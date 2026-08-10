# Project state

Обновлено: 2026-08-10

## Current phase

Pre-flight и локальный bootstrap завершены; production-код ещё не начинался. Репозиторий готов к публикации после явного выбора видимости `private` или `public`.

## Completed

- Каноническая продуктовая спецификация перенесена в `docs/product/specification.md`.
- Зафиксированы pre-flight, архитектурные границы, security baseline и четыре initial ADR.
- Пользователи заложены как first-class сущности API/БД; музыкальное ядро остаётся user-independent.
- Созданы root/nested `AGENTS.md` и воспроизводимый `DEVELOPMENT.md`.
- Настроены pnpm workspace, Node/TypeScript baseline, format, lint, typecheck, unit/integration/E2E gates и bootstrap tests.
- Создан централизованный typed environment boundary с fail-fast проверкой `.env.example` в общем gate.
- Созданы lockfile, локальный PostgreSQL Compose, GitHub Actions CI, Dependabot и PR template.
- `pnpm verify` проходит под Node.js `24.18.1`; dependency audit не находит известных уязвимостей.

## In progress

- Создание GitHub remote и включение доступных branch/security settings; ожидается выбор visibility.

## Next

1. Создать GitHub repository, подключить `origin` и отправить `main`.
2. Начать `packages/music-theory` с формальных типов и инвариантов канонической Roman progression.
3. Добавить unit, golden и property-based tests до API/UI реализации.

## Known issues

- На host по умолчанию установлен Node.js `22.20.0`; для проекта требуется `24.18.1`.
- Docker daemon сейчас не запущен, поэтому Compose проверен статически, но PostgreSQL container/healthcheck не запускались.
- GitHub visibility и доступность private-repository security features ещё не определены.

## Major architecture decisions

- pnpm monorepo с направленными package boundaries.
- Каноническая Roman progression независима от абсолютной тональности.
- `packages/music-theory` — чистое user-independent ядро.
- PostgreSQL — основное хранилище; пользователи являются first-class сущностями API/БД.

## Current limitations

- Auth provider/session transport, ORM/migrations, web/API frameworks, audio engine и MIDI implementation намеренно не выбраны.
- Integration и E2E suites пока пусты и допускают это только до появления соответствующих слоёв.
