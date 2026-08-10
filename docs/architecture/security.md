# Архитектура безопасности

## Цели

Система должна защищать пользовательские учётные данные и связи, целостность канонической библиотеки, provenance импортов и доступность публичного API. Music-theory остаётся чистой user-independent библиотекой и не является местом для auth/authorization.

Конкретный auth-провайдер и session mechanism пока не выбраны. Их выбор требует отдельного threat review и ADR до реализации.

## Trust boundaries

- browser ↔ API: все данные недоверенные, даже если до этого проверены UI;
- API ↔ PostgreSQL: parameterized access, least-privilege role и транзакционные constraints;
- importer ↔ external datasets: недоверенные данные и отдельная license/provenance gate;
- browser ↔ MIDI device: permissioned local capability и недоверенный event stream;
- browser ↔ audio assets: только утверждённые origin/license/format;
- CI/dependencies ↔ repository: pinned versions, review и минимальные token permissions.

## Пользователь и аутентификация

`User` имеет внутренний стабильный ID; внешние provider subjects или password credentials являются отдельными auth identities. Это позволяет менять способ входа без изменения ownership/favorites/tags.

До auth ADR обязательны следующие инварианты:

- anonymous actor может только разрешённое публичное чтение/analysis;
- authenticated actor устанавливается проверенным server-side механизмом;
- authorization отдельно проверяет resource ownership и action;
- cookies/tokens/passwords не попадают в response DTO, логи или URLs;
- если выбираются passwords, используются современный password hash, безопасный reset и защита от credential enumeration;
- если выбираются cookies, применяются `HttpOnly`, `Secure`, подходящий `SameSite` и CSRF strategy;
- account linking предотвращает takeover из-за несовпадающих provider/email assertions.

## Авторизация

Server-side policy проверяет:

- create progression/community tag/favorite — только authenticated actor;
- update/delete progression — только допустимый владелец/роль;
- private progression — только разрешённый actor;
- technical/character tag mutation — недоступна community endpoints;
- user library/profile fields — минимально необходимое раскрытие;
- импорт и административные операции — не через обычный public user path.

Client-side gating служит UX, но не security boundary. Negative cross-user tests обязательны.

## Валидация и abuse controls

Runtime schemas и hard limits применяются к path/query/body/headers, chord sequences, tags, pagination, metadata и environment. Необходимы:

- body/text/list/depth limits;
- нормализация Unicode/slug/email/username с явной collision policy;
- tag spam/rate limits и uniqueness constraints;
- bounded analysis complexity и request timeout;
- parameterized SQL и allowlisted sort/filter fields;
- safe content rendering без raw HTML;
- CORS allowlist и CSRF strategy согласно выбранному transport;
- generic safe errors с correlation ID.

## MIDI и audio

- MIDI permission запрашивается по user gesture; SysEx не требуется.
- Raw MIDI stream/device identity не отправляются и не сохраняются без необходимости.
- Flooding/stuck notes ограничиваются client reducer и capture limits; server повторно валидирует save command.
- Audio запускается по user gesture; sample sources не управляются пользователем.
- Piano assets проходят license/integrity/size review.

## Import pipeline

- Источник и лицензия проверяются до загрузки/импорта.
- Parsers работают с лимитами размера/времени и не исполняют содержимое dataset.
- Archive extraction должна предотвращать path traversal и decompression bombs, если архивы будут поддержаны.
- Importer не получает production credentials на developer/agent этапе.
- Rejections и provenance сохраняются без публикации запрещённого corpus content.

## Secrets и конфигурация

- Secrets только в environment/secret store; `.env` не коммитится.
- `.env.example` содержит безопасные placeholder/development values.
- Typed configuration валидируется при старте и fail-fast.
- `process.env` не читается по всему codebase.
- Логи редактируют authorization, cookies, passwords, DSN и provider tokens.
- Production secrets никогда не выдаются MCP, coding agent или browser tests.

## Database и privacy

- Приложение и migrations используют минимально необходимые роли.
- Local PostgreSQL доступен только через loopback с disposable credentials.
- Unique/FK/check constraints защищают ownership и целостность дополнительно к API.
- Backup encryption, retention, account deletion/export и public profile fields определяются до deployment.
- Usage statistics не внедряются до privacy/retention решения; сырые события не собираются «на будущее».

## Supply chain и CI

- Lockfile и точные tool versions обязательны.
- Новая dependency проверяется по необходимости, license, maintenance и advisories.
- CI использует least-privilege token и pinned third-party action SHAs.
- Dependabot/security updates проходят compatibility review; major upgrades не применяются автоматически.
- CI для недоверенных PR не получает deployment/production secrets.

## Security verification

- Unit/integration tests authorization matrix и cross-user isolation.
- Tests malformed/oversized payloads, duplicate spam и safe errors.
- Dependency audit в CI.
- Review database migrations, workflow files и auth changes как security-sensitive code.
- Threat model обновляется перед auth, public deployment, file/archive import или новыми write endpoints.

## Отложенные решения

- auth provider и credential/session transport;
- password vs OAuth requirements;
- rate-limit implementation/storage;
- public profile fields и privacy/retention policy;
- production secrets/database/deployment provider;
- moderation/administrative roles;
- CSP и exact CORS/CSRF values после выбора deployment/frontend architecture.
