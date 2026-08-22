import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // 선언보다 먼저 쓰면 빌드는 통과하지만 실행 시 화면이 통째로 죽는다.
      // 실제로 리포트가 검은 화면만 뜨는 사고가 있었고, vite build는 잡지 못했다.
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
    },
  },
  {
    // api/ 는 브라우저가 아니라 Vercel 서버(Node)에서 돈다
    files: ['api/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])
