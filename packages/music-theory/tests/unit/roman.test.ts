import { describe, expect, it } from 'vitest';

import {
  CHORD_STRUCTURES,
  createAbsoluteChord,
  createRomanChord,
  fromRomanNumerals,
  realizeRomanChord,
  toRomanChord,
  toRomanNumerals,
  type AbsoluteChordIdentity,
  type Accidental,
  type Key,
  type Result,
  type RomanChord,
} from '../../src/index.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }
  return result.value;
};

const cMajor: Key = Object.freeze({
  tonic: Object.freeze({ letter: 'C', accidental: 0 }),
  mode: 'major',
});

const eMinor: Key = Object.freeze({
  tonic: Object.freeze({ letter: 'E', accidental: 0 }),
  mode: 'minor',
});

describe('Roman chord constructors', () => {
  it('creates frozen absolute and Roman identities from the supported vocabulary', () => {
    const root = { letter: 'C', accidental: 0 } as const;
    const absolute = unwrap(createAbsoluteChord(root, 'major7'));
    const roman = unwrap(createRomanChord(1, 0, 'major7'));

    expect(absolute).toEqual({ root, structure: CHORD_STRUCTURES.major7 });
    expect(roman).toEqual({ degree: 1, alteration: 0, structure: CHORD_STRUCTURES.major7 });
    expect(Object.isFrozen(absolute)).toBe(true);
    expect(Object.isFrozen(absolute.root)).toBe(true);
    expect(Object.isFrozen(roman)).toBe(true);
    expect(absolute.root).not.toBe(root);
  });

  it.each([0, 8, 1.5])('rejects scale degree %s', (degree) => {
    expect(createRomanChord(degree, 0, 'major')).toEqual({
      ok: false,
      error: { code: 'invalid-scale-degree', received: degree },
    });
  });

  it.each([-3, 3, 0.5])('rejects degree alteration %s', (alteration) => {
    expect(createRomanChord(1, alteration, 'major')).toEqual({
      ok: false,
      error: { code: 'invalid-degree-alteration', received: alteration },
    });
  });

  it('rejects unsupported chord structures and invalid root accidentals', () => {
    expect(createRomanChord(1, 0, 'power5')).toEqual({
      ok: false,
      error: { code: 'invalid-chord-kind', received: 'power5' },
    });

    expect(createAbsoluteChord({ letter: 'C', accidental: 3 as Accidental }, 'major')).toEqual({
      ok: false,
      error: { code: 'invalid-accidental', received: 3 },
    });
  });
});

describe('structured Roman conversion', () => {
  it('converts C-G-Am-F in C major to degrees I-V-vi-IV', () => {
    const absolute = [
      unwrap(createAbsoluteChord({ letter: 'C', accidental: 0 }, 'major')),
      unwrap(createAbsoluteChord({ letter: 'G', accidental: 0 }, 'major')),
      unwrap(createAbsoluteChord({ letter: 'A', accidental: 0 }, 'minor')),
      unwrap(createAbsoluteChord({ letter: 'F', accidental: 0 }, 'major')),
    ];

    const roman = unwrap(toRomanNumerals(absolute, cMajor));

    expect(roman).toEqual([
      unwrap(createRomanChord(1, 0, 'major')),
      unwrap(createRomanChord(5, 0, 'major')),
      unwrap(createRomanChord(6, 0, 'minor')),
      unwrap(createRomanChord(4, 0, 'major')),
    ]);
    expect(Object.isFrozen(roman)).toBe(true);
  });

  it('uses natural-minor roots while preserving the explicit dominant-seventh structure', () => {
    const dominant = unwrap(createRomanChord(5, 0, 'dominant7'));
    const realized = unwrap(realizeRomanChord(dominant, eMinor));

    expect(realized).toEqual(
      unwrap(createAbsoluteChord({ letter: 'B', accidental: 0 }, 'dominant7')),
    );
    expect(unwrap(toRomanChord(realized, eMinor))).toEqual(dominant);
  });

  it('round-trips supported structured chords without parsing display strings', () => {
    const chords: readonly RomanChord[] = [
      unwrap(createRomanChord(1, 0, 'minor')),
      unwrap(createRomanChord(6, 0, 'major')),
      unwrap(createRomanChord(4, 0, 'minor')),
      unwrap(createRomanChord(5, 0, 'dominant7')),
    ];

    const absolute = unwrap(fromRomanNumerals(chords, eMinor));

    expect(unwrap(toRomanNumerals(absolute, eMinor))).toEqual(chords);
    expect(Object.isFrozen(absolute)).toBe(true);
  });

  it('returns explicit errors for empty progressions and forged structures', () => {
    expect(toRomanNumerals([], cMajor)).toEqual({
      ok: false,
      error: { code: 'empty-progression' },
    });
    expect(fromRomanNumerals([], cMajor)).toEqual({
      ok: false,
      error: { code: 'empty-progression' },
    });

    const forged = {
      root: { letter: 'C', accidental: 0 },
      structure: { quality: 'major', extension: { kind: 'seventh', quality: 'diminished' } },
    } as AbsoluteChordIdentity;

    expect(toRomanChord(forged, cMajor)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-kind', received: 'unsupported-structure' },
    });
  });
});
