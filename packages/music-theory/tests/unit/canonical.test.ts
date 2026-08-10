import { describe, expect, it } from 'vitest';

import {
  canonicalizeProgression,
  createAbsoluteChord,
  createCanonicalProgression,
  createRomanChord,
  realizeCanonicalProgression,
  serializeCanonicalProgression,
  type CanonicalProgressionInput,
  type ChordStructure,
  type Key,
  type Mode,
  type Result,
  type RomanChord,
} from '../../src/index.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }
  return result.value;
};

const cMajor: Key = Object.freeze({
  tonic: Object.freeze({ letter: 'C', accidental: 0 }),
  mode: 'major',
});

const eMinor: Key = Object.freeze({
  tonic: Object.freeze({ letter: 'E', accidental: 0 }),
  mode: 'minor',
});

const cMinor: Key = Object.freeze({
  tonic: Object.freeze({ letter: 'C', accidental: 0 }),
  mode: 'minor',
});

const minorRoman = (): RomanChord[] => [
  unwrap(createRomanChord(1, 0, 'minor')),
  unwrap(createRomanChord(6, 0, 'major')),
  unwrap(createRomanChord(4, 0, 'minor')),
  unwrap(createRomanChord(5, 0, 'dominant7')),
];

describe('canonical progression construction', () => {
  it('normalizes, defensively copies, and freezes a non-empty Roman progression', () => {
    const inputChords = minorRoman();
    const canonical = unwrap(createCanonicalProgression({ mode: 'minor', chords: inputChords }));

    inputChords.reverse();

    expect(canonical.schemaVersion).toBe(1);
    expect(canonical.chords.map((chord) => chord.degree)).toEqual([1, 6, 4, 5]);
    expect(Object.isFrozen(canonical)).toBe(true);
    expect(Object.isFrozen(canonical.chords)).toBe(true);
    expect(canonical.chords.every((chord) => Object.isFrozen(chord))).toBe(true);
  });

  it('rejects empty input, unknown modes, and unsupported chord structures', () => {
    expect(createCanonicalProgression({ mode: 'minor', chords: [] })).toEqual({
      ok: false,
      error: { code: 'empty-progression' },
    });

    expect(createCanonicalProgression({ mode: 'dorian' as Mode, chords: minorRoman() })).toEqual({
      ok: false,
      error: { code: 'invalid-mode', received: 'dorian' },
    });

    const unsupportedStructure = {
      quality: 'major',
      extension: { kind: 'seventh', quality: 'diminished' },
    } as ChordStructure;
    const forgedInput: CanonicalProgressionInput = {
      mode: 'major',
      chords: [{ degree: 1, alteration: 0, structure: unsupportedStructure }],
    };

    expect(createCanonicalProgression(forgedInput)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-kind', received: 'unsupported-structure' },
    });
  });
});

describe('canonical conversion and serialization', () => {
  it('canonicalizes transposed minor realizations to one key-independent value', () => {
    const eMinorChords = [
      unwrap(createAbsoluteChord({ letter: 'E', accidental: 0 }, 'minor')),
      unwrap(createAbsoluteChord({ letter: 'C', accidental: 0 }, 'major')),
      unwrap(createAbsoluteChord({ letter: 'A', accidental: 0 }, 'minor')),
      unwrap(createAbsoluteChord({ letter: 'B', accidental: 0 }, 'dominant7')),
    ];
    const cMinorChords = [
      unwrap(createAbsoluteChord({ letter: 'C', accidental: 0 }, 'minor')),
      unwrap(createAbsoluteChord({ letter: 'A', accidental: -1 }, 'major')),
      unwrap(createAbsoluteChord({ letter: 'F', accidental: 0 }, 'minor')),
      unwrap(createAbsoluteChord({ letter: 'G', accidental: 0 }, 'dominant7')),
    ];

    const fromE = unwrap(canonicalizeProgression(eMinorChords, eMinor));
    const fromC = unwrap(canonicalizeProgression(cMinorChords, cMinor));

    expect(fromE).toEqual(fromC);
    expect(unwrap(serializeCanonicalProgression(fromE))).toBe(
      unwrap(serializeCanonicalProgression(fromC)),
    );
  });

  it('rejects realization in a key whose mode differs from the canonical mode', () => {
    const canonical = unwrap(createCanonicalProgression({ mode: 'minor', chords: minorRoman() }));

    expect(realizeCanonicalProgression(canonical, cMajor)).toEqual({
      ok: false,
      error: {
        code: 'mode-mismatch',
        progressionMode: 'minor',
        keyMode: 'major',
      },
    });
  });

  it('serializes v1 with fixed field order and explicit defaults', () => {
    const canonical = unwrap(
      createCanonicalProgression({
        mode: 'major',
        chords: [unwrap(createRomanChord(1, -0, 'major'))],
      }),
    );

    const serialized = unwrap(serializeCanonicalProgression(canonical));
    const positiveZero = unwrap(
      createCanonicalProgression({
        mode: 'major',
        chords: [unwrap(createRomanChord(1, 0, 'major'))],
      }),
    );

    expect(canonical).toEqual(positiveZero);
    expect(Object.is(canonical.chords[0].alteration, 0)).toBe(true);
    expect(serialized).toBe(
      '{"schemaVersion":1,"mode":"major","chords":[{"degree":1,"alteration":0,"quality":"major","extension":{"kind":"none"}}]}',
    );
    expect(Object.keys(JSON.parse(serialized) as object)).toEqual([
      'schemaVersion',
      'mode',
      'chords',
    ]);
    expect(serialized).not.toContain('tonic');
    expect(serialized).not.toContain('user');
    expect(serialized).not.toContain('inversion');
    expect(serialized).not.toContain('voicing');
  });

  it('preserves chord order in canonical identity', () => {
    const forward = unwrap(createCanonicalProgression({ mode: 'minor', chords: minorRoman() }));
    const reversed = unwrap(
      createCanonicalProgression({ mode: 'minor', chords: minorRoman().reverse() }),
    );

    expect(unwrap(serializeCanonicalProgression(forward))).not.toBe(
      unwrap(serializeCanonicalProgression(reversed)),
    );
  });

  it('rejects a forged future schema instead of reinterpreting it as v1', () => {
    const canonical = unwrap(createCanonicalProgression({ mode: 'minor', chords: minorRoman() }));
    const future = { ...canonical, schemaVersion: 2 } as unknown as typeof canonical;

    const expected = {
      ok: false,
      error: { code: 'invalid-schema-version', received: 2 },
    };

    expect(serializeCanonicalProgression(future)).toEqual(expected);
    expect(realizeCanonicalProgression(future, eMinor)).toEqual(expected);
  });

  it('validates the realization key before comparing modes', () => {
    const canonical = unwrap(createCanonicalProgression({ mode: 'minor', chords: minorRoman() }));
    const invalidKey = { ...cMajor, mode: 'dorian' as Mode };

    expect(realizeCanonicalProgression(canonical, invalidKey)).toEqual({
      ok: false,
      error: { code: 'invalid-mode', received: 'dorian' },
    });
  });
});
