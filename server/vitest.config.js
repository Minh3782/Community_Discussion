import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // One shared test database, so test files run one after another
    fileParallelism: false,
    // First run downloads a MongoDB binary for the in-memory server, which can take a while
    hookTimeout: 180_000,
    testTimeout: 30_000,
    env: {
      SESSION_SECRET: 'test-session-secret-not-for-production',
      CLIENT_URL: 'http://localhost:5173',
    },
  },
});
