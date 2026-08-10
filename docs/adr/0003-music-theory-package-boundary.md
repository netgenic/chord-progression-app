# ADR 0003: music-theory package boundary

## Status

Accepted — 2026-08-10

## Context

Parsing, chord recognition, transposition, key detection, Roman conversion, canonicalization и technical tag generation используются web-клиентом, API и import pipeline. Дублирование этих алгоритмов между слоями почти гарантирует несовпадения и ошибки в музыкальной идентичности.

Эта логика детерминирована и требует высокой плотности unit/property/golden tests. Framework, persistence, browser capability и user authorization concerns затруднили бы её тестирование и повторное использование.

## Decision

Вся музыкальная логика размещается в `packages/music-theory` как чистая user-independent TypeScript-библиотека.

Пакет:

- не зависит от `apps/*`, React, HTTP/backend framework, ORM/PostgreSQL, audio engine, Web Audio, Web MIDI или auth/user models;
- не выполняет network, filesystem, database или browser side effects;
- принимает и возвращает собственные domain values/results, включая явные ambiguity/confidence outcomes;
- содержит единственные реализации parsing, recognition, intervals/scales, transposition, Roman conversion, key detection, canonicalization/hashing и технического анализа;
- тестируется unit, property-based и curated golden fixtures.

Web, API и importers могут зависеть от пакета. Они адаптируют transport/persistence/browser данные к domain values и не создают альтернативные функции для той же операции.

User identity, ownership, favorites, community attribution и authorization существуют только в API/database layers. Ни одна music-theory function не принимает `userId`, session или actor context.

## Alternatives

- Реализовать логику отдельно в frontend и backend: уменьшает начальные package boundaries, но создаёт расхождения и двойные тесты.
- Поместить музыкальные методы в ORM entities/database: удобно для одного server flow, но связывает core с persistence и исключает browser/import reuse.
- Выполнять весь анализ только через API: централизует вычисления, но ухудшает MIDI/editor latency и всё равно не требует framework dependency внутри core.
- Использовать generic shared package: размывает ответственность и позволяет случайно смешать domain, transport и UI utilities.

## Consequences

Положительные:

- одна проверяемая реализация музыкальных инвариантов;
- быстрые детерминированные tests без browser/database;
- одинаковое поведение API, UI preview и importers;
- возможность развивать приложения и infrastructure независимо от domain core.

Отрицательные/риски:

- нужны явные adapters между domain types и API/DB/browser representations;
- package API требует дисциплины и backward-compatible evolution;
- нельзя «быстро исправить» музыкальный edge case только в UI/API;
- purity и запрещённые dependencies нужно контролировать lint/tests/review.
