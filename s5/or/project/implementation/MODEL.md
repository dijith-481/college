# Mathematical contract — engine 2-lcg64-batched

Module 4 of the provided PBCBT504 syllabus establishes the academic scope: arrival and service mechanisms, FCFS queues, Poisson processes, performance measures, random-number generation, and queuing simulation (CO4 and CO6). Signal geometry, grid enumeration, statistical procedures, and the finite-horizon objective are project modeling choices. Ordinary M/M/1 delay equations do not describe the periodic deterministic service here.

## Movements and permissions

Approaches are indexed North, East, South, West. Movement order is Left, Straight, Right. Lane index is `3 × approach + movement`.

| Approach | Left exits toward | Straight exits toward | Right exits toward |
| -------- | ----------------- | --------------------- | ------------------ |
| North    | East              | South                 | West               |
| East     | South             | West                  | North              |
| South    | West              | North                 | East               |
| West     | North             | East                  | South              |

The phases repeat in approach order. Phase i permits exactly lanes 3i, 3i+1, 3i+2. A conservative conflict matrix declares all movements from different approaches conflicting; those from one approach are compatible under diverging paths and separate receiving lanes. The displayed geometry uses left-hand traffic. Outgoing road motion is visual; it has no downstream queue or blocking feedback.

## Arrivals and randomness

Each approach has constant Poisson rate λₐ, entered in vehicles/hour and converted to vehicles/second. Independent turn assignments with shared probabilities p = (left, straight, right) imply movement rates λₐpₘ. They are probabilities, not fixed quotas.

The generator uses `x′ = (6364136223846793005 x + 1442695040888963407) mod 2^64`. The increment is odd and the multiplier is 1 modulo 4, giving a full-period state recurrence. Uniform values use the upper 52 bits: `U = ((x >> 12) + 0.5)/2^52`, which lies strictly between zero and one. Exponential sampling is `gap = -ln(1-U)/λ`; another uniform chooses the movement. Zero-rate approaches generate no arrivals.

A scenario contains all generated arrival times up to T and movement assignments, generated before signal evaluation. Training candidates replay the identical current scenario. Fresh baselines likewise replay an identical evaluation scenario. Consecutive scenarios consume the same explicit generator's sequence. Its longer period does not prove statistical independence; correlations remain a limitation. The initial seed is an unsigned 32-bit input expanded into the 64-bit state.

## Service and waiting

All queues start empty. Each lane is a single FCFS server with a common deterministic service duration h, equal to its discharge headway. Waiting and service populations are separate.

Service begins when its lane has permission, the server is free, and completion at `now+h` is no later than green end. Otherwise the vehicle waits. Service is never interrupted. Total clearance L is divided equally after the phases; it permits no new service or completion events. The animation can show amber followed by all red within this gap, without changing these service rules.

At equal timestamps: service completion, green end, green start, arrival, then insertion order. Completion exactly at green end is valid. Service extending past the observation horizon remains in-service at T and is not counted as a departure.

Vehicle trace fields are identity, lane, arrival, optional service start, and scheduled service completion (`departed`). A scheduled completion may lie after T; completed-departure accounting counts only events processed by T. Incoming travel animation before queue arrival and outgoing motion after service completion are display conventions, not modeled travel time.

## Objective and accounting

For waiting population Qₘ, `D_T = Σₘ ∫₀ᵀ Qₘ(t)dt` in vehicle-seconds. Between events add `Qₘ × Δt`. Integration always extends to T, including unfinished waits. Service time is excluded.

For each lane: arrivals = departures + waiting + in-service. Queue-area verification compares integrated area with waits accumulated up to service start plus partial waits of vehicles still queued at T. The reported accounting error is the sum of absolute lane discrepancies from floating-point arithmetic.

Time-average queue = area/T. Throughput = departures × 3600/T. Utilization = time in service/T. Maximum queue is sampled after each atomic event. `Run.max_queue` is the largest single-lane maximum, not the largest simultaneous intersection total.

`waiting_per_arrival` summarizes each replication's D_T/arrivals (zero for no arrivals). It is accumulated observed waiting per arrival, including censored waits, not completed-trip delay or a pooled ratio across runs. Little's relation is not enforced as an exact finite-window assertion.

## Search and fresh evaluation

Integer-second greens satisfy `Σgᵢ = C-L` and common min/max bounds. Search uses `gᵢ = min + kᵢ × step`, including the fourth phase. Current input greens obey bounds and integrality but need not lie on that lattice. UI edits preserve all other fields. Number inputs allow exact values; invalid totals, bounds and grids are flagged and disable Run. Green rebalancing is available only through an explicit action. Rust independently validates requests.

Train every feasible timing on `training_replications` shared scenarios. Select the smallest training mean total waiting, resolving ties by enumeration order. Equal and demand-proportional targets are projected onto the feasible grid by squared Euclidean distance.

A separate fresh batch of `replications` scenarios evaluates selected, input, equal-green, and proportional plans on matched arrivals. Paired savings equal baseline delay minus selected delay; positive values favor the selected plan. A training winner can perform worse in fresh evaluation, which the interface reports.

The selected plan's mean queue trajectory divides `[0,T]` into 120 equal intervals. For approach `a` and interval `b` of width `Δ`, the plotted height is `Σᵣ ∫_b Qₐ,ᵣ(t)dt / (RΔ)`, over all `R` fresh evaluation runs. Queue integration is exact within each event interval. The chart is an interval average, not an instantaneous queue sample; its four curves have total area equal to the fresh-run mean `D_T`. Only 120 × 4 accumulated areas are retained, independent of replication count. Training runs, baseline plans, and optional sensitivity runs do not enter this trajectory.

Optional sensitivity scales all approach demands by 0.5, 0.75, 1, 1.25, and 1.5 while holding the selected timing fixed, using additional scenarios. Rates exceeding the engine's approach limit are omitted. There is no re-optimization at each scale.

## Incremental statistics and batches

A Session explicitly stores its stage (training, evaluation, optional sensitivity, done), current scenario, counters, generator state, and moment accumulators. One unit of work is one complete simulation. Batch boundaries neither change scenario generation nor evaluation order.

Welford updates are `n += 1`, `delta = x-old_mean`, `mean += delta/n`, `M2 += delta*(x-new_mean)`. Sample variance is M2/(n−1), SE = s/√n. Approximate 95% intervals are mean ± t[0.975,n−1]SE, tabulated through 30 degrees of freedom and approximated above it. Intervals are pointwise and unadjusted for multiple comparisons; sampling assumptions and model limitations apply.

Convergence retains early prefixes and roughly 160 spaced checkpoints; every observation contributes to each applicable running estimate. Only the first 2,048 scalar delay examples and first fresh detailed replay are retained. A bounded set of replay references stores generator state, green allocation and observed outcomes for selected search, fresh and baseline runs; choosing one regenerates its trace. One scenario at a time is reused across plans in each worker. Parallel search workers evaluate disjoint candidate ranges against identical seeded scenarios and merge statistics before fresh evaluation. Memory grows with worker count and candidate count, not with R.

Outcome densities use 64×40 count grids of accumulated waiting per arrival versus final waiting population. Training and fresh selected-plan results are separate. Axis ranges double when necessary; adjacent cells merge while preserving counts. All outcomes contribute exactly once to their dataset. No raw-point subsampling is used for the density, and cell counts are 64-bit.

## Model boundaries and verification

The finite operating period starts empty. There is no stationary warm-up, downstream spillback, platooning, pedestrian phase, lane changing, physical acceleration, or microscopic collision model.

Tests verify sampling, manually calculated traces, boundary behavior, conservation, phase permissions, grid enumeration, paired arithmetic, batch-size invariance, progress totals, bounded summaries, and density conservation. Native/WASM checks compare equivalent requests and incremental/synchronous results. Browser checks cover constraints, progress, stop, vehicle playback, interactive graphs, saving/comparison persistence, and mobile layout.
