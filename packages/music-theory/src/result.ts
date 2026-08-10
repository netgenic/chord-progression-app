import type { Mode, NoteLetter } from './model.js';

export type ValidationError =
  | Readonly<{ code: 'invalid-note-letter'; received: string }>
  | Readonly<{ code: 'invalid-accidental'; received: number }>
  | Readonly<{ code: 'invalid-pitch-class'; received: number }>
  | Readonly<{ code: 'invalid-semitone-offset'; received: number }>
  | Readonly<{ code: 'invalid-diatonic-steps'; received: number }>
  | Readonly<{ code: 'invalid-mode'; received: string }>
  | Readonly<{ code: 'invalid-scale-degree'; received: number }>
  | Readonly<{ code: 'invalid-degree-alteration'; received: number }>
  | Readonly<{ code: 'invalid-chord-kind'; received: string }>
  | Readonly<{ code: 'invalid-chord-bass'; received: string }>
  | Readonly<{
      code: 'invalid-chord-value';
      reason: 'not-object' | 'invalid-root' | 'unexpected-fields';
    }>
  | Readonly<{
      code: 'invalid-chord-symbol-value';
      reason: 'not-object' | 'missing-identity' | 'missing-bass' | 'unexpected-fields';
    }>
  | Readonly<{
      code: 'invalid-interval-value';
      reason: 'not-object' | 'missing-fields' | 'invalid-field-types' | 'unexpected-fields';
    }>
  | Readonly<{ code: 'invalid-progression-value'; reason: 'not-array' }>
  | Readonly<{ code: 'invalid-schema-version'; received: unknown }>
  | Readonly<{ code: 'empty-progression' }>;

export type ChordParseErrorReason =
  | 'invalid-type'
  | 'empty'
  | 'too-long'
  | 'whitespace'
  | 'multiple-slashes'
  | 'invalid-root'
  | 'unsupported-accidental'
  | 'unsupported-suffix'
  | 'invalid-slash-bass';

export type ChordParseError =
  | Readonly<{
      code: 'invalid-chord-symbol';
      input: string;
      reason: Exclude<ChordParseErrorReason, 'invalid-type' | 'too-long'>;
    }>
  | Readonly<{
      code: 'invalid-chord-symbol';
      reason: 'too-long';
      receivedLength: number;
    }>
  | Readonly<{
      code: 'invalid-chord-symbol';
      reason: 'invalid-type';
      receivedType: string;
    }>;

export type ConversionError =
  | ValidationError
  | Readonly<{
      code: 'unsupported-spelling';
      letter: NoteLetter;
      requiredAccidental: number;
    }>
  | Readonly<{
      code: 'mode-mismatch';
      progressionMode: Mode;
      keyMode: Mode;
    }>;

export type ChordTranspositionError =
  | ConversionError
  | Readonly<{
      code: 'chord-component-error';
      component: 'root' | 'bass';
      cause: ConversionError;
    }>;

export type ProgressionTranspositionError =
  | ValidationError
  | Readonly<{
      code: 'progression-chord-error';
      index: number;
      cause: ChordTranspositionError;
    }>;

export type Result<T, E = ConversionError> =
  Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: E }>;

export const success = <T>(value: T): Result<T, never> => Object.freeze({ ok: true, value });

export const failure = <E>(error: E): Result<never, E> =>
  Object.freeze({ ok: false, error: Object.freeze(error) });
