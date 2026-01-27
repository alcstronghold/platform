// @ts-check
import js from '@eslint/js';
import angular from 'angular-eslint';
import astro from 'eslint-plugin-astro';
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
      '**/.astro/**',
      '**/.angular/**',
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
        ecmaVersion: 'latest',
        sourceType: 'module',
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

  // Angular files configuration
  {
    files: ['apps/dashboard/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },

  // Angular HTML templates
  {
    files: ['apps/dashboard/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },

  // Astro files configuration
  {
    files: ['apps/web/**/*.astro'],
    extends: [...astro.configs.recommended],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
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
