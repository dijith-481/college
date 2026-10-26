# Traffic signal experiments

A Rust/WASM queuing engine and a SolidJS interface for the Operations Research project. The control panel owns all model settings. The visual area contains results, individual vehicle playback, an interactive outcome-density plot, and saved comparisons. No backend or remote fonts are used.

## Run

The current NixOS environment already supplies Node.js, npm, Vite Plus, Rust, the WASM target, and `wasm-bindgen` 0.2.129.

```sh
npm install
vp dev
```

Open http://127.0.0.1:5173. Both development and production build commands build the Rust/WASM bundle automatically. Rust source changes rebuild it during development.

```sh
vp check
vp run test:core
vp run test:wasm
vp run test:controls
vp run test:scale
vp build
vp preview
```

`vp check` is the only frontend type-check command. `test:wasm` requires the generated WASM from dev/build or `vp run wasm`. On a new machine, install `wasm32-unknown-unknown` through rustup and `wasm-bindgen-cli` exactly 0.2.129. npm and Cargo lockfiles pin dependencies.

## Review the implementation

| File or crate                         | Purpose                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `crates/random`                       | Replaceable uniform source; 64-bit LCG and exponential inverse transform       |
| `crates/simulation`                   | Arrival scenarios, event state transitions, waiting accounting, vehicle traces |
| `crates/experiments`                  | A bounded experiment session: training, fresh evaluation, optional sensitivity |
| `crates/wasm`                         | Synchronous API, incremental sessions, and a replay preview                    |
| `src/engine.worker.ts`                | Runs Rust/WASM sessions and parallel training workers; reports live progress   |
| `src/controls.ts`                     | Checks inputs, transfers adjacent green/turn allocations, counts timing plans  |
| `src/components/Intersection.tsx`     | SVG vehicle paths through the intersection and onto outgoing roads             |
| `src/components/Ensemble.tsx`         | Canvas density of every search/evaluation outcome                              |
| `src/components/SavedComparisons.tsx` | Compare stored demand, timing, and performance summaries                       |

The event transition function consumes explicit state and configuration and performs no external effects. The experiment session contains explicit mutable orchestration state; batch size does not change its result. There is no randomness in the frontend traffic model.

## Performance

[`PERFORMANCE_ANALYSIS.md`](PERFORMANCE_ANALYSIS.md) records the Rust hot-path review, the approach-level training cache, native before/after timings, numerical comparison, and remaining optimization ideas. The 5× target is exceeded in the measured native searches; browser/WebAssembly timing is a separate measurement.

The scenario presets include a separate Toronto AM-peak demonstration derived from the City of Toronto's intersection turning-movement dataset. The City-sourced [count table](https://www.toraffic.ca/data/intersection-counts) reports 3,139 vehicles/hour at Eglinton Avenue East / Victoria Park Avenue on 2026-09-16. The summary is an intersection total, so the preset evenly divides it across four approach inputs and retains the default 20/60/20 turn split as explicit assumptions; it is not a field-calibrated four-approach dataset or part of the report's reference experiments. The dataset and licence links and assumptions are shown beside the preset in the control panel.

## Larger experiments

The API accepts 2 to 1,000,000 replications, up to 100,000 feasible grid plans, 24-hour horizons, and approach demand up to 20,000 vehicles/hour. A scenario with more than a million expected vehicles is rejected to bound individual-scenario memory. UI ranges are narrower for ordinary operating conditions, with the full million-replication range available.

One scenario at a time is replayed across all training candidates or all evaluation baselines. Welford accumulators summarize results in constant memory per plan. Memory does not grow with replication count: convergence retains fewer than about 200 checkpoints, scalar delay examples retain the first 2,048 results, and one evaluation scenario retains its full vehicle/event trace. Increasing replication count still increases computation time; a million replications across many plans can be a very long job.

`test:scale` completes one million zero-demand replications (four million simulation calls) and checks bounded summaries and exact counts. This is an orchestration stress test, not a realistic-traffic speed benchmark.

The 64-bit LCG has a full-period state recurrence. This version intentionally changes seeded outputs from the previous 32-bit generator. Exported results identify engine version `2-lcg64-batched`. A long period does not establish independence or eliminate LCG correlations.

## WASM interface

- `experiment(JSON) -> JSON`: synchronous complete experiment, retained for native/WASM verification.
- `new ExperimentSession(JSON)`: validate a request and create an explicit batch session.
- `advance(work) -> done`: run up to `work` simulations, capped at 4,096 per call.
- `progress() -> JSON`: stage, exact work counts, fresh replication count, running statistics, and density counts.
- `replay() -> JSON`: the first evaluated run and selected green allocation, once available.
- `ParallelTrainingShard` and `adopt_training(chunks)`: split search across workers and merge it into the Rust session.
- `replay_choice(input, state, green) -> JSON`: regenerate a selected calculated run on demand.
- `result() -> JSON`: completed results; errors until completion.
- `preview(JSON) -> JSON`: one input-timing scenario for playback while training runs.

The worker advances eight simulations per call for roughly 25 ms, then yields. Optimization searches with at least 20,000 evaluations use independent Web Workers, each running the same Rust/WASM engine on a disjoint set of timing candidates and identical seeded arrival scenarios. The pool uses at most 16 workers, about 75% of the browser's reported logical processors, one worker per 1,000 search evaluations, and no more workers than candidates. Rust merges candidate statistics and verifies that every plan and outcome was counted. Fresh evaluation and the optional demand sweep continue on one worker. Small searches avoid the worker startup cost. This is parallel WASM computation through separate workers, without shared-memory WASM threads or cross-origin isolation requirements. Progress messages are limited to about ten per second. It provides an input-timing replay initially and replaces it with the first fresh evaluated scenario. Stop terminates the worker; incomplete work cannot be saved as a completed result. There is no resume checkpoint API.

Sensitivity is optional (`sensitivity: false` by default). Evaluation and baseline comparisons always use the requested replication count. `training_replications` sets a separate search effort per candidate (default 256), also configurable up to one million. This avoids repeating a million final-evaluation runs for every training candidate.

## Understanding the visualizations

The setup panel shows integer expected vehicle counts for the whole run. Its four approach counts always sum to the chosen total: changing the total apportions it by the current proportions, while changing one approach transfers whole vehicles with the next approach (West wraps to North). The frontend converts each count to a vehicles/hour rate using the run duration before submitting the existing Rust request. Actual Poisson arrivals in a replication remain random and need not equal the displayed expected count.

The SVG scene uses left-hand traffic. Incoming approach plus turning movement determines the outgoing road. Arrival and service timestamps come from Rust; visual approach travel and downstream travel have no effect on waiting or throughput. Crossing paths finish by the modeled service completion. Amber occupies part of a modeled clearance interval, followed by all red; neither interval permits modeled discharge. Vehicles join visible queues, follow their movement path, and continue off screen instead of disappearing at the centre.

The outcome canvas has separate datasets for all training simulations and fresh selected-plan replications. Every outcome increments exactly one cell in a 64×40 density grid. Larger/darker dots mean more outcomes; hover exposes count and ranges, click pins, +/− zoom, and dragging pans. Page scrolling remains available over the graph. It does not create one DOM node per replication. Axes expand by merging adjacent bins, preserving total counts. Search outcomes mix plans and should not be interpreted as the selected plan's performance.

The queue graph defaults to the mean number waiting on each incoming road across all fresh selected-plan runs. The engine integrates queue length in 120 equal time intervals, so the area under the four average curves equals mean total waiting time. Switch to “This replay” for a downsampled trace of one scenario. Statistical summaries, convergence, and density also use all fresh replications. Recommended greens minimize estimated training waiting on the configured grid; fresh paired confidence intervals assess the difference from equal green. They are not a proof of the true stochastic optimum.

The convergence chart can focus on the first 100 fresh runs or show the full experiment. Its vertical axis is zoomed to the data and labelled accordingly; the dashed line marks the estimate from all fresh runs, not a known exact answer. The focused view hides the confidence band so early changes in the running mean are visible. The full view shades a confidence interval for the estimated mean, not the spread of individual runs. Timing comparison bars include each plan's four green times, and an expandable table gives exact means, intervals, and paired differences.

## Save and compare

Save a named summary from the control panel. It retains inputs, selected timings, and uncertainty in browser local storage (up to 30 summaries). Select up to three in Saved comparisons. Demand and green allocation appear side by side for each road. Comparisons across changed inputs are descriptive, not paired causal claims. Delete removes only that saved summary.

Download full JSON for the complete current output, including candidate summaries and one vehicle/event trace plus at most eight small replay references. Selecting a replay regenerates its detailed trace on demand. Download saved summaries to retain the comparison records outside the browser. Storage errors are reported; browser storage can be cleared by the browser/user.

See [MODEL.md](MODEL.md) for the precise mathematical contract.
