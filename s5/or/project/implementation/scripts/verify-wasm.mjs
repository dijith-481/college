import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import init, { experiment, ExperimentSession } from "../public/wasm/traffic.js";
const native = execFileSync(
  "cargo",
  ["run", "--quiet", "--offline", "-p", "experiments", "--example", "fixture"],
  { encoding: "utf8" },
)
  .trim()
  .split(" ")
  .map(Number);
await init({
  module_or_path: await readFile(new URL("../public/wasm/traffic_bg.wasm", import.meta.url)),
});
const request = {
  config: {
    horizon: 120,
    cycle: 48,
    clearance: 8,
    headway: 2,
    rates: [600, 300, 450, 200],
    turns: [0.2, 0.6, 0.2],
    green: [12, 8, 12, 8],
  },
  replications: 4,
  training_replications: 4,
  grid_step: 4,
  min_green: 4,
  max_green: 28,
  seed: 2026,
  optimize: true,
  sensitivity: true,
};
const result = JSON.parse(experiment(JSON.stringify(request)));
const wasm = [
  result.delay.mean,
  result.run.arrivals,
  result.run.departures,
  result.candidates.length,
  result.sensitivity[2].delay.mean,
];
wasm.forEach((value, i) => assert.ok(Math.abs(value - native[i]) < 1e-7));
assert.throws(() => experiment(JSON.stringify({ ...request, replications: 0 })));
console.log(
  "Native Rust and WebAssembly agree: delay, conservation counts, exhaustive search, demand sensitivity. Invalid requests rejected.",
);

const session = new ExperimentSession(JSON.stringify(request));
while (!session.advance(3)) {}
const batched = JSON.parse(session.result());
assert.equal(batched.delay.mean, result.delay.mean);
assert.equal(batched.distribution.total, request.replications);
assert.equal(JSON.parse(session.progress()).completed, JSON.parse(session.progress()).total);
session.free();
console.log("Batched and synchronous WASM results agree; all replications are counted.");
