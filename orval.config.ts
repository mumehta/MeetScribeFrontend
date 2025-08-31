import { defineConfig } from 'orval';

export default defineConfig({
  meetscribe: {
    input: './openapi.yml',
    output: {
      target: 'src/api/generated/index.ts',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: 'src/api/http.ts',
          name: 'customFetcher',
        },
      },
      // Disable prettier integration to avoid missing dependency warnings.
      prettier: false,
      clean: true,
    },
    hooks: {
      // Run ESLint only on generated files; avoid shell operators that confuse argument parsing
      afterAllFilesWrite: ['eslint --fix "src/api/generated/**/*.{ts,tsx}"'],
    },
  },
});
