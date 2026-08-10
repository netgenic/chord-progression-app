import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.pnpm-store/**',
      '**/*.min.js',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['packages/music-theory/src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'process',
          message: 'The music-theory core must not read runtime environment or Node globals.',
        },
        {
          name: 'window',
          message: 'Browser capabilities belong in application adapters, not music-theory.',
        },
        {
          name: 'document',
          message: 'DOM access belongs in the web application, not music-theory.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'node:*',
                'react',
                'react/*',
                'fastify',
                '@fastify/*',
                'prisma',
                '@prisma/*',
                'tone',
                'tone/*',
                'apps/*',
                '**/apps/**',
              ],
              message:
                'The music-theory core must remain pure and independent of runtimes, frameworks, and apps.',
            },
          ],
        },
      ],
    },
  },
);
