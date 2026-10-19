import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'vitest.setup.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/router.tsx', 'src/anim/TransitionLink.tsx', 'src/lib/auth.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // The 3D layer intentionally mutates plain proxy state per frame (useFrame),
    // never React state — see PLAN.md §9 "3D" convention.
    files: ['src/three/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
)
