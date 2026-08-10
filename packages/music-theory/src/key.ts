import {
  MODES,
  NOTE_LETTERS,
  type DegreeAlteration,
  type Key,
  type Mode,
  type ScaleDegree,
  type SpelledPitchClass,
} from './model.js';
import {
  createInterval,
  createSpelledPitchClass,
  pitchClassOf,
  transposePitchClass,
  transposeSpelledPitch,
} from './pitch.js';
import {
  failure,
  success,
  type ConversionError,
  type Result,
  type ValidationError,
} from './result.js';

const MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;
const MINOR_SCALE_OFFSETS = [0, 2, 3, 5, 7, 8, 10] as const;

export interface ScaleDegreeInput {
  readonly degree: number;
  readonly alteration: number;
}

const isMode = (mode: string): mode is Mode => (MODES as readonly string[]).includes(mode);

const validateScaleDegree = (degree: number): Result<ScaleDegree, ValidationError> => {
  if (!Number.isSafeInteger(degree) || degree < 1 || degree > 7) {
    return failure({ code: 'invalid-scale-degree', received: degree });
  }

  return success(degree as ScaleDegree);
};

const validateDegreeAlteration = (
  alteration: number,
): Result<DegreeAlteration, ValidationError> => {
  if (!Number.isSafeInteger(alteration) || alteration < -2 || alteration > 2) {
    return failure({ code: 'invalid-degree-alteration', received: alteration });
  }

  return success(alteration as DegreeAlteration);
};

const scaleOffsetsFor = (mode: Mode): readonly number[] =>
  mode === 'major' ? MAJOR_SCALE_OFFSETS : MINOR_SCALE_OFFSETS;

const signedPitchClassDifference = (from: number, to: number): number => {
  const ascendingDifference = (((to - from) % 12) + 12) % 12;
  return ascendingDifference > 6 ? ascendingDifference - 12 : ascendingDifference;
};

export const createKey = (tonic: SpelledPitchClass, mode: string): Result<Key, ValidationError> => {
  const validatedTonic = createSpelledPitchClass(tonic.letter, tonic.accidental);
  if (!validatedTonic.ok) {
    return validatedTonic;
  }

  if (!isMode(mode)) {
    return failure({ code: 'invalid-mode', received: mode });
  }

  return success(Object.freeze({ tonic: validatedTonic.value, mode }));
};

export const scaleDegreeToSpelledPitch = (
  key: Key,
  scaleDegree: ScaleDegreeInput,
): Result<SpelledPitchClass, ConversionError> => {
  const validatedKey = createKey(key.tonic, key.mode);
  if (!validatedKey.ok) {
    return validatedKey;
  }

  const validatedDegree = validateScaleDegree(scaleDegree.degree);
  if (!validatedDegree.ok) {
    return validatedDegree;
  }

  const validatedAlteration = validateDegreeAlteration(scaleDegree.alteration);
  if (!validatedAlteration.ok) {
    return validatedAlteration;
  }

  const scaleOffset = scaleOffsetsFor(validatedKey.value.mode)[validatedDegree.value - 1];
  if (scaleOffset === undefined) {
    return failure({ code: 'invalid-scale-degree', received: validatedDegree.value });
  }

  const interval = createInterval(
    validatedDegree.value - 1,
    scaleOffset + validatedAlteration.value,
  );
  if (!interval.ok) {
    return interval;
  }

  return transposeSpelledPitch(validatedKey.value.tonic, interval.value);
};

export const spelledPitchToScaleDegree = (
  key: Key,
  note: SpelledPitchClass,
): Result<Readonly<{ degree: ScaleDegree; alteration: DegreeAlteration }>, ConversionError> => {
  const validatedKey = createKey(key.tonic, key.mode);
  if (!validatedKey.ok) {
    return validatedKey;
  }

  const validatedNote = createSpelledPitchClass(note.letter, note.accidental);
  if (!validatedNote.ok) {
    return validatedNote;
  }

  const tonicLetterIndex = NOTE_LETTERS.indexOf(validatedKey.value.tonic.letter);
  const noteLetterIndex = NOTE_LETTERS.indexOf(validatedNote.value.letter);
  const diatonicSteps = (((noteLetterIndex - tonicLetterIndex) % 7) + 7) % 7;
  const degree = (diatonicSteps + 1) as ScaleDegree;
  const scaleOffset = scaleOffsetsFor(validatedKey.value.mode)[diatonicSteps];
  if (scaleOffset === undefined) {
    return failure({ code: 'invalid-scale-degree', received: degree });
  }

  const tonicPitchClass = pitchClassOf(validatedKey.value.tonic);
  if (!tonicPitchClass.ok) {
    return tonicPitchClass;
  }

  const expectedPitchClass = transposePitchClass(tonicPitchClass.value, scaleOffset);
  if (!expectedPitchClass.ok) {
    return expectedPitchClass;
  }

  const notePitchClass = pitchClassOf(validatedNote.value);
  if (!notePitchClass.ok) {
    return notePitchClass;
  }

  const alteration = signedPitchClassDifference(expectedPitchClass.value, notePitchClass.value);
  const validatedAlteration = validateDegreeAlteration(alteration);
  if (!validatedAlteration.ok) {
    return failure({
      code: 'unsupported-spelling',
      letter: validatedNote.value.letter,
      requiredAccidental: alteration,
    });
  }

  return success(Object.freeze({ degree, alteration: validatedAlteration.value }));
};
