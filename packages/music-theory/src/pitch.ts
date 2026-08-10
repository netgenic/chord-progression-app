import {
  NOTE_LETTERS,
  type Accidental,
  type Interval,
  type NoteLetter,
  type PitchClass,
  type SpelledPitchClass,
} from './model.js';
import {
  failure,
  success,
  type ConversionError,
  type Result,
  type ValidationError,
} from './result.js';

const NATURAL_PITCH_CLASSES: Readonly<Record<NoteLetter, PitchClass>> = Object.freeze({
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
});

const normalizeModulo = (value: number, modulus: number): number =>
  ((value % modulus) + modulus) % modulus;

const isNoteLetter = (letter: string): letter is NoteLetter =>
  (NOTE_LETTERS as readonly string[]).includes(letter);

const isAccidental = (accidental: number): accidental is Accidental =>
  Number.isSafeInteger(accidental) && accidental >= -2 && accidental <= 2;

const signedPitchClassDifference = (from: PitchClass, to: PitchClass): number => {
  const ascendingDifference = normalizeModulo(to - from, 12);
  return ascendingDifference > 6 ? ascendingDifference - 12 : ascendingDifference;
};

export const createSpelledPitchClass = (
  letter: string,
  accidental = 0,
): Result<SpelledPitchClass, ValidationError> => {
  if (!isNoteLetter(letter)) {
    return failure({ code: 'invalid-note-letter', received: letter });
  }

  if (!isAccidental(accidental)) {
    return failure({ code: 'invalid-accidental', received: accidental });
  }

  return success(Object.freeze({ letter, accidental: Object.is(accidental, -0) ? 0 : accidental }));
};

const pitchClassOfValidated = (note: SpelledPitchClass): PitchClass =>
  normalizeModulo(NATURAL_PITCH_CLASSES[note.letter] + note.accidental, 12) as PitchClass;

export const pitchClassOf = (note: SpelledPitchClass): Result<PitchClass, ValidationError> => {
  const validatedNote = createSpelledPitchClass(note.letter, note.accidental);
  if (!validatedNote.ok) {
    return validatedNote;
  }

  return success(pitchClassOfValidated(validatedNote.value));
};

export const createInterval = (
  diatonicSteps: number,
  semitones: number,
): Result<Interval, ValidationError> => {
  if (!Number.isSafeInteger(diatonicSteps)) {
    return failure({ code: 'invalid-diatonic-steps', received: diatonicSteps });
  }

  if (!Number.isSafeInteger(semitones)) {
    return failure({ code: 'invalid-semitone-offset', received: semitones });
  }

  return success(Object.freeze({ diatonicSteps, semitones }));
};

export const transposePitchClass = (
  pitchClass: number,
  semitones: number,
): Result<PitchClass, ValidationError> => {
  if (!Number.isSafeInteger(pitchClass) || pitchClass < 0 || pitchClass > 11) {
    return failure({ code: 'invalid-pitch-class', received: pitchClass });
  }

  if (!Number.isSafeInteger(semitones)) {
    return failure({ code: 'invalid-semitone-offset', received: semitones });
  }

  const normalizedOffset = normalizeModulo(semitones, 12);
  return success(normalizeModulo(pitchClass + normalizedOffset, 12) as PitchClass);
};

export const transposeSpelledPitch = (
  note: SpelledPitchClass,
  interval: Interval,
): Result<SpelledPitchClass, ConversionError> => {
  const validatedNote = createSpelledPitchClass(note.letter, note.accidental);
  if (!validatedNote.ok) {
    return validatedNote;
  }

  const validatedInterval = createInterval(interval.diatonicSteps, interval.semitones);
  if (!validatedInterval.ok) {
    return validatedInterval;
  }

  const sourceLetterIndex = NOTE_LETTERS.indexOf(validatedNote.value.letter);
  const targetLetterIndex = normalizeModulo(
    sourceLetterIndex + normalizeModulo(validatedInterval.value.diatonicSteps, 7),
    7,
  );
  const targetLetter = NOTE_LETTERS[targetLetterIndex] as NoteLetter;

  const targetPitchClass = transposePitchClass(
    pitchClassOfValidated(validatedNote.value),
    validatedInterval.value.semitones,
  );
  if (!targetPitchClass.ok) {
    return targetPitchClass;
  }

  const requiredAccidental = signedPitchClassDifference(
    NATURAL_PITCH_CLASSES[targetLetter],
    targetPitchClass.value,
  );
  if (!isAccidental(requiredAccidental)) {
    return failure({
      code: 'unsupported-spelling',
      letter: targetLetter,
      requiredAccidental,
    });
  }

  return createSpelledPitchClass(targetLetter, requiredAccidental);
};
