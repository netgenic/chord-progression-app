# ADR 0005: canonical serialization v1

## Status

Accepted — 2026-08-10

## Context

ADR 0002 establishes a transposition-invariant Roman progression as the primary musical
identity and requires an explicit canonical schema version. The first music-theory slice
needs a deterministic representation that browser and server consumers can reproduce
without free-text parsing, persistence entities, framework types, or environment-specific
APIs.

The exact hash algorithm is still an open architectural question. A stable serialization
must therefore be defined before hashing so that a future hash has unambiguous input bytes.

## Decision

Canonical schema v1 is a non-empty ordered sequence with:

- `schemaVersion` equal to numeric `1`;
- mode `major` or `minor`;
- an ordered `chords` array;
- explicit scale degree `1..7` and semitone alteration `-2..2` for every chord;
- an explicit normalized chord quality and extension for every chord.

The public constructor validates and rebuilds every Roman chord through the supported chord
vocabulary, defensively copies the sequence, and freezes the resulting canonical value.
Order and repetitions are significant. The music-theory core permits a one-chord non-empty
value; product-specific progression length limits belong at application and importer
boundaries.

Minor degree roots use the natural-minor scale. A harmonic dominant is represented by the
explicit `dominant7` structure on degree five, not by silently switching the progression's
mode or scale basis.

## Wire format

The canonical serializer emits compact UTF-8 JSON. Field order is fixed and defaults are
never omitted:

```json
{"schemaVersion":1,"mode":"minor","chords":[{"degree":1,"alteration":0,"quality":"minor","extension":{"kind":"none"}},{"degree":5,"alteration":0,"quality":"major","extension":{"kind":"seventh","quality":"minor"}}]}
```

Top-level field order is:

1. `schemaVersion`;
2. `mode`;
3. `chords`.

Chord field order is:

1. `degree`;
2. `alteration`;
3. `quality`;
4. `extension`.

Extension encodings are:

- `{"kind":"none"}`;
- `{"kind":"seventh","quality":"major|minor|diminished"}`;
- `{"kind":"added-tone","degree":9,"alteration":0}`.

Negative zero is serialized as `0`. The serializer returns a typed `Result`, revalidates the
schema version and rebuilds the value through the canonical constructor before emitting bytes.
Untrusted transport or persistence data still requires decoding into domain input at its owning
application boundary. A forged or future schema version is rejected rather than reinterpreted as
v1. Enum aliases, display Roman strings, and omitted defaults are not canonical v1 inputs.

Absolute key and note spelling, users, ownership, visibility, tags, inversion, voicing,
rhythm, tempo, playback data, source occurrence, and provenance are deliberately excluded.
They may be retained in their own representation or persistence models but cannot alter this
serialization.

## Hashing

No hash function or algorithm is selected by this ADR. A later ADR must specify:

- the exact digest algorithm and algorithm version;
- that the digest input is the UTF-8 bytes of this exact serialization;
- output encoding and identifier format;
- compatibility and migration behavior for a future canonical schema version;
- golden digest vectors for every supported runtime.

Until then, callers must not treat an ad hoc digest or `JSON.stringify` of arbitrary domain
objects as a canonical progression hash.

## Alternatives

- Store a Roman numeral string such as `i-VI-iv-V7`: compact, but it conflates parsing,
  display conventions, chord structure, and future schema evolution.
- Sort object keys generically: deterministic in principle, but broadens the format to an
  unnecessary generic canonical-JSON algorithm and can accidentally include new fields.
- Include the realization key or chord spelling: preserves display input but breaks
  transposition invariance.
- Select a hash immediately: would prematurely couple the model to an algorithm before its
  portability, security, versioning, and migration behavior are reviewed.

## Consequences

Positive:

- equivalent realizations in different keys have byte-identical canonical serialization;
- schema changes cannot silently redefine existing v1 bytes;
- serializer output is dependency-free and browser-compatible;
- golden fixtures can explain and lock musical as well as byte-level behavior.

Negative and risks:

- v1 supports only the current bounded Roman alterations and chord vocabulary;
- secondary-function labels and modal-interchange interpretations are structural future
  extensions, not hidden v1 heuristics;
- changing field order, enum spelling, defaults, or equivalence rules requires a new schema
  version and migration plan;
- consumers must preserve separate source spelling and realization metadata when those are
  significant.
