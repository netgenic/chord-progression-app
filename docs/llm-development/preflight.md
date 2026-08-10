# Pre-flight: подготовка и ограничения

Дата проверки: 2026-08-10
Статус: принято как исходная конфигурация до начала production-кода

## Current tooling recommendations

Проект следует начинать как TypeScript-монорепозиторий на Node.js 24 LTS и pnpm. На этапе подготовки создаются только границы репозитория, документация, проверки качества, локальный PostgreSQL и CI; прикладной код, схема БД и музыкальная логика пока не реализуются.

Зафиксированный baseline:

- Node.js `24.18.1` LTS; локально сейчас установлен Node.js `22.20.0`, поэтому до разработки нужно переключить версию по `.node-version`.
- pnpm `11.21.0`, зафиксированный в `packageManager`.
- TypeScript `6.0.3`. TypeScript 7 пока не выбран: текущая стабильная версия `typescript-eslint` официально ограничивает поддерживаемый диапазон TypeScript версией ниже 6.1.
- ESLint `10.8.1`, `@eslint/js` `10.0.1`, `typescript-eslint` `8.66.0`; flat config и type-aware linting.
- Prettier `3.9.6` как единственный форматтер.
- Vitest `4.1.10` и `@vitest/coverage-v8` `4.1.10`.
- `@types/node` `24.13.3` для типизации runtime/tooling API выбранной Node 24 линии.
- Playwright Test `1.62.1`; до появления веб-приложения допускается отсутствие e2e-тестов, но команда должна завершаться успешно.
- PostgreSQL `18.4` в официальном Docker-образе `postgres:18.4-bookworm` только для локальной разработки.
- GitHub Actions для обязательной проверки, Dependabot для npm/pnpm и Actions.

Лицензии выбранных инструментов совместимы с обычной разработкой приложения: MIT или Apache-2.0. Лицензии прикладных зависимостей и импортируемых наборов данных всё равно проверяются отдельно при их добавлении.

## Codex configuration

На старте **не создаётся** проектный `.codex/config.toml`. В текущем окружении уже доступны sandbox, patch-based editing, браузер, параллельные агенты и локальные команды. Проектные настройки без реальной необходимости увеличили бы число неочевидных точек отказа.

Codex должен работать по следующим правилам:

- читать корневой `AGENTS.md`, затем ближайший вложенный `AGENTS.md`;
- перед изменениями читать продуктовую спецификацию, `PROJECT_STATE.md` и релевантные ADR;
- не начинать production-код до завершения этого pre-flight;
- не смешивать React, HTTP, ORM, аудио и MIDI с чистой музыкальной моделью;
- после изменения запускать минимально достаточные проверки, а перед передачей результата — `pnpm verify` и просмотр diff;
- не добавлять инструмент или зависимость без явной пользы и документации решения.

Пересмотр `.codex/config.toml` нужен только при появлении устойчивой проектной потребности: например, безопасного project-scoped MCP с точным allowlist или специализированных hooks.

## Repository instructions strategy

Используется двухуровневая стратегия инструкций:

1. Корневой `AGENTS.md` содержит краткие неизменные правила всего репозитория: порядок чтения, архитектурные границы, качество, безопасность, Git и критерии готовности.
2. Вложенные инструкции уточняют локальные ограничения в `apps/web`, `apps/api`, `packages/music-theory` и `scripts/importers`.

Это соответствует модели Codex: инструкции загружаются от корня к рабочей директории, а ближайшие инструкции имеют приоритет. Общий текст должен оставаться коротким; детали и обоснования хранятся в архитектурных документах и ADR, а не дублируются в инструкциях.

## Context management strategy

Контекст разделяется по назначению:

- `docs/product/specification.md` — каноническое продуктовое задание;
- `PROJECT_STATE.md` — короткий актуальный снимок состояния, следующего шага и известных ограничений;
- `docs/architecture/` — текущее устройство системы и направления зависимостей;
- `docs/adr/` — решения, причины, альтернативы и последствия;
- `DEVELOPMENT.md` — воспроизводимые команды;
- `AGENTS.md` — только исполнимые правила для агентов.

После каждого существенного этапа обновляется `PROJECT_STATE.md`. Если решение меняет архитектурную границу, модель данных, выбранную инфраструктуру или внешний контракт, сначала создаётся или обновляется ADR. Длинные журналы сессий и копии одинаковых правил не ведутся.

## Agent Skills

Собственные project Skills сейчас **не создаются**. На pre-flight нет повторяющегося проектного workflow, который нельзя выразить командами, документацией и `AGENTS.md`.

Критерий для будущего Skill:

- один и тот же многошаговый процесс повторился не менее двух раз;
- у него есть стабильные входы, ожидаемый результат и проверяемая последовательность;
- Skill заметно уменьшает ошибки или объём повторного контекста.

Вероятные будущие кандидаты: валидация/нормализация музыкального датасета и выпуск проверяемой миграции. До появления реального процесса создавать их преждевременно.

## MCP strategy

На старте **не подключается ни один MCP-сервер**. Текущие локальные и встроенные инструменты покрывают файловую систему, shell, документацию и браузер; MCP не должен дублировать эти возможности.

Правила возможного будущего подключения:

- MCP добавляется только для устойчивого внешнего контекста, который иначе требует ручного цикла;
- сначала read-only и минимальный набор tools через allowlist;
- токены, DSN и OAuth-секреты не хранятся в репозитории и не передаются в аргументах запуска;
- операции записи требуют явного подтверждения и не получают доступ к `main`, production-БД или секретам CI;
- версии фиксируются, сервер и его зависимости проверяются;
- `roots`, annotations и описание «read-only» не считаются полноценной границей безопасности.

Рассмотренные кандидаты:

- OpenAI Docs MCP — официальный и read-only, но проект пока не использует OpenAI API, а официальная документация уже доступна через текущие инструменты; отклонён сейчас.
- GitHub MCP — может быть полезен после появления устойчивого PR/issues workflow; отложен. Первоначально допустимы только read-only toolsets для repositories, issues, pull requests и actions.
- DBHub/PostgreSQL MCP — допустим в будущем только для одноразовой локальной БД и отдельной роли с `SELECT`; не нужен до появления схемы.
- Playwright MCP и filesystem MCP — отклонены: локальный Playwright Test, браузер и sandbox уже покрывают сценарии без лишней поверхности доступа.

Поскольку MCP не выбран, отдельная проверка соединения на этом этапе неприменима.

## Development methodology

Работа ведётся вертикальными, проверяемыми этапами:

1. Pre-flight, документация и quality gates.
2. Чистое ядро музыкальной теории и property/unit tests.
3. Минимальные API, PostgreSQL и пользователи как сущность первого класса.
4. Веб-интерфейс и воспроизведение.
5. MIDI.
6. Теги, избранное и пользовательские связи.
7. Идемпотентный импорт данных с provenance и лицензиями.

Для каждого этапа:

- сначала уточняются инварианты и критерии готовности;
- реализация делается минимальным вертикальным срезом;
- тесты проверяют наблюдаемое поведение и граничные случаи;
- изменения проходят `format`, lint, typecheck, tests и build;
- архитектурные решения фиксируются ADR;
- следующий этап не должен маскировать незавершённость текущего.

Не используются speculative microservices, CQRS, Kafka, сложные генераторы, Nx/Turborepo или абстракции «на будущее» без измеримой необходимости.

## Testing strategy

Пирамида проверок:

- **Unit tests**: чистая музыкальная теория, нормализация, транспонирование, валидация, преобразования представлений.
- **Property-based tests**: после появления `packages/music-theory` добавляется `fast-check`; ключевые свойства — обратимость транспонирования, сохранение длины/структуры и каноничность результата.
- **Integration tests**: репозитории БД, миграции, API-контракты, авторизация и права владения на реальном локальном PostgreSQL.
- **E2E tests**: только критические пользовательские потоки через Playwright после появления UI.
- **Importer tests**: повторный запуск не создаёт дубликаты; некорректные и нелицензированные записи отклоняются с диагностикой.

На pre-flight создаётся один содержательный тест структуры репозитория. Пустые unit/integration/e2e suites разрешены только до появления соответствующего слоя. При добавлении production-кода для него должны появиться тесты того же изменения.

Coverage используется как диагностический сигнал. Жёсткий общий процент не вводится до появления репрезентативного кода; для музыкального ядра позже устанавливаются отдельные высокие пороги по branches/functions/lines/statements.

## Validation strategy

Единая локальная и CI-команда — `pnpm verify`. Она должна включать:

1. `prettier --check`;
2. ESLint без warnings;
3. TypeScript typecheck в strict-режиме;
4. unit и integration tests;
5. build;
6. e2e-команду, допускающую отсутствие тестов только до появления UI.

Дополнительно CI запускает `pnpm audit --audit-level high`. Перед завершением задачи проверяются `git diff`, отсутствие секретов и актуальность документации. Миграции и импорт позже получают собственные dry-run/validation-команды.

## Security strategy

Базовые правила:

- секреты только через environment/secret store; `.env` игнорируется, в Git хранится только `.env.example` с безопасными локальными значениями;
- входные данные валидируются на границе API; ошибки не раскрывают stack, SQL, токены и внутренние пути;
- SQL не строится из пользовательских строк; доступ к данным следует принципу наименьших привилегий;
- логи не содержат пароли, session/cookie/token, полные MIDI payload и чувствительные персональные данные;
- для загрузок задаются ограничения размера, типа и времени обработки;
- authn и authz считаются разными проверками; владение progression/favorite/tag проверяется сервером;
- при email/password используется Argon2id, уникальный нормализованный email/username и безопасное восстановление доступа;
- при cookie-сессиях применяются `HttpOnly`, `Secure`, подходящий `SameSite` и защита от CSRF;
- публичное чтение/прослушивание может быть анонимным, но изменение данных и пользовательские связи требуют аутентификации;
- музыкальное ядро не знает о пользователях: пользовательские права остаются в API/БД.

В первой модели данных пользователь — сущность первого класса: стабильный ID, нормализованные уникальные идентификаторы входа, auth identity/password hash, временные метки и явные связи владения/избранного/тегов. Конкретный auth-провайдер будет выбран отдельным ADR перед реализацией, чтобы не зафиксировать решение без требований к развёртыванию.

GitHub Actions получает только `contents: read`; сторонние actions фиксируются полным commit SHA. CodeQL и secret scanning для private-репозитория зависят от тарифа/entitlement, поэтому включаются после выбора видимости и проверки доступности. Локальная БД слушает только `127.0.0.1` и использует одноразовые development credentials.

## Git strategy

- Основная ветка — `main`.
- Изменения выполняются в коротких feature branches и попадают в `main` через PR после появления remote.
- Коммиты небольшие, тематические и не смешивают рефакторинг с новой функциональностью без необходимости.
- Первый локальный коммит — проверенный bootstrap/pre-flight.
- После создания GitHub-репозитория на `main` настраиваются PR requirement и обязательный check `verify`, если план GitHub поддерживает ruleset/protection.
- Force-push в `main`, автоматический merge агентом и запись через MCP не разрешаются.
- Версии зависимостей и Actions фиксируются; Dependabot предлагает обновления через отдельные PR.

До завершения pre-flight remote не создаётся. Видимость `private`/`public` должна быть явно выбрана перед публикацией, поскольку это влияет на раскрытие спецификации и доступность security-функций GitHub.

## CI strategy

Минимальный workflow запускается на pull request и push в `main`:

- checkout и setup-node по полному commit SHA;
- Node из `.node-version`;
- точная версия pnpm через Corepack;
- `pnpm install --frozen-lockfile`;
- `pnpm verify`;
- `pnpm audit --audit-level high`;
- `permissions: contents: read`, timeout и отмена устаревшего запуска той же ветки.

Кэш и дополнительные сторонние actions на старте не обязательны: их добавляют только после измеримого замедления CI. CodeQL откладывается до создания GitHub-репозитория и проверки entitlement. Dependabot следит за ecosystem `npm` (включая pnpm lockfile) и `github-actions`.

## Documentation strategy

Документация считается частью результата:

- продуктовая спецификация переносится в `docs/product/specification.md`, а исходное имя получает совместимую ссылку;
- архитектура разделяется на overview, domain model, music theory, database, frontend, backend, audio, MIDI и import pipeline;
- `DEVELOPMENT.md` содержит копируемые команды и явно отмечает ещё не реализованные команды;
- ADR фиксируют решения, которые трудно безопасно отменить;
- `PROJECT_STATE.md` остаётся коротким и обновляется по итогам каждого этапа;
- комментарии в коде объясняют нетривиальную причину, а не пересказывают код.

## Architecture decision process

Для значимых решений используется lightweight ADR со статусом `Proposed`, `Accepted`, `Superseded` или `Rejected`:

1. Контекст и ограничения.
2. Принятое решение.
3. Реально рассмотренные альтернативы.
4. Положительные и отрицательные последствия.
5. Условия пересмотра.

Первичные ADR:

- pnpm monorepo;
- каноническая Roman-numeral модель прогрессии;
- независимая граница `packages/music-theory`;
- PostgreSQL как постоянное хранилище.

Auth, ORM, UI framework, audio library и способ MIDI-экспорта не фиксируются до соответствующего этапа и уточнённых требований.

## Recommended tools

Ниже перечислены предлагаемые инструменты. Поле **Decision** различает немедленное включение и осознанно отложенное добавление.

### Node.js 24.18.1 LTS

- **Tool:** Node.js `24.18.1`.
- **Purpose:** единая среда выполнения, сборки и CI.
- **Why needed:** TypeScript-инструменты и будущие web/API packages требуют общего поддерживаемого runtime.
- **Alternative:** Node.js 22 LTS или Node.js 26 Current.
- **Advantages:** актуальная LTS-линия, долгий срок поддержки, совместима с выбранными инструментами.
- **Disadvantages:** локально сейчас установлена версия 22, потребуется переключение.
- **Maintenance risk:** низкий; обновления только внутри 24.x после проверки CI.
- **Security implications:** поддерживаемая LTS получает исправления; точная версия повышает воспроизводимость, но её нужно регулярно обновлять.
- **Decision:** включить сейчас и зафиксировать в `.node-version`/`engines`.

### pnpm 11.21.0

- **Tool:** pnpm `11.21.0`.
- **Purpose:** workspaces, lockfile и управление зависимостями.
- **Why needed:** монорепозиторию нужен воспроизводимый пакетный менеджер с фильтрами и строгими dependency controls.
- **Alternative:** npm workspaces, Yarn, Bun.
- **Advantages:** быстрый content-addressable store, строгая структура зависимостей, workspace-команды и настройки supply-chain.
- **Disadvantages:** отдельный инструмент; часть команды может быть знакома только с npm.
- **Maintenance risk:** средний; pnpm 11 новый baseline, настройки install scripts требуют поддержки.
- **Security implications:** frozen lockfile, release-age/trust policy и allowlist build scripts снижают supply-chain риск; токены registry нельзя хранить в проектном `.npmrc`.
- **Decision:** включить сейчас, точную версию зафиксировать в `packageManager`.

### TypeScript 6.0.3

- **Tool:** TypeScript `6.0.3`.
- **Purpose:** строгая типизация всего production- и test-кода.
- **Why needed:** сложная музыкальная модель, API-контракты и пользовательские права выигрывают от статических инвариантов.
- **Alternative:** TypeScript 7.0.2, JavaScript, другой язык для backend.
- **Advantages:** поддерживается `typescript-eslint`, строгий TSConfig, единая модель типов между слоями.
- **Disadvantages:** build/typecheck сложнее, чем у JavaScript; часть runtime-валидации всё равно обязательна.
- **Maintenance risk:** средний из-за близкого перехода экосистемы на TS7.
- **Security implications:** уменьшает класс ошибок, но не заменяет валидацию недоверенного ввода.
- **Decision:** включить сейчас; пересмотреть TS7 после официальной поддержки `typescript-eslint`.

### ESLint 10 + typescript-eslint 8

- **Tool:** ESLint `10.8.1`, `@eslint/js` `10.0.1`, `typescript-eslint` `8.66.0`.
- **Purpose:** статический анализ и type-aware правила.
- **Why needed:** ловит ошибки promises, unsafe operations и нарушения общих правил раньше тестов.
- **Alternative:** Biome, Oxlint, только TypeScript.
- **Advantages:** зрелая экосистема, flat config, type-aware presets.
- **Disadvantages:** медленнее синтаксических линтеров и требует согласования версий.
- **Maintenance risk:** средний; конфиг нельзя бесконтрольно расширять и нужно обновлять вместе с TypeScript.
- **Security implications:** снижает вероятность небезопасных конструкций, но не является security scanner.
- **Decision:** включить сейчас; использовать recommended type-checked baseline и точечные дополнительные правила.

### Prettier 3.9.6

- **Tool:** Prettier `3.9.6`.
- **Purpose:** детерминированное форматирование.
- **Why needed:** убирает стилистические споры и делает diff компактнее.
- **Alternative:** Biome formatter, ручное форматирование.
- **Advantages:** предсказуемый результат и широкая поддержка форматов.
- **Disadvantages:** отдельный проход и ограниченная настраиваемость.
- **Maintenance risk:** низкий.
- **Security implications:** исполняет код плагинов, поэтому внешние плагины не добавляются без проверки.
- **Decision:** включить сейчас без сторонних плагинов.

### Vitest 4.1.10 и V8 coverage

- **Tool:** Vitest `4.1.10`, `@vitest/coverage-v8` `4.1.10`.
- **Purpose:** unit/integration tests и измерение покрытия.
- **Why needed:** быстрый feedback для чистой TypeScript-логики и API/DB интеграций.
- **Alternative:** Node test runner, Jest.
- **Advantages:** TypeScript/ESM-friendly, быстрый watch/run, совместимый coverage provider.
- **Disadvantages:** добавляет runner-specific config; coverage имеет стоимость по времени.
- **Maintenance risk:** низкий/средний из-за общего Vite toolchain.
- **Security implications:** тесты исполняют код репозитория и dependencies; CI работает без write-токенов и production-секретов.
- **Decision:** включить сейчас; числовые thresholds добавить вместе с реальным кодом.

### @types/node 24.13.3

- **Tool:** `@types/node` `24.13.3`.
- **Purpose:** compile-time типы Node.js APIs и `process.env` для конфигурации, тестов и tooling.
- **Why needed:** TypeScript не поставляет Node runtime declarations, а pre-flight использует `node:fs`, `node:path`, `process` и Node ESM APIs.
- **Alternative:** локальные неполные declarations или отсутствие type checking для Node-specific кода.
- **Advantages:** соответствует выбранной major-линии Node 24 и поддерживает строгий typecheck стандартных API.
- **Disadvantages:** declarations могут немного опережать точный patch runtime и требуют синхронного обновления.
- **Maintenance risk:** низкий; обновлять внутри major после проверки TypeScript/CI.
- **Security implications:** runtime-поведение не меняет; помогает ловить ошибочное использование API, но не валидирует недоверенные данные.
- **Decision:** включить сейчас как development dependency.

### Playwright Test 1.62.1

- **Tool:** `@playwright/test` `1.62.1`.
- **Purpose:** будущие критические браузерные e2e-потоки.
- **Why needed:** приложение интерактивное, включает фильтрацию, воспроизведение, auth и пользовательские действия.
- **Alternative:** Cypress, WebdriverIO, только integration tests.
- **Advantages:** реальные браузеры, tracing, web-first assertions, изоляция контекстов.
- **Disadvantages:** браузерные бинарники и e2e дороже в установке/времени.
- **Maintenance risk:** средний; селекторы и окружение требуют ухода.
- **Security implications:** тестовый браузер не должен получать production credentials; загружаемый контент считается недоверенным.
- **Decision:** конфигурацию и команду включить сейчас, браузеры устанавливать/тесты добавлять при появлении web-приложения.

### fast-check 4.9.0

- **Tool:** `fast-check` `4.9.0`.
- **Purpose:** property-based tests музыкальных преобразований.
- **Why needed:** пространство тональностей, ступеней, обращений и транспозиций слишком велико для набора только примерных тестов.
- **Alternative:** ручные таблицы unit cases.
- **Advantages:** автоматически ищет контрпримеры и минимизирует failing inputs.
- **Disadvantages:** генераторы требуют дисциплины, а ошибки тестов иногда сложнее читать.
- **Maintenance risk:** низкий после стабилизации доменных типов.
- **Security implications:** прямого runtime-влияния нет; генераторы должны иметь ограничения размера/времени.
- **Decision:** выбрать, но добавить только в этапе `packages/music-theory`, не в пустой bootstrap.

### PostgreSQL 18.4 + Docker Compose

- **Tool:** официальный `postgres:18.4-bookworm` и Docker Compose.
- **Purpose:** воспроизводимая локальная relational DB.
- **Why needed:** канонические прогрессии, пользователи, связи, теги, provenance и поиск требуют транзакций и ограничений целостности.
- **Alternative:** SQLite, managed PostgreSQL сразу, document database.
- **Advantages:** зрелые constraints/indexes/transactions, близость local и production модели.
- **Disadvantages:** Docker увеличивает требования к локальной среде.
- **Maintenance risk:** средний; образ и миграции нужно регулярно обновлять и тестировать.
- **Security implications:** только `127.0.0.1`, отдельные development credentials, named volume, никакого production dump; контейнер не является security boundary.
- **Decision:** включить локальный Compose сейчас; ORM и миграционный инструмент выбрать позднее.

### GitHub Actions и Dependabot

- **Tool:** GitHub Actions CI и Dependabot.
- **Purpose:** независимая обязательная проверка и предложения обновлений.
- **Why needed:** одинаковые проверки до merge и регулярное обслуживание зафиксированных зависимостей.
- **Alternative:** другой CI, Renovate, только локальные команды.
- **Advantages:** нативно для будущего GitHub-репозитория, checks для branch rules, обновляет npm/pnpm и action SHAs.
- **Disadvantages:** зависит от GitHub и расходует CI minutes; Dependabot PR всё равно требуют проверки.
- **Maintenance risk:** низкий/средний; action SHA и runtime нужно обновлять.
- **Security implications:** least-privilege token, pinned full SHAs, без секретов для PR из forks; workflow-файлы являются чувствительным кодом.
- **Decision:** включить сейчас; CodeQL/secret scanning настроить после выбора visibility и проверки entitlement.

### Zod 4

- **Tool:** Zod 4 (точная версия выбирается при добавлении API).
- **Purpose:** runtime-валидация env и внешних контрактов.
- **Why needed:** TypeScript не валидирует JSON, query, headers и environment в runtime.
- **Alternative:** Valibot, ArkType, JSON Schema/Ajv, ручные guards.
- **Advantages:** понятная schema-first модель и вывод TypeScript types.
- **Disadvantages:** дополнительная dependency и риск дублирования DB/OpenAPI schemas.
- **Maintenance risk:** средний до выбора контрактной стратегии.
- **Security implications:** корректные limits/refinements уменьшают риск malformed input; schema сама не задаёт rate limits и авторизацию.
- **Decision:** рекомендовать, но не устанавливать до API/env bootstrap.

### Knip

- **Tool:** Knip (версия выбирается при появлении workspace entry points).
- **Purpose:** поиск неиспользуемых файлов, exports и dependencies.
- **Why needed:** полезен после разрастания монорепозитория.
- **Alternative:** ESLint/TypeScript и ручной аудит.
- **Advantages:** уменьшает мёртвый код и лишнюю supply-chain поверхность.
- **Disadvantages:** без реальных entry points даёт ложные срабатывания и требует конфигурации.
- **Maintenance risk:** средний в монорепозитории с generators/config conventions.
- **Security implications:** удаление неиспользуемых зависимостей сокращает поверхность атаки; инструмент исполняется только локально/в CI.
- **Decision:** отложить до первого полноценного workspace.

## Rejected tools

- **TypeScript 7 сейчас:** отклонён до официального расширения поддерживаемого диапазона `typescript-eslint`; переход будет отдельным проверяемым изменением.
- **Biome/Oxlint вместо ESLint + Prettier:** не дают достаточной выгоды для baseline при необходимости type-aware linting; повторно оценить только при измеримой проблеме скорости.
- **npm/Yarn/Bun:** не выбраны, потому что pnpm лучше соответствует workspace и строгому управлению зависимостями; это не запрет на пересмотр при несовместимости deployment platform.
- **Nx/Turborepo:** преждевременное кэширование и orchestration; pnpm recursive/filter commands достаточно до появления измеримых узких мест.
- **Git hooks/Husky/lint-staged:** локальные hooks легко обходятся и добавляют install-time scripts; единая команда и CI достаточны на старте.
- **Автоматический AI-review:** не заменяет тесты и человеческое review, может раскрывать код внешнему сервису; возможен позднее только с понятной privacy model.
- **CodeQL в baseline:** полезен, но доступность для private repository зависит от GitHub Code Security entitlement; решение после создания remote.
- **Filesystem, Playwright, PostgreSQL и Context7 MCP:** дублируют текущие возможности или дают лишнюю поверхность доступа без устойчивого workflow.
- **Устаревший `@modelcontextprotocol/server-postgres`:** архивирован; не использовать.
- **Микросервисы, CQRS, event bus/Kafka:** не соответствуют текущему масштабу и усложнят транзакции, тестирование и сопровождение.

## Risks

1. **Несовпадение локального Node:** установлен 22.20.0, выбран 24.18.1. До production-разработки нужна установка/активация Node 24; окончательная CI-проверка выполняется на выбранной версии.
2. **Docker permissions:** текущая команда Docker сообщала об отказе доступа к пользовательскому `config.json`; Compose может потребовать исправления локальных прав, не изменения репозитория.
3. **Переход TypeScript 7:** экосистема быстро меняется; зафиксированный TS6 безопаснее сейчас, но потребует планового пересмотра.
4. **Supply-chain freshness:** точные версии и lockfile улучшают воспроизводимость, но требуют Dependabot и регулярного ручного review changelog/security advisories.
5. **Неопределённый auth:** пользователи заложены архитектурно, но провайдер не выбран. Слишком ранний выбор может связать backend с неподходящей deployment model.
6. **Музыкальные неоднозначности:** enharmonic spelling, borrowed chords, secondary dominants и slash chords требуют явных доменных инвариантов до импорта данных.
7. **Лицензии данных:** технически доступный dataset нельзя импортировать без provenance, лицензии и права распространения.
8. **GitHub visibility:** до выбора public/private нельзя окончательно решить настройки CodeQL, secret scanning и branch rules; публикация может раскрыть исходную спецификацию.
9. **Пустые test suites:** временный `passWithNoTests` допустим только на pre-flight; он должен исчезать по мере появления слоёв.
10. **Переусложнение:** ранние ORM, audio, auth и UI решения намеренно отложены; их нельзя незаметно принимать внутри другой задачи.

## Final proposed setup

Создать до production-кода:

- pnpm workspace с каталогами `apps/web`, `apps/api`, `packages/music-theory`, `packages/database`, `packages/shared`, `packages/ui`, `scripts/importers`;
- root/nested `AGENTS.md`, архитектурные документы, ADR, `DEVELOPMENT.md` и `PROJECT_STATE.md`;
- Node `24.18.1`, pnpm `11.21.0`, TypeScript `6.0.3`, строгий TSConfig;
- ESLint/type-aware rules, Prettier, Vitest/V8 coverage и Playwright configuration;
- содержательный pre-flight test структуры;
- централизованный typed environment boundary и fail-fast проверку `.env.example`;
- локальный PostgreSQL `18.4` Compose;
- безопасные `.gitignore`, `.env.example`, editor/git attributes;
- GitHub CI с pinned actions, least permissions, frozen install, `pnpm verify` и high-severity audit;
- Dependabot для npm/pnpm и GitHub Actions;
- локальный Git-репозиторий с веткой `main` и bootstrap commit после успешной проверки.

Не создавать сейчас:

- production/domain/application code;
- `.codex/config.toml`, собственные Skills и MCP-серверы;
- ORM/schema/migrations, auth provider, Tone.js/audio engine или MIDI implementation;
- Nx/Turborepo, hooks, CodeQL workflow и автоматический AI-review.

После успешного pre-flight и отдельного выбора видимости создать GitHub-репозиторий, подключить `origin`, отправить `main`, затем включить доступные branch/security settings.

## Sources

- [Codex best practices](https://learn.chatgpt.com/guides/best-practices)
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex Skills](https://learn.chatgpt.com/docs/build-skills)
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp)
- [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)
- [MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
- [pnpm settings](https://pnpm.io/settings)
- [TypeScript strict](https://www.typescriptlang.org/tsconfig/strict)
- [typescript-eslint typed linting](https://typescript-eslint.io/getting-started/typed-linting/)
- [typescript-eslint supported dependency versions](https://typescript-eslint.io/users/dependency-versions/)
- [ESLint configuration files](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Prettier installation and CI version pinning](https://prettier.io/docs/install.html)
- [Vitest coverage](https://vitest.dev/guide/coverage.html)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/)
- [Official PostgreSQL Docker image](https://hub.docker.com/_/postgres)
- [GitHub Actions security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Dependabot configuration](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
