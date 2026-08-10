import { describe, expect, it } from 'vitest';
import {
  EnvironmentValidationError,
  parseEnvironment,
  parseToolingEnvironment,
  type EnvironmentSource,
} from '../../config/environment.ts';

const validEnvironment = {
  POSTGRES_DB: 'chord_progression',
  POSTGRES_USER: 'chord_app',
  POSTGRES_PASSWORD: 'local_dev_password',
  POSTGRES_PORT: '5432',
  DATABASE_URL: 'postgresql://chord_app:local_dev_password@127.0.0.1:5432/chord_progression',
  E2E_BASE_URL: 'http://127.0.0.1:5173',
} satisfies EnvironmentSource;

describe('environment validation', () => {
  it('returns an immutable typed configuration for valid input', () => {
    const environment = parseEnvironment(validEnvironment);

    expect(environment.postgres.database).toBe('chord_progression');
    expect(environment.postgres.port).toBe(5432);
    expect(environment.postgres.url.protocol).toBe('postgresql:');
    expect(environment.e2e.baseUrl.origin).toBe('http://127.0.0.1:5173');
    expect(Object.isFrozen(environment)).toBe(true);
    expect(Object.isFrozen(environment.postgres)).toBe(true);
  });

  it('fails with variable names when required values are missing or invalid', () => {
    expect(() =>
      parseEnvironment({
        ...validEnvironment,
        POSTGRES_PASSWORD: '',
        POSTGRES_PORT: '70000',
      }),
    ).toThrowError(/POSTGRES_PASSWORD is required[\s\S]*POSTGRES_PORT must be an integer/);
  });

  it('never includes a rejected value in its diagnostic', () => {
    const rejectedValue = 'not-a-url-with-sensitive-material';

    try {
      parseEnvironment({ ...validEnvironment, DATABASE_URL: rejectedValue });
      throw new Error('Expected environment validation to fail');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(EnvironmentValidationError);
      expect((error as Error).message).not.toContain(rejectedValue);
      expect((error as Error).message).toContain('DATABASE_URL');
    }
  });

  it('validates CI flags and supplies a safe local E2E default', () => {
    expect(parseToolingEnvironment({}).e2eBaseUrl.origin).toBe('http://127.0.0.1:5173');
    expect(parseToolingEnvironment({ CI: 'true' }).ci).toBe(true);
    expect(() => parseToolingEnvironment({ CI: 'sometimes' })).toThrowError(/CI must be true/);
  });
});
