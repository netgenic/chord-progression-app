# ADR 0007: exact chord recognition v1

## Status

Accepted — 2026-08-11

## Context

Music-theory core должен распознавать все 13 поддерживаемых chord kinds из одновременно
звучащих spelled pitch classes, сохранять неоднозначность и отделять harmonic identity от
физического bass. Одного массива `SpelledPitchClass` недостаточно для вывода bass: в нём нет
октав, а порядок MIDI events не обязан совпадать с высотой нот.

Некоторые pitch-class sets имеют несколько корректных identities. Например, `C D G` может
быть `Csus2` или `Gsus4`, augmented triad имеет три симметричных roots, а diminished seventh
— четыре. Spelling даёт важное evidence, но не всегда устраняет неоднозначность.

## Decision

Публичный вход v1 имеет structured форму:

```ts
interface ChordRecognitionInput {
  readonly notes: readonly SpelledPitchClass[];
  readonly bass: SpelledPitchClass | null;
}
```

`notes` содержит полный одновременно звучащий pitch-class observation. Порядок нот не имеет
семантики. `bass` передаётся отдельно, когда caller действительно знает нижний pitch; non-null
bass обязан с точным spelling присутствовать в `notes`. `null` означает unknown bass, а не
root position.

Recognition сравнивает distinct sounding pitch classes с полными шаблонами всех 13 v1 chord
kinds. Doublings не влияют на совпадение. Candidate root всегда берётся из observed spellings;
ядро не синтезирует скрытый enharmonic root. Rootless/incomplete chords, arbitrary subset
matching и omitted tones не поддерживаются.

Сначала возвращаются только exact full-set candidates. Лишь когда full-set candidates нет и
explicit bass задан, алгоритм может удалить pitch class баса и сопоставить оставшийся полный
upper structure. Такой candidate помечается как `non-chord` bass. Поэтому `C E G B` не
упрощается до `C/B`, `A C E G` остаётся `Am7`, а `Eb C E G Bb` может дать `C7/Eb`.

Результат сохраняет defensive copy исходных pitch classes, explicit bass и immutable список
всех candidates. Каждый candidate содержит:

- `ChordSymbol` с harmonic identity;
- bass classification `unknown | root-position | inversion | non-chord`;
- chord-tone role для inversion (`second`, `third`, `fourth`, `fifth`, `seventh`, `ninth`);
- evidence: способ pitch-set match и число spelling mismatches.

Root-position и unknown-bass candidates отображаются без redundant slash. Физический root
bass всё равно остаётся в recognition result. Inversion и non-chord bass отображаются slash
symbol. Numeric inversion labels намеренно не назначаются suspended и added-tone chords:
chord-tone role точнее и не закрепляет спорную терминологию.

Candidates имеют стабильный, permutation-independent порядок: полный set, меньше spelling
mismatches, root position перед chord-tone inversion, затем fixed v1 kind/root tie-breakers.
Это deterministic presentation order, а не статистическая вероятность. Numeric confidence не
добавляется до появления проверяемой scoring policy и context-aware evidence.

В исходной спецификации `G C E => C/E` ошибочно связывает identity с неверным bass. В новом
контракте `{ notes: [G, C, E], bass: G }` даёт `C/G`, а `{ notes: [E, G, C], bass: E }` —
`C/E`. Порядок массива сам по себе ни один из результатов не определяет.

## Alternatives

- Считать первую ноту массива bass: удобно для примеров, но неверно для unordered MIDI events
  и не выражает, откуда caller знает физически нижний pitch.
- Возвращать только лучший candidate: проще для UI, но теряет реальную sus/augmented/diminished
  ambiguity и создаёт скрытую теоретическую эвристику.
- Искать любые знакомые subsets: повышает recall, но `Cmaj7` начинает одновременно выглядеть
  как `C` с посторонней нотой и разрушает точность extensions.
- Добавить confidence сейчас: число выглядело бы вероятностью без dataset, calibration или
  key/temporal context.

## Consequences

Положительные:

- все 13 kinds распознаются одной deterministic exact-template операцией;
- physical bass, slash presentation и harmonic identity не смешиваются;
- ambiguous sets сохраняют все candidates и explainable spelling evidence;
- permutation и doublings не меняют harmonic candidates;
- API готов принять bass, вычисленный будущим octave-aware MIDI adapter.

Ограничения:

- caller обязан отдельно определить bass либо передать `null`;
- нет incomplete/rootless/fuzzy recognition, octave voicing и key-aware re-ranking;
- MIDI pitch numbers потребуют отдельной spelling policy до вызова этого API;
- расширение templates или ordering является наблюдаемым изменением recognition policy.

## References

- [Open Music Theory: Inversion](https://viva.pressbooks.pub/openmusictheory/chapter/inversion/)
- [music21 chord documentation](https://music21.org/music21docs/moduleReference/moduleChord.html)
