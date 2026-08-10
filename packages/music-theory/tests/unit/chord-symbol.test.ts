import { describe, expect, it } from 'vitest';

import {
  CHORD_SYMBOL_MAX_LENGTH,
  createAbsoluteChord,
  createChordSymbol,
  createInterval,
  createSpelledPitchClass,
  parseChord,
  renderChord,
  transposeChord,
  transposeProgression,
  type ChordSymbol,
  type Interval,
  type Result,
} from '../../src/index.js';
import {
  INVALID_CHORD_SYMBOL_GOLDENS,
  UNSUPPORTED_CHORD_ALIASES,
} from '../../test-fixtures/chord-symbols.js';

const unwrap = <T, E>(result: Result<T, E>): T => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, received ${JSON.stringify(result.error)}`);
  }
  return result.value;
};

const parse = (source: string) => unwrap(parseChord(source));

describe('chord symbol construction', () => {
  it('uses null for an unspecified bass and retains an explicit slash bass', () => {
    const identity = unwrap(createAbsoluteChord(unwrap(createSpelledPitchClass('C')), 'major7'));
    const e = unwrap(createSpelledPitchClass('E'));
    const withoutBass = unwrap(createChordSymbol(identity));
    const withBass = unwrap(createChordSymbol(identity, e));

    expect(withoutBass.bass).toBeNull();
    expect(withBass.bass).toEqual(e);
    expect(withBass.identity).toEqual(withoutBass.identity);
    expect(Object.isFrozen(withoutBass)).toBe(true);
    expect(Object.isFrozen(withBass)).toBe(true);
    expect(Object.isFrozen(withBass.identity)).toBe(true);
    expect(Object.isFrozen(withBass.bass)).toBe(true);
  });

  it('does not erase an explicit bass equal to the chord root', () => {
    const parsed = parse('C/C');

    expect(parsed.bass).toEqual(parsed.identity.root);
    expect(unwrap(renderChord(parsed))).toBe('C/C');
  });

  it('keeps slash bass outside harmonic identity', () => {
    const unspecified = parse('C');
    const firstInversion = parse('C/E');
    const secondInversion = parse('C/G');

    expect(firstInversion.identity).toEqual(unspecified.identity);
    expect(secondInversion.identity).toEqual(unspecified.identity);
    expect(firstInversion.bass).not.toEqual(secondInversion.bass);
  });
});

describe('strict chord-symbol parsing', () => {
  it('returns a Result error when the runtime input is not a string', () => {
    expect(parseChord(null as unknown as string)).toEqual({
      ok: false,
      error: {
        code: 'invalid-chord-symbol',
        reason: 'invalid-type',
        receivedType: 'object',
      },
    });
  });

  it.each(INVALID_CHORD_SYMBOL_GOLDENS)(
    'rejects non-canonical input $input with reason $reason',
    ({ input, reason }) => {
      const result = parseChord(input);

      if (reason === 'too-long') {
        expect(result).toEqual({
          ok: false,
          error: { code: 'invalid-chord-symbol', reason, receivedLength: input.length },
        });
      } else {
        expect(result).toEqual({
          ok: false,
          error: { code: 'invalid-chord-symbol', input, reason },
        });
      }
    },
  );

  it.each(UNSUPPORTED_CHORD_ALIASES)('rejects unsupported alias %s', (input) => {
    expect(parseChord(input)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-symbol', input, reason: 'unsupported-suffix' },
    });
  });

  it('accepts a non-chord slash bass without asserting inversion semantics', () => {
    const parsed = parse('C7/Eb');

    expect(parsed.identity.root).toEqual({ letter: 'C', accidental: 0 });
    expect(parsed.bass).toEqual({ letter: 'E', accidental: -1 });
    expect(unwrap(renderChord(parsed))).toBe('C7/Eb');
  });

  it('accepts the exact maximum canonical length', () => {
    const source = 'C##madd9/Bbb';

    expect(source).toHaveLength(CHORD_SYMBOL_MAX_LENGTH);
    expect(unwrap(renderChord(parse(source)))).toBe(source);
  });

  it('validates a forged slash bass before rendering', () => {
    const forged = {
      ...parse('C'),
      bass: { letter: 'H', accidental: 0 },
    } as unknown as ChordSymbol;

    expect(renderChord(forged)).toEqual({
      ok: false,
      error: { code: 'invalid-note-letter', received: 'H' },
    });
  });

  it('returns Result errors for malformed top-level values', () => {
    expect(renderChord(null as unknown as ChordSymbol)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-symbol-value', reason: 'not-object' },
    });
    expect(renderChord({ identity: null, bass: null } as unknown as ChordSymbol)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-value', reason: 'not-object' },
    });
    expect(renderChord({ identity: parse('C').identity } as unknown as ChordSymbol)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-symbol-value', reason: 'missing-bass' },
    });
  });

  it('rejects extra musical fields instead of silently simplifying a structure', () => {
    const source = parse('C');
    const forged = {
      ...source,
      identity: {
        ...source.identity,
        structure: {
          quality: 'major',
          extension: { kind: 'none', alterations: ['b5'] },
        },
      },
    } as unknown as ChordSymbol;

    expect(renderChord(forged)).toEqual({
      ok: false,
      error: { code: 'invalid-chord-kind', received: 'unsupported-structure' },
    });
  });
});

describe('enharmonic transposition choice', () => {
  it('uses diatonic steps to distinguish C-sharp from D-flat at the same pitch class', () => {
    const source = parse('C');
    const augmentedUnison = unwrap(createInterval(0, 1));
    const minorSecond = unwrap(createInterval(1, 1));

    expect(unwrap(renderChord(unwrap(transposeChord(source, augmentedUnison))))).toBe('C#');
    expect(unwrap(renderChord(unwrap(transposeChord(source, minorSecond))))).toBe('Db');
  });
});

describe('chord and progression transposition errors', () => {
  const augmentedUnison = () => unwrap(createInterval(0, 1));

  it('identifies an unsupported root spelling as a root component failure', () => {
    const result = transposeChord(parse('B##'), augmentedUnison());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toEqual({
      code: 'chord-component-error',
      component: 'root',
      cause: { code: 'unsupported-spelling', letter: 'B', requiredAccidental: 3 },
    });
  });

  it('identifies an unsupported slash-bass spelling as a bass component failure', () => {
    const result = transposeChord(parse('C/B##'), augmentedUnison());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toEqual({
      code: 'chord-component-error',
      component: 'bass',
      cause: { code: 'unsupported-spelling', letter: 'B', requiredAccidental: 3 },
    });
  });

  it('wraps the failing progression position instead of returning a partial result', () => {
    const source = [parse('C'), parse('C/B##'), parse('G')];
    const result = transposeProgression(source, augmentedUnison());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toEqual({
      code: 'progression-chord-error',
      index: 1,
      cause: {
        code: 'chord-component-error',
        component: 'bass',
        cause: { code: 'unsupported-spelling', letter: 'B', requiredAccidental: 3 },
      },
    });
    expect(source.map((chord) => unwrap(renderChord(chord)))).toEqual(['C', 'C/B##', 'G']);
  });

  it('rejects an empty progression using the shared progression boundary error', () => {
    expect(transposeProgression([], augmentedUnison())).toEqual({
      ok: false,
      error: { code: 'empty-progression' },
    });
  });

  it('validates interval units at chord and progression boundaries', () => {
    const fractionalSteps = { diatonicSteps: 0.5, semitones: 1 } as Interval;
    const fractionalSemitones = { diatonicSteps: 1, semitones: 1.5 } as Interval;

    expect(transposeChord(parse('C'), fractionalSteps)).toEqual({
      ok: false,
      error: { code: 'invalid-diatonic-steps', received: 0.5 },
    });
    expect(transposeProgression([parse('C')], fractionalSemitones)).toEqual({
      ok: false,
      error: { code: 'invalid-semitone-offset', received: 1.5 },
    });
  });

  it('returns Result errors for malformed interval and progression containers', () => {
    expect(transposeChord(parse('C'), null as unknown as Interval)).toEqual({
      ok: false,
      error: { code: 'invalid-interval-value', reason: 'not-object' },
    });
    expect(transposeChord(parse('C'), { diatonicSteps: 1 } as Interval)).toEqual({
      ok: false,
      error: { code: 'invalid-interval-value', reason: 'missing-fields' },
    });
    expect(
      transposeChord(parse('C'), { diatonicSteps: '1', semitones: 2 } as unknown as Interval),
    ).toEqual({
      ok: false,
      error: { code: 'invalid-interval-value', reason: 'invalid-field-types' },
    });
    expect(
      transposeChord(parse('C'), {
        diatonicSteps: 1,
        semitones: 2,
        cents: 0,
      } as unknown as Interval),
    ).toEqual({
      ok: false,
      error: { code: 'invalid-interval-value', reason: 'unexpected-fields' },
    });
    expect(
      transposeProgression(null as unknown as readonly ChordSymbol[], augmentedUnison()),
    ).toEqual({
      ok: false,
      error: { code: 'invalid-progression-value', reason: 'not-array' },
    });
  });
});
