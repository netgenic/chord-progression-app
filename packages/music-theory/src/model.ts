export const NOTE_LETTERS = Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const);
export type NoteLetter = (typeof NOTE_LETTERS)[number];

export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface SpelledPitchClass {
  readonly letter: NoteLetter;
  readonly accidental: Accidental;
}

export interface Interval {
  /** Zero-based distance through note letters: unison = 0, second = 1, etc. */
  readonly diatonicSteps: number;
  readonly semitones: number;
}

export const MODES = Object.freeze(['major', 'minor'] as const);
export type Mode = (typeof MODES)[number];

export interface Key {
  readonly tonic: SpelledPitchClass;
  readonly mode: Mode;
}

export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DegreeAlteration = Accidental;

export const CHORD_KINDS = Object.freeze([
  'major',
  'minor',
  'diminished',
  'augmented',
  'sus2',
  'sus4',
  'major7',
  'minor7',
  'dominant7',
  'diminished7',
  'half-diminished7',
  'add9',
  'minor-add9',
] as const);
export type ChordKind = (typeof CHORD_KINDS)[number];

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4';

export type ChordExtension =
  | Readonly<{ kind: 'none' }>
  | Readonly<{ kind: 'seventh'; quality: 'major' | 'minor' | 'diminished' }>
  | Readonly<{ kind: 'added-tone'; degree: 9; alteration: 0 }>;

export interface ChordStructure {
  readonly quality: ChordQuality;
  readonly extension: ChordExtension;
}

export interface AbsoluteChordIdentity {
  readonly root: SpelledPitchClass;
  readonly structure: ChordStructure;
}

export interface RomanChord {
  readonly degree: ScaleDegree;
  readonly alteration: DegreeAlteration;
  readonly structure: ChordStructure;
}

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

export interface CanonicalProgressionInput {
  readonly mode: Mode;
  readonly chords: readonly RomanChord[];
}

export interface CanonicalProgressionV1 {
  readonly schemaVersion: 1;
  readonly mode: Mode;
  readonly chords: NonEmptyReadonlyArray<RomanChord>;
}
