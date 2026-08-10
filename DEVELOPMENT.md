# Разработка

Этот документ описывает воспроизводимый pre-flight baseline. Прикладные workspace-пакеты, серверы, схема БД, migrations, seed и dataset import пока не реализованы. Команды ниже соответствуют текущему `package.json`; когда появляется новый слой, его команды и этот документ обновляются в одном изменении.

## Требования

- Git.
- Node.js ровно `24.18.1`, зафиксированный в `.node-version` и `package.json`.
- pnpm ровно `11.21.0`, зафиксированный в `packageManager`.
- Docker Engine/Desktop с Docker Compose v2 — только для локального PostgreSQL.

Проверьте активные версии:

```bash
node --version
pnpm --version
docker --version
docker compose version
```

Ожидаются `v24.18.1` и `11.21.0`. Если Node отличается, сначала переключите его через используемый вами version manager. При поставляемом с Node Corepack pnpm можно активировать так:

```bash
corepack enable
pnpm --version
```

## Установка

Из корня существующего clone:

```bash
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` является частью репозитория. На чистом clone не обходите frozen-lockfile. После намеренного изменения dependency manifests обновите lockfile обычным `pnpm install`, проверьте diff и закоммитьте manifest и lockfile вместе.

## Настройка окружения

В `.env.example` находятся только безопасные локальные значения. Создайте игнорируемый `.env`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash/zsh:

```bash
cp .env.example .env
```

Не добавляйте `.env` в Git. Значения по умолчанию предназначены только для loopback local development; не используйте их при deployment. Проверьте локальную конфигурацию:

```bash
pnpm env:check
```

Typed boundary находится в `config/environment.ts`, централизует единственное чтение `process.env` и не выводит значения секретов в diagnostics. Будущие приложения обязаны вызывать `loadEnvironment()` при старте и расширять схему вместе с новыми переменными. CI отдельно проверяет committed `.env.example` через `pnpm env:check:example`.

## Локальная база данных

Запустите PostgreSQL `18.4` и дождитесь healthcheck:

```bash
pnpm db:up
```

Проверьте состояние или прочитайте логи:

```bash
docker compose ps postgres
docker compose logs postgres
```

Остановите контейнер, сохранив named volume:

```bash
pnpm db:down
```

Compose публикует PostgreSQL только на `127.0.0.1` и использует значения из `.env` либо безопасные local defaults. Команды автоматического удаления volume/reset намеренно нет: удаление локальных данных должно быть отдельным осознанным действием.

## Development server

Запуск всех реализованных workspace `dev` scripts:

```bash
pnpm dev
```

На pre-flight в workspaces ещё нет application `dev` scripts, поэтому команда корректно завершается, не запуская сервер. Она начнёт запускать приложения после добавления их собственных scripts; тогда здесь должны появиться адреса, зависимости и порядок запуска.

## Тестирование

Текущие unit/bootstrap и integration suites:

```bash
pnpm test
```

Отдельные режимы:

```bash
pnpm test:unit
pnpm test:watch
pnpm test:coverage
pnpm test:integration
pnpm test:e2e
```

До появления соответствующих слоёв integration и E2E разрешают отсутствие тестов. Это временное свойство bootstrap: новый production behavior должен добавлять тесты в том же изменении. В CI Chromium устанавливается автоматически. Локально после появления первого браузерного теста установите его так:

```bash
pnpm exec playwright install chromium
```

## Форматирование и lint

Проверка форматирования без записи:

```bash
pnpm format:check
```

Применение форматтера:

```bash
pnpm format
```

Lint без допустимых warnings:

```bash
pnpm lint
```

## Type checking

```bash
pnpm typecheck
```

TypeScript работает в strict-режиме. Внешние данные всё равно требуют runtime validation на границе соответствующего приложения.

## Сборка

```bash
pnpm build
```

На pre-flight это проверяет project references/TypeScript scaffold; готового web/API artifact ещё нет. Когда появятся приложения, их реальные production builds должны войти в эту root-команду.

## Общие quality gates

Быстрая проверка format, lint, types и unit tests:

```bash
pnpm check
```

Полная локальная проверка, включая integration, build и E2E:

```bash
pnpm verify
```

Перед передачей завершённой задачи запускайте `pnpm verify` и просматривайте собственный diff. Если проверка не могла выполниться из-за окружения, явно укажите это в результате.

## Database migrations

**Ещё не реализованы.** ORM и migration framework намеренно не выбраны на pre-flight; schema и migration directories отсутствуют. Поэтому в проекте нет migration generate/apply/rollback команды. Не запускайте случайные Prisma или SQL-команды и не создавайте ручную «начальную миграцию» до отдельного ADR и реализации database package.

Когда workflow появится, он должен включать review сгенерированного SQL, проверку на disposable local PostgreSQL и документированный production-safe порядок. Применённые migration files не переписываются.

## Seed database

**Ещё не реализован.** Seed command и канонический seed dataset отсутствуют. Не заполняйте основной seed вручную случайными SQL/JSON-файлами. Будущие seed records должны хранить Roman Numerals/canonical identity, mode и необходимые tags и проходить ту же domain validation, что и приложение.

## Importer execution

**Ещё не реализовано.** В `scripts/importers` сейчас находятся только инструкции; executable import command отсутствует. Не скачивайте и не импортируйте ChoCo, OpenEWLD или другой dataset без проверки лицензии и provenance.

Первый importer должен добавить вместе: версионированный parser, runtime validation, dry-run, идемпотентность, bounded processing, provenance, summary logs, fixtures/tests и точную команду запуска. Production credentials для разработки importer запрещены.

## Troubleshooting

### Ошибка версии Node или pnpm

```bash
node --version
pnpm --version
```

Активируйте Node `24.18.1`, затем снова выполните `corepack enable` и установку. `engineStrict` намеренно отклоняет другие версии вместо создания невоспроизводимого lockfile.

### Frozen lockfile не совпадает

На чистом clone сначала убедитесь, что checkout полный и manifests не изменены:

```bash
git status --short
pnpm install --frozen-lockfile
```

Не удаляйте lockfile. Обычный `pnpm install` применяйте только если вы намеренно меняете dependencies.

### PostgreSQL не запускается

```bash
docker compose ps postgres
docker compose logs postgres
```

Убедитесь, что Docker daemon запущен. Если локальный порт `5432` занят, измените только `POSTGRES_PORT` в `.env` и повторите `pnpm db:up`; согласуйте `DATABASE_URL` с тем же портом.

### `pnpm dev` ничего не запускает

Это ожидаемо до появления application workspace с собственным `dev` script. Не добавляйте фиктивный сервер только ради удержания процесса.

### Проверка форматирования не проходит

```bash
pnpm format
pnpm verify
```

Перед завершением убедитесь, что форматтер не переписал несвязанные файлы.
