import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts", "lib/shelters/**/*.test.ts"],
    setupFiles: [],
    testTimeout: 120000,
    hookTimeout: 120000,
    globals: true,
    fileParallelism: false,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
