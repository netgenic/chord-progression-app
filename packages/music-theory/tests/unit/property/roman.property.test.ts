import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  CHORD_KINDS,
  MODES,
  NOTE_LETTERS,
  canonicalizeProgression,
  createCanonicalProgression,
  createKey,
  createRomanChord,
  createSpelledPitchClass,
  realizeCanonicalProgression,
  realizeRomanChord,
  serializeCanonicalProgression,
  toRomanChord,
} from '../../../src/index.js';

type ResultLike<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: unknown }>;

const unwrap = <T>(result: ResultLike<T>): T => {
  if (!result.ok) {
    throw new Error(
      `Expected a successful domain result, received ${JSON.stringify(result.error)}`,
    );
  }

  return result.value;
};

const noteLetterArbitrary = fc.constantFrom(...NOTE_LETTERS);
const modeArbitrary = fc.constantFrom(...MODES);
const chordKindArbitrary = fc.constantFrom(...CHORD_KINDS);

const naturalTonicArbitrary = noteLetterArbitrary.map((letter) =>
  unwrap(createSpelledPitchClass(letter, 0)),
);

const naturalKeyArbitrary = fc
  .tuple(naturalTonicArbitrary, modeArbitrary)
  .map(([tonic, mode]) => unwrap(createKey(tonic, mode)));

// Unaltered degrees are representable in every natural-letter major and minor key,
// so the generator produces supported values by construction without filtering.
const romanChordArbitrary = fc
  .tuple(fc.integer({ min: 1, max: 7 }), chordKindArbitrary)
  .map(([degree, kind]) => unwrap(createRomanChord(degree, 0, kind)));

const romanProgressionArbitrary = fc.array(romanChordArbitrary, {
  minLength: 1,
  maxLength: 8,
});

const noteLetterAt = (index: number): (typeof NOTE_LETTERS)[number] => {
  const letter = NOTE_LETTERS[index];

  if (letter === undefined) {
    throw new Error(`No note letter at index ${index}`);
  }

  return letter;
};

const distinctCompatibleKeyPairArbitrary = fc
  .tuple(
    fc.integer({ min: 0, max: NOTE_LETTERS.length - 1 }),
    fc.integer({ min: 1, max: NOTE_LETTERS.length - 1 }),
    modeArbitrary,
  )
  .map(([firstIndex, distance, mode]) => {
    const secondIndex = (firstIndex + distance) % NOTE_LETTERS.length;
    const firstTonic = unwrap(createSpelledPitchClass(noteLetterAt(firstIndex), 0));
    const secondTonic = unwrap(createSpelledPitchClass(noteLetterAt(secondIndex), 0));

    return {
      mode,
      first: unwrap(createKey(firstTonic, mode)),
      second: unwrap(createKey(secondTonic, mode)),
    } as const;
  });

describe('structured Roman and canonical progression properties', () => {
  it('round-trips supported Roman chords through absolute chords in natural major and minor keys', () => {
    fc.assert(
      fc.property(naturalKeyArbitrary, romanChordArbitrary, (key, romanChord) => {
        const absoluteChord = unwrap(realizeRomanChord(romanChord, key));
        const roundTripped = unwrap(toRomanChord(absoluteChord, key));

        expect(roundTripped).toEqual(romanChord);
      }),
      { numRuns: 300 },
    );
  });

  it('canonicalizes realizations in two compatible keys to the same value and serialization', () => {
    fc.assert(
      fc.property(
        distinctCompatibleKeyPairArbitrary,
        romanProgressionArbitrary,
        ({ mode, first, second }, chords) => {
          const canonical = unwrap(createCanonicalProgression({ mode, chords }));
          const firstRealization = unwrap(realizeCanonicalProgression(canonical, first));
          const secondRealization = unwrap(realizeCanonicalProgression(canonical, second));
          const firstCanonical = unwrap(canonicalizeProgression(firstRealization, first));
          const secondCanonical = unwrap(canonicalizeProgression(secondRealization, second));

          expect(firstCanonical).toEqual(canonical);
          expect(secondCanonical).toEqual(canonical);
          expect(unwrap(serializeCanonicalProgression(firstCanonical))).toBe(
            unwrap(serializeCanonicalProgression(secondCanonical)),
          );
        },
      ),
      { numRuns: 250 },
    );
  });

  it('serializes deterministically and isolates canonical values from caller-owned arrays', () => {
    fc.assert(
      fc.property(modeArbitrary, romanProgressionArbitrary, (mode, generatedChords) => {
        const input = [...generatedChords];
        const expectedChords = [...generatedChords];
        const canonical = unwrap(createCanonicalProgression({ mode, chords: input }));
        const equivalent = unwrap(
          createCanonicalProgression({ mode, chords: [...generatedChords] }),
        );
        const serialized = unwrap(serializeCanonicalProgression(canonical));

        expect(unwrap(serializeCanonicalProgression(canonical))).toBe(serialized);
        expect(unwrap(serializeCanonicalProgression(equivalent))).toBe(serialized);

        input.splice(0, input.length);

        expect(canonical.chords).toEqual(expectedChords);
        expect(unwrap(serializeCanonicalProgression(canonical))).toBe(serialized);
      }),
      { numRuns: 200 },
    );
  });
});
