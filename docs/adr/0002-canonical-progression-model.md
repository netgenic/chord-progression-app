# ADR 0002: canonical progression model

## Status

Accepted — 2026-08-10

## Context

Продукт должен находить, транспонировать и объединять одну гармоническую структуру независимо от абсолютной тональности. Хранение `C–G–Am–F`, `D–A–Bm–G` и `E–B–C#m–A` как независимых progressions создаёт дубликаты, усложняет поиск, статистику и теги.

Одновременно необходимо сохранять исходный spelling/key импортированной записи, inversion/voicing, playback settings и пользовательское происхождение, не смешивая их с harmonic identity.

## Decision

Основной музыкальной сущностью является каноническая progression: mode плюс упорядоченная последовательность relative scale degrees с accidentals и нормализованными chord qualities/extensions.

Абсолютная key является параметром realization/display/playback. Абсолютные chord names вычисляются из canonical progression и key и не создают отдельную progression row.

Canonical identity и hash MVP включают:

- canonical schema/hash version;
- mode;
- порядок chord steps;
- degree, accidental и harmonic quality/extension каждого step.

Они не включают:

- display key и enharmonic presentation choice;
- user/creator, visibility, favorites или tags;
- tempo, duration и velocity;
- inversion и voicing;
- dataset occurrence/provenance.

Эти данные сохраняются как связанные representation, realization, user или occurrence metadata. Exact serialization и hash function определяются тестами перед реализацией, имеют явную версию и не меняются молча.

## Alternatives

- Хранить каждую absolute-key последовательность отдельно: проще первоначальная запись, но нарушает основную концепцию продукта и делает deduplication ненадёжной.
- Хранить только Roman string: компактно, но строка недостаточно выражает typed accidentals, qualities, extensions и эволюцию schema.
- Включить voicing/rhythm/inversion в primary identity: сохраняет варианты, но дробит одну harmonic progression; варианты лучше моделировать отдельно.
- Вычислять каноническую идентичность только при поиске: избегает schema, но делает constraints, tags, favorites и occurrence aggregation нестабильными.

## Consequences

Положительные:

- transposed equivalents дедуплицируются детерминированно;
- поиск по Roman progression не зависит от key;
- tags, favorites и occurrence statistics агрегируются вокруг одной музыкальной сущности;
- playback/display свободно меняют key без записи новых объектов.

Отрицательные/риски:

- key detection и enharmonic ambiguity требуют явного confidence/confirmation;
- canonical equivalence rules должны быть тщательно протестированы;
- смена schema/hash rules требует versioned migration/reconciliation;
- voicing, rhythm и source spelling требуют отдельных моделей;
- deduplication нельзя смешивать с пользовательским ownership: эта политика должна быть решена до CRUD schema.
