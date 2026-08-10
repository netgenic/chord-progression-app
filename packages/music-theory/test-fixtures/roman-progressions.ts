import type {
  AbsoluteChordIdentity,
  CanonicalProgressionV1,
  ChordStructure,
  Key,
  NonEmptyReadonlyArray,
  RomanChord,
  SpelledPitchClass,
} from '../src/index.js';

export interface RomanProgressionRealization {
  readonly label: string;
  readonly key: Key;
  readonly chords: NonEmptyReadonlyArray<AbsoluteChordIdentity>;
}

export interface RomanProgressionGolden {
  readonly name: string;
  readonly rationale: string;
  readonly canonical: CanonicalProgressionV1;
  readonly serialization: string;
  readonly realizations: NonEmptyReadonlyArray<RomanProgressionRealization>;
}

const none = Object.freeze({ kind: 'none' } as const);
const minorSeventh = Object.freeze({ kind: 'seventh', quality: 'minor' } as const);

const major: ChordStructure = Object.freeze({ quality: 'major', extension: none });
const minor: ChordStructure = Object.freeze({ quality: 'minor', extension: none });
const dominantSeventh: ChordStructure = Object.freeze({
  quality: 'major',
  extension: minorSeventh,
});

const note = (
  letter: SpelledPitchClass['letter'],
  accidental: SpelledPitchClass['accidental'] = 0,
): SpelledPitchClass => Object.freeze({ letter, accidental });

const absolute = (root: SpelledPitchClass, structure: ChordStructure): AbsoluteChordIdentity =>
  Object.freeze({ root, structure });

const roman = (
  degree: RomanChord['degree'],
  structure: ChordStructure,
  alteration: RomanChord['alteration'] = 0,
): RomanChord => Object.freeze({ degree, alteration, structure });

const nonEmpty = <T>(first: T, ...rest: T[]): NonEmptyReadonlyArray<T> =>
  Object.freeze([first, ...rest]);

const majorOneFiveSixFour = nonEmpty(
  roman(1, major),
  roman(5, major),
  roman(6, minor),
  roman(4, major),
);

const minorOneSixFourFiveSeven = nonEmpty(
  roman(1, minor),
  roman(6, major),
  roman(4, minor),
  roman(5, dominantSeventh),
);

const minorOneSixThreeSeven = nonEmpty(
  roman(1, minor),
  roman(6, major),
  roman(3, major),
  roman(7, major),
);

export const ROMAN_PROGRESSION_GOLDENS: readonly RomanProgressionGolden[] = Object.freeze([
  Object.freeze({
    name: 'major I-V-vi-IV',
    rationale:
      'C major supplies the diatonic roots C, G, A, F; the explicit minor quality on degree six yields vi.',
    canonical: Object.freeze({
      schemaVersion: 1,
      mode: 'major',
      chords: majorOneFiveSixFour,
    }),
    serialization:
      '{"schemaVersion":1,"mode":"major","chords":[{"degree":1,"alteration":0,"quality":"major","extension":{"kind":"none"}},{"degree":5,"alteration":0,"quality":"major","extension":{"kind":"none"}},{"degree":6,"alteration":0,"quality":"minor","extension":{"kind":"none"}},{"degree":4,"alteration":0,"quality":"major","extension":{"kind":"none"}}]}',
    realizations: nonEmpty<RomanProgressionRealization>(
      Object.freeze({
        label: 'C major',
        key: Object.freeze({ tonic: note('C'), mode: 'major' }),
        chords: nonEmpty(
          absolute(note('C'), major),
          absolute(note('G'), major),
          absolute(note('A'), minor),
          absolute(note('F'), major),
        ),
      }),
    ),
  }),
  Object.freeze({
    name: 'minor i-VI-iv-V7',
    rationale:
      'Natural-minor scale degrees determine the roots; an explicit dominant7 structure raises the leading tone inside V7 without changing its root degree.',
    canonical: Object.freeze({
      schemaVersion: 1,
      mode: 'minor',
      chords: minorOneSixFourFiveSeven,
    }),
    serialization:
      '{"schemaVersion":1,"mode":"minor","chords":[{"degree":1,"alteration":0,"quality":"minor","extension":{"kind":"none"}},{"degree":6,"alteration":0,"quality":"major","extension":{"kind":"none"}},{"degree":4,"alteration":0,"quality":"minor","extension":{"kind":"none"}},{"degree":5,"alteration":0,"quality":"major","extension":{"kind":"seventh","quality":"minor"}}]}',
    realizations: nonEmpty<RomanProgressionRealization>(
      Object.freeze({
        label: 'E minor',
        key: Object.freeze({ tonic: note('E'), mode: 'minor' }),
        chords: nonEmpty(
          absolute(note('E'), minor),
          absolute(note('C'), major),
          absolute(note('A'), minor),
          absolute(note('B'), dominantSeventh),
        ),
      }),
      Object.freeze({
        label: 'C minor',
        key: Object.freeze({ tonic: note('C'), mode: 'minor' }),
        chords: nonEmpty(
          absolute(note('C'), minor),
          absolute(note('A', -1), major),
          absolute(note('F'), minor),
          absolute(note('G'), dominantSeventh),
        ),
      }),
    ),
  }),
  Object.freeze({
    name: 'minor i-VI-III-VII canonical equivalence',
    rationale:
      'E minor and C minor realize the same ordered natural-minor degrees and chord structures, so their absolute roots must not affect canonical identity.',
    canonical: Object.freeze({
      schemaVersion: 1,
      mode: 'minor',
      chords: minorOneSixThreeSeven,
    }),
    serialization:
      '{"schemaVersion":1,"mode":"minor","chords":[{"degree":1,"alteration":0,"quality":"minor","extension":{"kind":"none"}},{"degree":6,"alteration":0,"quality":"major","extension":{"kind":"none"}},{"degree":3,"alteration":0,"quality":"major","extension":{"kind":"none"}},{"degree":7,"alteration":0,"quality":"major","extension":{"kind":"none"}}]}',
    realizations: nonEmpty<RomanProgressionRealization>(
      Object.freeze({
        label: 'E minor: Em-C-G-D',
        key: Object.freeze({ tonic: note('E'), mode: 'minor' }),
        chords: nonEmpty(
          absolute(note('E'), minor),
          absolute(note('C'), major),
          absolute(note('G'), major),
          absolute(note('D'), major),
        ),
      }),
      Object.freeze({
        label: 'C minor: Cm-Ab-Eb-Bb',
        key: Object.freeze({ tonic: note('C'), mode: 'minor' }),
        chords: nonEmpty(
          absolute(note('C'), minor),
          absolute(note('A', -1), major),
          absolute(note('E', -1), major),
          absolute(note('B', -1), major),
        ),
      }),
    ),
  }),
]);
