import { describe, expect, it } from 'vitest';

import {
  createKey,
  createSpelledPitchClass,
  scaleDegreeToSpelledPitch,
  spelledPitchToScaleDegree,
  type Result,
} from '../../src/index.js';

const valueOf = <T>(result: Result<T, unknown>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected a successful result');
  }
  return result.value;
};

describe('keys', () => {
  it('creates validated major and minor keys', () => {
    const c = valueOf(createSpelledPitchClass('C'));

    expect(createKey(c, 'major')).toEqual({
      ok: true,
      value: { tonic: { letter: 'C', accidental: 0 }, mode: 'major' },
    });
    expect(createKey(c, 'minor')).toEqual({
      ok: true,
      value: { tonic: { letter: 'C', accidental: 0 }, mode: 'minor' },
    });
    expect(createKey(c, 'dorian')).toEqual({
      ok: false,
      error: { code: 'invalid-mode', received: 'dorian' },
    });
  });

  it('spells degrees from the tonic letter in major and natural minor', () => {
    const bFlatMajor = valueOf(createKey(valueOf(createSpelledPitchClass('B', -1)), 'major'));
    const eFlatMinor = valueOf(createKey(valueOf(createSpelledPitchClass('E', -1)), 'minor'));

    expect(scaleDegreeToSpelledPitch(bFlatMajor, { degree: 4, alteration: 0 })).toEqual({
      ok: true,
      value: { letter: 'E', accidental: -1 },
    });
    expect(scaleDegreeToSpelledPitch(eFlatMinor, { degree: 6, alteration: 0 })).toEqual({
      ok: true,
      value: { letter: 'C', accidental: -1 },
    });
  });

  it('applies chromatic degree alteration after the mode scale offset', () => {
    const fSharpMajor = valueOf(createKey(valueOf(createSpelledPitchClass('F', 1)), 'major'));

    expect(scaleDegreeToSpelledPitch(fSharpMajor, { degree: 2, alteration: 1 })).toEqual({
      ok: true,
      value: { letter: 'G', accidental: 2 },
    });
  });

  it.each([
    [
      { degree: 0, alteration: 0 },
      { code: 'invalid-scale-degree', received: 0 },
    ],
    [
      { degree: 8, alteration: 0 },
      { code: 'invalid-scale-degree', received: 8 },
    ],
    [
      { degree: 1.5, alteration: 0 },
      { code: 'invalid-scale-degree', received: 1.5 },
    ],
    [
      { degree: 1, alteration: -3 },
      { code: 'invalid-degree-alteration', received: -3 },
    ],
    [
      { degree: 1, alteration: 3 },
      { code: 'invalid-degree-alteration', received: 3 },
    ],
  ] as const)('rejects invalid degree input %#', (degree, error) => {
    const cMajor = valueOf(createKey(valueOf(createSpelledPitchClass('C')), 'major'));
    expect(scaleDegreeToSpelledPitch(cMajor, degree)).toEqual({ ok: false, error });
  });

  it('reports a scale spelling that requires more than a double accidental', () => {
    const bDoubleSharpMajor = valueOf(createKey(valueOf(createSpelledPitchClass('B', 2)), 'major'));

    expect(scaleDegreeToSpelledPitch(bDoubleSharpMajor, { degree: 7, alteration: 0 })).toEqual({
      ok: false,
      error: { code: 'unsupported-spelling', letter: 'A', requiredAccidental: 3 },
    });
  });

  it('converts spelled notes back to scale degrees and alterations', () => {
    const eFlatMinor = valueOf(createKey(valueOf(createSpelledPitchClass('E', -1)), 'minor'));

    expect(
      spelledPitchToScaleDegree(eFlatMinor, valueOf(createSpelledPitchClass('C', -1))),
    ).toEqual({ ok: true, value: { degree: 6, alteration: 0 } });
    expect(spelledPitchToScaleDegree(eFlatMinor, valueOf(createSpelledPitchClass('B', 0)))).toEqual(
      { ok: true, value: { degree: 5, alteration: 1 } },
    );
  });

  it('round-trips every supported degree of representative keys', () => {
    const keys = [
      valueOf(createKey(valueOf(createSpelledPitchClass('C')), 'major')),
      valueOf(createKey(valueOf(createSpelledPitchClass('E', -1)), 'minor')),
      valueOf(createKey(valueOf(createSpelledPitchClass('F', 1)), 'major')),
    ];

    for (const key of keys) {
      for (let degree = 1; degree <= 7; degree += 1) {
        const spelled = valueOf(scaleDegreeToSpelledPitch(key, { degree, alteration: 0 }));
        expect(spelledPitchToScaleDegree(key, spelled)).toEqual({
          ok: true,
          value: { degree, alteration: 0 },
        });
      }
    }
  });
});
