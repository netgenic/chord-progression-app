# ADR 0004: PostgreSQL

## Status

Accepted — 2026-08-10

## Context

Проект хранит канонические progressions и ordered chord steps, пользователей, ownership/visibility, favorites, typed tag assignments и многочисленные dataset occurrences с provenance. Эти данные имеют выраженные relations, uniqueness constraints и транзакционные mutations.

Требуются deduplication по канонической идентичности, комбинируемые фильтры и возможность развивать поиск без введения отдельного distributed data layer.

## Decision

Использовать PostgreSQL как единственную основную relational database.

Users являются first-class rows со стабильными внутренними IDs; progressions, favorites, community tag attribution и ownership ссылаются на них foreign keys. Музыкальная идентичность при этом остаётся user-independent.

Локальная разработка использует зафиксированный официальный PostgreSQL image через Docker Compose, loopback binding и одноразовые development credentials. Schema меняется версионированными migrations и проверяется integration tests на disposable database.

ORM/query builder и migration framework этим ADR не выбираются. Выбор будет сделан отдельно после определения требований API/schema и должен сохранять database constraints, parameterized queries и прозрачные migrations.

## Alternatives

- SQLite: проще локальный bootstrap, но хуже соответствует ожидаемым concurrent writes, PostgreSQL-specific search/constraints и production parity.
- Document database: гибкая metadata schema, но основные сущности и права являются реляционными; потребовалась бы ручная целостность.
- Managed backend/database как исходная архитектурная граница: может упростить deployment/auth, но преждевременно связывает проект с provider.
- Несколько databases/search service: увеличивают operational complexity без доказанной нагрузки; PostgreSQL достаточно для MVP.

## Consequences

Положительные:

- foreign keys, unique/check constraints и transactions защищают целостность;
- естественная модель users/favorites/tags/occurrences;
- достаточные filtering/indexing/search возможности для MVP;
- local/CI disposable database приближена к production semantics.

Отрицательные/риски:

- разработке требуется доступный PostgreSQL/Docker environment;
- migrations, backup и version upgrades требуют дисциплины;
- JSON metadata нельзя использовать вместо нормальной схемы для основных полей;
- конкретная production hosting/backup/retention policy остаётся открытой;
- PostgreSQL не заменяет application authorization и music-theory validation.
