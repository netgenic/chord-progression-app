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
  | Readonly<{ code: 'invalid-schema-version'; received: unknown }>
  | Readonly<{ code: 'empty-progression' }>;

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

export type Result<T, E = ConversionError> =
  Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: E }>;

export const success = <T>(value: T): Result<T, never> => Object.freeze({ ok: true, value });

export const failure = <E>(error: E): Result<never, E> =>
  Object.freeze({ ok: false, error: Object.freeze(error) });
