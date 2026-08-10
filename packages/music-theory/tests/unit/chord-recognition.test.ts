import { describe, expect, it } from 'vitest';

import {
  createSpelledPitchClass,
  detectChord,
  renderChord,
  type Result,
  type SpelledPitchClass,
} from '../../src/index.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }

  return result.value;
};

const note = (letter: string, accidental = 0): SpelledPitchClass =>
  unwrap(createSpelledPitchClass(letter, accidental));

const summarize = (notes: readonly SpelledPitchClass[], bass: SpelledPitchClass | null) =>
  unwrap(detectChord({ notes, bass })).candidates.map((candidate) => ({
    kind: candidate.kind,
    symbol: unwrap(renderChord(candidate.symbol)),
    bassClassification: candidate.bassClassification,
    evidence: candidate.evidence,
  }));

type RecognitionInput = Parameters<typeof detectChord>[0];

describe('chord recognition bass semantics', () => {
  it('renders root position without inventing an explicit root slash', () => {
    const c = note('C');
    const recognition = unwrap(detectChord({ notes: [c, note('E'), note('G')], bass: c }));
    const candidate = recognition.candidates[0];

    expect(candidate).toBeDefined();
    if (candidate === undefined) {
      throw new Error('Expected a C-major recognition candidate');
    }

    expect(recognition.bass).toEqual(c);
    expect(candidate.bassClassification).toEqual({ kind: 'root-position' });
    expect(candidate.symbol.bass).toBeNull();
    expect(unwrap(renderChord(candidate.symbol))).toBe('C');
  });

  it('uses explicit G bass for C/G and does not repeat the incorrect C/E specification example', () => {
    const g = note('G');
    const candidates = summarize([g, note('C'), note('E')], g);

    expect(candidates).toEqual([
      {
        kind: 'major',
        symbol: 'C/G',
        bassClassification: { kind: 'inversion', chordTone: 'fifth' },
        evidence: { pitchSet: 'exact', spellingMismatches: 0 },
      },
    ]);
  });

  it('does not derive bass from the order of otherwise unordered notes', () => {
    const e = note('E');

    expect(summarize([note('G'), note('C'), e], e)).toEqual([
      {
        kind: 'major',
        symbol: 'C/E',
        bassClassification: { kind: 'inversion', chordTone: 'third' },
        evidence: { pitchSet: 'exact', spellingMismatches: 0 },
      },
    ]);
    expect(summarize([note('E'), note('G'), note('C')], null)).toEqual([
      {
        kind: 'major',
        symbol: 'C',
        bassClassification: { kind: 'unknown' },
        evidence: { pitchSet: 'exact', spellingMismatches: 0 },
      },
    ]);
  });

  it('recognizes an exact extended chord before attempting non-chord-bass fallback', () => {
    const d = note('D');
    const a = note('A');

    expect(summarize([d, note('C'), note('E'), note('G')], d)).toEqual([
      {
        kind: 'add9',
        symbol: 'Cadd9/D',
        bassClassification: { kind: 'inversion', chordTone: 'ninth' },
        evidence: { pitchSet: 'exact', spellingMismatches: 0 },
      },
    ]);
    expect(summarize([a, note('C'), note('E'), note('G')], a)).toEqual([
      {
        kind: 'minor7',
        symbol: 'Am7',
        bassClassification: { kind: 'root-position' },
        evidence: { pitchSet: 'exact', spellingMismatches: 0 },
      },
    ]);
  });

  it('prioritizes exact spelling evidence before root-position preference', () => {
    const e = note('E');

    expect(summarize([note('C'), e, note('G', 1)], e)).toEqual([
      {
        kind: 'augmented',
        symbol: 'Caug/E',
        bassClassification: { kind: 'inversion', chordTone: 'third' },
        evidence: { pitchSet: 'exact', spellingMismatches: 0 },
      },
      {
        kind: 'augmented',
        symbol: 'Eaug',
        bassClassification: { kind: 'root-position' },
        evidence: { pitchSet: 'exact', spellingMismatches: 1 },
      },
      {
        kind: 'augmented',
        symbol: 'G#aug/E',
        bassClassification: { kind: 'inversion', chordTone: 'fifth' },
        evidence: { pitchSet: 'exact', spellingMismatches: 2 },
      },
    ]);
  });

  it('does not infer a larger rootless chord when the observed set is itself exact', () => {
    const e = note('E');

    expect(summarize([e, note('G'), note('B', -1)], e)).toEqual([
      {
        kind: 'diminished',
        symbol: 'Edim',
        bassClassification: { kind: 'root-position' },
        evidence: { pitchSet: 'exact', spellingMismatches: 0 },
      },
    ]);
  });
});

describe('chord recognition value semantics', () => {
  it('collapses pitch-class doublings without changing candidates', () => {
    const c = note('C');
    const e = note('E');
    const g = note('G');

    expect(summarize([c, e, g, c, e], c)).toEqual(summarize([c, e, g], c));
  });

  it('keeps ambiguous non-chord-bass fallback stable across permutations and doublings', () => {
    const a = note('A');
    const c = note('C');
    const d = note('D');
    const g = note('G');
    const expected = summarize([a, c, d, g], a);

    expect(summarize([g, d, a, c], a)).toEqual(expected);
    expect(summarize([a, c, d, g, c, g, d], a)).toEqual(expected);
  });

  it('returns deeply immutable values isolated from caller-owned arrays', () => {
    const c = note('C');
    const inputNotes = [c, note('E'), note('G')];
    const recognition = unwrap(detectChord({ notes: inputNotes, bass: c }));
    const expectedNotes = [...recognition.notes];
    const candidate = recognition.candidates[0];

    inputNotes.splice(0, inputNotes.length);

    expect(recognition.notes).toEqual(expectedNotes);
    expect(recognition.candidates).toHaveLength(1);
    expect(Object.isFrozen(recognition)).toBe(true);
    expect(Object.isFrozen(recognition.notes)).toBe(true);
    expect(Object.isFrozen(recognition.candidates)).toBe(true);
    expect(candidate).toBeDefined();
    if (candidate !== undefined) {
      expect(Object.isFrozen(candidate)).toBe(true);
      expect(Object.isFrozen(candidate.bassClassification)).toBe(true);
      expect(Object.isFrozen(candidate.evidence)).toBe(true);
      expect(Object.isFrozen(candidate.symbol)).toBe(true);
    }
  });
});

describe('chord recognition input validation', () => {
  const c = () => note('C');

  it('rejects malformed top-level values and exact-shape violations', () => {
    expect(detectChord(null as unknown as RecognitionInput)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-recognition-input', reason: 'not-object' },
    });
    expect(detectChord([] as unknown as RecognitionInput)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-recognition-input', reason: 'not-object' },
    });
    expect(detectChord({ bass: null } as unknown as RecognitionInput)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-recognition-input', reason: 'missing-fields' },
    });
    expect(detectChord({ notes: [c()] } as unknown as RecognitionInput)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-recognition-input', reason: 'missing-fields' },
    });
    expect(
      detectChord({ notes: [c()], bass: null, ordered: true } as unknown as RecognitionInput),
    ).toEqual({
      ok: false,
      error: { code: 'invalid-chord-recognition-input', reason: 'unexpected-fields' },
    });
  });

  it('distinguishes an invalid notes container from an empty observation', () => {
    expect(detectChord({ notes: null, bass: null } as unknown as RecognitionInput)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-recognition-notes', reason: 'not-array' },
    });
    expect(detectChord({ notes: [], bass: null })).toEqual({
      ok: false,
      error: { code: 'invalid-chord-recognition-notes', reason: 'empty' },
    });
  });

  it('reports the exact invalid observed-note position without filtering it', () => {
    const invalidLetter = { letter: 'H', accidental: 0 } as unknown as SpelledPitchClass;

    expect(detectChord({ notes: [c(), invalidLetter, note('G')], bass: c() })).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-note-error',
        index: 1,
        cause: { code: 'invalid-note-letter', received: 'H' },
      },
    });
  });

  it('rejects sparse observations and malformed note shapes without throwing', () => {
    const sparseNotes = new Array<SpelledPitchClass>(3);
    sparseNotes[0] = c();
    sparseNotes[2] = note('G');
    const extraFieldNote = {
      letter: 'E',
      accidental: 0,
      octave: 4,
    } as unknown as SpelledPitchClass;
    const invalidFieldTypes = {
      letter: 'E',
      accidental: '0',
    } as unknown as SpelledPitchClass;

    expect(detectChord({ notes: sparseNotes, bass: c() })).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-note-error',
        index: 1,
        cause: { code: 'invalid-spelled-pitch-value', reason: 'not-object' },
      },
    });
    expect(detectChord({ notes: [c(), extraFieldNote], bass: c() })).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-note-error',
        index: 1,
        cause: { code: 'invalid-spelled-pitch-value', reason: 'unexpected-fields' },
      },
    });
    expect(detectChord({ notes: [c(), invalidFieldTypes], bass: c() })).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-note-error',
        index: 1,
        cause: { code: 'invalid-spelled-pitch-value', reason: 'invalid-field-types' },
      },
    });
  });

  it('reports an invalid explicit bass through the bass boundary', () => {
    const invalidBass = { letter: 'H', accidental: 0 } as unknown as SpelledPitchClass;

    expect(detectChord({ notes: [c(), note('E'), note('G')], bass: invalidBass })).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-bass-error',
        cause: { code: 'invalid-note-letter', received: 'H' },
      },
    });
  });

  it('rejects extra bass fields instead of silently simplifying the value', () => {
    const invalidBass = {
      letter: 'C',
      accidental: 0,
      octave: 3,
    } as unknown as SpelledPitchClass;

    expect(detectChord({ notes: [c(), note('E'), note('G')], bass: invalidBass })).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-bass-error',
        cause: { code: 'invalid-spelled-pitch-value', reason: 'unexpected-fields' },
      },
    });
  });

  it('returns typed bass errors for primitive values and invalid field types', () => {
    const invalidFieldTypes = {
      letter: 'C',
      accidental: '0',
    } as unknown as SpelledPitchClass;

    expect(
      detectChord({
        notes: [c(), note('E'), note('G')],
        bass: 12 as unknown as SpelledPitchClass,
      }),
    ).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-bass-error',
        cause: { code: 'invalid-spelled-pitch-value', reason: 'not-object' },
      },
    });
    expect(detectChord({ notes: [c(), note('E'), note('G')], bass: invalidFieldTypes })).toEqual({
      ok: false,
      error: {
        code: 'chord-recognition-bass-error',
        cause: { code: 'invalid-spelled-pitch-value', reason: 'invalid-field-types' },
      },
    });
  });

  it('requires exact-spelling bass membership rather than enharmonic pitch equality', () => {
    const result = detectChord({ notes: [c(), note('E'), note('G')], bass: note('B', 1) });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toMatchObject({ code: 'chord-recognition-bass-not-present' });
  });
});
