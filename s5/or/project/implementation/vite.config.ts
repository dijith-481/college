import { execFileSync } from "node:child_process";
import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solid(),
    {
      name: "rust-engine",
      handleHotUpdate({ file, server }) {
        if (file.endsWith(".rs") || file.endsWith("Cargo.toml")) {
          execFileSync(process.execPath, ["scripts/build-wasm.mjs"], { stdio: "inherit" });
          server.ws.send({ type: "full-reload" });
          return [];
        }
      },
      buildStart() {
        execFileSync(process.execPath, ["scripts/build-wasm.mjs"], { stdio: "inherit" });
      },
    },
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true, watch: { ignored: ["**/target/**"] } },
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ["public/wasm/**", "dist/**", "target/**"],
  },
  fmt: { ignorePatterns: ["public/wasm/**", "target/**", "dist/**", "Cargo.lock"] },
});
