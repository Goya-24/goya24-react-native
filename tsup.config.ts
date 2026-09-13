import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  // Metro reads `src` straight through the `react-native` export condition;
  // the built files are for type consumers and the odd Node-side test.
  external: ["react", "react-native", "react-native-webview"],
});
