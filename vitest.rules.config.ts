import path from "path";
import { defineConfig } from "vitest/config";

/** إعداد منفصل لاختبارات قواعد Firestore — تعمل عبر Firebase Emulator فقط. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.rules.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
