# Архитектура frontend

## Ответственность

Web-клиент отвечает за быстрый каталог прогрессий, фильтры и поиск, progression detail, ручной/MIDI editor, управление воспроизведением и пользовательскую библиотеку. Он не реализует собственные версии musical parsing, transposition, key detection или canonicalization.

Конкретные frontend framework, router, state manager, query library и styling toolkit не выбраны этим документом. Предложенный в ТЗ стек оценивается отдельным решением перед созданием `apps/web`.

## Страницы и основные потоки

Минимальные маршруты продукта:

- `/` — каталог, комбинируемые фильтры и preview;
- `/progressions/:id` — canonical/absolute views, tags, similar progressions и playback;
- `/create` — manual и MIDI capture;
- `/my-library` — favorites и собственные progression;
- `/tags/:slug` — каталог по тегу.

Анонимный пользователь может просматривать, искать, транспонировать и слушать. Создание, favorites и community tagging требуют authenticated actor. UI скрывает или блокирует недоступные действия для удобства, но это не заменяет серверную authorization.

## Разделение состояния

### Server state

Progressions, users/current user, tags, favorites и persistence status приходят из API. Кэширование должно сохранять server ownership: optimistic updates разрешены только с rollback и последующей сверкой ответа.

### URL state

Поисковая строка, фильтры, сортировка, пагинация и желательно выбранный catalog key кодируются в URL, чтобы результат можно было обновить и поделиться им.

### Local interaction state

Открытые панели, временный editor draft, playback controls, MIDI device/session и неподтверждённые key candidates остаются локальными. До сохранения они не считаются серверным источником истины.

### User identity state

Клиент работает со стабильным `User`/current-user DTO, а не только с opaque session boolean. Auth transport и credential provider остаются изолированными от presentation components.

## Musical boundary

UI может вызывать публичное API `packages/music-theory` для низколатентного preview, если browser bundle допускает это, либо получать рассчитанный результат от API. В обоих случаях UI-компоненты не содержат таблиц intervals/chords или самостоятельных алгоритмов.

Преобразование `CanonicalProgression + Key -> AbsoluteProgression` выполняется общей библиотекой. Выбранный key — состояние представления; он не создаёт копию progression и не меняет canonical hash.

## Компонентные границы

Предпочтительные feature boundaries:

- library/search/filter;
- progression card/detail;
- progression editor;
- user/my-library;
- tags;
- playback;
- MIDI capture;
- shared accessible primitives.

Feature code зависит от typed API client и domain values, а не импортирует server persistence entities. Общие UI primitives не знают о музыкальной модели.

## Состояния интерфейса

Каждый async flow должен явно обрабатывать loading, empty, validation error, permission denied, network failure и retry. MIDI недоступность или audio autoplay restriction не должны блокировать manual editor и обычный каталог.

Key detection показывает несколько candidates с confidence и предлагает ручной выбор при низкой уверенности. Character confidence отображается как эвристика, а не объективное утверждение.

## Accessibility и responsive behavior

- Все основные действия доступны с клавиатуры без MIDI-устройства.
- Play/Stop/Loop имеют доступные имена и различимые состояния.
- Фильтры и autocomplete работают с клавиатурой и screen reader semantics.
- Цвет не является единственным носителем mode/tag/status.
- Layout поддерживает каталог и editor на узком экране.
- Motion и audio не запускаются автоматически без действия пользователя.

## Проверки

- Unit/component tests: фильтры, формы, permission states, key candidate selection и error states.
- Contract tests: соответствие typed API schemas.
- Playwright: каталог → фильтр → progression → transpose/play; sign-in boundary → favorite; manual create; MIDI fallback; responsive smoke tests.
- Реальное audio quality и hardware MIDI требуют отдельной ручной/browser matrix проверки и не симулируются только DOM assertions.

## Отложенные решения

- framework/router/rendering model;
- server-state и local-state libraries;
- component/CSS toolkit;
- auth UI и session transport;
- offline/PWA behavior;
- точная API client generation strategy;
- browser support matrix для audio и MIDI.
