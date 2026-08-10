# Dataset importer instructions

These rules extend the repository-level `AGENTS.md` for `scripts/importers`.

- Import only datasets whose source, version, license, attribution, and redistribution/derived-data terms have been reviewed and recorded. Technical accessibility is not permission to ingest or publish.
- Preserve provenance for every accepted record: dataset and version, original source identifier, import timestamp, parser version, and license metadata. Canonicalization must not erase lineage.
- Separate source parsing, validation, normalization, music-theory conversion, deduplication, and persistence so each stage can be tested independently.
- Call `packages/music-theory` for chord parsing, Roman numerals, key/canonical identity, and other harmonic operations. Never create importer-specific variants of domain algorithms.
- Validate every external record at runtime. Reject malformed or unsupported records with a stable reason; do not silently coerce uncertain harmony into valid data.
- Make imports deterministic, bounded, restartable, and idempotent. A repeated run against the same dataset/version must not create duplicates or inflate occurrence counts.
- Support validation/dry-run before persistence when the importer is implemented. Do not treat manually edited intermediate files as the canonical seed source.
- Stream or batch large inputs with explicit size/time limits; do not load unbounded datasets into memory.
- Log source, processed, accepted, rejected, duplicate, and error counts. Do not log credentials, personal data, full sensitive records, or uncontrolled raw payloads.
- Network access and database writes must be explicit. Use local fixtures in tests, disposable local databases for integration tests, and never production credentials or production data.
- Test representative valid records, malformed records, unsupported notation, duplicates, idempotent reruns, provenance preservation, and partial failures. Keep small licensed fixtures with their origin documented.

No migration, seed, or importer execution command exists during pre-flight. Do not document or invoke one until its implementation and safety checks land together.
