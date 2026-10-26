import assert from "node:assert/strict";
import {
  allocate,
  allocateVehicleCounts,
  demandScales,
  expectedVehicles,
  inputIssues,
  maximumVehicleCount,
  planCount,
  ratesFromVehicleCounts,
  shiftNext,
  vehicleCountsFromRates,
  vehiclesPerRoadLimit,
} from "../src/controls.ts";
import { defaults } from "../src/types.ts";
assert.deepEqual(inputIssues(defaults), []);
assert.equal(planCount(defaults), 415);
const cases = [
  [
    (r) => {
      r.config.turns[0] = 0.3;
    },
    /Turning percentages/,
  ],
  [
    (r) => {
      r.config.green[0] = 25;
    },
    /Greens \+ safety gaps/,
  ],
  [
    (r) => {
      r.config.cycle = 100;
    },
    /Greens \+ safety gaps/,
  ],
  [
    (r) => {
      r.min_green = 25;
    },
    /allowed green bounds/,
  ],
  [
    (r) => {
      r.grid_step = 7;
    },
    /No timings/,
  ],
  [
    (r) => {
      r.grid_step = 0;
    },
    /No timings/,
  ],
  [
    (r) => {
      r.config.cycle = 1e10;
    },
    /Signal cycle/,
  ],
  [
    (r) => {
      r.config.clearance = 1000;
    },
    /Safety gaps/,
  ],
  [
    (r) => {
      r.replications = 2.5;
    },
    /Run counts/,
  ],
  [
    (r) => {
      r.config.rates[0] = -1;
    },
    /arrival rate/,
  ],
];
for (const [edit, message] of cases) {
  const r = structuredClone(defaults);
  edit(r);
  const entered = JSON.stringify(r);
  assert.ok(
    inputIssues(r).some((issue) => message.test(issue)),
    String(message),
  );
  assert.equal(JSON.stringify(r), entered, "Validation must preserve entered values");
}
const custom = structuredClone(defaults);
custom.config.rates[0] = 613;
custom.replications = 1234;
custom.training_replications = 237;
assert.deepEqual(inputIssues(custom), []);
const changed = structuredClone(defaults);
changed.config.cycle = 100;
changed.config.green = allocate(84, changed.min_green, changed.max_green, changed.config.green);
assert.deepEqual(inputIssues(changed), []);
assert.deepEqual(demandScales({ ...defaults, sensitivity: true }), [0.5, 0.75, 1, 1.25, 1.5]);
const highDemand = structuredClone(defaults);
highDemand.sensitivity = true;
highDemand.config.rates[0] = 20000;
assert.deepEqual(demandScales(highDemand), [0.5, 0.75, 1]);
console.log(
  "Independent drafts, exact values, explicit balancing, grid validation and demand workload verified.",
);

const greens = [24, 16, 24, 16];
assert.equal(expectedVehicles(defaults.config.rates, defaults.config.horizon), 300);
assert.deepEqual(vehicleCountsFromRates(defaults.config.rates, 600), [100, 58, 92, 50]);
assert.deepEqual(
  allocateVehicleCounts(600, [100, 58, 92, 50], vehiclesPerRoadLimit(600)),
  [200, 116, 184, 100],
);
assert.deepEqual(allocateVehicleCounts(7, [0, 0, 0, 0], 10), [2, 2, 2, 1]);
assert.deepEqual(allocateVehicleCounts(15, [9, 1, 0, 0], 5), [5, 5, 3, 2]);
assert.equal(maximumVehicleCount(600, false), 13332);
assert.equal(expectedVehicles(ratesFromVehicleCounts([200, 116, 184, 100], 600), 600), 600);
assert.deepEqual(shiftNext([200, 116, 184, 100], 0, 220, 0, 3333), [220, 96, 184, 100]);
assert.deepEqual(shiftNext([200, 116, 184, 100], 3, 110, 0, 3333), [190, 116, 184, 110]);
assert.deepEqual(shiftNext(greens, 0, 28, 8, 44), [28, 12, 24, 16]);
assert.deepEqual(shiftNext(greens, 3, 20, 8, 44), [20, 16, 24, 20]);
assert.deepEqual(shiftNext(greens, 0, 40, 8, 44), [32, 8, 24, 16]);
assert.deepEqual(greens, [24, 16, 24, 16]);
assert.ok(
  shiftNext([0.2, 0.6, 0.2], 2, 0.3, 0, 1).every(
    (v, i) => Math.abs(v - [0.1, 0.6, 0.3][i]) < 1e-12,
  ),
);
