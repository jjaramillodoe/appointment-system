import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // ~490 existing `any`s: visible as warnings, but not blocking CI while they're paid down
      '@typescript-eslint/no-explicit-any': 'warn',
      // Mostly the "fetch on mount" pattern; revisit when moving data loading off effects
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // CommonJS config files
    files: ['*.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'database-backups/**',
  ]),
])

export default eslintConfig
