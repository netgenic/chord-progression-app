import { CHORD_KINDS, type ChordExtension, type ChordKind, type ChordStructure } from './model.js';
import { failure, success, type Result, type ValidationError } from './result.js';
import { hasExactOwnKeys, isRuntimeRecord } from './runtime-shape.js';

const noExtension = Object.freeze({ kind: 'none' } as const);
const majorSeventh = Object.freeze({ kind: 'seventh', quality: 'major' } as const);
const minorSeventh = Object.freeze({ kind: 'seventh', quality: 'minor' } as const);
const diminishedSeventh = Object.freeze({ kind: 'seventh', quality: 'diminished' } as const);
const addedNinth = Object.freeze({ kind: 'added-tone', degree: 9, alteration: 0 } as const);

export const CHORD_STRUCTURES: Readonly<Record<ChordKind, ChordStructure>> = Object.freeze({
  major: Object.freeze({ quality: 'major', extension: noExtension }),
  minor: Object.freeze({ quality: 'minor', extension: noExtension }),
  diminished: Object.freeze({ quality: 'diminished', extension: noExtension }),
  augmented: Object.freeze({ quality: 'augmented', extension: noExtension }),
  sus2: Object.freeze({ quality: 'sus2', extension: noExtension }),
  sus4: Object.freeze({ quality: 'sus4', extension: noExtension }),
  major7: Object.freeze({ quality: 'major', extension: majorSeventh }),
  minor7: Object.freeze({ quality: 'minor', extension: minorSeventh }),
  dominant7: Object.freeze({ quality: 'major', extension: minorSeventh }),
  diminished7: Object.freeze({ quality: 'diminished', extension: diminishedSeventh }),
  'half-diminished7': Object.freeze({ quality: 'diminished', extension: minorSeventh }),
  add9: Object.freeze({ quality: 'major', extension: addedNinth }),
  'minor-add9': Object.freeze({ quality: 'minor', extension: addedNinth }),
});

export const createChordStructure = (kind: string): Result<ChordStructure, ValidationError> => {
  if (!(CHORD_KINDS as readonly string[]).includes(kind)) {
    return failure({ code: 'invalid-chord-kind', received: kind });
  }

  return success(CHORD_STRUCTURES[kind as ChordKind]);
};

/** Internal structural comparison used to recover a supported chord kind. */
export const extensionsEqual = (left: ChordExtension, right: ChordExtension): boolean => {
  if (left.kind !== right.kind) {
    return false;
  }

  switch (left.kind) {
    case 'none':
      return true;
    case 'seventh':
      return right.kind === 'seventh' && left.quality === right.quality;
    case 'added-tone':
      return (
        right.kind === 'added-tone' &&
        left.degree === right.degree &&
        left.alteration === right.alteration
      );
  }
};

/** Internal reverse lookup for structurally typed values at package boundaries. */
export const chordKindOf = (structure: unknown): ChordKind | undefined => {
  if (!isRuntimeRecord(structure) || !hasExactOwnKeys(structure, ['quality', 'extension'])) {
    return undefined;
  }

  const extension = structure['extension'];
  if (!isRuntimeRecord(extension)) {
    return undefined;
  }

  switch (extension['kind']) {
    case 'none':
      if (!hasExactOwnKeys(extension, ['kind'])) {
        return undefined;
      }
      break;
    case 'seventh':
      if (!hasExactOwnKeys(extension, ['kind', 'quality'])) {
        return undefined;
      }
      break;
    case 'added-tone':
      if (!hasExactOwnKeys(extension, ['kind', 'degree', 'alteration'])) {
        return undefined;
      }
      break;
    default:
      return undefined;
  }

  return CHORD_KINDS.find((kind) => {
    const supported = CHORD_STRUCTURES[kind];

    return (
      structure['quality'] === supported.quality &&
      extensionsEqual(extension as ChordExtension, supported.extension)
    );
  });
};
