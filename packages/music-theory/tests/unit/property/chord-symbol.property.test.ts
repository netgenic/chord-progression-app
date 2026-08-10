import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  CHORD_KINDS,
  NOTE_LETTERS,
  createAbsoluteChord,
  createChordSymbol,
  createInterval,
  createSpelledPitchClass,
  parseChord,
  pitchClassOf,
  renderChord,
  transposeChord,
  transposeProgression,
  type ChordSymbol,
  type Interval,
  type Result,
  type SpelledPitchClass,
} from '../../../src/index.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }
  return result.value;
};

const spelledPitchArbitrary = (minimumAccidental: number, maximumAccidental: number) =>
  fc
    .tuple(
      fc.constantFrom(...NOTE_LETTERS),
      fc.integer({ min: minimumAccidental, max: maximumAccidental }),
    )
    .map(([letter, accidental]) => unwrap(createSpelledPitchClass(letter, accidental)));

const chordSymbolArbitrary = (
  pitchArbitrary: fc.Arbitrary<SpelledPitchClass>,
): fc.Arbitrary<ChordSymbol> => {
  const identityArbitrary = fc
    .tuple(pitchArbitrary, fc.constantFrom(...CHORD_KINDS))
    .map(([root, kind]) => unwrap(createAbsoluteChord(root, kind)));
  const bassArbitrary = fc.option(pitchArbitrary, { nil: null });

  return fc
    .tuple(identityArbitrary, bassArbitrary)
    .map(([identity, bass]) => unwrap(createChordSymbol(identity, bass)));
};

const allSpellingsChordArbitrary = chordSymbolArbitrary(spelledPitchArbitrary(-2, 2));
const invertibleChordArbitrary = chordSymbolArbitrary(spelledPitchArbitrary(-1, 1));

const invertibleIntervalArbitrary: fc.Arbitrary<Interval> = fc
  .constantFrom(
    [0, 0] as const,
    [1, 2] as const,
    [2, 4] as const,
    [3, 5] as const,
    [4, 7] as const,
    [5, 9] as const,
    [6, 11] as const,
    [7, 12] as const,
    [-1, -2] as const,
    [-2, -4] as const,
    [-3, -5] as const,
    [-4, -7] as const,
    [-5, -9] as const,
    [-6, -11] as const,
    [-7, -12] as const,
  )
  .map(([diatonicSteps, semitones]) => unwrap(createInterval(diatonicSteps, semitones)));

const normalizedModulo = (value: number, modulus: number): number =>
  ((value % modulus) + modulus) % modulus;

const expectedLetterAfter = (
  note: SpelledPitchClass,
  diatonicSteps: number,
): SpelledPitchClass['letter'] => {
  const sourceIndex = NOTE_LETTERS.indexOf(note.letter);
  const targetIndex = normalizedModulo(sourceIndex + diatonicSteps, NOTE_LETTERS.length);
  const target = NOTE_LETTERS[targetIndex];

  if (target === undefined) {
    throw new Error(`Missing note letter at index ${targetIndex}`);
  }

  return target;
};

const expectedPitchClassAfter = (note: SpelledPitchClass, semitones: number): number =>
  normalizedModulo(unwrap(pitchClassOf(note)) + semitones, 12);

describe('chord-symbol properties', () => {
  it('round-trips every generated canonical value through render and parse', () => {
    fc.assert(
      fc.property(allSpellingsChordArbitrary, (chord) => {
        const rendered = unwrap(renderChord(chord));
        const parsed = unwrap(parseChord(rendered));

        expect(parsed).toEqual(chord);
        expect(unwrap(renderChord(parsed))).toBe(rendered);
      }),
      { numRuns: 300 },
    );
  });

  it('restores the exact chord spelling after an interval and its inverse', () => {
    fc.assert(
      fc.property(invertibleChordArbitrary, invertibleIntervalArbitrary, (chord, interval) => {
        const transposed = unwrap(transposeChord(chord, interval));
        const inverse = unwrap(createInterval(-interval.diatonicSteps, -interval.semitones));
        const restored = unwrap(transposeChord(transposed, inverse));

        expect(transposed.identity.structure).toEqual(chord.identity.structure);
        expect(transposed.identity.root.letter).toBe(
          expectedLetterAfter(chord.identity.root, interval.diatonicSteps),
        );
        expect(unwrap(pitchClassOf(transposed.identity.root))).toBe(
          expectedPitchClassAfter(chord.identity.root, interval.semitones),
        );
        if (chord.bass === null) {
          expect(transposed.bass).toBeNull();
        } else {
          expect(transposed.bass).not.toBeNull();
          if (transposed.bass === null) {
            throw new Error('Expected the explicit slash bass to be preserved');
          }
          expect(transposed.bass.letter).toBe(
            expectedLetterAfter(chord.bass, interval.diatonicSteps),
          );
          expect(unwrap(pitchClassOf(transposed.bass))).toBe(
            expectedPitchClassAfter(chord.bass, interval.semitones),
          );
        }
        expect(restored).toEqual(chord);
        expect(unwrap(renderChord(restored))).toBe(unwrap(renderChord(chord)));
      }),
      { numRuns: 300 },
    );
  });

  it('restores progression order, repetitions, structures, roots, and basses without filtering', () => {
    fc.assert(
      fc.property(
        fc.array(invertibleChordArbitrary, { minLength: 1, maxLength: 8 }),
        invertibleIntervalArbitrary,
        (progression, interval) => {
          const transposed = unwrap(transposeProgression(progression, interval));
          const individuallyTransposed = progression.map((chord) =>
            unwrap(transposeChord(chord, interval)),
          );
          const inverse = unwrap(createInterval(-interval.diatonicSteps, -interval.semitones));
          const restored = unwrap(transposeProgression(transposed, inverse));

          expect(transposed).toEqual(individuallyTransposed);
          expect(restored).toEqual(progression);
          expect(Object.isFrozen(transposed)).toBe(true);
          expect(Object.isFrozen(restored)).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  });
});
