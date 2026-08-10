import {
  MODES,
  type AbsoluteChordIdentity,
  type CanonicalProgressionInput,
  type CanonicalProgressionV1,
  type ChordExtension,
  type Key,
  type NonEmptyReadonlyArray,
  type RomanChord,
} from './model.js';
import { createKey } from './key.js';
import { fromRomanNumerals, normalizeRomanChord, toRomanNumerals } from './roman.js';
import {
  failure,
  success,
  type ConversionError,
  type Result,
  type ValidationError,
} from './result.js';

const isRuntimeArray = (value: unknown): boolean => Array.isArray(value);

export const createCanonicalProgression = (
  input: CanonicalProgressionInput,
): Result<CanonicalProgressionV1, ValidationError> => {
  if (!(MODES as readonly string[]).includes(input.mode)) {
    return failure({ code: 'invalid-mode', received: String(input.mode) });
  }

  const inputChords: readonly RomanChord[] = input.chords;
  if (!isRuntimeArray(inputChords) || inputChords.length === 0) {
    return failure({ code: 'empty-progression' });
  }

  const normalizedChords: RomanChord[] = [];
  for (const chord of inputChords) {
    const normalized = normalizeRomanChord(chord);
    if (!normalized.ok) {
      return failure(normalized.error);
    }
    normalizedChords.push(normalized.value);
  }

  const chords = Object.freeze(normalizedChords) as NonEmptyReadonlyArray<RomanChord>;

  return success(
    Object.freeze({
      schemaVersion: 1,
      mode: input.mode,
      chords,
    }),
  );
};

export const canonicalizeProgression = (
  chords: readonly AbsoluteChordIdentity[],
  key: Key,
): Result<CanonicalProgressionV1, ConversionError> => {
  const romanChords = toRomanNumerals(chords, key);
  if (!romanChords.ok) {
    return failure(romanChords.error);
  }

  return createCanonicalProgression({ mode: key.mode, chords: romanChords.value });
};

const normalizeCanonicalProgressionV1 = (
  progression: CanonicalProgressionV1,
): Result<CanonicalProgressionV1, ValidationError> => {
  if (progression.schemaVersion !== 1) {
    return failure({ code: 'invalid-schema-version', received: progression.schemaVersion });
  }

  return createCanonicalProgression({
    mode: progression.mode,
    chords: progression.chords,
  });
};

export const realizeCanonicalProgression = (
  progression: CanonicalProgressionV1,
  key: Key,
): Result<readonly AbsoluteChordIdentity[], ConversionError> => {
  const normalized = normalizeCanonicalProgressionV1(progression);
  if (!normalized.ok) {
    return failure(normalized.error);
  }

  const validatedKey = createKey(key.tonic, key.mode);
  if (!validatedKey.ok) {
    return failure(validatedKey.error);
  }

  if (normalized.value.mode !== validatedKey.value.mode) {
    return failure({
      code: 'mode-mismatch',
      progressionMode: normalized.value.mode,
      keyMode: validatedKey.value.mode,
    });
  }

  return fromRomanNumerals(normalized.value.chords, validatedKey.value);
};

const serializeExtension = (extension: ChordExtension): object => {
  switch (extension.kind) {
    case 'none':
      return { kind: 'none' };
    case 'seventh':
      return { kind: 'seventh', quality: extension.quality };
    case 'added-tone':
      return {
        kind: 'added-tone',
        degree: extension.degree,
        alteration: extension.alteration,
      };
  }
};

export const serializeCanonicalProgression = (
  progression: CanonicalProgressionV1,
): Result<string, ValidationError> => {
  const normalized = normalizeCanonicalProgressionV1(progression);
  if (!normalized.ok) {
    return failure(normalized.error);
  }

  return success(
    JSON.stringify({
      schemaVersion: 1,
      mode: normalized.value.mode,
      chords: normalized.value.chords.map((chord) => ({
        degree: chord.degree,
        alteration: Object.is(chord.alteration, -0) ? 0 : chord.alteration,
        quality: chord.structure.quality,
        extension: serializeExtension(chord.structure.extension),
      })),
    }),
  );
};
