# Music-theory package instructions

These rules extend the repository-level `AGENTS.md` for `packages/music-theory` and are strict package boundaries.

## Purity and dependencies

- Keep this package deterministic, framework-neutral, and free of I/O, global mutable state, database access, logging, timers, and environment reads.
- Do not depend on React, Fastify, Prisma, Tone.js, DOM/Web MIDI APIs, or `apps/*`. Prefer dependency-free TypeScript; justify every package dependency against mathematical correctness and maintenance cost.
- Export domain operations through the package's public entry points. Do not let applications depend on internal files.

## Domain modeling

- Distinguish pitch class, spelled note, interval, chord root, chord quality/extensions, bass note/inversion, key, scale degree, and Roman numeral in types. Do not collapse enharmonic spelling into pitch-class identity when notation depends on spelling.
- Make interval units and normalization rules explicit. Avoid unexplained numeric encodings or modulo arithmetic.
- Parsing must retain root, quality, extensions/alterations, and bass/inversion. Harmonic chord identity excludes inversion and voicing; represent them separately, and do not silently discard them while parsing or rendering.
- Roman-numeral conversion must preserve mode, degree alteration, chord quality, extension, and inversion supported by the model. Document unsupported or ambiguous notation.
- Key detection is evidence-based and may be ambiguous. Return ranked/explicit alternatives or uncertainty according to the public contract; do not invent certainty.
- Canonical progression identity represents harmonic relationships and must remain invariant under transposition. Absolute chord names are renderings in a key, not separate canonical entities.
- Keep theoretical assumptions for enharmonic choice, borrowed chords, secondary dominants, chromatic chords, and minor-mode variants explicit in code-facing documentation.

## Tests

- Every new operation or corrected edge case requires focused unit tests.
- Maintain curated golden fixtures for major/minor cases, inversions, extensions, enharmonic spellings, borrowed/chromatic harmony, secondary dominants, and ambiguous keys. Fixture changes require a theory explanation, not snapshot regeneration alone.
- Add property tests where invariants are clear: transpose by `n` then `-n`, canonical identity across transposition, interval normalization, and supported Roman → absolute → Roman round trips.
- Test input boundaries and invalid/unsupported notation explicitly. Never weaken an invariant or expected value merely to make generated tests pass.
- Prefer structural equality and musical equivalence assertions over fragile display snapshots.

Explain non-obvious algorithms and limitations well enough that another contributor can derive why the result is musically correct.
