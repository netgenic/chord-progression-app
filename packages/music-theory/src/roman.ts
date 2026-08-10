import { CHORD_STRUCTURES, createChordStructure } from './chord-structure.js';
import { scaleDegreeToSpelledPitch, spelledPitchToScaleDegree } from './key.js';
import {
  CHORD_KINDS,
  NOTE_LETTERS,
  type AbsoluteChordIdentity,
  type ChordExtension,
  type ChordKind,
  type ChordStructure,
  type DegreeAlteration,
  type Key,
  type RomanChord,
  type ScaleDegree,
  type SpelledPitchClass,
} from './model.js';
import {
  failure,
  success,
  type ConversionError,
  type Result,
  type ValidationError,
} from './result.js';

const isScaleDegree = (value: number): value is ScaleDegree =>
  Number.isInteger(value) && value >= 1 && value <= 7;

const isDegreeAlteration = (value: number): value is DegreeAlteration =>
  Number.isInteger(value) && value >= -2 && value <= 2;

const extensionsEqual = (left: ChordExtension, right: ChordExtension): boolean => {
  if (left.kind !== right.kind) {
    return false;
  }

  switch (left.kind) {
    case 'none':
      return true;
    case 'seventh':
      return right.kind === 'seventh' && left.quality === right.quality;
    case 'added-tone':
      return (
        right.kind === 'added-tone' &&
        left.degree === right.degree &&
        left.alteration === right.alteration
      );
  }
};

const chordKindOf = (structure: ChordStructure): ChordKind | undefined => {
  if (typeof structure !== 'object' || structure === null) {
    return undefined;
  }

  return CHORD_KINDS.find((kind) => {
    const supported = CHORD_STRUCTURES[kind];

    return (
      structure.quality === supported.quality &&
      typeof structure.extension === 'object' &&
      structure.extension !== null &&
      extensionsEqual(structure.extension, supported.extension)
    );
  });
};

const cloneSpelledPitchClass = (
  root: SpelledPitchClass,
): Result<SpelledPitchClass, ValidationError> => {
  if (!(NOTE_LETTERS as readonly string[]).includes(root.letter)) {
    return failure({ code: 'invalid-note-letter', received: String(root.letter) });
  }

  if (!Number.isInteger(root.accidental) || root.accidental < -2 || root.accidental > 2) {
    return failure({ code: 'invalid-accidental', received: root.accidental });
  }

  return success(Object.freeze({ letter: root.letter, accidental: root.accidental }));
};

export const createAbsoluteChord = (
  root: SpelledPitchClass,
  kind: string,
): Result<AbsoluteChordIdentity, ValidationError> => {
  const normalizedRoot = cloneSpelledPitchClass(root);
  if (!normalizedRoot.ok) {
    return failure(normalizedRoot.error);
  }

  const structure = createChordStructure(kind);
  if (!structure.ok) {
    return failure(structure.error);
  }

  return success(
    Object.freeze({
      root: normalizedRoot.value,
      structure: structure.value,
    }),
  );
};

export const createRomanChord = (
  degree: number,
  alteration: number,
  kind: string,
): Result<RomanChord, ValidationError> => {
  if (!isScaleDegree(degree)) {
    return failure({ code: 'invalid-scale-degree', received: degree });
  }

  if (!isDegreeAlteration(alteration)) {
    return failure({ code: 'invalid-degree-alteration', received: alteration });
  }

  const structure = createChordStructure(kind);
  if (!structure.ok) {
    return failure(structure.error);
  }

  return success(
    Object.freeze({
      degree,
      alteration: Object.is(alteration, -0) ? 0 : alteration,
      structure: structure.value,
    }),
  );
};

/** Rebuilds a structurally typed value through the supported Roman vocabulary. */
export const normalizeRomanChord = (chord: RomanChord): Result<RomanChord, ValidationError> => {
  const kind = chordKindOf(chord.structure);
  if (kind === undefined) {
    return failure({ code: 'invalid-chord-kind', received: 'unsupported-structure' });
  }

  return createRomanChord(chord.degree, chord.alteration, kind);
};

const normalizeAbsoluteChord = (
  chord: AbsoluteChordIdentity,
): Result<AbsoluteChordIdentity, ValidationError> => {
  const kind = chordKindOf(chord.structure);
  if (kind === undefined) {
    return failure({ code: 'invalid-chord-kind', received: 'unsupported-structure' });
  }

  return createAbsoluteChord(chord.root, kind);
};

export const toRomanChord = (
  chord: AbsoluteChordIdentity,
  key: Key,
): Result<RomanChord, ConversionError> => {
  const normalizedChord = normalizeAbsoluteChord(chord);
  if (!normalizedChord.ok) {
    return failure(normalizedChord.error);
  }

  const degree = spelledPitchToScaleDegree(key, normalizedChord.value.root);
  if (!degree.ok) {
    return failure(degree.error);
  }

  const kind = chordKindOf(normalizedChord.value.structure);
  if (kind === undefined) {
    return failure({ code: 'invalid-chord-kind', received: 'unsupported-structure' });
  }

  return createRomanChord(degree.value.degree, degree.value.alteration, kind);
};

export const realizeRomanChord = (
  chord: RomanChord,
  key: Key,
): Result<AbsoluteChordIdentity, ConversionError> => {
  const normalizedChord = normalizeRomanChord(chord);
  if (!normalizedChord.ok) {
    return failure(normalizedChord.error);
  }

  const root = scaleDegreeToSpelledPitch(key, {
    degree: normalizedChord.value.degree,
    alteration: normalizedChord.value.alteration,
  });
  if (!root.ok) {
    return failure(root.error);
  }

  const kind = chordKindOf(normalizedChord.value.structure);
  if (kind === undefined) {
    return failure({ code: 'invalid-chord-kind', received: 'unsupported-structure' });
  }

  return createAbsoluteChord(root.value, kind);
};

export const toRomanNumerals = (
  chords: readonly AbsoluteChordIdentity[],
  key: Key,
): Result<readonly RomanChord[], ConversionError> => {
  if (chords.length === 0) {
    return failure({ code: 'empty-progression' });
  }

  const romanChords: RomanChord[] = [];
  for (const chord of chords) {
    const converted = toRomanChord(chord, key);
    if (!converted.ok) {
      return failure(converted.error);
    }
    romanChords.push(converted.value);
  }

  return success(Object.freeze(romanChords));
};

export const fromRomanNumerals = (
  chords: readonly RomanChord[],
  key: Key,
): Result<readonly AbsoluteChordIdentity[], ConversionError> => {
  if (chords.length === 0) {
    return failure({ code: 'empty-progression' });
  }

  const absoluteChords: AbsoluteChordIdentity[] = [];
  for (const chord of chords) {
    const converted = realizeRomanChord(chord, key);
    if (!converted.ok) {
      return failure(converted.error);
    }
    absoluteChords.push(converted.value);
  }

  return success(Object.freeze(absoluteChords));
};
