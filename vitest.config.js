import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    typecheck: {
      enabled: true,
      tsconfig: "./jsconfig.json",
      include: ["**/*.test.js"],
    },
  },
});
