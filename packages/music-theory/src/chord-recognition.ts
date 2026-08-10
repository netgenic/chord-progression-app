import { createAbsoluteChord } from './chord.js';
import { createChordSymbol } from './chord-symbol.js';
import {
  NOTE_LETTERS,
  type ChordBassClassification,
  type ChordKind,
  type ChordRecognition,
  type ChordRecognitionCandidate,
  type ChordRecognitionEvidence,
  type ChordRecognitionInput,
  type ChordToneRole,
  type Interval,
  type NonEmptyReadonlyArray,
  type PitchClass,
  type SpelledPitchClass,
} from './model.js';
import { createSpelledPitchClass, pitchClassOf, transposeSpelledPitch } from './pitch.js';
import {
  failure,
  success,
  type ChordRecognitionError,
  type Result,
  type ValidationError,
} from './result.js';
import { hasExactOwnKeys, isRuntimeRecord } from './runtime-shape.js';

type ChordMemberDegree = 1 | 2 | 3 | 4 | 5 | 7 | 9;

interface ChordTemplateMember {
  readonly degree: ChordMemberDegree;
  readonly interval: Interval;
}

interface ObservedPitch {
  readonly note: SpelledPitchClass;
  readonly pitchClass: PitchClass;
}

interface NormalizedRecognitionInput {
  readonly notes: NonEmptyReadonlyArray<SpelledPitchClass>;
  readonly observations: readonly ObservedPitch[];
  readonly bass: SpelledPitchClass | null;
  readonly bassPitchClass: PitchClass | null;
}

interface CandidateWithSortEvidence {
  readonly candidate: ChordRecognitionCandidate;
  readonly root: SpelledPitchClass;
  readonly rootPitchClass: PitchClass;
}

const chordMember = (
  degree: ChordMemberDegree,
  diatonicSteps: number,
  semitones: number,
): ChordTemplateMember =>
  Object.freeze({ degree, interval: Object.freeze({ diatonicSteps, semitones }) });

const root = chordMember(1, 0, 0);
const majorSecond = chordMember(2, 1, 2);
const minorThird = chordMember(3, 2, 3);
const majorThird = chordMember(3, 2, 4);
const perfectFourth = chordMember(4, 3, 5);
const diminishedFifth = chordMember(5, 4, 6);
const perfectFifth = chordMember(5, 4, 7);
const augmentedFifth = chordMember(5, 4, 8);
const diminishedSeventh = chordMember(7, 6, 9);
const minorSeventh = chordMember(7, 6, 10);
const majorSeventh = chordMember(7, 6, 11);
const addedNinth = chordMember(9, 8, 2);

const template = (...members: readonly ChordTemplateMember[]): readonly ChordTemplateMember[] =>
  Object.freeze(members);

const CHORD_TEMPLATES: Readonly<Record<ChordKind, readonly ChordTemplateMember[]>> = Object.freeze({
  major: template(root, majorThird, perfectFifth),
  minor: template(root, minorThird, perfectFifth),
  diminished: template(root, minorThird, diminishedFifth),
  augmented: template(root, majorThird, augmentedFifth),
  sus2: template(root, majorSecond, perfectFifth),
  sus4: template(root, perfectFourth, perfectFifth),
  major7: template(root, majorThird, perfectFifth, majorSeventh),
  minor7: template(root, minorThird, perfectFifth, minorSeventh),
  dominant7: template(root, majorThird, perfectFifth, minorSeventh),
  diminished7: template(root, minorThird, diminishedFifth, diminishedSeventh),
  'half-diminished7': template(root, minorThird, diminishedFifth, minorSeventh),
  add9: template(root, majorThird, perfectFifth, addedNinth),
  'minor-add9': template(root, minorThird, perfectFifth, addedNinth),
});

/** Stable v1 tie-break order; changing it is an observable recognition-policy change. */
const RECOGNITION_KIND_ORDER: readonly ChordKind[] = Object.freeze([
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
]);

const normalizePitchClass = (value: number): PitchClass => (((value % 12) + 12) % 12) as PitchClass;

const notesEqual = (left: SpelledPitchClass, right: SpelledPitchClass): boolean =>
  left.letter === right.letter && left.accidental === right.accidental;

const normalizeObservedNote = (value: unknown): Result<SpelledPitchClass, ValidationError> => {
  if (!isRuntimeRecord(value)) {
    return failure({ code: 'invalid-spelled-pitch-value', reason: 'not-object' });
  }

  if (!hasExactOwnKeys(value, ['letter', 'accidental'])) {
    return failure({ code: 'invalid-spelled-pitch-value', reason: 'unexpected-fields' });
  }

  const letter = value['letter'];
  const accidental = value['accidental'];
  if (typeof letter !== 'string' || typeof accidental !== 'number') {
    return failure({ code: 'invalid-spelled-pitch-value', reason: 'invalid-field-types' });
  }

  return createSpelledPitchClass(letter, accidental);
};

const normalizeRecognitionInput = (
  input: ChordRecognitionInput,
): Result<NormalizedRecognitionInput, ChordRecognitionError> => {
  const inputCandidate: unknown = input;
  if (!isRuntimeRecord(inputCandidate) || Array.isArray(inputCandidate)) {
    return failure({ code: 'invalid-chord-recognition-input', reason: 'not-object' });
  }

  if (!hasExactOwnKeys(inputCandidate, ['notes', 'bass'])) {
    const hasRequiredFields =
      Object.hasOwn(inputCandidate, 'notes') && Object.hasOwn(inputCandidate, 'bass');
    return failure({
      code: 'invalid-chord-recognition-input',
      reason: hasRequiredFields ? 'unexpected-fields' : 'missing-fields',
    });
  }

  const notesCandidate = inputCandidate['notes'];
  if (!Array.isArray(notesCandidate)) {
    return failure({ code: 'invalid-chord-recognition-notes', reason: 'not-array' });
  }

  if (notesCandidate.length === 0) {
    return failure({ code: 'invalid-chord-recognition-notes', reason: 'empty' });
  }

  const notes: SpelledPitchClass[] = [];
  const observations: ObservedPitch[] = [];
  for (let index = 0; index < notesCandidate.length; index += 1) {
    const normalizedNote = normalizeObservedNote(notesCandidate[index]);
    if (!normalizedNote.ok) {
      return failure({
        code: 'chord-recognition-note-error',
        index,
        cause: normalizedNote.error,
      });
    }

    const soundingPitchClass = pitchClassOf(normalizedNote.value);
    if (!soundingPitchClass.ok) {
      return failure({
        code: 'chord-recognition-note-error',
        index,
        cause: soundingPitchClass.error,
      });
    }

    notes.push(normalizedNote.value);
    observations.push(
      Object.freeze({ note: normalizedNote.value, pitchClass: soundingPitchClass.value }),
    );
  }

  const bassCandidate = inputCandidate['bass'];
  let bass: SpelledPitchClass | null = null;
  let bassPitchClass: PitchClass | null = null;
  if (bassCandidate !== null) {
    const normalizedBass = normalizeObservedNote(bassCandidate);
    if (!normalizedBass.ok) {
      return failure({ code: 'chord-recognition-bass-error', cause: normalizedBass.error });
    }

    const observedBass = observations.find((observation) =>
      notesEqual(observation.note, normalizedBass.value),
    );
    if (observedBass === undefined) {
      return failure({ code: 'chord-recognition-bass-not-present' });
    }

    bass = observedBass.note;
    bassPitchClass = observedBass.pitchClass;
  }

  return success(
    Object.freeze({
      notes: Object.freeze(notes) as NonEmptyReadonlyArray<SpelledPitchClass>,
      observations: Object.freeze(observations),
      bass,
      bassPitchClass,
    }),
  );
};

const distinctPitchClasses = (observations: readonly ObservedPitch[]): readonly PitchClass[] =>
  Object.freeze(
    [...new Set(observations.map((observation) => observation.pitchClass))].sort(
      (left, right) => left - right,
    ),
  );

const distinctRootSpellings = (
  observations: readonly ObservedPitch[],
): readonly ObservedPitch[] => {
  const roots: ObservedPitch[] = [];
  for (const observation of observations) {
    if (!roots.some((candidate) => notesEqual(candidate.note, observation.note))) {
      roots.push(observation);
    }
  }
  return roots;
};

const templateMatchesPitchSet = (
  rootPitchClass: PitchClass,
  members: readonly ChordTemplateMember[],
  observedPitchClasses: readonly PitchClass[],
): boolean => {
  if (members.length !== observedPitchClasses.length) {
    return false;
  }

  const observedSet = new Set<PitchClass>(observedPitchClasses);
  return members.every((member) =>
    observedSet.has(normalizePitchClass(rootPitchClass + member.interval.semitones)),
  );
};

const countSpellingMismatches = (
  rootNote: SpelledPitchClass,
  members: readonly ChordTemplateMember[],
  observations: readonly ObservedPitch[],
): number =>
  members.reduce((mismatches, member) => {
    const expected = transposeSpelledPitch(rootNote, member.interval);
    if (!expected.ok) {
      return mismatches + 1;
    }

    const observed = observations.some((observation) =>
      notesEqual(observation.note, expected.value),
    );
    return mismatches + (observed ? 0 : 1);
  }, 0);

const chordToneRoleOf = (degree: Exclude<ChordMemberDegree, 1>): ChordToneRole => {
  switch (degree) {
    case 2:
      return 'second';
    case 3:
      return 'third';
    case 4:
      return 'fourth';
    case 5:
      return 'fifth';
    case 7:
      return 'seventh';
    case 9:
      return 'ninth';
  }
};

const classifyBass = (
  bassPitchClass: PitchClass | null,
  rootPitchClass: PitchClass,
  members: readonly ChordTemplateMember[],
): ChordBassClassification => {
  if (bassPitchClass === null) {
    return Object.freeze({ kind: 'unknown' });
  }

  if (bassPitchClass === rootPitchClass) {
    return Object.freeze({ kind: 'root-position' });
  }

  const member = members.find(
    (candidate) =>
      candidate.degree !== 1 &&
      normalizePitchClass(rootPitchClass + candidate.interval.semitones) === bassPitchClass,
  );
  if (member !== undefined && member.degree !== 1) {
    return Object.freeze({ kind: 'inversion', chordTone: chordToneRoleOf(member.degree) });
  }

  return Object.freeze({ kind: 'non-chord' });
};

const buildCandidate = (
  kind: ChordKind,
  rootObservation: ObservedPitch,
  members: readonly ChordTemplateMember[],
  observations: readonly ObservedPitch[],
  bass: SpelledPitchClass | null,
  bassPitchClass: PitchClass | null,
  pitchSet: ChordRecognitionEvidence['pitchSet'],
): Result<CandidateWithSortEvidence, ChordRecognitionError> => {
  const identity = createAbsoluteChord(rootObservation.note, kind);
  if (!identity.ok) {
    return failure(identity.error);
  }

  const bassClassification = classifyBass(bassPitchClass, rootObservation.pitchClass, members);
  const slashBass =
    bassClassification.kind === 'inversion' || bassClassification.kind === 'non-chord'
      ? bass
      : null;
  const symbol = createChordSymbol(identity.value, slashBass);
  if (!symbol.ok) {
    return failure(symbol.error);
  }

  const evidence = Object.freeze({
    pitchSet,
    spellingMismatches: countSpellingMismatches(rootObservation.note, members, observations),
  });
  const candidate = Object.freeze({ kind, symbol: symbol.value, bassClassification, evidence });

  return success(
    Object.freeze({
      candidate,
      root: rootObservation.note,
      rootPitchClass: rootObservation.pitchClass,
    }),
  );
};

const collectCandidates = (
  observations: readonly ObservedPitch[],
  bass: SpelledPitchClass | null,
  bassPitchClass: PitchClass | null,
  pitchSet: ChordRecognitionEvidence['pitchSet'],
): Result<readonly CandidateWithSortEvidence[], ChordRecognitionError> => {
  const observedPitchClasses = distinctPitchClasses(observations);
  const roots = distinctRootSpellings(observations);
  const candidates: CandidateWithSortEvidence[] = [];

  for (const kind of RECOGNITION_KIND_ORDER) {
    const members = CHORD_TEMPLATES[kind];
    for (const rootObservation of roots) {
      if (!templateMatchesPitchSet(rootObservation.pitchClass, members, observedPitchClasses)) {
        continue;
      }

      const candidate = buildCandidate(
        kind,
        rootObservation,
        members,
        observations,
        bass,
        bassPitchClass,
        pitchSet,
      );
      if (!candidate.ok) {
        return candidate;
      }
      candidates.push(candidate.value);
    }
  }

  return success(candidates);
};

const bassClassificationRank = (classification: ChordBassClassification): number => {
  switch (classification.kind) {
    case 'root-position':
      return 0;
    case 'inversion':
      return 1;
    case 'unknown':
      return 2;
    case 'non-chord':
      return 3;
  }
};

const compareCandidates = (
  left: CandidateWithSortEvidence,
  right: CandidateWithSortEvidence,
): number => {
  const pitchSetDifference =
    Number(left.candidate.evidence.pitchSet === 'without-non-chord-bass') -
    Number(right.candidate.evidence.pitchSet === 'without-non-chord-bass');
  if (pitchSetDifference !== 0) {
    return pitchSetDifference;
  }

  const spellingDifference =
    left.candidate.evidence.spellingMismatches - right.candidate.evidence.spellingMismatches;
  if (spellingDifference !== 0) {
    return spellingDifference;
  }

  const bassDifference =
    bassClassificationRank(left.candidate.bassClassification) -
    bassClassificationRank(right.candidate.bassClassification);
  if (bassDifference !== 0) {
    return bassDifference;
  }

  const kindDifference =
    RECOGNITION_KIND_ORDER.indexOf(left.candidate.kind) -
    RECOGNITION_KIND_ORDER.indexOf(right.candidate.kind);
  if (kindDifference !== 0) {
    return kindDifference;
  }

  const pitchDifference = left.rootPitchClass - right.rootPitchClass;
  if (pitchDifference !== 0) {
    return pitchDifference;
  }

  const letterDifference =
    NOTE_LETTERS.indexOf(left.root.letter) - NOTE_LETTERS.indexOf(right.root.letter);
  if (letterDifference !== 0) {
    return letterDifference;
  }

  return left.root.accidental - right.root.accidental;
};

export const detectChord = (
  input: ChordRecognitionInput,
): Result<ChordRecognition, ChordRecognitionError> => {
  const normalized = normalizeRecognitionInput(input);
  if (!normalized.ok) {
    return normalized;
  }

  const exactCandidates = collectCandidates(
    normalized.value.observations,
    normalized.value.bass,
    normalized.value.bassPitchClass,
    'exact',
  );
  if (!exactCandidates.ok) {
    return exactCandidates;
  }

  let candidates = exactCandidates.value;
  if (candidates.length === 0 && normalized.value.bassPitchClass !== null) {
    const upperStructure = normalized.value.observations.filter(
      (observation) => observation.pitchClass !== normalized.value.bassPitchClass,
    );
    const fallbackCandidates = collectCandidates(
      upperStructure,
      normalized.value.bass,
      normalized.value.bassPitchClass,
      'without-non-chord-bass',
    );
    if (!fallbackCandidates.ok) {
      return fallbackCandidates;
    }
    candidates = fallbackCandidates.value;
  }

  const sortedCandidates = Object.freeze(
    [...candidates].sort(compareCandidates).map((candidate) => candidate.candidate),
  );

  return success(
    Object.freeze({
      notes: normalized.value.notes,
      bass: normalized.value.bass,
      candidates: sortedCandidates,
    }),
  );
};
