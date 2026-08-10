# Архитектура audio

## Область ответственности

Audio layer воспроизводит выбранную абсолютную реализацию прогрессии в браузере. Он не анализирует harmony и не изменяет canonical progression. Выбор конкретного engine, sampler и piano assets отложен до проверки лицензии, browser support, bundle impact и latency.

MVP требует Play, Stop, Loop, BPM и длительность аккордов; по умолчанию 90 BPM, 4/4 и один chord на bar. Arpeggio/block mode и сохранённые пользовательские voicings являются расширениями.

## Поток данных

```text
Canonical progression + selected key
                ↓ music-theory realization
Absolute chords + generated voicings
                ↓ playback plan
Transport/scheduler
                ↓ audio adapter
Browser audio capability
```

Playback plan — неизменяемое описание событий: note/pitch, start, duration и velocity. Он не содержит UI components или engine-specific nodes. Music-theory может предоставить чистую генерацию voicings; scheduler переводит музыкальное время в engine time.

## Компоненты

- Realization adapter получает абсолютные chords из общей music-theory модели.
- Voicing policy создаёт MVP close-position voicings отдельно от chord identity.
- Playback-plan builder применяет BPM, meter, durations, velocity и loop range.
- Transport управляет play/stop/seek/loop и единым clock.
- Audio adapter инкапсулирует browser/third-party engine lifecycle.
- Asset loader загружает лицензированный piano preset и сообщает состояние/ошибку.

Эти границы не требуют собственного plugin framework: достаточно одной реализации и небольшого тестового fake adapter.

## Browser lifecycle

- Audio context запускается только после user gesture.
- Повторный Play не создаёт параллельные неуправляемые contexts/schedulers.
- Stop и unmount отменяют запланированные события и освобождают ресурсы.
- Изменение key/BPM во время playback имеет явную policy: применить со следующего запуска либо безопасно перестроить schedule.
- Background tab, suspended context и asset load failure дают контролируемое состояние.
- Отсутствие audio capability не блокирует просмотр/редактирование.

## Timing

Scheduler использует audio clock, а не цепочку UI timers. UI progress является проекцией transport state и не считается источником времени. Loop boundary не должен удваивать или обрезать note events.

Tempo, duration и velocity — параметры playback/arrangement, а не canonical hash. Изменение их не создаёт новую progression.

## Assets и безопасность

- Используются только assets с проверенной лицензией и provenance.
- Remote sample URLs не принимаются от пользователя.
- Размер/формат assets ограничивается; failures не раскрывают внутренние пути.
- Audio не стартует автоматически и учитывает пользовательский контроль/предпочтения.

## Проверки

- Unit tests playback-plan math, bar-to-time conversion, loop boundaries и cancellation.
- Fake adapter tests для lifecycle Play/Stop/restart и ошибок загрузки.
- Browser tests проверяют controls/state без утверждений о субъективном качестве звука.
- Ручная matrix проверяет реальное воспроизведение, latency и mobile/browser restrictions.

## Отложенные решения

- Tone.js или другая engine abstraction;
- sampler format, hosting и piano asset;
- browser support matrix и fallback;
- arpeggio modes, sustain/voice-leading policies;
- сохранение пользовательских voicings и playback presets.
