import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@tigilabs/schemas": path.resolve(
        rootDir,
        "../../packages/schemas/src/index.ts",
      ),
      "@tigilabs/types": path.resolve(
        rootDir,
        "../../packages/types/src/index.ts",
      ),
      "@tigilabs/ui": path.resolve(rootDir, "../../packages/ui/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
  },
});
