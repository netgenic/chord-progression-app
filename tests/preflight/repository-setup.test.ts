import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '..', '..');

const requiredRootFiles = [
  '.editorconfig',
  '.env.example',
  '.gitattributes',
  '.gitignore',
  '.node-version',
  '.prettierignore',
  'compose.yaml',
  'config/environment.ts',
  'eslint.config.mjs',
  'package.json',
  'playwright.config.ts',
  'pnpm-workspace.yaml',
  'prettier.config.mjs',
  'tsconfig.base.json',
  'tsconfig.json',
  'vitest.config.ts',
  'vitest.integration.config.ts',
] as const;

const requiredRepositoryGuidance = [
  'AGENTS.md',
  'DEVELOPMENT.md',
  'PROJECT_STATE.md',
  'apps/api/AGENTS.md',
  'apps/web/AGENTS.md',
  'packages/music-theory/AGENTS.md',
  'scripts/importers/AGENTS.md',
  'scripts/validate-environment.ts',
  'docs/llm-development/preflight.md',
  'docs/product/specification.md',
  'docs/architecture/overview.md',
  'docs/architecture/domain-model.md',
  'docs/architecture/music-theory-model.md',
  'docs/architecture/database.md',
  'docs/architecture/frontend.md',
  'docs/architecture/backend.md',
  'docs/architecture/audio.md',
  'docs/architecture/midi.md',
  'docs/architecture/import-pipeline.md',
  'docs/adr/0001-pnpm-monorepo.md',
  'docs/adr/0002-canonical-progression-model.md',
  'docs/adr/0003-music-theory-package-boundary.md',
  'docs/adr/0004-postgresql.md',
] as const;

const readRootFile = async (relativePath: string): Promise<string> =>
  readFile(resolve(repositoryRoot, relativePath), 'utf8');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readRootJsonObject = async (relativePath: string): Promise<Record<string, unknown>> => {
  const parsed: unknown = JSON.parse(await readRootFile(relativePath));

  if (!isRecord(parsed)) {
    throw new TypeError(`${relativePath} must contain a JSON object`);
  }

  return parsed;
};

describe('repository pre-flight scaffold', () => {
  it('contains every required root configuration file', async () => {
    const checks = requiredRootFiles.map((relativePath) =>
      access(resolve(repositoryRoot, relativePath)),
    );

    await expect(Promise.all(checks)).resolves.toHaveLength(requiredRootFiles.length);
  });

  it('contains the required repository instructions and architecture records', async () => {
    const checks = requiredRepositoryGuidance.map(async (relativePath) =>
      access(resolve(repositoryRoot, relativePath)),
    );

    await expect(Promise.all(checks)).resolves.toHaveLength(requiredRepositoryGuidance.length);
  });

  it('pins the supported Node.js and pnpm versions', async () => {
    const manifest = await readRootJsonObject('package.json');
    const engines = manifest['engines'];

    expect(isRecord(engines)).toBe(true);
    if (!isRecord(engines)) {
      throw new TypeError('package.json engines must be an object');
    }

    expect((await readRootFile('.node-version')).trim()).toBe('24.18.1');
    expect(manifest['packageManager']).toBe('pnpm@11.21.0');
    expect(engines['node']).toBe('24.18.1');
    expect(engines['pnpm']).toBe('11.21.0');
  });

  it('uses exact versions for the approved pre-flight dependencies', async () => {
    const manifest = await readRootJsonObject('package.json');

    expect(manifest['devDependencies']).toEqual({
      '@eslint/js': '10.0.1',
      '@playwright/test': '1.62.1',
      '@types/node': '24.13.3',
      '@vitest/coverage-v8': '4.1.10',
      eslint: '10.8.1',
      prettier: '3.9.6',
      typescript: '6.0.3',
      'typescript-eslint': '8.66.0',
      vitest: '4.1.10',
    });
  });

  it('keeps the full verification gate safe for temporarily empty suites', async () => {
    const manifest = await readRootJsonObject('package.json');
    const scripts = manifest['scripts'];

    expect(isRecord(scripts)).toBe(true);
    if (!isRecord(scripts)) {
      throw new TypeError('package.json scripts must be an object');
    }

    expect(scripts['test:integration']).toContain('--passWithNoTests');
    expect(scripts['test:e2e']).toContain('--pass-with-no-tests');
    expect(scripts['check']).toContain('pnpm run env:check:example');
    expect(scripts['verify']).toContain('pnpm run build');
  });

  it('keeps CI least-privileged, pinned, and ready to execute browser tests', async () => {
    const workflow = await readRootFile('.github/workflows/ci.yml');

    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).toContain('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1');
    expect(workflow).toContain('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020');
    expect(workflow).toContain('playwright install --with-deps chromium');
  });

  it('enforces practical pnpm supply-chain controls', async () => {
    const workspace = await readRootFile('pnpm-workspace.yaml');

    expect(workspace).toContain('strictPeerDependencies: true');
    expect(workspace).toContain('minimumReleaseAgeStrict: true');
    expect(workspace).toContain('trustPolicy: no-downgrade');
    expect(workspace).toContain('strictDepBuilds: true');
    expect(workspace).toContain('esbuild: true');
  });

  it('binds PostgreSQL locally and persists PostgreSQL 18 data at its supported mount point', async () => {
    const compose = await readRootFile('compose.yaml');

    expect(compose).toContain('image: postgres:18.4-bookworm');
    expect(compose).toContain("'127.0.0.1:${POSTGRES_PORT:-5432}:5432'");
    expect(compose).toContain('postgres-data:/var/lib/postgresql');
  });
});
