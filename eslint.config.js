import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettier.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Import 순서 및 그룹화 규칙
      // 컨벤션: 프레임워크 > 외부 패키지 > 프로젝트 내부 (shared > feature > 같은 디렉토리)
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'], // 프레임워크 및 외부 패키지
            'internal', // 프로젝트 내부 (@/shared, @/features 등)
            ['parent', 'sibling'], // 상위 디렉토리, 같은 디렉토리
            'index', // index 파일
            'type', // type imports
          ],
          'newlines-between': 'always', // 그룹 간 빈 줄
          alphabetize: {
            order: 'asc', // 알파벳 순 정렬
            caseInsensitive: true,
          },
          pathGroups: [
            // React를 가장 앞에 배치
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'react-dom',
              group: 'external',
              position: 'before',
            },
            // 프로젝트 내부 경로를 internal 그룹으로 분류
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['react', 'react-dom'],
        },
      ],
      // 기본 import와 named import 분리 (Prettier에서 처리)
      'import/no-duplicates': 'error',
    },
  },
  {
    ignores: ['dist', 'node_modules', '*.config.js', '.eslintrc.cjs'],
  },
];
