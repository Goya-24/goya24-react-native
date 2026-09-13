import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.{ts,tsx}"],
    // react-native ships untranspiled Flow; nothing in these tests reaches
    // it, so the two native modules are replaced by the fakes in test/mocks.
    alias: {
      "react-native-webview": new URL("./test/mocks/react-native-webview.tsx", import.meta.url)
        .pathname,
      "react-native": new URL("./test/mocks/react-native.ts", import.meta.url).pathname,
    },
  },
});
