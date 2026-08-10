import { createAbsoluteChord, normalizeAbsoluteChord } from './chord.js';
import { chordKindOf } from './chord-structure.js';
import {
  CHORD_KINDS,
  NOTE_LETTERS,
  type Accidental,
  type AbsoluteChordIdentity,
  type ChordKind,
  type ChordSymbol,
  type Interval,
  type SpelledPitchClass,
} from './model.js';
import { createInterval, createSpelledPitchClass, transposeSpelledPitch } from './pitch.js';
import {
  failure,
  success,
  type ChordParseError,
  type ChordParseErrorReason,
  type ChordTranspositionError,
  type ConversionError,
  type ProgressionTranspositionError,
  type Result,
  type ValidationError,
} from './result.js';
import { hasExactOwnKeys, isRuntimeRecord } from './runtime-shape.js';

export const CHORD_SYMBOL_MAX_LENGTH = 12 as const;

const CHORD_SUFFIX_BY_KIND: Readonly<Record<ChordKind, string>> = Object.freeze({
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  major7: 'maj7',
  minor7: 'm7',
  dominant7: '7',
  diminished7: 'dim7',
  'half-diminished7': 'm7b5',
  add9: 'add9',
  'minor-add9': 'madd9',
});

const parseFailure = (
  input: string,
  reason: Exclude<ChordParseErrorReason, 'invalid-type'>,
): Result<never, ChordParseError> => {
  if (reason === 'too-long') {
    return failure({
      code: 'invalid-chord-symbol',
      reason,
      receivedLength: input.length,
    });
  }

  return failure({ code: 'invalid-chord-symbol', input, reason });
};

const normalizeInterval = (interval: Interval): Result<Interval, ValidationError> => {
  const intervalCandidate: unknown = interval;
  if (!isRuntimeRecord(intervalCandidate)) {
    return failure({ code: 'invalid-interval-value', reason: 'not-object' });
  }

  if (!hasExactOwnKeys(intervalCandidate, ['diatonicSteps', 'semitones'])) {
    const hasBothFields =
      Object.hasOwn(intervalCandidate, 'diatonicSteps') &&
      Object.hasOwn(intervalCandidate, 'semitones');

    return failure({
      code: 'invalid-interval-value',
      reason: hasBothFields ? 'unexpected-fields' : 'missing-fields',
    });
  }

  const diatonicSteps = intervalCandidate['diatonicSteps'];
  const semitones = intervalCandidate['semitones'];
  if (typeof diatonicSteps !== 'number' || typeof semitones !== 'number') {
    return failure({ code: 'invalid-interval-value', reason: 'invalid-field-types' });
  }

  return createInterval(diatonicSteps, semitones);
};

const isRuntimeArray = (value: unknown): boolean => Array.isArray(value);

const accidentalFromToken = (token: string): Accidental | undefined => {
  switch (token) {
    case 'bb':
      return -2;
    case 'b':
      return -1;
    case '':
      return 0;
    case '#':
      return 1;
    case '##':
      return 2;
    default:
      return undefined;
  }
};

const accidentalTokenAtStart = (source: string): string => {
  if (source.startsWith('bb') || source.startsWith('##')) {
    return source.slice(0, 2);
  }

  if (source.startsWith('b') || source.startsWith('#')) {
    return source.slice(0, 1);
  }

  return '';
};

const renderAccidental = (accidental: Accidental): string => {
  switch (accidental) {
    case -2:
      return 'bb';
    case -1:
      return 'b';
    case 0:
      return '';
    case 1:
      return '#';
    case 2:
      return '##';
  }
};

const renderSpelledPitch = (note: SpelledPitchClass): string =>
  `${note.letter}${renderAccidental(note.accidental)}`;

const parseExactSpelledPitch = (token: string): SpelledPitchClass | undefined => {
  const letter = token.slice(0, 1);
  const accidental = accidentalFromToken(token.slice(1));
  if (!(NOTE_LETTERS as readonly string[]).includes(letter) || accidental === undefined) {
    return undefined;
  }

  const note = createSpelledPitchClass(letter, accidental);
  return note.ok ? note.value : undefined;
};

const parseRootAndKind = (
  source: string,
  input: string,
): Result<Readonly<{ root: SpelledPitchClass; kind: ChordKind }>, ChordParseError> => {
  const letter = source.slice(0, 1);
  if (!(NOTE_LETTERS as readonly string[]).includes(letter)) {
    return parseFailure(input, 'invalid-root');
  }

  const remainder = source.slice(1);
  const accidentalToken = accidentalTokenAtStart(remainder);
  const suffix = remainder.slice(accidentalToken.length);

  if (/^[#b♯♭]/u.test(suffix)) {
    return parseFailure(input, 'unsupported-accidental');
  }

  const accidental = accidentalFromToken(accidentalToken);
  if (accidental === undefined) {
    return parseFailure(input, 'unsupported-accidental');
  }

  const kind = CHORD_KINDS.find((candidate) => CHORD_SUFFIX_BY_KIND[candidate] === suffix);
  if (kind === undefined) {
    return parseFailure(input, 'unsupported-suffix');
  }

  const root = createSpelledPitchClass(letter, accidental);
  if (!root.ok) {
    return parseFailure(input, 'invalid-root');
  }

  return success(Object.freeze({ root: root.value, kind }));
};

export const createChordSymbol = (
  identity: AbsoluteChordIdentity,
  bass: SpelledPitchClass | null = null,
): Result<ChordSymbol, ValidationError> => {
  const normalizedIdentity = normalizeAbsoluteChord(identity);
  if (!normalizedIdentity.ok) {
    return normalizedIdentity;
  }

  if (bass === null) {
    return success(Object.freeze({ identity: normalizedIdentity.value, bass: null }));
  }

  if (!isRuntimeRecord(bass)) {
    return failure({ code: 'invalid-chord-bass', received: typeof bass });
  }

  if (!hasExactOwnKeys(bass, ['letter', 'accidental'])) {
    return failure({ code: 'invalid-chord-bass', received: 'unexpected-fields' });
  }

  const normalizedBass = createSpelledPitchClass(bass.letter, bass.accidental);
  if (!normalizedBass.ok) {
    return normalizedBass;
  }

  return success(
    Object.freeze({
      identity: normalizedIdentity.value,
      bass: normalizedBass.value,
    }),
  );
};

const normalizeChordSymbol = (chord: ChordSymbol): Result<ChordSymbol, ValidationError> => {
  const chordCandidate: unknown = chord;
  if (!isRuntimeRecord(chordCandidate)) {
    return failure({ code: 'invalid-chord-symbol-value', reason: 'not-object' });
  }

  if (!hasExactOwnKeys(chordCandidate, ['identity', 'bass'])) {
    if (!Object.hasOwn(chordCandidate, 'identity')) {
      return failure({ code: 'invalid-chord-symbol-value', reason: 'missing-identity' });
    }

    if (!Object.hasOwn(chordCandidate, 'bass')) {
      return failure({ code: 'invalid-chord-symbol-value', reason: 'missing-bass' });
    }

    return failure({ code: 'invalid-chord-symbol-value', reason: 'unexpected-fields' });
  }

  const bass = chordCandidate['bass'];
  if (bass !== null && !isRuntimeRecord(bass)) {
    return failure({ code: 'invalid-chord-bass', received: typeof bass });
  }

  return createChordSymbol(
    chordCandidate['identity'] as AbsoluteChordIdentity,
    bass as SpelledPitchClass | null,
  );
};

export const parseChord = (source: string): Result<ChordSymbol, ChordParseError> => {
  const sourceCandidate: unknown = source;
  if (typeof sourceCandidate !== 'string') {
    return failure({
      code: 'invalid-chord-symbol',
      reason: 'invalid-type',
      receivedType: typeof sourceCandidate,
    });
  }

  if (sourceCandidate.length === 0) {
    return parseFailure(sourceCandidate, 'empty');
  }

  if (sourceCandidate.length > CHORD_SYMBOL_MAX_LENGTH) {
    return parseFailure(sourceCandidate, 'too-long');
  }

  if (/\s/u.test(sourceCandidate)) {
    return parseFailure(sourceCandidate, 'whitespace');
  }

  const segments = sourceCandidate.split('/');
  if (segments.length > 2) {
    return parseFailure(sourceCandidate, 'multiple-slashes');
  }

  const head = segments[0] ?? '';
  const parsedHead = parseRootAndKind(head, sourceCandidate);
  if (!parsedHead.ok) {
    return parsedHead;
  }

  const bassToken = segments[1];
  const bass = bassToken === undefined ? null : parseExactSpelledPitch(bassToken);
  if (bass === undefined) {
    return parseFailure(sourceCandidate, 'invalid-slash-bass');
  }

  const identity = createAbsoluteChord(parsedHead.value.root, parsedHead.value.kind);
  if (!identity.ok) {
    return parseFailure(sourceCandidate, 'invalid-root');
  }

  const chord = createChordSymbol(identity.value, bass);
  if (!chord.ok) {
    return parseFailure(sourceCandidate, 'invalid-root');
  }

  return chord;
};

export const renderChord = (chord: ChordSymbol): Result<string, ValidationError> => {
  const normalized = normalizeChordSymbol(chord);
  if (!normalized.ok) {
    return normalized;
  }

  const kind = chordKindOf(normalized.value.identity.structure);
  if (kind === undefined) {
    return failure({ code: 'invalid-chord-kind', received: 'unsupported-structure' });
  }

  const root = renderSpelledPitch(normalized.value.identity.root);
  const suffix = CHORD_SUFFIX_BY_KIND[kind];
  const bass = normalized.value.bass;

  return success(`${root}${suffix}${bass === null ? '' : `/${renderSpelledPitch(bass)}`}`);
};

const componentFailure = (
  component: 'root' | 'bass',
  cause: ConversionError,
): Result<never, ChordTranspositionError> =>
  failure({ code: 'chord-component-error', component, cause });

export const transposeChord = (
  chord: ChordSymbol,
  interval: Interval,
): Result<ChordSymbol, ChordTranspositionError> => {
  const normalizedChord = normalizeChordSymbol(chord);
  if (!normalizedChord.ok) {
    return normalizedChord;
  }

  const normalizedInterval = normalizeInterval(interval);
  if (!normalizedInterval.ok) {
    return normalizedInterval;
  }

  const root = transposeSpelledPitch(normalizedChord.value.identity.root, normalizedInterval.value);
  if (!root.ok) {
    return componentFailure('root', root.error);
  }

  let bass: SpelledPitchClass | null = null;
  if (normalizedChord.value.bass !== null) {
    const transposedBass = transposeSpelledPitch(
      normalizedChord.value.bass,
      normalizedInterval.value,
    );
    if (!transposedBass.ok) {
      return componentFailure('bass', transposedBass.error);
    }
    bass = transposedBass.value;
  }

  const kind = chordKindOf(normalizedChord.value.identity.structure);
  if (kind === undefined) {
    return failure({ code: 'invalid-chord-kind', received: 'unsupported-structure' });
  }

  const identity = createAbsoluteChord(root.value, kind);
  if (!identity.ok) {
    return identity;
  }

  return createChordSymbol(identity.value, bass);
};

export const transposeProgression = (
  chords: readonly ChordSymbol[],
  interval: Interval,
): Result<readonly ChordSymbol[], ProgressionTranspositionError> => {
  const chordsCandidate: unknown = chords;
  if (!isRuntimeArray(chordsCandidate)) {
    return failure({ code: 'invalid-progression-value', reason: 'not-array' });
  }

  if (chords.length === 0) {
    return failure({ code: 'empty-progression' });
  }

  const normalizedInterval = normalizeInterval(interval);
  if (!normalizedInterval.ok) {
    return normalizedInterval;
  }

  const transposed: ChordSymbol[] = [];
  for (const [index, chord] of chords.entries()) {
    const result = transposeChord(chord, normalizedInterval.value);
    if (!result.ok) {
      return failure({ code: 'progression-chord-error', index, cause: result.error });
    }
    transposed.push(result.value);
  }

  return success(Object.freeze(transposed));
};
