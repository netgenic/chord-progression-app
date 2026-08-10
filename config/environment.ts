export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface RuntimeEnvironment {
  readonly postgres: Readonly<{
    database: string;
    user: string;
    password: string;
    port: number;
    url: URL;
  }>;
  readonly e2e: Readonly<{
    baseUrl: URL;
  }>;
}

export interface ToolingEnvironment {
  readonly ci: boolean;
  readonly e2eBaseUrl: URL;
}

const defaultE2eBaseUrl = 'http://127.0.0.1:5173';

export class EnvironmentValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid environment configuration:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    this.name = 'EnvironmentValidationError';
    this.issues = [...issues];
  }
}

const readRequired = (
  source: EnvironmentSource,
  name: string,
  issues: string[],
): string | undefined => {
  const value = source[name]?.trim();

  if (!value) {
    issues.push(`${name} is required`);
    return undefined;
  }

  return value;
};

const readPort = (
  source: EnvironmentSource,
  name: string,
  issues: string[],
): number | undefined => {
  const value = readRequired(source, name, issues);

  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    issues.push(`${name} must be an integer between 1 and 65535`);
    return undefined;
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    issues.push(`${name} must be an integer between 1 and 65535`);
    return undefined;
  }

  return port;
};

const readUrl = (
  source: EnvironmentSource,
  name: string,
  allowedProtocols: readonly string[],
  issues: string[],
): URL | undefined => {
  const value = readRequired(source, name, issues);

  if (value === undefined) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (!allowedProtocols.includes(url.protocol)) {
      issues.push(`${name} must use one of: ${allowedProtocols.join(', ')}`);
      return undefined;
    }

    return url;
  } catch {
    issues.push(`${name} must be a valid URL`);
    return undefined;
  }
};

export const parseEnvironment = (source: EnvironmentSource): RuntimeEnvironment => {
  const issues: string[] = [];
  const database = readRequired(source, 'POSTGRES_DB', issues);
  const user = readRequired(source, 'POSTGRES_USER', issues);
  const password = readRequired(source, 'POSTGRES_PASSWORD', issues);
  const port = readPort(source, 'POSTGRES_PORT', issues);
  const url = readUrl(source, 'DATABASE_URL', ['postgres:', 'postgresql:'], issues);
  const baseUrl = readUrl(source, 'E2E_BASE_URL', ['http:', 'https:'], issues);

  if (
    issues.length > 0 ||
    database === undefined ||
    user === undefined ||
    password === undefined ||
    port === undefined ||
    url === undefined ||
    baseUrl === undefined
  ) {
    throw new EnvironmentValidationError(issues);
  }

  return Object.freeze({
    postgres: Object.freeze({ database, user, password, port, url }),
    e2e: Object.freeze({ baseUrl }),
  });
};

const readProcessEnvironment = (): EnvironmentSource => process.env;

export const loadEnvironment = (): RuntimeEnvironment => parseEnvironment(readProcessEnvironment());

export const parseToolingEnvironment = (source: EnvironmentSource): ToolingEnvironment => {
  const issues: string[] = [];
  const ciValue = source['CI']?.trim();

  if (ciValue !== undefined && ciValue !== 'true' && ciValue !== 'false') {
    issues.push('CI must be true or false when provided');
  }

  const e2eBaseUrl = readUrl(
    { E2E_BASE_URL: source['E2E_BASE_URL'] ?? defaultE2eBaseUrl },
    'E2E_BASE_URL',
    ['http:', 'https:'],
    issues,
  );

  if (issues.length > 0 || e2eBaseUrl === undefined) {
    throw new EnvironmentValidationError(issues);
  }

  return Object.freeze({ ci: ciValue === 'true', e2eBaseUrl });
};

export const loadToolingEnvironment = (): ToolingEnvironment =>
  parseToolingEnvironment(readProcessEnvironment());
