# Архитектура backend

## Ответственность API

API предоставляет публичное чтение каталога и authenticated mutations, валидирует недоверенные данные, формирует actor context, применяет authorization, orchestrates music-theory operations и сохраняет результаты транзакционно.

API не дублирует музыкальные алгоритмы и не переносит их в ORM models или route handlers. HTTP-framework, ORM, auth provider и schema-generation tooling будут выбраны отдельными ADR.

## Логические слои

```text
HTTP transport
    ↓ validation + actor context
Application use cases
    ↓
Music-theory domain + authorization policy
    ↓
Persistence/auth/external adapters
```

- Transport разбирает HTTP, применяет limits/runtime schemas и переводит ошибки в стабильный error envelope.
- Application use cases координируют операции и транзакции без framework-specific domain objects.
- Music-theory получает только музыкальные values.
- Persistence adapters скрывают SQL/ORM details, но не превращаются в speculative generic repository framework.
- Authorization получает actor/resource/action и остаётся серверной обязанностью.

## API-ресурсы

Базовая REST-oriented поверхность:

- progressions: list/detail/create/update/delete/similar;
- tags и progression tag assignments;
- favorites;
- chord/progression analysis;
- users/current user и пользовательские коллекции.

Пользователь представлен в API отдельным стабильным resource/DTO. Минимально необходимы получение current user и доступ к его favorites/own progressions; публичность профиля и exact route naming определяются privacy/API contract решением. Нельзя использовать внешний OAuth subject как единственный публичный ID или прятать пользователя внутри favorite/progression payload без собственного контракта.

## Доступ

Публично без входа доступны чтение public progressions/tags, поиск, фильтрация, similarity и безопасные analysis operations с лимитами. Authenticated actor требуется для:

- создания и изменения собственных progressions;
- favorite/unfavorite;
- создания/назначения community tags;
- чтения приватной пользовательской библиотеки.

Authentication только устанавливает actor; authorization отдельно проверяет ownership, visibility, tag category/source и разрешённое действие. Technical/character tags нельзя изменять через community endpoints.

## Команды создания прогрессии

1. Runtime schema проверяет размер, chord vocabulary и metadata limits.
2. Music-theory parses chords, проверяет/использует подтверждённый key и canonicalizes progression.
3. Application layer разрешает canonical duplicate/ownership policy.
4. Persistence transaction создаёт либо переиспользует canonical entity и фиксирует пользовательское происхождение/связь.
5. API возвращает canonical representation и requested absolute realization отдельно.

Распознанный клиентом результат MIDI никогда не считается доверенным: сервер повторно валидирует сохраняемое музыкальное представление.

## Чтение, фильтры и поиск

List endpoints используют bounded pagination, стабильную сортировку и allowlisted фильтры. Условия разных выбранных фильтров по умолчанию комбинируются через AND. Search принимает ограниченную строку и различает Roman, absolute chord, ID/name и tag queries через явный parsing flow.

API не генерирует SQL из пользовательской строки. Сначала применяется PostgreSQL search strategy; отдельный search service допускается только после измеримой необходимости.

## Контракты и ошибки

- Все request/response boundaries имеют runtime schemas и выведенные/согласованные TypeScript types.
- Error envelope содержит стабильный machine code, безопасное сообщение и correlation ID, но не stack/SQL/token/internal path.
- Validation, authentication, authorization, not-found, conflict и rate-limit errors различаются.
- Dates, confidence, IDs и enums сериализуются единообразно.
- Breaking API changes версионируются или проходят контролируемую migration policy.

## Надёжность и наблюдаемость

- Structured logs включают request/correlation ID, route, status и duration.
- Passwords, cookies, authorization headers, raw MIDI payloads и чувствительные профили не логируются.
- Mutations, deduplication и counters используют транзакции/constraints вместо process-local locks.
- Expensive analysis имеет input/time limits и позже может быть вынесен в job только при доказанной необходимости.
- Health/readiness endpoints не раскрывают secrets и внутреннюю topology.

## Тесты

- Use-case tests без HTTP там, где важны authorization и orchestration.
- API contract/integration tests с runtime schemas.
- PostgreSQL integration tests на disposable database для constraints и transactions.
- Negative tests: anonymous mutation, cross-user update/delete, technical tag mutation, malformed/oversized payload, duplicate favorite/community tag.

## Отложенные решения

- HTTP-framework и deployment runtime;
- auth mechanism/provider и session/token transport;
- ORM/query builder/migration tool;
- exact route/versioning/OpenAPI strategy;
- canonical duplicate ownership semantics;
- rate-limit storage и production observability platform.
