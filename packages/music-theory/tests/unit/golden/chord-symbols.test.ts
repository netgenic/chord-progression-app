import { describe, expect, it } from 'vitest';

import {
  createAbsoluteChord,
  createChordSymbol,
  createInterval,
  createSpelledPitchClass,
  parseChord,
  pitchClassOf,
  renderChord,
  transposeChord,
  transposeProgression,
  type ChordSymbol,
  type Result,
} from '../../../src/index.js';
import {
  CHORD_KIND_SYMBOL_GOLDENS,
  CHORD_TRANSPOSITION_GOLDENS,
  ENHARMONIC_CHORD_PAIR_GOLDENS,
  PROGRESSION_TRANSPOSITION_GOLDENS,
  SLASH_BASS_SYMBOL_GOLDENS,
  type ChordSymbolGolden,
} from '../../../test-fixtures/chord-symbols.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }
  return result.value;
};

const expectedChord = (fixture: ChordSymbolGolden): ChordSymbol => {
  const root = unwrap(createSpelledPitchClass(fixture.root.letter, fixture.root.accidental));
  const identity = unwrap(createAbsoluteChord(root, fixture.kind));
  const bass =
    fixture.bass === null
      ? null
      : unwrap(createSpelledPitchClass(fixture.bass.letter, fixture.bass.accidental));
  return unwrap(createChordSymbol(identity, bass));
};

describe('curated canonical chord symbols', () => {
  for (const fixture of [...CHORD_KIND_SYMBOL_GOLDENS, ...SLASH_BASS_SYMBOL_GOLDENS]) {
    it(`parses and renders ${fixture.name}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const parsed = unwrap(parseChord(fixture.symbol));

      expect(parsed).toEqual(expectedChord(fixture));
      expect(unwrap(renderChord(parsed))).toBe(fixture.symbol);
    });
  }

  for (const fixture of ENHARMONIC_CHORD_PAIR_GOLDENS) {
    it(`preserves enharmonic notation: ${fixture.left} and ${fixture.right}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const left = unwrap(parseChord(fixture.left));
      const right = unwrap(parseChord(fixture.right));

      expect(unwrap(pitchClassOf(left.identity.root))).toBe(
        unwrap(pitchClassOf(right.identity.root)),
      );
      expect(left.identity.root).not.toEqual(right.identity.root);
      expect(unwrap(renderChord(left))).toBe(fixture.left);
      expect(unwrap(renderChord(right))).toBe(fixture.right);
    });
  }
});

describe('curated chord transpositions', () => {
  for (const fixture of CHORD_TRANSPOSITION_GOLDENS) {
    it(`${fixture.source} transposes to ${fixture.expected}`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const source = unwrap(parseChord(fixture.source));
      const interval = unwrap(
        createInterval(fixture.interval.diatonicSteps, fixture.interval.semitones),
      );
      const transposed = unwrap(transposeChord(source, interval));

      expect(unwrap(renderChord(transposed))).toBe(fixture.expected);
      expect(transposed.identity.structure).toEqual(source.identity.structure);
      expect(unwrap(renderChord(source))).toBe(fixture.source);
    });
  }

  for (const fixture of PROGRESSION_TRANSPOSITION_GOLDENS) {
    it(`transposes the ${fixture.name} progression`, () => {
      expect(fixture.rationale.length).toBeGreaterThan(40);

      const source = fixture.source.map((symbol) => unwrap(parseChord(symbol)));
      const interval = unwrap(
        createInterval(fixture.interval.diatonicSteps, fixture.interval.semitones),
      );
      const transposed = unwrap(transposeProgression(source, interval));

      expect(transposed.map((chord) => unwrap(renderChord(chord)))).toEqual(fixture.expected);
      expect(source.map((chord) => unwrap(renderChord(chord)))).toEqual(fixture.source);
      expect(Object.isFrozen(transposed)).toBe(true);
    });
  }
});
