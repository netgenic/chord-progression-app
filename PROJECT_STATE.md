# Project state

Обновлено: 2026-08-10

## Current phase

Pre-flight и локальный bootstrap завершены; production-код ещё не начинался. Ветка `main` опубликована в `netgenic/chord-progression-app` и отслеживает `origin/main`.

## Completed

- Каноническая продуктовая спецификация перенесена в `docs/product/specification.md`.
- Зафиксированы pre-flight, архитектурные границы, security baseline и четыре initial ADR.
- Пользователи заложены как first-class сущности API/БД; музыкальное ядро остаётся user-independent.
- Созданы root/nested `AGENTS.md` и воспроизводимый `DEVELOPMENT.md`.
- Настроены pnpm workspace, Node/TypeScript baseline, format, lint, typecheck, unit/integration/E2E gates и bootstrap tests.
- Создан централизованный typed environment boundary с fail-fast проверкой `.env.example` в общем gate.
- Созданы lockfile, локальный PostgreSQL Compose, GitHub Actions CI, Dependabot и PR template.
- `pnpm verify` проходит под Node.js `24.18.1`; dependency audit не находит известных уязвимостей.
- GitHub remote подключён, bootstrap-коммит отправлен в `main`.

## In progress

- Активная production-задача отсутствует; pre-flight готов к передаче в следующий этап.

## Next

1. Начать `packages/music-theory` с формальных типов и инвариантов канонической Roman progression.
2. Добавить unit, golden и property-based tests до API/UI реализации.
3. После стабилизации музыкального ядра перейти к минимальной схеме API/БД с first-class пользователями.

## Known issues

- На host по умолчанию установлен Node.js `22.20.0`; для проекта требуется `24.18.1`.
- Docker daemon сейчас не запущен, поэтому Compose проверен статически, но PostgreSQL container/healthcheck не запускались.
- Branch rules и дополнительные GitHub security features ещё не проверены и не включены.

## Major architecture decisions

- pnpm monorepo с направленными package boundaries.
- Каноническая Roman progression независима от абсолютной тональности.
- `packages/music-theory` — чистое user-independent ядро.
- PostgreSQL — основное хранилище; пользователи являются first-class сущностями API/БД.

## Current limitations

- Auth provider/session transport, ORM/migrations, web/API frameworks, audio engine и MIDI implementation намеренно не выбраны.
- Integration и E2E suites пока пусты и допускают это только до появления соответствующих слоёв.
