import { describe, expect, it } from 'vitest';

import { ROMAN_PROGRESSION_GOLDENS } from '../../../test-fixtures/roman-progressions.js';
import {
  canonicalizeProgression,
  realizeCanonicalProgression,
  serializeCanonicalProgression,
} from '../../../src/index.js';

describe('curated Roman progression goldens', () => {
  for (const fixture of ROMAN_PROGRESSION_GOLDENS) {
    describe(fixture.name, () => {
      it('records the musical reason for the expected structure', () => {
        expect(fixture.rationale.length).toBeGreaterThan(40);
      });

      it('has an exact versioned canonical serialization', () => {
        expect(serializeCanonicalProgression(fixture.canonical)).toEqual({
          ok: true,
          value: fixture.serialization,
        });
      });

      for (const realization of fixture.realizations) {
        it(`canonicalizes the ${realization.label} realization`, () => {
          const canonical = canonicalizeProgression(realization.chords, realization.key);

          expect(canonical).toEqual({ ok: true, value: fixture.canonical });
        });

        it(`realizes the canonical value in ${realization.label}`, () => {
          const absolute = realizeCanonicalProgression(fixture.canonical, realization.key);

          expect(absolute).toEqual({ ok: true, value: realization.chords });
        });
      }
    });
  }
});
