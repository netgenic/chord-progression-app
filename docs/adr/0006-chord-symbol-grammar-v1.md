# ADR 0006: chord-symbol grammar v1

## Status

Accepted — 2026-08-11

## Context

Music-theory core должен разбирать, отображать и транспонировать chord symbols, не стирая
enharmonic spelling и slash bass. Спецификация перечисляет поддерживаемые chord kinds, но не
фиксирует точные символы для всех видов, aliases, whitespace/case policy или смысл slash.

Одного chromatic semitone offset недостаточно для корректного spelling: транспозиция `C` на
один semitone может означать `C#` или `Db` в зависимости от диатонического интервала. Slash
также не доказывает обращение: например, `C7/Eb` содержит explicit bass, которая не входит в
ноты C7.

## Decision

Версия grammar v1 является строгой, case-sensitive и ASCII-only:

```ebnf
chord-symbol = note, suffix, ["/", note] ;
note         = letter, accidental ;
letter       = "A" | "B" | "C" | "D" | "E" | "F" | "G" ;
accidental   = "" | "b" | "bb" | "#" | "##" ;
suffix       = "" | "m" | "dim" | "aug" | "sus2" | "sus4"
             | "maj7" | "m7" | "7" | "dim7" | "m7b5"
             | "add9" | "madd9" ;
```

Canonical suffixes:

| Chord kind | Suffix |
| --- | --- |
| major | empty |
| minor | `m` |
| diminished | `dim` |
| augmented | `aug` |
| sus2 | `sus2` |
| sus4 | `sus4` |
| major7 | `maj7` |
| minor7 | `m7` |
| dominant7 | `7` |
| diminished7 | `dim7` |
| half-diminished7 | `m7b5` |
| add9 | `add9` |
| minor-add9 | `madd9` |

Parser не обрезает whitespace, не меняет регистр и не принимает aliases. Unicode `♭`, `♯`,
`°`, `ø`, а также `min`, `+`, `M7`, `Δ7`, `dom7`, `m(add9)` и другие незафиксированные формы
отклоняются. Максимальная длина корректного v1 symbol равна 12 символам
(`C##madd9/Bbb`); более длинный ввод отклоняется до tokenization.
Ошибка такого ввода содержит только длину, но не отражает исходный неограниченный payload.

Parsed chord хранит `AbsoluteChordIdentity` и `bass: SpelledPitchClass | null` отдельно.
`null` означает отсутствие slash в notation, а не доказанную root-position voicing. Explicit
bass сохраняется даже для `C/C`; parser не проверяет, является ли bass chord tone.

Canonical renderer выдаёт только указанную выше форму. Для поддерживаемого canonical input
действуют обе обратимости:

```text
render(parse(symbol)) = symbol
parse(render(value)) = normalized value
```

`transposeChord` и `transposeProgression` принимают `Interval` с независимыми
`diatonicSteps` и `semitones`. Root и explicit bass транспонируются одним интервалом, structure
не меняется. Semitone-only chord API не добавляется до появления явной enharmonic policy.

## Specification clarifications

Пример `transposeChord("Em7", 3)` является schematic: число `3` не задаёт spelling. В v1
minor-third задаётся как `{ diatonicSteps: 2, semitones: 3 }`.

В chord-recognition примере спецификация указывает `G C E => C/E`. Если первая нота означает
реальный bass, корректный slash symbol для C major — `C/G`; `E G C => C/E`. Parser не делает
recognition, но будущий recognition slice должен разрешить этот конфликт отдельными golden
tests, а не копировать ошибочный bass.

## Alternatives

- Принимать распространённые aliases и сразу canonicalize: удобнее для ввода, но без списка
  aliases язык менялся бы неявно и усложнял round-trip fixtures.
- Использовать Unicode symbols как canonical: визуально богаче, но повышает риск различных
  normalization forms и portability ошибок.
- Хранить slash bass внутри harmonic identity: упрощает один объект, но разрушает canonical
  equivalence и противоречит отделению inversion/voicing.
- Транспонировать только по semitones: просто, но требует скрытой enharmonic эвристики.

## Consequences

Положительные:

- grammar bounded, dependency-free и детерминирована;
- все 13 MVP chord kinds имеют ровно одно canonical spelling;
- enharmonic spelling и explicit slash bass переживают parse/render/transposition;
- harmonic identity остаётся независимой от bass и presentation.

Отрицательные и ограничения:

- UI/import adapters пока передают unsupported-alias error без собственной музыкальной
  нормализации; будущая alias policy реализуется единожды внутри `packages/music-theory`;
- triple accidentals, compound extensions и altered dominants пока не поддерживаются;
- classification slash bass как inversion/non-chord bass остаётся задачей recognition;
- расширение grammar требует новых fixtures и явного пересмотра этого контракта.
