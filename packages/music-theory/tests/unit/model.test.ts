import { describe, expect, it } from 'vitest';

import { CHORD_KINDS, MODES, NOTE_LETTERS } from '../../src/index.js';

describe('public model vocabulary', () => {
  it.each([
    ['NOTE_LETTERS', NOTE_LETTERS],
    ['MODES', MODES],
    ['CHORD_KINDS', CHORD_KINDS],
  ] as const)('exposes %s as an immutable runtime value', (_name, values) => {
    expect(Object.isFrozen(values)).toBe(true);
  });
});
