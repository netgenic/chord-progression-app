# Архитектура базы данных

## Выбор хранилища

Основная база данных — PostgreSQL, согласно [ADR 0004](../adr/0004-postgresql.md). На pre-flight фиксируется реляционная модель и границы ответственности, но не выбирается ORM или migration framework.

База хранит пользователей и пользовательские связи как сущности первого класса, а также канонические музыкальные записи и provenance. Она не реализует музыкальные вычисления SQL-функциями или ORM hooks: canonicalization выполняется `packages/music-theory` до persistence boundary.

## Концептуальная схема

### users

Стабильный внутренний ID, нормализованные уникальные login identifiers, отображаемый профиль, timestamps и состояние учётной записи. Локальный password credential или внешние auth identities должны храниться отдельно либо явно моделироваться так, чтобы смена auth-провайдера не меняла `User.id`.

### progressions

ID, slug, canonical/hash version, canonical hash, mode, chord count, visibility, creator/submitter reference и audit timestamps. Абсолютная тональность отображения не хранится как отдельная progression row.

Точная политика уникальности canonical hash для public/private и повторно представленных пользователями прогрессий должна быть решена до schema implementation. Deduplication не должна случайно передавать одному пользователю права на запись другого.

### progression_chords

Упорядоченные harmonic steps: progression ID, position, degree, accidental, quality и extension. Inversion/bass, duration и voicing относятся к отдельным variant/realization данным и не должны неявно входить в harmonic identity.

### tags и progression_tags

`tags` содержит нормализованные name/slug/category. Join-запись содержит source (`analysis`, `classifier`, `user`, `import`), confidence, creator и timestamps. Ограничения обязаны предотвращать дубликаты одного assignment. Для technical tags пользовательский source запрещён правилами приложения и проверяется сервером.

### favorites

Связь `user_id + progression_id + created_at` с уникальностью пары. Создание/удаление выполняется идемпотентно в транзакции.

### progression_occurrences

Отдельные corpus occurrences с dataset, dataset version, source identifier, original key/chords, section, parser version, import timestamp, license/provenance и ограниченным metadata payload. Unique/import keys должны обеспечивать повторяемый импорт без потери нескольких реальных occurrences.

### Возможные будущие таблицы

- auth identities/sessions или password credentials — после auth ADR;
- user voicings — после определения продукта и формата;
- tag votes — предусмотрено продуктом, но не входит в MVP;
- usage events/aggregates — после privacy и retention решения;
- import runs/rejections — когда появится первый importer.

## Целостность данных

Минимальные database-level guarantees:

- foreign keys для всех пользовательских и progression relations;
- unique normalized email/username там, где они используются для входа;
- unique favorite pair и tag assignment;
- unique progression position внутри progression;
- category/source/confidence/domain checks;
- bounded text/metadata sizes;
- timestamps и provenance, которые importer не может пропустить;
- транзакции для progression + chord steps + tags и для пользовательских mutations.

API validation не заменяет constraints, а constraints не заменяют application authorization.

## Индексы и поиск

До реальных query plans предусматриваются индексы для:

- canonical hash/version;
- progression mode/chord count/public visibility;
- ordered chord lookup, если он нужен выбранной search strategy;
- normalized tag slug/category;
- favorites по user и progression;
- occurrences по dataset/source identifier и progression;
- creator/owner relations.

Конкретный full-text/trigram/search approach выбирается после измерения запросов. Для MVP не добавляется отдельный search service без доказанной необходимости.

## Миграции

- Schema меняется только версионированными migrations.
- Применённые migrations не переписываются; исправления добавляются следующей migration.
- Migration должна иметь проверяемый forward path и, где безопасно, rollback/restore plan.
- Изменение canonical hash требует отдельного backfill plan и сохранения версии.
- Тесты migrations выполняются на disposable PostgreSQL, не на production dump.

## Доступ и безопасность

- Production database недоступна coding agents и importer development tools.
- Приложение использует роль с минимальными правами; migration role отделяется при необходимости.
- SQL не строится из пользовательских строк.
- Secrets передаются через validated environment и не логируются.
- Локальная Compose DB слушает только loopback и использует одноразовые credentials.
- Backup, retention, deletion и персональные данные уточняются до deployment.

## Отложенные решения

- ORM/query builder и migration tooling;
- UUID/другая форма physical IDs;
- точная auth credential/session schema;
- политика canonical deduplication и ownership;
- search indexes/extensions;
- deployment provider, backup и retention.
