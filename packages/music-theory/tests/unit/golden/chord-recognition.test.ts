import { describe, expect, it } from 'vitest';

import {
  createSpelledPitchClass,
  detectChord,
  pitchClassOf,
  renderChord,
  type Result,
  type SpelledPitchClass,
} from '../../../src/index.js';
import {
  CHORD_KIND_RECOGNITION_GOLDENS,
  ENHARMONIC_RECOGNITION_GOLDENS,
  FALLBACK_RECOGNITION_GOLDENS,
  INVERSION_RECOGNITION_GOLDENS,
  VALID_UNRECOGNIZED_GOLDENS,
  type ChordRecognitionGolden,
  type RecognitionPitchFixture,
} from '../../../test-fixtures/chord-recognition.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }

  return result.value;
};

const toPitch = (fixture: RecognitionPitchFixture): SpelledPitchClass =>
  unwrap(createSpelledPitchClass(fixture.letter, fixture.accidental));

const recognize = (fixture: ChordRecognitionGolden) => {
  const notes = fixture.notes.map(toPitch);
  const bass = fixture.bass === null ? null : toPitch(fixture.bass);
  const recognition = unwrap(detectChord({ notes, bass }));

  return { notes, bass, recognition } as const;
};

const summarizeCandidates = (
  candidates: ReturnType<typeof recognize>['recognition']['candidates'],
) =>
  candidates.map((candidate) => ({
    kind: candidate.kind,
    symbol: unwrap(renderChord(candidate.symbol)),
    bassClassification: candidate.bassClassification,
    evidence: candidate.evidence,
  }));

describe('curated chord recognition vocabulary', () => {
  for (const fixture of CHORD_KIND_RECOGNITION_GOLDENS) {
    it(`recognizes ${fixture.name}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const { notes, bass, recognition } = recognize(fixture);

      expect(recognition.notes).toEqual(notes);
      expect(recognition.bass).toEqual(bass);
      expect(summarizeCandidates(recognition.candidates)).toEqual(fixture.candidates);
    });
  }
});

describe('curated chord bass and inversion recognition', () => {
  for (const fixture of INVERSION_RECOGNITION_GOLDENS) {
    it(`classifies ${fixture.name}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const { recognition } = recognize(fixture);

      expect(summarizeCandidates(recognition.candidates)).toEqual(fixture.candidates);
    });
  }
});

describe('curated enharmonic chord recognition', () => {
  for (const fixture of ENHARMONIC_RECOGNITION_GOLDENS) {
    it(`preserves ${fixture.name}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const { recognition } = recognize(fixture);

      expect(summarizeCandidates(recognition.candidates)).toEqual(fixture.candidates);
    });
  }

  it('retains distinct C-sharp and D-flat roots at the same sounding pitch class', () => {
    const sharp = recognize(ENHARMONIC_RECOGNITION_GOLDENS[0]!).recognition.candidates[0];
    const flat = recognize(ENHARMONIC_RECOGNITION_GOLDENS[1]!).recognition.candidates[0];

    expect(sharp).toBeDefined();
    expect(flat).toBeDefined();
    if (sharp === undefined || flat === undefined) {
      throw new Error('Expected the enharmonic fixtures to produce candidates');
    }

    expect(unwrap(pitchClassOf(sharp.symbol.identity.root))).toBe(
      unwrap(pitchClassOf(flat.symbol.identity.root)),
    );
    expect(sharp.symbol.identity.root).not.toEqual(flat.symbol.identity.root);
  });
});

describe('curated non-chord bass fallback recognition', () => {
  for (const fixture of FALLBACK_RECOGNITION_GOLDENS) {
    it(`handles ${fixture.name}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const { recognition } = recognize(fixture);

      expect(summarizeCandidates(recognition.candidates)).toEqual(fixture.candidates);
    });
  }
});

describe('valid unrecognized pitch sets', () => {
  for (const fixture of VALID_UNRECOGNIZED_GOLDENS) {
    it(`returns no candidates for ${fixture.name}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const notes = fixture.notes.map(toPitch);
      const bass = fixture.bass === null ? null : toPitch(fixture.bass);
      const recognition = unwrap(detectChord({ notes, bass }));

      expect(recognition.notes).toEqual(notes);
      expect(recognition.bass).toEqual(bass);
      expect(recognition.candidates).toEqual([]);
    });
  }
});
