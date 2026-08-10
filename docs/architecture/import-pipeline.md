# Архитектура import pipeline

## Цель

Import pipeline воспроизводимо получает небольшие гармонические patterns из разрешённых открытых датасетов, canonicalizes их общей music-theory библиотекой, дедуплицирует и сохраняет occurrences с полным provenance.

Первичные кандидаты: ChoCo, OpenEWLD и When in Rome. Техническая доступность источника не означает право импорта: лицензия, версия и условия распространения проверяются до написания parser или загрузки данных. Scraping коммерческих chord-сайтов не допускается без явного юридического основания.

## Граница пакета

Код pipeline располагается в `scripts/importers` и может зависеть от `packages/music-theory`, `packages/database` и безопасных shared schemas. Dataset-specific parsing не проникает в music-theory или API.

Importer работает только с disposable/development или специально назначенной import database. Production import требует отдельного operational runbook и явного разрешения.

## Этапы

```text
License/provenance gate
        ↓
Dataset reader + versioned parser
        ↓
Chord/key normalization
        ↓
Progression segmentation
        ↓
Roman conversion + canonicalization
        ↓
Deduplication
        ↓
Technical tag generation
        ↓
Transactional persistence
        ↓
Import report
```

Каждый этап принимает и возвращает валидируемую запись, а rejection сохраняет stage, безопасную причину и source identifier.

## Provenance envelope

Для каждого accepted/rejected source object сохраняются или доступны:

- dataset name и version/release;
- source URI/identifier;
- license и provenance metadata;
- fetch/import date;
- parser и normalization/canonical schema versions;
- original key/chords/section;
- checksum там, где он помогает воспроизводимости;
- transformation warnings и rejection reasons.

Canonicalization не удаляет original representation. Несколько occurrences могут ссылаться на одну canonical progression.

## Segmentation

Вся песня не считается одной progression. MVP поддерживает окна длиной 2, 3, 4, 5, 6 и 8 chords. Sliding-window policy должна быть детерминирована и включать параметры в parser/import version, чтобы повторный запуск создавал те же source occurrence keys.

Section boundaries, rests, repeats и dataset-specific annotations нельзя тихо игнорировать: parser документирует их interpretation или отклоняет неподдерживаемый случай.

## Идемпотентность и deduplication

- Повторный запуск той же dataset/parser/config version не создаёт дубликаты occurrences или tags.
- Source occurrence имеет детерминированный import key.
- Harmonic duplicates объединяются по versioned canonical hash.
- Обновление parser/canonical version выполняется новым import run с явной migration/reconciliation policy.
- Partial failure не оставляет progression без chord steps/provenance; batch transaction boundaries ограничены и восстанавливаемы.

## Режимы выполнения

- `validate`: проверить manifest, license metadata и schemas без persistence;
- `dry-run`: выполнить parsing/normalization/canonicalization и сформировать report;
- `import`: сохранить validated results транзакционно;
- `resume/reconcile`: добавляется только при реальной необходимости больших наборов.

Точные CLI-команды появятся вместе с первым importer и будут описаны в `DEVELOPMENT.md`.

## Наблюдаемость

Итоговый report содержит dataset/version, processed, accepted, rejected, duplicates, created/updated occurrences, warnings, errors и duration. Логи используют source IDs, но не secrets, полный потенциально лицензированный corpus или SQL.

Unknown chord/key и ambiguous analysis являются ожидаемыми typed outcomes, а не обязательно crashes. Unexpected errors завершают run non-zero.

## Проверки

- Golden parser fixtures с разрешёнными минимальными excerpts/синтетическими данными.
- Unit tests normalization и segmentation.
- Property/invariant tests canonicalization через music-theory.
- Integration tests PostgreSQL constraints и transaction rollback.
- Идемпотентный double-run test.
- License/provenance required-field и malformed/oversized input tests.

## Отложенные решения

- формат dataset manifests и raw artifact storage;
- download/cache tooling;
- batch size/parallelism;
- конкретный CLI framework;
- reconciliation при смене canonical version;
- production scheduling — не требуется MVP.
