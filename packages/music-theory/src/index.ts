export { CHORD_STRUCTURES, createChordStructure } from './chord-structure.js';
export {
  CHORD_KINDS,
  MODES,
  NOTE_LETTERS,
  type AbsoluteChordIdentity,
  type Accidental,
  type CanonicalProgressionInput,
  type CanonicalProgressionV1,
  type ChordExtension,
  type ChordKind,
  type ChordQuality,
  type ChordStructure,
  type DegreeAlteration,
  type Interval,
  type Key,
  type Mode,
  type NonEmptyReadonlyArray,
  type NoteLetter,
  type PitchClass,
  type RomanChord,
  type ScaleDegree,
  type SpelledPitchClass,
} from './model.js';
export {
  createInterval,
  createSpelledPitchClass,
  pitchClassOf,
  transposePitchClass,
  transposeSpelledPitch,
} from './pitch.js';
export { createKey, scaleDegreeToSpelledPitch, spelledPitchToScaleDegree } from './key.js';
export type { ScaleDegreeInput } from './key.js';
export {
  createAbsoluteChord,
  createRomanChord,
  fromRomanNumerals,
  realizeRomanChord,
  toRomanChord,
  toRomanNumerals,
} from './roman.js';
export {
  canonicalizeProgression,
  createCanonicalProgression,
  realizeCanonicalProgression,
  serializeCanonicalProgression,
} from './canonical.js';
export type { ConversionError, Result, ValidationError } from './result.js';
