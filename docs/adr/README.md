# Architecture Decision Records

ADR фиксируют архитектурно значимые решения, их контекст, альтернативы и последствия. Текущее устройство системы описывается в `docs/architecture`; ADR объясняют, почему оно стало таким.

## Статусы

- `Proposed` — решение обсуждается и ещё не является обязательным.
- `Accepted` — решение действует.
- `Superseded` — заменено более новым ADR; старый документ сохраняется со ссылкой на замену.
- `Rejected` — рассмотрено и явно не принято.

## Правила

1. Имя файла: `NNNN-краткое-решение.md`.
2. Обязательные разделы: `Status`, `Context`, `Decision`, `Alternatives`, `Consequences`.
3. Accepted ADR не переписывается так, чтобы изменить историческое решение. Существенное изменение оформляется новым ADR и помечает старое как superseded.
4. ADR нужен для границ packages, моделей идентичности/данных, инфраструктуры, публичных контрактов и security-sensitive choices.
5. ADR не нужен для локального refactor, имени функции, форматирования или другой обратимой implementation detail.

## Индекс

- [0001 — pnpm monorepo](0001-pnpm-monorepo.md)
- [0002 — canonical progression model](0002-canonical-progression-model.md)
- [0003 — music-theory package boundary](0003-music-theory-package-boundary.md)
- [0004 — PostgreSQL](0004-postgresql.md)
- [0005 — canonical serialization v1](0005-canonical-serialization-v1.md)
- [0006 — chord-symbol grammar v1](0006-chord-symbol-grammar-v1.md)
- [0007 — exact chord recognition v1](0007-exact-chord-recognition-v1.md)

Следующие решения пока намеренно не приняты: canonical hash algorithm, auth provider/session transport, ORM/migration tool, HTTP/frontend frameworks, UI toolkit, audio engine/assets и MIDI helper/support policy. Для каждого требуется отдельный ADR перед соответствующей реализацией.
