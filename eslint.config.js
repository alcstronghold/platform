// @ts-check
import js from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Globally ignores (must be first and standalone)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.moon/**',
      '**/coverage/**',
      '**/*.d.ts',
    ],
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.js', '*.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Quotes - single quotes
      quotes: ['error', 'single', { avoidEscape: true }],

      // Semicolons
      semi: ['error', 'always'],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Scripts, tools, and config files (looser rules)
  {
    files: ['scripts/**/*.ts', 'tools/**/*.ts', '*.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
