import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import init, { ExperimentSession } from "../public/wasm/traffic.js";
const wasm = await init({
  module_or_path: await readFile(new URL("../public/wasm/traffic_bg.wasm", import.meta.url)),
});
const request = {
  config: {
    horizon: 30,
    cycle: 48,
    clearance: 8,
    headway: 2,
    rates: [0, 0, 0, 0],
    turns: [0.2, 0.6, 0.2],
    green: [10, 10, 10, 10],
  },
  replications: 1000000,
  training_replications: 2,
  grid_step: 4,
  min_green: 4,
  max_green: 28,
  seed: 2026,
  optimize: false,
  sensitivity: false,
};
const session = new ExperimentSession(JSON.stringify(request)),
  start = performance.now();
while (!session.advance(4096)) await new Promise((resolve) => setImmediate(resolve));
const result = JSON.parse(session.result()),
  progress = JSON.parse(session.progress());
assert.equal(result.delay.n, 1000000);
assert.equal(result.distribution.total, 1000000);
assert.equal(
  result.distribution.counts.reduce((a, b) => a + b, 0),
  1000000,
);
assert.equal(progress.completed, 4000000);
assert.equal(progress.completed, progress.total);
assert.ok(result.convergence.length < 200);
assert.equal(result.replicate_delays.length, 2048);
assert.equal(result.delay.mean, 0);
console.log(
  `One million zero-demand replications passed (4 million simulation calls). ${(performance.now() - start) / 1000}s; WASM memory ${wasm.memory.buffer.byteLength / 1048576} MiB. This checks orchestration, not realistic-traffic runtime.`,
);
session.free();
