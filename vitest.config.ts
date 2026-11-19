import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests: pure logic, no network, no browser. End-to-end flows live in e2e/ (Playwright).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
