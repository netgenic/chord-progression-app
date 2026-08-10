# API application instructions

These rules extend the repository-level `AGENTS.md` for `apps/api`.

- Keep HTTP handlers thin: parse and validate the request, invoke an application/domain operation, enforce authorization, and map the result to a stable response.
- Use `packages/music-theory` for every harmonic calculation. Do not recreate parsing, key detection, canonicalization, similarity, or tagging algorithms in handlers, services, repositories, or SQL.
- Validate params, query, headers, and bodies at runtime. Define explicit response contracts and return safe errors without stack traces, SQL details, tokens, or internal paths.
- Authentication and authorization are separate. Check ownership or capability server-side for every progression, favorite, and community-tag write.
- User creation is a required future capability and users are first-class entities. Keep the boundary compatible with unique normalized login identifiers and either a password hash or external auth identity; never store or return plaintext passwords. The auth-provider choice requires an ADR before implementation.
- Keep database access behind the database/repository boundary. Do not interpolate user input into SQL, leak ORM records directly as API contracts, or add schema/migration changes invisibly inside a route task.
- Apply rate limits and content-size limits to public or authentication/write endpoints. Normalize identifiers consistently and make duplicate/conflict outcomes explicit.
- Keep configuration in one validated startup module and fail fast on missing required values; do not scatter `process.env` access.
- Use structured logs with request correlation, but redact credentials, auth headers, cookies, password fields, personal data, and large raw payloads.
- Integration-test validation, status codes, authorization/ownership, duplicate users, database constraints, transaction behavior, and safe error responses. Do not mock pure music theory where the real deterministic package is cheap.
