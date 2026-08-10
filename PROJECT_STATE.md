# Project state

Обновлено: 2026-08-11

## Current phase

Phase 1 — Music theory core. Pre-flight и локальный bootstrap завершены; реализован первый фундаментальный срез музыкальной модели. Ветка `main` опубликована в `netgenic/chord-progression-app` и отслеживает `origin/main`.

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
- Создан чистый workspace-пакет `@chord-progression/music-theory` без runtime dependencies.
- Реализованы spelled pitch classes, интервалы, major/natural-minor keys, structured chord/Roman identities и двунаправленное Roman-преобразование.
- Зафиксирована canonical schema/serialization v1: non-empty Roman sequence, invariant к абсолютной тональности, с defensive copy и immutable domain values.
- Добавлены unit, golden и property-based tests (`fast-check`) для транспонирования pitch classes, spelling, Roman round-trip, canonical invariance и deterministic serialization.
- Canonical serialization v1 закреплена ADR 0005; алгоритм hash намеренно оставлен отдельным решением.
- Зафиксирована строгая chord-symbol grammar v1 для всех 13 MVP chord kinds: canonical ASCII suffixes, accidentals до двойных и optional slash bass.
- Реализованы `parseChord`/`renderChord`, immutable `ChordSymbol` с bass вне harmonic identity и spelling-preserving transposition аккордов/прогрессий через явный диатонический+хроматический интервал.
- Chord-symbol grammar и уточнения неоднозначностей спецификации закреплены ADR 0006.
- Добавлены exact invalid fixtures, curated enharmonic/slash-bass/transposition goldens и property tests для parse/render и interval/inverse round-trip без filtering.

## In progress

- Phase 1 продолжается следующими вертикальными срезами музыкального ядра; frontend/API/БД не начаты.

## Next

1. Реализовать chord recognition из spelled notes с несколькими кандидатами, explicit bass и исправленными inversion fixtures.
2. Добавить ranked key detection с confidence/evidence и пользовательским подтверждением неоднозначности.
3. Зафиксировать Roman-text grammar, затем определить portable hash algorithm и добавить versioned canonical hash.
4. Добавить explainable technical tags и только после стабилизации ядра перейти к API/БД с first-class пользователями и созданием пользователей.

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
- Roman-text parser, inversion classification/voicing, chord recognition, key detection, progression hash и technical tags ещё не реализованы.
- Chord-symbol v1 намеренно не принимает aliases, Unicode accidentals, altered dominants или extensions вне текущих 13 kinds; slash bass сохраняется, но пока не классифицируется как inversion/non-chord bass.
- Текущий mode vocabulary ограничен major и natural minor; chromatic degree alteration ограничен двойными accidentals.
- Integration и E2E suites пока пусты и допускают это только до появления соответствующих слоёв.
