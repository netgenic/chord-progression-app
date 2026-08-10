# Модель музыкальной теории

## Назначение пакета

`packages/music-theory` — чистая TypeScript-библиотека и единственный источник музыкальных вычислений. Она предоставляет parsing, recognition, transposition, key detection, Roman conversion, canonicalization, hashing и technical tag generation.

Пакет не знает о пользователях, HTTP, базе данных, React, audio/MIDI browser APIs или конкретных framework types. Одинаковые входные данные и версия алгоритма должны давать одинаковый результат.

## Реализованный фундамент

Первый production-срез предоставляет dependency-free ESM API для:

- pitch class `0..11` и отдельного spelling `letter + accidental` без потери различия `C#`/`Db`;
- интервала с независимыми `diatonicSteps` и `semitones`;
- major и natural-minor key с преобразованием `scale degree ↔ spelled pitch`;
- нормализованного chord vocabulary, absolute chord identity и structured Roman chord;
- строгого chord-symbol parser/renderer v1 с отдельным explicit slash bass;
- spelling-preserving chord/progression transposition через `Interval`;
- двунаправленного `absolute chords ↔ Roman chords` в явно переданной key;
- immutable non-empty canonical progression и точной compact JSON serialization schema v1.

Ожидаемые validation/conversion failures возвращаются typed `Result`, а не скрываются fallback-значениями. Публичная граница находится только в `packages/music-theory/src/index.ts`; production build компилируется без DOM/Node globals и не имеет runtime dependencies.

Minor-root calculation использует natural minor. Например, `V7` в minor хранится как пятая ступень с явной dominant-seventh structure: повышенная leading tone является частью структуры аккорда, а не неявной сменой scale/mode.

## Семантические типы

Точные TypeScript encodings будут выбраны при реализации, но модель должна различать следующие понятия.

### Note spelling и pitch class

Pitch class задаёт высотный класс, а spelling сохраняет буквенное имя и accidental. `C#` и `Db` могут звучать одинаково, но не всегда взаимозаменяемы в анализе и отображении. Нормализация не должна преждевременно стирать spelling.

### Interval

Интервал должен сохранять и диатонический номер, и хроматическое расстояние. Одного количества semitones недостаточно для корректного spelling и Roman analysis.

### Chord identity

Chord identity состоит из root/spelling и нормализованных quality/extensions. Поддерживаемый MVP vocabulary включает major, minor, diminished, augmented, sus2, sus4, major7, minor7, dominant7, diminished7, half-diminished7, add9 и minor-add9.

Chord-symbol grammar v1 задаёт этим видам единственные canonical ASCII suffixes. Она case-sensitive, не обрезает whitespace и сохраняет accidentals до двойных. Aliases пока отклоняются; будущая alias policy должна быть одной операцией внутри music-theory, а не дублироваться в input/import adapters.

### Inversion и voicing

`ChordSymbol` хранит harmonic identity и optional slash bass раздельно. Slash bass ещё не является доказанной inversion: она может совпадать с root, быть chord tone или non-chord/pedal bass. Voicing — отдельные конкретные pitches и октавы; ни bass, ни voicing не меняют harmonic chord identity.

В исходной спецификации пример `G C E => C/E` конфликтует с указанным первым/bass pitch: при bass G корректный symbol — `C/G`, тогда как `E G C => C/E`. Будущий recognition slice обязан закрепить физический bass golden tests.

### Key и mode

Key содержит tonic spelling и mode. Набор поддерживаемых modes расширяется осознанно и тестируется; нельзя трактовать неизвестный mode как major/minor по умолчанию.

### Roman chord и canonical progression

Roman chord хранит scale degree, accidental, quality/extension и при необходимости функциональную интерпретацию. Canonical progression — mode плюс упорядоченный список таких аккордов. Абсолютная key не входит в неё.

## Канонизация

Канонизация выполняет следующую логическую последовательность:

1. parse/validate абсолютные аккорды;
2. принять явно выбранный key либо один подтверждённый key candidate;
3. преобразовать корни в relative scale degrees с accidentals;
4. нормализовать эквивалентные quality/extension representations;
5. построить детерминированное canonical value;
6. сериализовать его по версии canonical schema;
7. вычислить hash с явной версией алгоритма.

Hash MVP учитывает mode, порядок и harmonic identity chord steps. Display key/spelling, user data, tags, playback tempo/duration, inversion и voicing в hash не входят. Их можно анализировать или хранить как связанные варианты, но они не должны создавать отдельную harmonic progression.

Изменение canonical schema или equivalence rules требует новой версии hash и ADR/migration strategy; нельзя молча пересчитать существующие идентификаторы.

## Основные операции

Публичное API пакета должно покрывать продуктовые операции:

- parse chord symbol;
- detect chord candidates из одновременно звучащих notes;
- transpose chord/progression с корректным spelling;
- detect несколько key candidates с confidence;
- convert absolute chords to Roman representation;
- realize Roman representation в выбранном key;
- canonicalize progression и generate versioned hash;
- generate explainable technical tags;
- generate close-position voicing как отдельную операцию, когда это понадобится audio layer.

Функции не должны принимать persistence entities или DTO целиком. На границе приложения данные переводятся в domain values, а результаты — обратно в API/database representations.

## Key detection и распознавание

Key detection возвращает ранжированный список, не единственное предположение. Каждый результат содержит confidence; желательно также сохранять explainable evidence. Threshold пользовательского подтверждения является application/UI policy, а не скрытой частью математического типа.

Chord recognition может вернуть несколько кандидатов для неоднозначного набора notes. Алгоритм отделяет:

- chord identity;
- inversion/bass;
- исходный voicing;
- confidence/diagnostics.

## Technical tags

Technical tags выводятся из canonical progression и, где необходимо, из отдельно переданного realization context. MVP охватывает mode, chord count, diatonic/non-diatonic, dominant resolution, secondary dominant, extensions и borrowed chord. Каждое правило должно быть независимо тестируемым и объяснимым.

Character tags не являются частью математического ядра истины. Если rule-based implementation живёт рядом ради повторного использования типов, её результаты всё равно маркируются как heuristic с confidence и не участвуют в canonical identity.

## Тестовые инварианты

Обязательны unit, golden и property-based tests для:

- обратимости транспонирования;
- независимости canonical hash от key;
- Roman → absolute → Roman round-trip;
- enharmonic cases без потери требуемого spelling;
- chord recognition, включая inversions и расширения;
- deterministic serialization/hash;
- ambiguous key ordering и confidence bounds;
- отсутствие framework/database/browser dependencies.

Golden fixtures должны включать major/minor/harmonic-minor, borrowed и chromatic chords, secondary dominants, inversions, extended chords, enharmonic spellings и ambiguous keys.

## Известные открытые вопросы

- aliases/Unicode и extended chord-symbol grammar после строгой v1, а также дополнительные modes;
- политика предпочтительного enharmonic spelling;
- представление secondary functions и modal interchange;
- критерии equivalence для повторов/ритма;
- формула confidence и порог ручного подтверждения;
- portable canonical hash algorithm и стратегия версий digest;
- будущие версии canonical schema после появления secondary functions/inversion metadata.

Они уточняются тестовыми примерами до реализации соответствующего поведения.
