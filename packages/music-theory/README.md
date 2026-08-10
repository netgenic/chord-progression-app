# Music theory core

Pure, deterministic and browser-compatible TypeScript values and operations for harmonic analysis. This package has no runtime dependencies and does not know about users, persistence, HTTP, UI, audio or MIDI devices.

The first implementation slice covers:

- spelled pitch classes versus sounding pitch classes;
- intervals with explicit diatonic and chromatic distance;
- major and natural-minor keys with scale-degree spelling;
- structured chord identity and Roman chords;
- Roman-to-absolute conversion in an explicit key and the inverse conversion;
- validated, non-empty canonical progressions and deterministic versioned serialization.

Expected validation failures use a typed `Result`, including sounding-pitch calculation,
Roman conversion, canonical realization and serialization. Public vocabulary arrays and all
constructed domain values are immutable at runtime; the serializer rejects unknown schema
versions instead of silently treating them as v1.

Free-text chord/Roman parsing, chord recognition, key detection, canonical hashing and technical tags are intentionally separate follow-up slices. Their unresolved notation and ambiguity policies are documented in `docs/architecture/music-theory-model.md`.

Only `src/index.ts` is public. Applications must not import internal modules.
