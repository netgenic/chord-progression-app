# Repository instructions

These instructions apply to the whole repository. Read the nearest nested `AGENTS.md` before changing files in its directory; nested instructions add domain-specific rules and take precedence there.

## Project purpose

Build a searchable chord-progression library that treats a Roman-numeral progression as the canonical harmonic entity and chord names in a key as transposed representations. Guests may browse, filter, transpose, and listen. The architecture must support first-class users for creating progressions, favorites, and community tags.

The canonical requirements are in `docs/product/specification.md`. Use `PROJECT_STATE.md` for the active phase and limitations. Do not start product implementation while it marks pre-flight incomplete.

## Architecture

- `apps/web`: browser UI, audio, and MIDI interaction.
- `apps/api`: HTTP boundary, authentication/authorization, and application orchestration.
- `packages/music-theory`: pure deterministic music-domain logic.
- `packages/shared`: framework-neutral contracts and shared primitives.
- `packages/database`: persistence schema and database access.
- `packages/ui`: reusable presentation components only.
- `scripts/importers`: reproducible external-dataset ingestion.

Dependencies point from applications toward packages, never from packages toward applications.

## Critical rules

- Put all music-theory calculations in `packages/music-theory`.
- `packages/music-theory` must not depend on React, Fastify, Prisma, Tone.js, browser APIs, or any `apps/*` module.
- UI and API code must call the music-theory package; never duplicate its algorithms.
- Canonical progression identity is transposition-invariant. Do not create a separate progression entity per absolute key.
- Keep user identity, ownership, favorites, and permissions outside the music-theory package.
- Validate external data at runtime at the API, environment, database, MIDI-serialization, and importer boundaries. Read runtime environment only through the centralized typed configuration.
- Do not silently change a requirement. Record conflicts between the specification, architecture, and implementation and preserve the specification where possible.
- Prefer focused, boring solutions. Do not introduce microservices, CQRS, event sourcing, or infrastructure for hypothetical scale.

## Workflow

For non-trivial work: understand the goal, inspect affected modules and instructions, identify constraints/risks/tests, make a focused change, run the smallest useful checks, review the diff, and update documentation. Search for an existing domain function before adding another utility.

Do not combine a feature, broad refactor, formatting sweep, and dependency upgrade unless the task requires it. Preserve unrelated user changes.

## Commands

Run from the repository root:

- Install: `pnpm install --frozen-lockfile`
- Develop all implemented workspaces: `pnpm dev`
- Build: `pnpm build`
- Validate local environment: `pnpm env:check`
- All non-E2E tests: `pnpm test`
- Unit/bootstrap tests: `pnpm test:unit`
- Test watch mode: `pnpm test:watch`
- Integration tests: `pnpm test:integration`
- E2E tests: `pnpm test:e2e`
- Lint: `pnpm lint`
- Type-check: `pnpm typecheck`
- Format: `pnpm format`
- Format check: `pnpm format:check`
- Fast quality gate: `pnpm check`
- Full local gate: `pnpm verify`

During pre-flight, `dev`, integration, and E2E may have no application/tests to run, but their commands must still complete successfully. `DEVELOPMENT.md` is the source for environment and database setup. Do not invent migration, seed, or importer commands before their implementations exist.

## Definition of Done

A change is complete only when the relevant build, type-check, lint, and tests pass; new behavior has tests at the appropriate layer; required documentation is updated; the diff contains no unrelated changes, generated garbage, debug logging, or secrets; and `pnpm verify` passes before handoff when the environment permits it. Report any check that could not run.

## Coding and testing

- Keep TypeScript strict. Prefer `unknown` plus narrowing over `any`; justify unavoidable `any` locally.
- Comments explain intent, mathematical assumptions, external behavior, or limitations—not syntax.
- Unit-test deterministic domain behavior and edge cases. Music theory receives the deepest coverage, curated golden fixtures, and property tests for stable invariants.
- Use integration tests for API, authorization, database constraints, migrations, and import behavior.
- Reserve Playwright E2E for critical user journeys; do not move inexpensive edge cases into E2E.
- A temporary empty suite is allowed only while its application layer does not exist. Production behavior and its test belong in the same change.

## Dependencies

Add a dependency only for a concrete current requirement after checking maintenance, compatibility, license, security, and whether the platform already provides the capability. Use the correct workspace package and update the lockfile. Do not add a dependency solely to shorten a small local function.

## Database and data

- Change the schema through the selected migration workflow once it exists; never hand-edit an already applied migration.
- Review generated migrations, test them against local PostgreSQL, and keep schema changes separate from unrelated work.
- Never use production credentials or production dumps for local development and tests.
- Importers must preserve source, dataset/version, source identifier, import date, parser version, and license/provenance; imports should be deterministic and idempotent.

## Security

Never commit secrets. Keep local values in ignored environment files and safe placeholders in `.env.example`. Do not log passwords, hashes, cookies, tokens, full sensitive payloads, or database credentials. Enforce authorization server-side for every write; authentication alone is not authorization. Avoid raw SQL from user input, return safe errors, and apply rate/content limits to public write and ingestion endpoints.

## Documentation

Update `PROJECT_STATE.md` after a substantial completed stage. Update architecture docs when boundaries or behavior change. Add or revise an ADR for significant choices involving architecture, persistence, authentication, infrastructure, or external contracts; do not create ADRs for routine implementation details.
