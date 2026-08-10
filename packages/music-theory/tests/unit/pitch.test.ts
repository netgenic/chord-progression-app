import { describe, expect, it } from 'vitest';

import {
  createInterval,
  createSpelledPitchClass,
  pitchClassOf,
  transposePitchClass,
  transposeSpelledPitch,
  type Result,
} from '../../src/index.js';

const valueOf = <T>(result: Result<T, unknown>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected a successful result');
  }
  return result.value;
};

describe('spelled pitch classes', () => {
  it('creates a note without erasing its enharmonic spelling', () => {
    const cSharp = valueOf(createSpelledPitchClass('C', 1));
    const dFlat = valueOf(createSpelledPitchClass('D', -1));

    expect(cSharp).toEqual({ letter: 'C', accidental: 1 });
    expect(dFlat).toEqual({ letter: 'D', accidental: -1 });
    expect(valueOf(pitchClassOf(cSharp))).toBe(1);
    expect(valueOf(pitchClassOf(dFlat))).toBe(1);
  });

  it.each([
    ['H', 0, { code: 'invalid-note-letter', received: 'H' }],
    ['C', -3, { code: 'invalid-accidental', received: -3 }],
    ['C', 3, { code: 'invalid-accidental', received: 3 }],
    ['C', 0.5, { code: 'invalid-accidental', received: 0.5 }],
  ] as const)('rejects invalid spelling %s with accidental %s', (letter, accidental, error) => {
    expect(createSpelledPitchClass(letter, accidental)).toEqual({ ok: false, error });
  });

  it('normalizes sounding pitch classes across octave boundaries', () => {
    expect(valueOf(pitchClassOf(valueOf(createSpelledPitchClass('B', 1))))).toBe(0);
    expect(valueOf(pitchClassOf(valueOf(createSpelledPitchClass('C', -1))))).toBe(11);
  });

  it('rejects a structurally forged spelling instead of returning NaN as a pitch class', () => {
    expect(pitchClassOf({ letter: 'H', accidental: 0 } as never)).toEqual({
      ok: false,
      error: { code: 'invalid-note-letter', received: 'H' },
    });
  });
});

describe('intervals and transposition', () => {
  it('stores zero-based diatonic steps and chromatic semitones', () => {
    expect(createInterval(2, 4)).toEqual({
      ok: true,
      value: { diatonicSteps: 2, semitones: 4 },
    });
    expect(createInterval(-1, -2)).toEqual({
      ok: true,
      value: { diatonicSteps: -1, semitones: -2 },
    });
  });

  it.each([
    [0.5, 1, { code: 'invalid-diatonic-steps', received: 0.5 }],
    [1, Number.POSITIVE_INFINITY, { code: 'invalid-semitone-offset', received: Infinity }],
  ] as const)('rejects a non-integer interval (%s, %s)', (steps, semitones, error) => {
    expect(createInterval(steps, semitones)).toEqual({ ok: false, error });
  });

  it('normalizes pitch-class transposition in both directions', () => {
    expect(transposePitchClass(11, 2)).toEqual({ ok: true, value: 1 });
    expect(transposePitchClass(0, -1)).toEqual({ ok: true, value: 11 });
    expect(transposePitchClass(4, 24)).toEqual({ ok: true, value: 4 });
  });

  it.each([
    [-1, 0, { code: 'invalid-pitch-class', received: -1 }],
    [12, 0, { code: 'invalid-pitch-class', received: 12 }],
    [1.5, 0, { code: 'invalid-pitch-class', received: 1.5 }],
    [0, 0.5, { code: 'invalid-semitone-offset', received: 0.5 }],
  ] as const)('rejects invalid pitch transposition (%s, %s)', (pitch, semitones, error) => {
    expect(transposePitchClass(pitch, semitones)).toEqual({ ok: false, error });
  });

  it('transposes pitch and spelling together', () => {
    const c = valueOf(createSpelledPitchClass('C'));
    const majorThird = valueOf(createInterval(2, 4));
    const descendingMinorSecond = valueOf(createInterval(-1, -1));

    expect(transposeSpelledPitch(c, majorThird)).toEqual({
      ok: true,
      value: { letter: 'E', accidental: 0 },
    });
    expect(transposeSpelledPitch(c, descendingMinorSecond)).toEqual({
      ok: true,
      value: { letter: 'B', accidental: 0 },
    });
  });

  it('reports spellings that would require more than a double accidental', () => {
    const bDoubleSharp = valueOf(createSpelledPitchClass('B', 2));
    const augmentedUnison = valueOf(createInterval(0, 1));

    expect(transposeSpelledPitch(bDoubleSharp, augmentedUnison)).toEqual({
      ok: false,
      error: { code: 'unsupported-spelling', letter: 'B', requiredAccidental: 3 },
    });
  });
});
