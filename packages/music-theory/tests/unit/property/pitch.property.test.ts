import fc from 'fast-check';
import { describe, it } from 'vitest';

import {
  createInterval,
  createSpelledPitchClass,
  transposePitchClass,
  transposeSpelledPitch,
} from '../../../src/index.js';

const normalizedPitchClass = (pitchClass: number, semitones: number): number =>
  (((pitchClass + (semitones % 12)) % 12) + 12) % 12;

describe('pitch transposition properties', () => {
  it('always normalizes integer offsets into the twelve pitch classes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 11 }), fc.integer(), (pitchClass, semitones) => {
        const result = transposePitchClass(pitchClass, semitones);
        return result.ok && result.value === normalizedPitchClass(pitchClass, semitones);
      }),
      { numRuns: 300 },
    );
  });

  it('composes pitch-class offsets', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 11 }),
        fc.integer(),
        fc.integer(),
        (pitchClass, firstOffset, secondOffset) => {
          const first = transposePitchClass(pitchClass, firstOffset);
          const combined = transposePitchClass(pitchClass, firstOffset + secondOffset);
          if (!first.ok || !combined.ok) {
            return false;
          }

          const second = transposePitchClass(first.value, secondOffset);
          return second.ok && second.value === combined.value;
        },
      ),
      { numRuns: 300 },
    );
  });

  it('reverses every pitch-class offset', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 11 }), fc.integer(), (pitchClass, semitones) => {
        const transposed = transposePitchClass(pitchClass, semitones);
        if (!transposed.ok) {
          return false;
        }

        const restored = transposePitchClass(transposed.value, -semitones);
        return restored.ok && restored.value === pitchClass;
      }),
      { numRuns: 300 },
    );
  });

  it('round-trips spelled pitches whenever the intermediate spelling is supported', () => {
    const intervalArbitrary = fc.constantFrom(
      [0, 0] as const,
      [1, 1] as const,
      [1, 2] as const,
      [2, 3] as const,
      [2, 4] as const,
      [3, 5] as const,
      [4, 7] as const,
      [5, 8] as const,
      [5, 9] as const,
      [6, 10] as const,
      [6, 11] as const,
      [7, 12] as const,
    );

    fc.assert(
      fc.property(
        fc.constantFrom('C', 'D', 'E', 'F', 'G', 'A', 'B'),
        fc.integer({ min: -1, max: 1 }),
        intervalArbitrary,
        (letter, accidental, [diatonicSteps, semitones]) => {
          const note = createSpelledPitchClass(letter, accidental);
          const interval = createInterval(diatonicSteps, semitones);
          if (!note.ok || !interval.ok) {
            return false;
          }

          const transposed = transposeSpelledPitch(note.value, interval.value);
          if (!transposed.ok) {
            return true;
          }

          const inverse = createInterval(-diatonicSteps, -semitones);
          if (!inverse.ok) {
            return false;
          }

          const restored = transposeSpelledPitch(transposed.value, inverse.value);
          return (
            restored.ok &&
            restored.value.letter === note.value.letter &&
            restored.value.accidental === note.value.accidental
          );
        },
      ),
      { numRuns: 300 },
    );
  });
});
