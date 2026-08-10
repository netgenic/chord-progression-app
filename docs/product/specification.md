# 0. ОБЯЗАТЕЛЬНЫЙ PRE-FLIGHT ЭТАП: подготовка проекта к LLM-assisted development

До начала реализации приложения НЕ писать production-код.

Первой задачей необходимо провести актуальное исследование best practices разработки программных проектов с использованием coding agents / LLM, ориентируясь в первую очередь на Codex и актуальный на момент начала разработки ecosystem.

Цель этапа — сначала построить надёжную среду, правила и workflow для дальнейшей разработки агентом, и только затем приступать к реализации проекта.

Этот этап является обязательным.

---

## 0.1. Research before implementation

Перед созданием структуры приложения провести исследование актуальных на текущую дату рекомендаций по:

* OpenAI Codex;
* Codex CLI / Codex app;
* AGENTS.md;
* Agent Skills;
* MCP;
* repository-level instructions;
* context management;
* LLM-friendly repository architecture;
* agentic development workflows;
* planning methodologies;
* automated testing для coding agents;
* linting;
* formatting;
* static analysis;
* type checking;
* security scanning;
* dependency auditing;
* git workflow;
* CI;
* code review;
* documentation management;
* architectural decision records;
* management of long-running LLM development projects.

При исследовании отдавать приоритет:

1. официальной документации OpenAI;
2. официальной спецификации MCP;
3. официальной документации используемых инструментов;
4. первичным источникам;
5. только после этого — признанным community best practices.

Не основывать архитектуру на случайных blog posts, SEO-статьях или устаревших tutorials.

Проверять дату документации и актуальность рекомендаций.

---

# 0.2. Сначала подготовить Pre-flight Report

До каких-либо существенных изменений repository создать:

```text
/docs/llm-development/preflight.md
```

В документе описать результаты исследования.

Обязательные разделы:

```text
Current tooling recommendations
Codex configuration
Repository instructions strategy
Context management strategy
Agent Skills
MCP strategy
Development methodology
Testing strategy
Validation strategy
Security strategy
Git strategy
CI strategy
Documentation strategy
Architecture decision process
Recommended tools
Rejected tools
Risks
Final proposed setup
```

Для каждого предлагаемого инструмента указать:

```text
Tool
Purpose
Why needed
Alternative
Advantages
Disadvantages
Maintenance risk
Security implications
Decision
```

Не устанавливать инструмент только потому, что он популярен среди LLM-разработчиков.

Каждый инструмент должен решать конкретную проблему проекта.

---

# 0.3. Проверить актуальную конфигурацию Codex

Изучить актуальную документацию Codex и определить оптимальную конфигурацию проекта.

Проверить необходимость и затем создать/настроить соответствующие Codex configuration files.

В частности исследовать:

```text
AGENTS.md
.codex/
config.toml
Agent Skills
MCP configuration
```

Использовать только реально поддерживаемые текущей версией Codex механизмы.

Не предполагать наличие feature на основании старой документации.

---

# 0.4. Создать root AGENTS.md

После исследования создать в корне repository:

```text
/AGENTS.md
```

Этот файл должен быть кратким, конкретным и ориентированным на действия агента.

Не превращать его в огромную документацию проекта.

AGENTS.md должен как минимум содержать:

### Project purpose

Краткое описание Chord Progression Library.

### Architecture

Основные packages и границы ответственности.

### Critical architecture rules

Например:

```text
Music theory logic MUST live in packages/music-theory.

Music theory package MUST NOT depend on React.

Music theory package MUST NOT depend on Fastify.

UI MUST NOT implement music theory calculations.

API MUST NOT duplicate music theory logic.

Canonical progression is the primary harmonic representation.

Absolute chord names are representations of canonical progressions,
not independent progression entities.
```

### Commands

Точные команды:

```text
install
dev
build
test
test:unit
test:e2e
lint
typecheck
format
```

### Definition of Done

Задача не считается законченной, пока:

```text
build passes
typecheck passes
lint passes
tests pass
new behavior is tested
documentation is updated when required
no unrelated files are modified
```

### Coding rules

Основные проектные соглашения.

### Testing rules

Когда обязательны unit/integration/e2e tests.

### Dependency rules

Когда агент может добавлять dependency.

### Database rules

Как работать с schema и migrations.

### Security rules

Запрет на commit secrets.

### Documentation rules

Какие архитектурные изменения требуют ADR.

---

# 0.5. Использовать hierarchical AGENTS.md

Исследовать актуальную поддержку nested AGENTS.md в Codex.

Если механизм поддерживается текущей версией, использовать его для локальных правил.

Предварительно предполагаемая структура:

```text
/AGENTS.md

/apps/web/AGENTS.md
/apps/api/AGENTS.md

/packages/music-theory/AGENTS.md

/scripts/importers/AGENTS.md
```

Root AGENTS.md содержит общие правила.

Nested AGENTS.md должны содержать только domain-specific instructions.

Например:

```text
/packages/music-theory/AGENTS.md
```

должен особенно строго определять:

* mathematical correctness;
* enharmonic handling;
* interval representation;
* chord identity;
* inversion handling;
* key detection;
* Roman numeral representation;
* canonicalization;
* required unit tests;
* prohibition against UI/backend dependencies.

---

# 0.6. Создать Architecture Documentation

Создать:

```text
/docs/architecture/
```

Минимум:

```text
overview.md
domain-model.md
music-theory-model.md
database.md
frontend.md
backend.md
audio.md
midi.md
import-pipeline.md
```

Документация должна объяснять архитектуру агенту без необходимости заново анализировать весь repository.

Избегать дублирования README.

---

# 0.7. Architecture Decision Records

Добавить:

```text
/docs/adr/
```

Использовать лёгкий ADR format.

Например:

```text
0001-monorepo.md
0002-canonical-progression-model.md
0003-music-theory-package-boundary.md
0004-postgresql.md
0005-tonejs-audio-engine.md
```

ADR должен содержать:

```text
Status
Context
Decision
Alternatives
Consequences
```

Создавать ADR только для архитектурно значимых решений.

Не создавать ADR для тривиальных implementation details.

---

# 0.8. Создать PROJECT_STATE.md

Создать:

```text
/PROJECT_STATE.md
```

Это компактный файл состояния проекта для coding agents.

Он должен содержать:

```text
Current phase
Completed
In progress
Next
Known issues
Major architecture decisions
Current limitations
```

Файл должен оставаться коротким.

Не превращать его в changelog.

Codex должен обновлять его после завершения существенного этапа проекта.

---

# 0.9. Создать DEVELOPMENT.md

Создать:

```text
/DEVELOPMENT.md
```

Он должен содержать точные инструкции:

```text
Requirements
Installation
Environment setup
Database setup
Development server
Testing
Linting
Type checking
Building
Database migrations
Seed database
Importer execution
Troubleshooting
```

Все команды должны быть copy-paste executable.

---

# 0.10. Создать task methodology

До начала реализации выбрать и документировать methodology работы coding agent.

Предпочтительная модель:

```text
Understand
↓
Inspect
↓
Plan
↓
Implement
↓
Test
↓
Review
↓
Document
```

Для нетривиальной задачи Codex должен сначала определить:

```text
Goal
Affected modules
Constraints
Risks
Tests required
```

После этого выполнять изменения.

Не писать большой объём кода до понимания существующей архитектуры.

---

# 0.11. Small vertical tasks

Разработка должна идти небольшими проверяемыми изменениями.

Избегать задач вида:

```text
Implement entire backend
```

Предпочитать:

```text
Implement Note representation
Implement Interval representation
Add tests
Implement chord parser
Add tests
Implement transposition
Add tests
```

Каждый этап должен оставлять repository в рабочем состоянии.

---

# 0.12. Запрет speculative implementation

Codex не должен реализовывать functionality:

```text
because we may need it later
```

YAGNI является базовым принципом проекта.

Не создавать:

* unnecessary abstraction layers;
* generic repository frameworks;
* plugin systems;
* event buses;
* microservices;
* excessive factories;
* speculative interfaces.

Если abstraction не нужна текущим requirements, её не создавать.

---

# 0.13. Dependency policy

Перед добавлением новой dependency:

1. определить, действительно ли она нужна;
2. проверить её актуальность;
3. проверить license;
4. проверить maintenance status;
5. проверить security history;
6. проверить bundle/runtime impact;
7. определить, нельзя ли решить задачу средствами уже установленного stack.

Не писать собственную реализацию сложной стандартной задачи, если существует хорошо поддерживаемая специализированная библиотека.

Одновременно не добавлять огромную dependency для тривиальной функции.

---

# 0.14. Agent Skills analysis

Исследовать актуальный механизм Codex Agent Skills.

Определить, нужны ли проекту специализированные reusable skills.

Возможные кандидаты:

```text
music-theory-validation
database-migration
dataset-import
frontend-validation
release-check
```

Создавать skill только если:

* workflow повторяется;
* требует специфических инструкций;
* имеет чёткие входы/выходы;
* реально уменьшает ошибки агента.

Не создавать Skills ради наличия Skills.

Если принято решение создать skills — документировать их назначение.

---

# 0.15. MCP analysis

Исследовать актуальные MCP servers, которые могут существенно повысить качество разработки.

Не подключать MCP автоматически.

Сначала составить список кандидатов.

Исследовать как минимум категории:

```text
official documentation access
GitHub
PostgreSQL
browser automation
filesystem
package/documentation lookup
issue tracking
```

Для каждого определить:

```text
What problem does it solve?
Does Codex already have equivalent functionality?
Is it actively maintained?
Who publishes it?
What permissions does it require?
Can it modify external systems?
Can it access secrets?
Is read-only mode available?
Is it actually needed?
```

---

# 0.16. MCP minimal-permission principle

Подключать только необходимые MCP servers.

Использовать принцип минимальных полномочий.

Предпочитать:

```text
read-only
```

если write access не требуется.

Особенно осторожно относиться к MCP, имеющим доступ к:

```text
filesystem
shell
GitHub
database
cloud infrastructure
credentials
production systems
```

Не передавать MCP production credentials.

Не разрешать агенту автоматическую работу с production database.

---

# 0.17. Documentation MCP

Исследовать наличие подходящего MCP для получения актуальной документации используемых libraries.

Цель:

при работе, например, с:

```text
Tone.js
Fastify
Prisma
React
Vite
Vitest
Playwright
```

агент должен иметь возможность сверяться с актуальной документацией, а не полагаться исключительно на training knowledge.

Если найден зрелый и безопасный documentation MCP — предложить его использование.

Если нет — использовать web/documentation lookup другим способом.

---

# 0.18. GitHub integration

Если repository размещён на GitHub, исследовать необходимость GitHub MCP / GitHub integration.

Желательные возможности:

```text
read issues
read PRs
inspect CI
inspect repository
```

Write access включать только если он действительно нужен.

Не разрешать автоматический merge в main.

---

# 0.19. Browser automation

Так как приложение имеет значительный UI component, предусмотреть browser automation для проверки интерфейса.

Использовать Playwright.

Исследовать возможность предоставления Codex browser tooling / MCP для:

```text
open local application
interact with UI
inspect errors
test MIDI fallback UI
test filters
test progression playback controls
test responsive behavior
```

Не полагаться только на unit tests для frontend.

---

# 0.20. Database access

Для development database можно рассмотреть MCP/tooling, позволяющее агенту:

```text
inspect schema
run read queries
inspect migrations
inspect seed data
```

Предпочтительно использовать отдельную disposable development database.

Запретить доступ к production database.

---

# 0.21. Context management strategy

Создать стратегию управления LLM context.

Не рассчитывать на то, что агент всегда будет помнить предыдущие conversation turns.

Source of truth должен находиться в repository.

Использовать:

```text
AGENTS.md
PROJECT_STATE.md
DEVELOPMENT.md
/docs/architecture/
/docs/adr/
tests
types
database schema
```

Conversation history не является source of truth.

---

# 0.22. Documentation hierarchy

Определить источники истины:

```text
Requirements:
docs/product/

Architecture:
docs/architecture/

Architecture decisions:
docs/adr/

Current progress:
PROJECT_STATE.md

Agent instructions:
AGENTS.md

Developer commands:
DEVELOPMENT.md

Executable behavior:
tests + source code

Database model:
schema + migrations
```

При противоречиях Codex должен явно сообщить о них, а не самостоятельно угадывать намерение.

---

# 0.23. Product specification

Исходное ТЗ этого документа сохранить в repository.

Например:

```text
/docs/product/specification.md
```

Не позволять requirements существовать только внутри исходного prompt.

---

# 0.24. Testing pyramid

До реализации определить test strategy.

Для этого проекта основной объём tests должен приходиться на:

```text
music theory unit tests
```

поскольку это наиболее детерминированная и критически важная часть системы.

Далее:

```text
API integration tests
database integration tests
frontend component tests
Playwright E2E tests
```

Не пытаться покрывать E2E каждым edge case, который дешевле проверить unit test.

---

# 0.25. Property-based testing

Исследовать применение property-based testing для music theory engine.

Это особенно желательно для операций:

```text
transposition
canonicalization
Roman numeral conversion
interval arithmetic
enharmonic normalization
```

Примеры invariants:

```text
transpose(+n) then transpose(-n)
returns equivalent chord
```

```text
canonical progression hash
must not change when progression is transposed
```

```text
Roman → absolute → Roman
must preserve harmonic identity
```

Если подходящая mature TypeScript library существует — рассмотреть её использование.

---

# 0.26. Golden tests

Для сложных музыкальных случаев создать curated dataset:

```text
/packages/music-theory/test-fixtures/
```

Содержать проверенные вручную случаи:

```text
major
minor
harmonic minor
secondary dominants
borrowed chords
inversions
enharmonic spellings
chromatic chords
extended chords
ambiguous keys
```

Эти fixtures должны защищать theory engine от regression.

---

# 0.27. Linting / formatting / type checking

Перед первой feature установить обязательные quality gates.

Исследовать актуальные инструменты и выбрать минимальный набор.

Необходимы:

```text
formatter
linter
TypeScript strict mode
unused-code detection where practical
```

Все должны запускаться одной общей командой CI.

Например:

```text
pnpm check
```

которая выполняет:

```text
format check
lint
typecheck
tests
```

---

# 0.28. TypeScript strictness

Включить строгий TypeScript configuration.

Не использовать:

```text
any
```

без явно обоснованной причины.

Предпочитать:

```text
unknown
```

с validation.

Внешние данные валидировать runtime schema.

---

# 0.29. Runtime validation

Все данные, приходящие через:

```text
API
dataset imports
MIDI-related serialization
database boundaries where appropriate
environment variables
external services
```

должны проходить runtime validation.

Использовать выбранный validation layer последовательно.

---

# 0.30. Security baseline

Перед разработкой определить security baseline.

Как минимум:

* secrets только через environment variables;
* `.env` в `.gitignore`;
* `.env.example` без реальных credentials;
* dependency audit;
* input validation;
* authorization checks;
* rate limiting для public write endpoints;
* safe error responses;
* no raw SQL from user input;
* no secrets in logs;
* secure cookies/tokens;
* CORS configuration;
* CSRF strategy если применимо;
* content limits;
* protection from tag spam;
* protection from malformed MIDI/client payloads.

---

# 0.31. Dependency security

Настроить автоматическую проверку dependencies.

Исследовать актуальный recommended tooling package ecosystem / GitHub.

Security issue не должен автоматически исправляться случайным major upgrade без проверки compatibility.

---

# 0.32. CI

Создать CI до активной feature development.

Минимальный pipeline:

```text
install
↓
format check
↓
lint
↓
typecheck
↓
unit tests
↓
integration tests
↓
build
```

E2E можно запускать отдельным job.

Pull request с красным CI не считается завершённым.

---

# 0.33. Git workflow

По умолчанию использовать:

```text
main
feature branches
pull requests
```

Не работать крупными изменениями непосредственно в main.

Commits должны быть небольшими и тематическими.

Не смешивать:

```text
feature
refactor
formatting
dependency upgrade
```

без необходимости в одном изменении.

---

# 0.34. Diff discipline

Перед завершением каждой задачи Codex обязан посмотреть собственный diff.

Проверить:

```text
Were unrelated files modified?
Was generated garbage committed?
Were debug logs left behind?
Were tests accidentally removed?
Did formatting rewrite unrelated code?
Were secrets added?
```

---

# 0.35. Definition of Done automation

По возможности создать команду:

```text
pnpm verify
```

которая выполняет все локальные проверки, необходимые перед завершением задачи.

Codex обязан запускать её перед объявлением задачи завершённой.

Если команда не проходит, задача не завершена.

---

# 0.36. Hooks

Исследовать необходимость git hooks.

Не создавать чрезмерно медленные pre-commit hooks.

Предпочтительное разделение:

```text
pre-commit:
fast checks

CI:
full validation
```

Если hooks не дают существенной пользы — не добавлять их.

---

# 0.37. Automated code review

Исследовать актуальные возможности automated/AI code review.

AI review считать дополнительным уровнем проверки.

Он НЕ заменяет:

```text
tests
type checking
linting
human architectural review
```

Не принимать AI-generated review comments автоматически без проверки.

---

# 0.38. Observability during development

Ошибки должны быть диагностируемыми.

API должен иметь структурированные logs.

Frontend должен предоставлять понятные development errors.

Dataset importer должен логировать:

```text
source
processed
accepted
rejected
duplicates
errors
```

Не логировать sensitive information.

---

# 0.39. Dataset provenance

Поскольку проект импортирует внешние музыкальные datasets, архитектура должна хранить provenance.

Для каждого импортированного объекта должно быть возможно определить:

```text
dataset
dataset version
source identifier
import date
parser version
license/provenance metadata
```

Нельзя терять происхождение данных после canonicalization.

---

# 0.40. Reproducible import pipeline

Dataset import должен быть воспроизводимым.

Не делать основной seed database вручную из случайных промежуточных файлов.

Хранить:

```text
import scripts
normalization rules
dataset metadata
version information
```

Импорт должен по возможности быть idempotent.

---

# 0.41. Development environment reproducibility

Определить версии:

```text
Node
pnpm
PostgreSQL
```

Зафиксировать их подходящими средствами.

Dependency lockfile обязателен.

Новый разработчик или coding agent должен иметь возможность поднять проект только по repository documentation.

---

# 0.42. Docker decision

Проанализировать, нужен ли Docker.

Не использовать Docker автоматически.

Возможный разумный вариант:

```text
application runs locally
PostgreSQL runs through Docker Compose
```

Но окончательное решение принять после анализа developer experience.

---

# 0.43. Environment validation

Создать typed environment configuration.

Приложение должно fail fast при отсутствии обязательных environment variables.

Не обращаться напрямую к:

```text
process.env
```

по всему codebase.

Использовать централизованный validated config.

---

# 0.44. Package boundaries

Monorepo должен иметь чёткие dependency boundaries.

Предварительная модель:

```text
apps/web
        ↓
packages/shared
packages/music-theory

apps/api
        ↓
packages/shared
packages/music-theory
packages/database
```

Запрещён dependency:

```text
packages/music-theory
        ↓
apps/*
```

или:

```text
packages/music-theory
        ↓
React
Fastify
Prisma
Tone.js
```

---

# 0.45. No duplicated domain logic

Критически важное правило для LLM:

если нужная domain function уже существует — переиспользовать её.

Не создавать:

```text
transposeChord()
transposeChordName()
transposeHarmony()
shiftChord()
```

в разных packages для одной и той же операции.

Перед созданием новой utility искать существующую реализацию.

---

# 0.46. Refactoring rule

Не проводить крупный refactor одновременно с feature implementation, если это не требуется для задачи.

Если архитектурный refactor действительно нужен:

1. объяснить причину;
2. определить scope;
3. сохранить behavior тестами;
4. сделать refactor;
5. затем реализовать feature.

---

# 0.47. No silent requirement changes

Codex не должен самостоятельно менять product requirements ради удобства реализации.

Если возникает противоречие:

```text
specification
architecture
existing implementation
```

зафиксировать проблему.

При возможности выбрать решение, максимально сохраняющее исходные requirements.

Крупные изменения требований оформить отдельно.

---

# 0.48. Code comments policy

Не писать комментарии, пересказывающие код.

Плохой пример:

```ts
// Increment index
index++;
```

Комментарии использовать для:

```text
why
mathematical reasoning
music theory assumptions
non-obvious limitations
external specification behavior
```

---

# 0.49. LLM-generated code must be explainable

Не принимать сложную реализацию, которую агент не может объяснить.

Особенно для:

```text
key detection
canonicalization
similarity scoring
technical tag generation
dataset normalization
```

Для этих компонентов документация должна объяснять алгоритм и ограничения.

---

# 0.50. Establish complexity budget

Проект является pet project / focused web application.

Предпочитать boring technology.

Не использовать:

```text
microservices
Kubernetes
Kafka
CQRS
event sourcing
distributed architecture
multiple databases
```

без реальной необходимости.

Оптимизировать архитектуру для:

```text
correctness
maintainability
LLM comprehensibility
developer velocity
testability
```

а не для гипотетических миллионов пользователей.

---

# 0.51. Выполнить setup

После завершения research Codex должен не только написать рекомендации, но и применить одобренный им minimal setup.

Создать необходимые:

```text
AGENTS.md
nested AGENTS.md where justified
DEVELOPMENT.md
PROJECT_STATE.md

/docs/product/
/docs/architecture/
/docs/adr/
/docs/llm-development/

CI configuration
formatter configuration
lint configuration
TypeScript configuration
test configuration
environment validation
```

Настроить выбранные Codex capabilities.

Настроить оправданные MCP servers.

Создать Skills, только если research показал их необходимость.

---

# 0.52. Проверить setup

После установки выполнить validation.

Проверить:

```text
repository instructions are detected
build command works
test command works
lint command works
typecheck works
CI configuration is valid
MCP connections work
agent can access required documentation
agent cannot access unnecessary sensitive resources
```

---

# 0.53. Bootstrap commit

Подготовительный этап должен быть логически отделён от feature development.

Идеально:

```text
Commit 1:
chore: bootstrap llm development environment
```

До этого момента application domain implementation практически отсутствует.

---

# 0.54. Pre-flight completion report

После выполнения этапа Codex должен вывести отчёт:

```text
Research performed
Sources consulted
Tools evaluated
Tools selected
Tools rejected
MCP servers selected
MCP servers rejected
Codex configuration
AGENTS.md hierarchy
Skills created
Quality gates
CI setup
Security decisions
Repository structure
Development methodology
Remaining uncertainties
```

Также перечислить все установленные dependencies и объяснить назначение каждой development dependency.

---

# 0.55. STOP CONDITION

После завершения Pre-flight этапа проверить его целостность.

Production development можно начинать только если:

```text
Codex instructions exist
architecture documentation skeleton exists
development commands are documented
tests can run
lint can run
typecheck can run
CI exists
security baseline exists
context strategy exists
MCP strategy is documented
project specification is stored in repository
```

Только после этого переходить к:

# 1. Цель проекта

и далее выполнять основное техническое задание.

---

# 0.56. Важный принцип

Этот этап не должен превращаться в бесконечный "AI engineering framework".

Цель — сделать дальнейшую работу Codex:

```text
predictable
testable
repeatable
context-aware
safe
maintainable
```

а не окружить небольшой проект десятками агентов, MCP servers и configuration layers.

Если инструмент или методология не дают очевидной практической пользы этому конкретному проекту — не использовать их.

После исследования выбрать минимальный достаточный набор инструментов и немедленно переходить к разработке.

# Техническое задание: Chord Progression Library

## 1. Цель проекта

Создать web-приложение — библиотеку аккордовых последовательностей с возможностью:

* искать и фильтровать прогрессии;
* транспонировать их в любую тональность;
* воспроизводить прямо в браузере через piano sound;
* отображать аккорды и Roman Numerals;
* добавлять собственные прогрессии вручную или через MIDI-клавиатуру;
* автоматически назначать технические и характерные теги;
* позволять пользователям добавлять собственные community tags;
* импортировать и нормализовать прогрессии из открытых музыкальных датасетов.

Основная сущность приложения — не конкретная последовательность вроде:

`Em → C → G → D`

а абстрактная гармоническая структура:

`i → VI → III → VII`

Конкретная тональность должна быть параметром отображения и воспроизведения.

---

# 2. Основная концепция данных

Прогрессия должна храниться в каноническом, транспонируемом виде.

Пример:

Исходный ввод:

`Em → C → Am → B7`

Определённая тональность:

`E minor`

Каноническое представление:

`i → VI → iv → V7`

При выборе тональности `C minor` приложение должно автоматически получить:

`Cm → Ab → Fm → G7`

---

# 3. Типы тегов

Система должна поддерживать три категории тегов.

## 3.1 Technical tags

Назначаются автоматически на основании анализа гармонии.

Примеры:

* major
* minor
* 3-chord
* 4-chord
* 5-chord
* diatonic
* non-diatonic
* borrowed-chord
* modal-interchange
* secondary-dominant
* dominant-resolution
* contains-maj7
* contains-min7
* contains-dom7
* contains-add9
* contains-sus
* chromatic
* descending-bass
* ascending-bass
* pedal-tone
* circle-of-fifths
* loopable
* strong-cadence

Technical tags пользователь изменять не может.

---

## 3.2 Character / mood tags

Назначаются самой системой.

Примеры:

* cinematic
* dark
* melancholic
* uplifting
* tense
* dramatic
* dreamy
* romantic
* mysterious
* epic
* aggressive
* warm
* sad
* hopeful
* ominous

Для них желательно хранить не просто boolean, а confidence score:

```text
cinematic: 0.87
dark: 0.76
melancholic: 0.64
```

В первой версии допускается простая rule-based система.

Machine Learning/LLM-классификация не требуется для MVP.

---

## 3.3 Community tags

Добавляются пользователями.

Примеры:

* Bond
* Radiohead
* Muse
* final boss
* spy movie
* chorus
* villain
* 2000s rock
* sounds expensive

Community tags должны поддерживать autocomplete по уже существующим тегам.

Не создавать новый тег, если пользователь выбрал существующий.

---

# 4. Основной UI

Главная страница представляет собой каталог прогрессий.

Каждая карточка должна показывать:

```text
i → VI → III → VII

Em → C → G → D

▶ Play

Technical
minor · 4-chord · diatonic

Character
cinematic · dark · dramatic

Community
Bond · rock · chorus
```

Также:

* favorite button;
* количество сохранений;
* количество community tags;
* выбор тональности;
* кнопка открытия полной страницы progression.

---

# 5. Фильтрация

Фильтры должны комбинироваться.

Пример:

```text
Mode: Minor
Length: 4 chords

Technical:
borrowed chord
dominant resolution

Character:
cinematic
dark

Community:
Bond

Exclude:
jazz
```

Все выбранные условия работают через AND.

Внутри одной группы позже можно добавить AND/OR mode.

---

# 6. Поиск

Поддержать поиск по:

* Roman Numeral progression;
* названию аккордов;
* тегам;
* ID;
* пользовательскому названию;
* community tags.

Пример поиска:

`i VI III VII`

должен находить прогрессию независимо от тональности.

Поиск:

`Em C G D`

должен определить вероятную тональность и найти соответствующую canonical progression.

---

# 7. Страница progression

URL:

`/progressions/{slug-or-id}`

Страница должна содержать:

* canonical Roman Numerals;
* текущую выбранную тональность;
* реальные названия аккордов;
* piano playback;
* tempo;
* technical tags;
* character tags;
* community tags;
* похожие прогрессии;
* пользовательские комментарии — не нужны для MVP;
* статистику использования — предусмотреть архитектурно.

---

# 8. Транспонирование

Пользователь выбирает:

* tonic;
* mode.

Например:

```text
Key: E
Mode: Minor
```

Canonical progression:

`i → VI → iv → V7`

преобразуется в:

`Em → C → Am → B7`

При смене key:

```text
C minor
```

получаем:

`Cm → Ab → Fm → G7`

Roman Numerals остаются неизменными.

---

# 9. Piano playback

Прогрессии должны воспроизводиться непосредственно в браузере.

Рекомендуемый стек:

* Tone.js;
* Web Audio API;
* piano sampler.

Для MVP достаточно одного piano preset.

Необходимо:

* Play;
* Stop;
* Loop;
* BPM;
* длительность каждого аккорда;
* velocity;
* simple arpeggio/block chords mode — optional.

По умолчанию:

```text
BPM: 90
1 chord = 1 bar
4/4
```

---

# 10. MIDI input

Использовать Web MIDI API.

Пользователь должен иметь возможность подключить MIDI keyboard.

Раздел:

`Create progression`

режим:

`MIDI Capture`

Приложение должно:

1. слушать MIDI Note On / Note Off;
2. определять одновременно звучащие ноты;
3. распознавать аккорд;
4. показывать распознанный chord name;
5. добавлять аккорд в progression;
6. позволять отменить последний chord;
7. после завершения попытаться определить key;
8. преобразовать последовательность в Roman Numerals;
9. сохранить progression.

Пример:

```text
MIDI notes:
E G B

Detected:
Em
```

Следующий:

```text
C E G

Detected:
C
```

Результат:

```text
Em → C → Am → B7
```

---

# 11. Chord recognition

MVP должен распознавать:

* major
* minor
* diminished
* augmented
* sus2
* sus4
* major7
* minor7
* dominant7
* diminished7
* half-diminished7
* add9
* minor add9

Должны поддерживаться обращения.

Пример:

```text
G C E
```

распознаётся как:

`C/E`

но harmonic identity:

`C major`

Voicing и inversion хранить отдельно от chord identity.

---

# 12. Voicing

Архитектура должна разделять:

```text
harmonic chord
```

и

```text
voicing
```

Например:

```text
Chord:
Cmaj7

Voicing:
C3 G3 B3 E4
```

В MVP можно проигрывать автоматически сгенерированные close-position voicings.

Но база данных должна позволять позже хранить пользовательские voicings.

---

# 13. Key detection

После ввода последовательности приложение должно определять вероятную тональность.

Key detector должен возвращать несколько вариантов с confidence:

```text
E minor    0.82
G major    0.61
A minor    0.24
```

Если уверенность недостаточная, пользователь должен выбрать key вручную.

После выбора key рассчитываются Roman Numerals.

---

# 14. Canonical progression

Необходимо создать собственную canonical representation.

Пример:

```json
{
  "mode": "minor",
  "chords": [
    {
      "degree": 1,
      "quality": "minor"
    },
    {
      "degree": 6,
      "quality": "major"
    },
    {
      "degree": 4,
      "quality": "minor"
    },
    {
      "degree": 5,
      "quality": "dominant7"
    }
  ]
}
```

Canonical hash должен позволять определить одинаковые progression независимо от key.

Например:

```text
Em C Am B7
Cm Ab Fm G7
Am F Dm E7
```

являются одной progression.

---

# 15. База данных

Использовать PostgreSQL.

Примерная структура.

## users

```text
id
email
username
password_hash / auth_provider
created_at
```

## progressions

```text
id
slug
canonical_hash
mode
chord_count
created_by
is_public
created_at
updated_at
```

## progression_chords

```text
id
progression_id
position
degree
accidental
quality
extension
bass_degree
duration
```

## tags

```text
id
name
slug
category

category:
technical
character
community
```

## progression_tags

```text
progression_id
tag_id
source
confidence
created_by
created_at
```

source:

```text
analysis
classifier
user
import
```

## favorites

```text
user_id
progression_id
created_at
```

## progression_occurrences

Использовать для статистики импортированных corpus data.

```text
id
progression_id
source
source_identifier
original_key
original_chords
section
genre
year
metadata_json
```

---

# 16. Импорт datasets

Предусмотреть import pipeline для открытых датасетов.

Первоначальные источники:

* ChoCo;
* OpenEWLD;
* When in Rome.

Не импортировать данные с коммерческих chord-сайтов через scraping без проверки лицензии.

Pipeline:

```text
Dataset
↓
Parser
↓
Chord normalization
↓
Key normalization
↓
Roman numeral conversion
↓
Progression segmentation
↓
Canonicalization
↓
Deduplication
↓
Technical tag generation
↓
Database
```

---

# 17. Progression segmentation

Не считать всю песню одной progression.

Необходимо извлекать небольшие гармонические patterns.

На первом этапе поддержать:

* 2 chords;
* 3 chords;
* 4 chords;
* 5 chords;
* 6 chords;
* 8 chords.

Для импортированных песен использовать sliding windows.

Например:

```text
C G Am F C G F G
```

при размере 4:

```text
C G Am F
G Am F C
Am F C G
F C G F
C G F G
```

После этого:

* нормализовать;
* дедуплицировать;
* считать occurrences.

---

# 18. Similar progressions

Реализовать similarity score.

Сначала простой вариант.

Учитывать:

* одинаковые degrees;
* chord qualities;
* количество совпадающих chord positions;
* edit distance между harmonic sequences.

Пример:

```text
i VI III VII
```

похожие:

```text
i VI VII
i III VII VI
i VI III V
```

API:

`GET /api/progressions/{id}/similar`

---

# 19. Backend API

Предпочтительно REST API.

Основные endpoints:

```text
GET    /api/progressions
GET    /api/progressions/{id}
POST   /api/progressions
PUT    /api/progressions/{id}
DELETE /api/progressions/{id}

GET    /api/tags
POST   /api/tags

POST   /api/progressions/{id}/tags
DELETE /api/progressions/{id}/tags/{tagId}

POST   /api/progressions/{id}/favorite
DELETE /api/progressions/{id}/favorite

GET    /api/progressions/{id}/similar

POST   /api/analyze/chords
POST   /api/analyze/progression
```

---

# 20. Suggested stack

Frontend:

```text
React
TypeScript
Vite
Tone.js
Web MIDI API
TanStack Query
Zustand
```

UI:

```text
Tailwind CSS
```

Backend:

```text
Node.js
TypeScript
Fastify
```

ORM:

```text
Prisma
```

Database:

```text
PostgreSQL
```

Validation:

```text
Zod
```

Testing:

```text
Vitest
Playwright
```

Monorepo:

```text
pnpm
```

---

# 21. Monorepo structure

```text
/apps
  /web
  /api

/packages
  /music-theory
  /database
  /shared
  /ui

/scripts
  /importers
```

Критически важное требование:

вся музыкальная логика должна находиться в:

```text
/packages/music-theory
```

и не зависеть от React или backend framework.

---

# 22. Music theory package

Создать отдельную библиотеку.

Пример API:

```ts
parseChord("Cmaj7/E")
```

```ts
detectChord(["C", "E", "G", "B"])
```

```ts
transposeChord("Em7", 3)
```

```ts
detectKey([
  "Em",
  "C",
  "Am",
  "B7"
])
```

```ts
toRomanNumerals(
  ["Em", "C", "Am", "B7"],
  "E minor"
)
```

Результат:

```ts
["i", "VI", "iv", "V7"]
```

```ts
fromRomanNumerals(
  ["i", "VI", "iv", "V7"],
  "C minor"
)
```

Результат:

```ts
["Cm", "Ab", "Fm", "G7"]
```

Также:

```ts
generateTechnicalTags(progression)
```

---

# 23. Authentication

Для MVP:

* email/password;
* либо OAuth.

Допускается использовать:

* Auth.js;
* Supabase Auth.

Без авторизации пользователь может:

* просматривать progression;
* фильтровать;
* слушать;
* менять key.

Требовать авторизацию для:

* favorites;
* создания progression;
* community tags.

---

# 24. Страницы

Минимальный набор:

```text
/
```

Library.

```text
/progressions/:id
```

Progression detail.

```text
/create
```

Progression editor.

```text
/my-library
```

Favorites + собственные progression.

```text
/tags/:slug
```

Страница тега.

---

# 25. Progression editor

Два способа ввода.

## Manual

Добавление chord через autocomplete.

```text
Em
Cmaj7
Am
B7
```

## MIDI

Capture через Web MIDI API.

После ввода показать:

```text
Detected key:
E minor

Roman:
i VI iv V7
```

Пользователь может изменить key вручную.

---

# 26. Technical tag generation MVP

Реализовать минимум следующие правила.

### major/minor

На основании mode progression.

### chord count

```text
4-chord
5-chord
etc.
```

### diatonic

Все chords относятся к выбранной scale.

### non-diatonic

Есть минимум один chord вне scale.

### dominant resolution

Есть движение:

```text
V → I
```

или:

```text
V → i
```

### secondary dominant

Определять V/x.

### contains extensions

Например:

```text
maj7
min7
dom7
add9
sus
```

### borrowed chord

Аккорд взят из parallel mode.

---

# 27. Character tags MVP

На первой версии использовать rules.

Например:

Minor + chromatic + dominant chords:

```text
dark
tense
dramatic
```

Major + IV + V + vi:

```text
uplifting
pop
```

Maj7/add9 + медленное voice movement:

```text
dreamy
warm
```

Важно:

эти правила не считать объективной музыкальной истиной.

Сохранять confidence.

---

# 28. Community tagging

Пользователь вводит:

```text
bon...
```

Autocomplete:

```text
Bond
Bond-like
Bond theme
```

Если подходящего нет:

```text
Create tag "Bond villain"
```

При отображении сортировать community tags по популярности.

Архитектурно предусмотреть:

```text
tag_votes
```

но voting можно не реализовывать в первой версии.

---

# 29. Seed data

Для разработки создать минимум 100 canonical progressions.

Не хранить их только как absolute chords.

Каждая должна иметь:

* Roman Numeral progression;
* mode;
* technical tags;
* несколько character tags;
* occurrence count mock.

Примеры:

```text
I V vi IV
vi IV I V
i VI III VII
i VI iv V
I vi IV V
ii V I
i iv V i
I IV V I
```

---

# 30. Необходимые тесты

Music theory logic должна иметь высокий test coverage.

Обязательные тесты:

### Transposition

```text
i VI iv V7
E minor
=
Em C Am B7
```

```text
i VI iv V7
C minor
=
Cm Ab Fm G7
```

### Canonicalization

```text
Em C G D
```

и

```text
Cm Ab Eb Bb
```

должны получить одинаковый canonical hash.

### Chord recognition

```text
C E G
=> C
```

```text
E G C
=> C/E
```

```text
C E G B
=> Cmaj7
```

### Roman Numerals

```text
C G Am F
C major
=> I V vi IV
```

---

# 31. Этапы разработки

## Phase 1 — Music theory core

Сначала реализовать:

* chord parser;
* notes;
* intervals;
* scales;
* chord recognition;
* transposition;
* Roman Numeral conversion;
* key detection;
* canonical hashing.

Не делать UI до появления рабочих unit tests этой библиотеки.

---

## Phase 2 — Basic library

Реализовать:

* PostgreSQL;
* progression CRUD;
* list;
* filtering;
* progression page;
* transposition.

---

## Phase 3 — Audio

Добавить:

* Tone.js;
* piano playback;
* BPM;
* loop;
* chord scheduling.

---

## Phase 4 — MIDI

Добавить:

* Web MIDI detection;
* device selector;
* live notes;
* chord detection;
* progression capture.

---

## Phase 5 — Tags

Добавить:

* technical tags;
* character tags;
* community tags;
* filters.

---

## Phase 6 — Dataset importer

Добавить:

* ChoCo importer;
* OpenEWLD importer;
* normalization;
* deduplication;
* occurrence statistics.

---

# 32. Что НЕ делать в MVP

Не реализовывать:

* DAW plugin;
* VST;
* mobile app;
* social feed;
* comments;
* chat;
* AI-generated music;
* audio chord recognition;
* Spotify integration;
* automatic song scraping;
* full notation editor;
* guitar tabs;
* collaborative editing.

---

# 33. UX requirement

Главный сценарий должен занимать несколько секунд:

```text
Open library
↓
choose:
Minor
Cinematic
Dark
4 chords
↓
Preview several progressions
↓
Change key to E minor
↓
Play
↓
Favorite
```

Другой основной сценарий:

```text
Connect MIDI keyboard
↓
Play four chords
↓
Application recognizes them
↓
Detect key
↓
Show Roman Numerals
↓
Generate technical tags
↓
Save progression
```

---

# 34. Архитектурный принцип

Приложение должно рассматривать:

```text
I V vi IV
```

как музыкальную сущность,

а:

```text
C G Am F
D A Bm G
E B C#m A
```

как её транспонированные представления.

Нельзя создавать отдельную progression database entry для каждой тональности.

---

# 35. Первая задача для Codex

Начать не с UI.

Создать monorepo и пакет:

```text
packages/music-theory
```

Реализовать TypeScript API:

```ts
parseChord()
detectChord()
transposeChord()
detectKey()
toRomanNumerals()
fromRomanNumerals()
canonicalizeProgression()
generateProgressionHash()
generateTechnicalTags()
```

Покрыть unit tests.

После завершения вывести:

1. структуру проекта;
2. используемые musical data structures;
3. список реализованных функций;
4. результаты тестов;
5. известные ограничения;
6. предложения по следующему этапу.

Не переходить к frontend до стабильной работы music-theory core.
