import { chordKindOf, createChordStructure } from './chord-structure.js';
import type { AbsoluteChordIdentity, SpelledPitchClass } from './model.js';
import { createSpelledPitchClass } from './pitch.js';
import { failure, success, type Result, type ValidationError } from './result.js';
import { hasExactOwnKeys, isRuntimeRecord } from './runtime-shape.js';

export const createAbsoluteChord = (
  root: SpelledPitchClass,
  kind: string,
): Result<AbsoluteChordIdentity, ValidationError> => {
  const rootCandidate: unknown = root;
  if (
    !isRuntimeRecord(rootCandidate) ||
    !hasExactOwnKeys(rootCandidate, ['letter', 'accidental'])
  ) {
    return failure({ code: 'invalid-chord-value', reason: 'invalid-root' });
  }

  const letter = rootCandidate['letter'];
  const accidental = rootCandidate['accidental'];
  if (typeof letter !== 'string' || typeof accidental !== 'number') {
    return failure({ code: 'invalid-chord-value', reason: 'invalid-root' });
  }

  const normalizedRoot = createSpelledPitchClass(letter, accidental);
  if (!normalizedRoot.ok) {
    return failure(normalizedRoot.error);
  }

  const structure = createChordStructure(kind);
  if (!structure.ok) {
    return failure(structure.error);
  }

  return success(
    Object.freeze({
      root: normalizedRoot.value,
      structure: structure.value,
    }),
  );
};

/** Rebuilds a structurally typed value through the supported chord vocabulary. */
export const normalizeAbsoluteChord = (
  chord: AbsoluteChordIdentity,
): Result<AbsoluteChordIdentity, ValidationError> => {
  const chordCandidate: unknown = chord;
  if (!isRuntimeRecord(chordCandidate)) {
    return failure({ code: 'invalid-chord-value', reason: 'not-object' });
  }

  if (!hasExactOwnKeys(chordCandidate, ['root', 'structure'])) {
    return failure({ code: 'invalid-chord-value', reason: 'unexpected-fields' });
  }

  const root = chordCandidate['root'];
  if (!isRuntimeRecord(root)) {
    return failure({ code: 'invalid-chord-value', reason: 'invalid-root' });
  }

  const kind = chordKindOf(chordCandidate['structure']);
  if (kind === undefined) {
    return failure({ code: 'invalid-chord-kind', received: 'unsupported-structure' });
  }

  return createAbsoluteChord(root as unknown as SpelledPitchClass, kind);
};
