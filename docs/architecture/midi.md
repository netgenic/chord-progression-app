# Архитектура MIDI

## Назначение

MIDI capture позволяет получить progression с подключённой клавиатуры: выбрать устройство, отслеживать Note On/Off, сформировать одновременно звучащие notes, распознать chord candidates, отменить последний chord, определить key и сохранить каноническую прогрессию.

ТЗ ориентируется на Web MIDI API, но helper library, support matrix, permission UX и точные эвристики grouping не выбираются до browser spike. Manual input остаётся обязательным fallback.

## Граница capability

Browser MIDI изолируется адаптером, который выдаёт нормализованные события приложения:

- device connected/disconnected;
- note on/off;
- timestamp;
- channel и velocity, если они нужны capture policy;
- permission/capability/error state.

DOM/browser MIDI objects не передаются в music-theory. Тесты используют synthetic normalized events без реального устройства.

## Capture pipeline

```text
Browser MIDI events
      ↓ capability adapter
Normalized note events
      ↓ active-note state + grouping policy
Captured voicing
      ↓ packages/music-theory
Chord candidates + inversion + confidence
      ↓ user confirmation/editor
Chord sequence
      ↓ key candidates + Roman conversion
Save command to API
```

Music-theory распознаёт набор notes, но не решает UI-вопрос «когда аккорд завершён». Grouping/debounce/commit относится к capture application state и должно быть настраиваемым/тестируемым.

## Состояния сессии

- capability unavailable;
- permission not requested/requested/denied;
- no device/device selected/disconnected;
- idle/capturing;
- active notes;
- pending recognized chord candidates;
- accepted chord sequence;
- key candidates/manual key selection;
- save pending/success/error.

Disconnect, lost Note Off и duplicated events не должны оставлять «залипшие» ноты. Panic/reset очищает active-note state без изменения уже подтверждённой последовательности.

## Musical semantics

- MIDI note number преобразуется в pitch/voicing общим domain adapter, сохраняя octave.
- Chord identity, inversion и original voicing — разные значения.
- Несколько chord candidates показываются пользователю, если распознавание неоднозначно.
- Key detector возвращает несколько candidates с confidence; пользователь может выбрать вручную.
- Сохранение отправляет нормализованное представление, которое API повторно валидирует/canonicalizes.

## Privacy и безопасность

- Permission запрашивается только после явного действия пользователя.
- SysEx не требуется MVP и не запрашивается.
- Raw continuous event stream не отправляется на сервер и не логируется по умолчанию.
- Размер progression, частота событий и время capture ограничиваются.
- Device names считаются потенциально identifying metadata и не сохраняются без отдельной необходимости/согласия.
- MIDI payload никогда не является доверенным кодом или SQL/input fragment.

## Проверки

- Unit tests active-note reducer, Note On velocity zero semantics, grouping, undo и panic/reset.
- Synthetic integration tests для recognition boundary и disconnect/reconnect.
- Browser tests для permission denied/unavailable/manual fallback.
- Hardware smoke tests на утверждённой browser/device matrix перед релизом MIDI feature.

## Отложенные решения

- helper library или прямой Web MIDI adapter;
- browser/device support matrix;
- grouping window и chord commit UX;
- channel/pedal/aftertouch handling;
- сохранение voicings;
- fallback/feature-detection messaging.
