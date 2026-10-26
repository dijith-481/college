import { execFileSync } from "node:child_process";
execFileSync(
  "cargo",
  ["build", "--release", "--target", "wasm32-unknown-unknown", "-p", "traffic-wasm"],
  { stdio: "inherit" },
);
execFileSync(
  "wasm-bindgen",
  [
    "target/wasm32-unknown-unknown/release/traffic_wasm.wasm",
    "--target",
    "web",
    "--out-dir",
    "public/wasm",
    "--out-name",
    "traffic",
  ],
  { stdio: "inherit" },
);
