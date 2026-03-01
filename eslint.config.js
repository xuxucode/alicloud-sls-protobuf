import stylistic from '@stylistic/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  stylistic.configs.customize({
    braceStyle: '1tbs',
  }),
  {
    languageOptions: {
      parser: parserTs,
    },
    files: [
      'src/**/*.{ts,tsx}',
    ],
  },
  globalIgnores([ // 'global ignores' can match directories, not only files
    '**/dist/',
    '**/gen/',
  ]),
])
