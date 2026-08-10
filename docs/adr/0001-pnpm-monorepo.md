# ADR 0001: pnpm monorepo

## Status

Accepted — 2026-08-10

## Context

Проект включает web и API applications, чистую music-theory библиотеку, database/shared/UI packages и dataset importers. Они должны совместно использовать типы и tooling, но сохранять проверяемые направления зависимостей. Для одного небольшого проекта отдельные repositories увеличили бы coordination/versioning overhead.

Нужен воспроизводимый package manager с workspace support и едиными root-командами для format, lint, typecheck, tests и build. Дополнительный task orchestrator пока не решает измеримую проблему.

## Decision

Использовать один Git repository и pnpm workspaces со следующими верхнеуровневыми границами:

```text
apps/web
apps/api
packages/music-theory
packages/database
packages/shared
packages/ui
scripts/importers
```

Версия pnpm фиксируется в root `packageManager`, dependency graph — lockfile. Общие команды запускаются из root через pnpm workspace/filter/recursive capabilities. Nx, Turborepo и собственный task runner не добавляются, пока измерения не покажут потребность в дополнительном caching/orchestration.

Workspace не отменяет package boundaries: приложения могут зависеть от packages, но packages не импортируют `apps/*`; `packages/music-theory` подчиняется отдельному ADR 0003.

## Alternatives

- Несколько repositories: сильнее физическая изоляция, но лишние release/version coordination и дублирование tooling для текущего масштаба.
- npm/Yarn/Bun workspaces: технически возможны, но pnpm выбран pre-flight как единый workspace manager с точным lockfile и строгой моделью dependencies.
- Nx/Turborepo поверх workspaces: полезны для крупного task graph и remote cache, но преждевременны без измеримых CI/build bottlenecks.

## Consequences

Положительные:

- одна воспроизводимая установка и единые quality gates;
- атомарные изменения API, типов и consumers;
- простые локальные package links без публикации;
- единое место для инструкций, ADR и CI.

Отрицательные/риски:

- границы зависимостей нужно контролировать config/tests/review, а не считать гарантированными расположением каталогов;
- root install охватывает весь workspace;
- версии pnpm/Node и lockfile требуют регулярного обслуживания;
- при реальном росте build graph может потребоваться повторная оценка orchestration, оформленная новым ADR.
