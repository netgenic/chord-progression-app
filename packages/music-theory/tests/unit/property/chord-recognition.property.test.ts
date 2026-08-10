import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  CHORD_KINDS,
  NOTE_LETTERS,
  createInterval,
  createSpelledPitchClass,
  detectChord,
  pitchClassOf,
  renderChord,
  transposeSpelledPitch,
  type ChordKind,
  type Result,
  type SpelledPitchClass,
} from '../../../src/index.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }

  return result.value;
};

type ToneInterval = readonly [diatonicSteps: number, semitones: number];

const CHORD_TONE_INTERVALS = Object.freeze({
  major: [
    [0, 0],
    [2, 4],
    [4, 7],
  ],
  minor: [
    [0, 0],
    [2, 3],
    [4, 7],
  ],
  diminished: [
    [0, 0],
    [2, 3],
    [4, 6],
  ],
  augmented: [
    [0, 0],
    [2, 4],
    [4, 8],
  ],
  sus2: [
    [0, 0],
    [1, 2],
    [4, 7],
  ],
  sus4: [
    [0, 0],
    [3, 5],
    [4, 7],
  ],
  major7: [
    [0, 0],
    [2, 4],
    [4, 7],
    [6, 11],
  ],
  minor7: [
    [0, 0],
    [2, 3],
    [4, 7],
    [6, 10],
  ],
  dominant7: [
    [0, 0],
    [2, 4],
    [4, 7],
    [6, 10],
  ],
  diminished7: [
    [0, 0],
    [2, 3],
    [4, 6],
    [6, 9],
  ],
  'half-diminished7': [
    [0, 0],
    [2, 3],
    [4, 6],
    [6, 10],
  ],
  add9: [
    [0, 0],
    [1, 2],
    [2, 4],
    [4, 7],
  ],
  'minor-add9': [
    [0, 0],
    [1, 2],
    [2, 3],
    [4, 7],
  ],
} satisfies Readonly<Record<ChordKind, readonly ToneInterval[]>>);

const naturalRootArbitrary = fc
  .constantFrom(...NOTE_LETTERS)
  .map((letter) => unwrap(createSpelledPitchClass(letter)));

const generatedChordArbitrary = fc
  .tuple(naturalRootArbitrary, fc.constantFrom(...CHORD_KINDS))
  .map(([root, kind]) => {
    const notes = CHORD_TONE_INTERVALS[kind].map(([diatonicSteps, semitones]) =>
      unwrap(transposeSpelledPitch(root, unwrap(createInterval(diatonicSteps, semitones)))),
    );

    return { root, kind, notes } as const;
  });

const arbitrarySpelledPitch = fc
  .tuple(fc.constantFrom(...NOTE_LETTERS), fc.integer({ min: -1, max: 1 }))
  .map(([letter, accidental]) => unwrap(createSpelledPitchClass(letter, accidental)));

const arbitraryRecognitionInput = fc
  .tuple(fc.array(arbitrarySpelledPitch, { minLength: 1, maxLength: 7 }), fc.boolean())
  .map(([notes, hasBass]) => ({ notes, bass: hasBass ? (notes[0] ?? null) : null }) as const);

const summarize = (notes: readonly SpelledPitchClass[], bass: SpelledPitchClass | null) =>
  unwrap(detectChord({ notes, bass })).candidates.map((candidate) => ({
    kind: candidate.kind,
    root: candidate.symbol.identity.root,
    symbol: unwrap(renderChord(candidate.symbol)),
    bassClassification: candidate.bassClassification,
    evidence: candidate.evidence,
  }));

const sortedDistinct = (values: readonly number[]): readonly number[] =>
  [...new Set(values)].sort((left, right) => left - right);

const soundingSet = (notes: readonly SpelledPitchClass[]): readonly number[] =>
  sortedDistinct(notes.map((note) => unwrap(pitchClassOf(note))));

const candidateToneSet = (kind: ChordKind, root: SpelledPitchClass): readonly number[] => {
  const rootPitchClass = unwrap(pitchClassOf(root));

  return sortedDistinct(
    CHORD_TONE_INTERVALS[kind].map(([, semitones]) => (rootPitchClass + semitones) % 12),
  );
};

describe('chord recognition properties', () => {
  it('finds the generated exact root and kind for every supported chord template', () => {
    fc.assert(
      fc.property(generatedChordArbitrary, ({ root, kind, notes }) => {
        const recognition = unwrap(detectChord({ notes, bass: root }));
        const expected = recognition.candidates.find(
          (candidate) =>
            candidate.kind === kind &&
            candidate.symbol.identity.root.letter === root.letter &&
            candidate.symbol.identity.root.accidental === root.accidental,
        );

        expect(expected).toBeDefined();
        expect(expected?.bassClassification).toEqual({ kind: 'root-position' });
        expect(expected?.evidence).toEqual({ pitchSet: 'exact', spellingMismatches: 0 });
        expect(expected?.symbol.bass).toBeNull();
      }),
      { numRuns: 250 },
    );
  });

  it('is invariant to every reversal or rotation of the unordered observations', () => {
    fc.assert(
      fc.property(generatedChordArbitrary, ({ root, notes }) => {
        const reversed = [...notes].reverse();
        const rotated = [...notes.slice(1), notes[0]!];
        const expected = summarize(notes, root);

        expect(summarize(reversed, root)).toEqual(expected);
        expect(summarize(rotated, root)).toEqual(expected);
      }),
      { numRuns: 250 },
    );
  });

  it('collapses arbitrary chord-tone doublings without changing candidate semantics', () => {
    fc.assert(
      fc.property(generatedChordArbitrary, ({ root, notes }) => {
        const doubled = [...notes, ...notes.slice().reverse(), root];

        expect(summarize(doubled, root)).toEqual(summarize(notes, root));
      }),
      { numRuns: 250 },
    );
  });

  it('never recognizes an arbitrary subset other than the explicit non-chord-bass fallback', () => {
    fc.assert(
      fc.property(arbitraryRecognitionInput, ({ notes, bass }) => {
        const recognition = unwrap(detectChord({ notes, bass }));
        const observed = soundingSet(notes);
        const identityKeys = new Set<string>();

        for (const candidate of recognition.candidates) {
          const tones = candidateToneSet(candidate.kind, candidate.symbol.identity.root);
          const expectedObserved =
            candidate.evidence.pitchSet === 'exact'
              ? observed
              : sortedDistinct(
                  observed.filter(
                    (pitchClass) => bass === null || pitchClass !== unwrap(pitchClassOf(bass)),
                  ),
                );

          expect(tones).toEqual(expectedObserved);
          if (candidate.evidence.pitchSet === 'without-non-chord-bass') {
            expect(bass).not.toBeNull();
            expect(candidate.bassClassification).toEqual({ kind: 'non-chord' });
          }

          const identityKey = `${candidate.kind}:${candidate.symbol.identity.root.letter}:${candidate.symbol.identity.root.accidental}`;
          expect(identityKeys.has(identityKey)).toBe(false);
          identityKeys.add(identityKey);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('returns deterministic immutable candidate ordering for repeated recognition', () => {
    fc.assert(
      fc.property(arbitraryRecognitionInput, ({ notes, bass }) => {
        const first = unwrap(detectChord({ notes, bass }));
        const second = unwrap(detectChord({ notes: [...notes], bass }));

        expect(first).toEqual(second);
        expect(Object.isFrozen(first)).toBe(true);
        expect(Object.isFrozen(first.notes)).toBe(true);
        expect(Object.isFrozen(first.candidates)).toBe(true);
        for (const candidate of first.candidates) {
          expect(Object.isFrozen(candidate)).toBe(true);
          expect(Object.isFrozen(candidate.bassClassification)).toBe(true);
          expect(Object.isFrozen(candidate.evidence)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });
});
