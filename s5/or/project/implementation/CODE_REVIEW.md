# Rust core code review — `random` → `simulation` → `experiments` (→ `wasm`)

Scope: `crates/random/src/lib.rs`, `crates/simulation/src/lib.rs`, `crates/experiments/src/lib.rs`,
`crates/wasm/src/lib.rs`, plus the interactive loop in `src/engine.worker.ts` /
`src/training.worker.ts`. Requirements checked: (a) correctness of the event/queue model,
(b) pure-functional style where possible, (c) performance on the interactive and batch paths.

Verification performed:

- `cargo test --workspace` — all tests pass.
- `cargo clippy --workspace --all-targets` — 2 warnings, both in `simulation`
  (`needless_range_loop` at `lib.rs:304`, `needless_option_as_deref` at `lib.rs:385`).
- Release-mode measurements on this machine (throw-away bench, not committed):

| case | result |
| --- | --- |
| `feasible()` worst legal grid (`min=1, max=600, step=1, total=4`) | **503 ms native for one plan** |
| 1 h, 20 000 veh/h × 4, 80 117 arrivals — `simulate(trace=false)` | 27.5 ms |
| same, `trace=true` — 84 915 frames | 45.3 ms, **25 MB** of JSON |
| 4 h, same rates — 319 916 arrivals | 107 ms no-trace, 157 ms trace, **105 MB** JSON |
| 24 h, 10 000 veh/h × 4 — 959 899 arrivals | 448 ms no-trace; trace extrapolates to **~630 MB** JSON |

Headline: the **model is correct** — I could not find a logic error in event ordering,
service rules, area integration, conservation, or the training/evaluation pairing; the tests
are genuinely meaningful. The weaknesses are (1) an unbounded trace payload that is reachable
from the UI, (2) a cubic feasibility enumerator that is multiplied by the worker count,
(3) per-observation allocation/formatting in the hottest training loop, and (4) an
`&mut`-heavy session design where most of the impurity is avoidable.

---

## 1. How the layers fit (and where the impurity lives)

```
seed ──> random::Lcg ──> simulation::scenario ──> Scenario (arrivals + display samples)
                                                        │
Config ────────────────────────────────────────────────┴──> simulation::simulate / simulate_with_profile
                                                                     │  Run (delay, lanes, frames, vehicles)
                                                                     v
experiments::Session (training -> evaluation -> sensitivity) ──> Output / Progress
                                                                     │
wasm_bindgen exports ──> engine.worker.ts (advance(8) in a 25 ms budget, progress every 100 ms)
```

Purity is already better than it looks:

- `random::exponential` — pure.
- `simulation::transition(State, Event, &Config) -> State` — a genuine pure state transition
  (ownership move, no interior mutation).
- `simulation::simulate(config, scenario, trace)` — referentially transparent: same inputs,
  same `Run`, never touches an RNG.
- `experiments::{feasible, baseline, statistics, Moments::summary, Session::progress,
  Session::output, Session::replay_choices}` — pure projections.

The two real impurity sources are the stateful RNG (`Uniform::uniform(&mut self)`) and
`Session::advance(&mut self)`. Both are confined to the worker boundary, which is the right
place for them, but they can each be re-expressed as pure reducers without losing speed
(section 6).

---

## 2. `crates/random` — function by function

### `trait Uniform { fn uniform(&mut self) -> f64; }` — `lib.rs:1-3`

The entropy interface used by `scenario`. It is deliberately minimal and object-safe, so
`simulate` never sees it. Assessment: correct abstraction, but it is *stateful by signature*,
which is the only reason `scenario` is impure. A pure companion (`fn next(state: u64) -> (u64, f64)`)
would cost nothing and make the whole pipeline a fold. Also missing `Debug`/`Clone` bounds in
the trait (not needed, since it is only used as `&mut impl Uniform`).

### `struct Lcg(u64)` + `new(u32)` / `from_state(u64)` / `state()` — `lib.rs:5-18`

A newtype over the 64-bit LCG state. `new` expands the user seed as `u64::from(seed)` — no
mixing step. `from_state`/`state` are the replay hooks used by `TrainingChunk::end_state`,
`ReplayChoice::state`, and `first_evaluation_state`. That round-trip is sound: the state is the
entire generator state, and `format!("{:016x}")` → `from_str_radix` is lossless.

Notes:

- Seeds differing by one are correlated through the first multiplication, but only for the
  *first* draw, which is then avalanche-mixed by a 64×64 multiply; not a practical issue here.
- `#[derive(Clone)]` is enough; `Copy` would also be fine (it is a single `u64`).
- No `Default`, so a caller must pick a seed explicitly — good for reproducibility.

### `impl Uniform for Lcg { fn uniform(&mut self) -> f64 }` — `lib.rs:20-29`

The math is right and matches `MODEL.md` exactly:

- recurrence `x' = 6_364_136_223_846_793_005·x + 1_442_695_040_888_963_407 (mod 2^64)`
  (Knuth/MMIX constants; multiplier ≡ 1 mod 4, odd increment ⇒ full period 2^64);
- output uses the **upper 52 bits** with a half-ulp offset: `((x >> 12) + 0.5) / 2^52`, so the
  result is in the *open* interval (0, 1). That is exactly what `-ln_1p(-u)` needs — no
  `ln(0)` and no `u == 1` singularity.

Things worth noting:

- Low bits of an LCG are weak; the code correctly discards them.
- Consecutive output pairs still lie on lattice hyperplanes (inherent to LCG). Each arrival
  consumes *two* consecutive draws (gap, then movement), so gap and turn choice are
  correlated by construction. `MODEL.md` acknowledges this honestly. If you ever want better
  statistics without changing the API, wrapping the output in SplitMix64 finalization
  (`x ^= x >> 30; x *= 0xbf58476d1ce4e5b9; ...`) costs ~3 ns/draw and decouples the pairs,
  at the price of breaking every stored seed's results. Do not do it casually.
- The magic constants are duplicated between production and the test at `lib.rs:44`; factor
  them into named `const MULTIPLIER/INCREMENT/MODULUS` or the test is fragile.

### `fn exponential(uniform: f64, rate: f64) -> f64` — `lib.rs:31-33`

Inverse-CDF sampling: `-ln(1-u)/λ`. Using `ln_1p` on a value near 0 is the accurate choice
(avoids catastrophic cancellation for tiny gaps). Correct for `u ∈ (0,1)`, `rate > 0`.
Two small things:

- `rate == 0` yields `+inf` (or `NaN` for `gap == 0`); it is only guarded *outside* this
  function (`scenario` skips zero-rate approaches). A `debug_assert!(rate > 0.0)` documents
  the contract.
- In the hot loop the division is per arrival; `rate` is constant per approach, so compute
  `inv_rate = 1.0 / rate` once and return `-(-u).ln_1p() * inv_rate`. Same result within an
  ulp; the multiplication is materially cheaper than a divide.

### tests — `lib.rs:35-70`

Good tests: exact first output, 100 k samples strictly inside (0,1), mean/variance of the
uniform (0.5, 1/3), and exponential mean ≈ 6 for rate 1/6. Missing: an explicit
state round-trip test (`from_state(x.state()).uniform() == x.uniform()`), and a check that
`exponential` matches `-T::ln(1-u)/rate` for a range of inputs.

**random verdict:** correct, minimal, and the only function I would change for speed is
`exponential` (precomputed inverse rate), and for design the `Uniform` trait → pure
`next(state)`. No numerical bugs.

---

## 3. `crates/simulation` — function by function

### `Config` + `Config::validate` — `lib.rs:8-49`

`Config` is a plain value type: `horizon, cycle, clearance, headway, rates[4], turns[3], green[4]`.
`validate` is one long boolean that rejects non-finite numbers, out-of-range values, turn
probabilities that do not sum to 1 (`|Σp − 1| ≤ 1e-9`), greens below the discharge headway,
and a green budget that does not close the cycle (`|Σg + L − C| ≤ 1e-8`). It is a pure
predicate and the right place for the invariants.

Observations:

- It uses `!(a..=b).contains(&x)` consistently, so `NaN` is rejected even before `is_finite`;
  fine.
- Tolerances are absolute (`1e-8`), which is appropriate at these magnitudes.
- It does **not** check `green.len()`/`rates.len()` (fixed arrays, so fine), nor the
  `horizon·Σλ ≤ 10⁶` guard (that lives in `Session::new`, `experiments:462`) — so
  `simulate` accepts a 24 h × 80 000 veh/h request that the UI/`Session` rejects. See S5.
- `validate` returns `Result<(), String>` — fine for a WASM-facing API, but it makes the
  library error type stringly typed. Not worth changing for this project.

### `struct Arrival` / `struct Sample` / `struct Scenario` — `lib.rs:50-67`

`Arrival { time, lane }` (lane = `3·approach + movement`), `Sample { approach, uniform, gap, time, movement }`
(first ≤16 arrivals kept for the UI's sampling panel), `Scenario { arrivals, samples }`.
`Arrival`/`Sample` derive `Serialize` only; `Scenario` derives `Serialize` only (it is never
deserialized — replay regenerates it from an RNG state, which is the cheaper and more honest
design). Correct.

### `fn scenario(config: &Config, rng: &mut impl Uniform) -> Scenario` — `lib.rs:68-113`

For each approach:

1. `rate = rates[a]/3600` vehicles/s; skip exactly-zero rates.
2. Loop: draw `u`, `gap = exponential(u, rate)`, `time += gap`, stop when `time > horizon`.
3. Draw a second `u` and map it to a movement via the cumulative turn probabilities
   (`u < p₀`, `u < p₀+p₁`, else right).
4. Push `(time, 3a + movement)` and, for the first 8 per approach, a display `Sample`.

Then sorts arrivals by `(time, lane)` and samples by time, truncating to 16.

Correctness notes:

- The movement interval is closed at `u = p₀` etc. and probabilities sum to 1, so every `u`
  maps to exactly one movement. ✓
- Interleaving the four approaches (each a separate thinning-free Poisson stream) and then
  sorting is exactly the superposition of four independent Poisson processes. ✓
- `sort_by` is a *stable* sort, so equal `(time, lane)` ties keep generation order; this
  matters only for display, because the simulator re-sorts arrivals through the priority
  queue with a deterministic tie-break (S4).
- `if sampled < 8` *before* the global `truncate(16)` means the kept samples are the earliest
  8 of each approach, then the globally earliest 16 of those. That is a defensible UI choice,
  but note it is not "16 uniform samples over the horizon" as a reader might assume.
- `config.turns[0] + config.turns[1]` is recomputed for every arrival; hoist into a
  `let straight_end = ...` outside the loop.
- `arrivals` grows without a capacity hint; a 24 h heavy run is ~1 M pushes (~16 MB of
  realloc churn). `Vec::with_capacity((Σλ·T/3600·1.05) as usize)` per approach would remove it.
  (You cannot reserve a global capacity up front cheaply, but reserving `sum/4` per approach is
  accurate.)
- The four per-approach streams are generated in sorted order already; a 4-way merge plus a
  final `merge` is O(N log 4) instead of O(N log N) (measured 59 ms for 960 k arrivals,
  including generation). Secondary but free.

### `enum Kind`, `struct Event`, `Event::priority`, `Ord`/`Eq` impls — `lib.rs:114-156`

`Kind` is `Departure(lane) | PhaseEnd | PhaseStart(phase, green_end) | Arrival(lane, id)`.
`Event` carries `time`, a monotonically increasing `order`, and the kind. The ordering is
encoded as a *max-heap tie-break inversion*: `cmp` compares times with `total_cmp` reversed,
then `priority` reversed, then `order` reversed, so `BinaryHeap` pops

1. smallest time (NaN-safe via `total_cmp`),
2. then smallest priority: Departure (0) → PhaseEnd (1) → PhaseStart (2) → Arrival (3),
3. then smallest insertion order.

This is a correct total order, `Eq` is consistent with `Ord` (it delegates to `cmp`), and it
matches `MODEL.md` line 32 exactly. Completion at green end is allowed because the deadline
check is `time + headway <= green_end` (inclusive), and a departure scheduled exactly at green
end is popped before `PhaseEnd` at the same timestamp. ✓

One robustness note: `order: usize` is compared after `priority`, so it only breaks ties inside
one kind. That is what you want, but it also means the *cross-kind* order is fixed by
`priority()` alone; if the model ever needs "arrival before phase start" at a boundary, this is
the single place to change.

### `struct Lane`, `struct State` — `lib.rs:157-176`

`Lane` is the per-server record: FCFS `waiting: VecDeque<(id, arrival_time)>`, optional
`service_end`, counters (`arrived`, `departed`), integrators (`area`, `started_wait`,
`busy_time`), and `max_queue`. `State` holds time, current phase, green end, 12 lanes, the
event heap, the sequence counter, and the optional vehicle trace. Every field is needed; this
is a clean SoA-ish split. `Lane: Default` gives the all-empty start. `State` is not `Clone`,
which is deliberate and good — `transition` moves it.

Naming nit: `started_wait` accumulates *completed* waits up to service start, and `area`
accumulates *all* waiting time; the names read backwards. `completed_wait` / `queue_area`
would be clearer.

### `fn transition(mut state: State, event: Event, config: &Config) -> State` — `lib.rs:177-226`

This is the heart of the model, and it is a pure function of `(State, Event, Config)`.

Walkthrough:

1. `dt = event.time − state.time`; for all 12 lanes add `waiting.len()·dt` to `area`, and, if a
   service is active, add `dt` to `busy_time`. Because events are atomic and queues only change
   at events, `Q(t)` is constant on `[state.time, event.time)`, so this is an exact left
   Riemann sum — no sampling error.
2. Set `state.time = event.time`.
3. Apply the event:
   - `Arrival(m, id)`: `arrived += 1`, push `(id, event.time)`.
   - `Departure(m)`: clear `service_end`, `departed += 1`.
   - `PhaseEnd`: `phase = None`.
   - `PhaseStart(p, end)`: `phase = Some(p)`, `green_end = end`.
4. Then, for every lane `m`, if `phase == Some(m/3)` **and** the server is free **and**
   `now + headway ≤ green_end` **and** the queue is non-empty: pop the head, add
   `now − arrival` to `started_wait`, stamp `started`/`departed` on the vehicle trace, schedule
   a `Departure` at `now + headway` with a fresh `sequence`, and remember `service_end`.
5. Update `max_queue` per lane.

Why it is right:

- A single free server per lane can only start one service per event; the `if let` is correct.
- A departure and the next service start happen in the same transition at the same instant, so
  a saturated lane is never idle for a positive interval — the accounting stays exact.
- Because a service may only start if it can *complete* by green end, `service_end` can never
  straddle a `PhaseEnd`; a lane can never be "busy" outside its permission, which is exactly
  what the heavy-demand test asserts (`lib.rs:562-579`).
- At `PhaseEnd`, `phase` becomes `None` before the start scan, so no new service starts at the
  green boundary; a departure at that boundary was already popped first (priority 0) and its
  successor is rejected by the deadline check. ✓
- `dt` is exactly zero for same-time events, so no area is double counted.
- `state.sequence` only grows; `order` therefore never wraps in a run.

I checked every boundary case I could construct (arrival exactly at green start, completion
exactly at green end, arrival exactly at horizon, clearance = 0, non-multiple-of-4 clearance,
zero demand, saturated lanes) and found no incorrect behavior:
`completion_at_boundary_and_conservation` and `manual_waiting_and_green_boundary` pin the two
trickiest ones by hand (`delay = 78`, `utilization = 4/96`).

Cost: step 1 is 12 lanes × 2 branches per event, and step 4 scans 12 lanes to touch at most 3.
For an 80 k-arrival run (~160 k events) that is ~2 M pointless lane visits. See O1.

### `Frame`, `LaneResult`, `VehicleTrace`, `Run` — `lib.rs:227-269`

`Frame` snapshots time, phase, `queues[12]`, `busy[12]`, cumulative `departed`, and cumulative
`delay` (= total area so far). `LaneResult` is the final per-lane summary. `VehicleTrace` is
`id/lane/arrived/started/departed` — note `departed` is the *scheduled* completion, which may
lie past the horizon, and `started` is `Option` (never served). `Run` aggregates everything.

The UI depends on the per-event `Frame` semantics: `App.tsx:236` reconstructs the live queue as
`frame.delay + Σframe.queues·(t − frame.time)`, which is only correct because a frame exists
after *every* state change. Do not "decimate frames" casually — see S2/O4.

### `fn frame(&State) -> Frame` — `lib.rs:270-279`

A pure projection: six allocations-cum-arrays per event when `trace = true`
(`from_fn` over 12 lanes twice, plus two 12-lane sums). Correct, but it is ~35% of trace-mode
time (45.3 ms vs 27.5 ms measured) and is what blows up the payload (S2).

### `fn simulate` / `fn simulate_with_profile` — `lib.rs:280-290`

Thin entry points; `simulate` delegates with `profile = None`, `simulate_with_profile` passes a
caller-owned `&mut [[f64; 4]]`. Both are pure apart from the profile buffer. That buffer is the
one place where performance beat purity — and it did not have to: the profile is only used for
the selected plan on fresh runs (`experiments:618-624`), so returning `Vec<[f64; 4]>`
(120 × 32 B = 3.8 KB) per run would be negligible. See P3.

### `fn add_queue_area(state, end, horizon, profile)` — `lib.rs:291-310`

Integrates the approach-level queue `Qₐ(t)` (sum of the three lanes) into `profile[bin][approach]`
over `[state.time, end)`, splitting across bin boundaries.

- `width = horizon / bins`; bins are `[b·w, (b+1)·w)`; `first`/`last` are clamped to the bin
  range.
- Per bin, `dt = min(end, upper) − max(state.time, lower)`, clamped at 0.
- Because the caller invokes it once per event and once for the tail, the profile integrates
  the same piecewise-constant function as `area`, so the test
  `queue_profile_area_matches_waiting_time` (equality with lane delay to 1e-8) is a real
  invariant, not a tautology. ✓
- The `queues` snapshot is recomputed per call (12 lane lengths), and `width`/`first` are
  recomputed per event even though `width` is constant; hoist those into a small
  `ProfileSink { width, bins }`. Only 120 bins and fresh-evaluation runs use it, so low priority.
- The `needless_range_loop` clippy warning is here; iterating `profile[first..=last]`
  with `enumerate()` is both cleaner and marginally faster.
- Bedrock issue for purity: it mutates the caller's slice. See P3.

### `fn simulate_core(config, scenario, trace, profile) -> Run` — `lib.rs:311-439`

The driver. Steps:

1. Build a `BinaryHeap` with **every arrival** (id = index in the sorted scenario) and, for
   every cycle starting before the horizon, **8 phase events** (`PhaseStart(p, start+g_p)` and
   `PhaseEnd` at `start+g_p`), where each phase is followed by `clearance/4`.
2. Seed the `State` (time 0, `phase = None`, 12 empty lanes); create `vehicles` only when
   `trace`.
3. Drain the heap while `event.time ≤ horizon`: integrate the profile interval, then
   `state = transition(state, event, config)`, then push a `Frame` when tracing.
4. Integrate the tail `[state.time, horizon]` into lane areas/busy time and the profile, set
   `state.time = horizon`, push a final frame.
5. Project 12 `LaneResult`s, the `accounting_error`, and the aggregated `Run`.

Correctness:

- The schedule closes the cycle: `Σg + 4·(L/4) = C`. Phase `p` starts at
  `Σ_{i<p} g_i + p·L/4`. With `L = 0`, the next `PhaseStart` shares a timestamp with the
  preceding `PhaseEnd` and the priority order resolves it correctly (end before start). ✓
- Events after the horizon are dropped without being transitioned, so `departed` and `area`
  only count what happened by `T`; unfinished service remains `in_service`, exactly as
  `MODEL.md` line 32-33 and the `service_at_horizon_is_not_waiting_or_a_departure` test
  require. ✓
- `accounting_error` is `Σ_m |area_m − completed_wait_m − Σ_{waiting}(T − arrival)|`.
  That identity is exact in real arithmetic and matches the queue-area semantics. It is a
  diagnostic, not an invariant test, so the float residue at 1 M vehicles may exceed the
  `1e-8` used in unit tests; the tests only run 96-600 s, so they are safe.
- `accounting_error` does **not** cover the conservation identity `arrived = departed +
  remaining + in_service`; the tests check it separately. Consider folding it into the same
  field so the UI's single number catches both classes of drift.
- `mean_queue` per lane is `area / horizon`, so `Run.mean_queue` is the *sum* of lane averages
  = time-average total queue. `MODEL.md` line 42 says the same. ✓
- `throughput = Σdeparted · 3600 / horizon`. ✓
- `Run.max_queue` is the max over lanes, not the max simultaneous total — correctly documented.
- If a caller passes an unsorted scenario, the heap still orders events correctly, but the
  initial `vehicles` vector includes arrivals with `time > horizon` that are never popped
  (ghost rows with `departed = None`). `scenario` never produces them, but the public API
  would. Truncate `scenario.arrivals` to `t ≤ horizon` when building `vehicles` (or
  `debug_assert`). Low severity, cheap fix.
- `trace = true` retains every event, and `vehicles` retains every arrival. This is S2.
- Phase events are queued for cycles whose start is `< horizon` even if every event in that
  cycle is past `horizon`; at most one cycle's worth of waste, harmless.
- Profile call site: `add_queue_area` runs before each transition and once after the loop. The
  only way to double count is an event with `time == state.time` (dt = 0) — safe.

### tests — `lib.rs:440-580`

Strong suite: hand-computed delay, completion exactly at green end, conservation, determinism
after regenerating a scenario, profile area == queue delay, empty demand, invalid turns,
in-service at horizon, and phase permission under saturation. Gaps I would fill:

- `clearance = 0` and `clearance % 4 ≠ 0`.
- phase boundary exactly at `T`; arrival exactly at `T`.
- unsorted manual scenario (should equal sorted).
- a direct `Event` ordering test (the `cmp` inversion is subtle).
- `simulate` with a zero headway would divide nothing but violates validate; assert the
  public entry validates or document that it must.

---

## 4. `crates/experiments` — function by function

### `struct Request` + `default_training` — `lib.rs:7-23`

The serialized job description: `config`, `replications`, `training_replications`
(default 256, so old saved requests still deserialize), `grid_step`, `min_green`, `max_green`,
`seed`, `optimize`, `sensitivity` (default false). `#[serde(default)]` on the two optional
fields is the right compatibility tool. Note that `training_replications` is validated even
when `optimize = false` (2..=1e6) — harmless but surprising.

### `struct Moments` + `push` + `summary` — `lib.rs:33-79`

Welford's online mean/variance: `n += 1; delta = x − mean; mean += delta/n; M2 += delta·(x − mean_new)`.
This is the numerically stable form (better than `Σx²`), and it is the right choice for
millions of observations.

`summary`:

- `n == 0` → all-zero `Statistics` (so `Progress` can be serialized before any run).
- `sd = sqrt(M2/(n−1))`, `se = sd/√n`.
- Student-t critical value: exact lookup through `df = 30` (`critical[0] = 0` for `n = 1`), then
  `1.959964 + 2.372/df + 2.822/df²` above that. The approximation is continuous with the table
  (df=31 → 2.0394 vs true 2.0395) and is documented as approximate. ✓
- `df <= 30` indexes `critical[df]` with a 31-entry table — index 30 is the last, so no panic. ✓
- `n = 1` gives `sd = se = 0`, interval `[mean, mean]`; acceptable.

Purity: `push` is `&mut self` (a fold step), `summary` is pure. At the call sites the mutation
is a loop-local accumulator, so the enclosing `simulate`/training is still deterministic.

### `fn statistics(&[f64]) -> Statistics` — `lib.rs:80-86`

Convenience fold over `Moments`. Pure. Fine; only used in tests today.

### `Candidate`, `Comparison`, `DemandPoint` — `lib.rs:87-105`

Pure output records: search candidate (`green`, delay stats), baseline comparison
(`label`, `green`, delay stats, paired-saving stats), and a sensitivity point
(`scale`, total rate, delay stats, backlog stats). All `Serialize` only. Good.

### `struct Distribution` + `merge` + `push` — `lib.rs:106-183`

A 64×40 histogram of `(wait per arrival, backlog)` with 64-bit counts, `total`, and dynamic
axis maxima. `push`:

- Grows an axis by powers of two while the value is outside the range, halving existing cell
  indices (`x/2`, `y/2`) so the old histogram is exactly coarsened, then bucketizes with
  `(v / max · size) as usize` and clamps. Counts are preserved by construction. ✓
- The grow loop reallocates a fresh `Vec` on every doubling; compute the needed power-of-two
  once and coarsen once. Minor (only when an outlier first appears).

`merge`:

- Grows `self` until it covers `other`'s maxima, then maps each `other` cell by its **center**
  `((x+0.5)·other.max/self.max)` into `self`. Sum is preserved. ✓
- Determinism caveat: the grid resolution at the time of a push/merge depends on the *order*
  of observations, so serial training and 16-shard training can produce **different
  histograms** for the same outcomes (the test only compares `total` and candidate means at
  `lib.rs:1046`). The axis range is also order-dependent. This is not wrong for a density
  plot, but "parallel training matches serial" is only true for the statistics, not the
  density image. Either (a) fix the grid at a pre-declared resolution (e.g., always grow to
  `2^k` covering the maximum observed so far, which is what merge effectively does), or
  (b) document that the density is order-dependent. I would do (a): normalize both operands to
  a common power-of-two resolution before pushing cells, making merge associative. That also
  makes the parallel result exactly reproducible.
- `merge` is O(cells) per shard and is called once per chunk (≤ 16), so performance is fine.

### `ReplayChoice`, `QueuePoint` — `lib.rs:184-196`

`ReplayChoice { label, state: String (hex), green, delay, remaining }` is the UI's replay
bookmark; `QueuePoint { time, queues[4] }` is a profile sample. Both fine as data, but see E2
for the cost of building/formatting them in the training loop.

### `struct Output` — `lib.rs:198-219`

The complete result: request echo, selected greens, candidates, comparisons, stats,
queue profile, the first fresh `Run` (trace), replay choices, samples, 2048 replicate delays,
sensitivity, and two distributions. Serialized once. Note it duplicates the same detailed
`Run` that `replay()` already sent (frames + vehicles) — see S2/E9.

### `enum Stage`, `struct Progress` — `lib.rs:220-240`

The stage machine Training → Evaluation → Sensitivity → Done, and the small JSON payload the
UI polls every 100 ms. `Progress` includes `estimate`, `distribution`, and
`search_distribution` by value. `Session::progress` clones both distributions
(2 × 2560 × 8 B = 40 KB) every call (E3).

### `fn feasible(&Request) -> Result<Vec<[f64; 4]>, String>` — `lib.rs:242-285`

Enumerates integer green plans on the lattice `gᵢ = min + kᵢ·step` with `Σg = C − L` and
`min ≤ gᵢ ≤ max`.

- First verifies `C − L` is an integer (tolerance 1e-9), the grid parameters (`step ∈ 1..=60`,
  `1 ≤ min ≤ max ≤ 600`, `min ≥ headway`), and that the total is compatible
  (`4·min ≤ total ≤ 4·max`, reachable on the step lattice).
- Triple nested `for a / for b / for c`, then `d = total − a − b − c`, filtered to
  `min ≤ d ≤ max` and lattice-aligned. `d` is automatically on the lattice because
  `total ≡ 4·min (mod step)`, so the final `is_multiple_of` is redundant but harmless.
- Caps at 100 001 plans with a helpful message, and guarantees non-empty.

The mathematical enumeration is **correct** (the test pins 84 plans for a known grid). The
problem is the control flow:

- Every `(a,b,c)` triple is visited even when `a+b+c > total`. Complexity is
  `O(((max−min)/step)³)` **independent of the number of feasible plans**.
- Measured worst legal case: `min=1, max=600, step=1, total=4` → 600³ = 216 M iterations,
  **503 ms in native release for exactly one plan**. WASM is slower. The UI lets users reach
  this (bounds 1..=600, step 1, cycle 24, clearance 20).
- In parallel mode this runs in `Session::new` **and** in every `TrainingShard::new`
  (`lib.rs:328`), i.e. up to 17 times → ~8.5 s of pure enumeration before any work starts.
- The `plans.len() > 100_000` check is inside the innermost loop, but because over-total
  triples `continue` without pushing, it does not bound the iteration count.

Fix (keeps the exact same plan ordering, so tie-breaks do not change):

```rust
let step = step as usize;
for a in (min..=max).step_by(step) {
    if a + 3 * min > total { break; }
    for b in (min..=max).step_by(step) {
        let rest = match total.checked_sub(a + b) { Some(r) if r >= 2 * min => r, _ => break };
        let lo = min.max(rest.saturating_sub(max));
        let hi = max.min(rest - min);
        // c stays on the min + k·step lattice
        let mut c = min + (lo - min).div_ceil(step as u32) * step as u32;
        while c <= hi {
            plans.push([a as f64, b as f64, c as f64, (rest - c) as f64]);
            if plans.len() > 100_000 { return Err(/* … */); }
            c += step as u32;
        }
    }
}
```

This visits only real candidates plus the two outer scans, so worst case is ~O(#plans + 600²/step²)
and the pathology becomes microseconds. I verified this version against the original on 83 663
parameter sets (identical plan lists, including order) and timed the pathological case at 184 ns
instead of 503 ms. Also consider caching the plan list: `Session::new` could pass it to shards
instead of each shard recomputing it (the wasm API currently can't, so fixing the enumerator is
the cheaper route).

### `fn baseline(target, plans) -> [f64; 4]` — `lib.rs:286-299`

Projects an ideal (equal or demand-proportional) allocation onto the feasible lattice by
minimum squared Euclidean distance. `min_by` returns the **first** minimum, so ties resolve by
enumeration order, matching the documented rule. Correct.

Small things:

- The distance closure is recomputed on both sides of every comparison → ~`2·4·n·log n`
  multiplications instead of `4·n`. Precompute a `Vec<(f64, [f64;4])>` or write a single
  `for` loop with strict `<` (also makes the tie rule explicit rather than relying on
  `min_by` semantics).
- `unwrap()` is safe because `feasible` guarantees a non-empty list, but it is implicit; a
  `debug_assert!(!plans.is_empty())` documents the contract.

### `struct TrainingChunk` — `lib.rs:301-309`

The serialized shard result: `start`, per-plan `Moments`, distribution, `end_state` (hex), and
the best/worst replay bookmarks. `Serialize + Deserialize` so it crosses the worker boundary
as JSON. Good design: the shard never needs to send raw samples, only sufficient statistics.

### `struct TrainingShard` + `new`/`completed`/`total`/`advance`/`result` — `lib.rs:311-413`

The parallel training worker. `new` validates the request, re-enumerates `feasible`, validates
the `[start, end)` range, and seeds its own `Lcg` with the same `request.seed`. Because the
scenario for replication `r` depends only on `(seed, r, config)` and not on the plan slice,
every shard sees the *same* scenarios — this is the key design insight, and `adopt_training`
verifies it by comparing `end_state`s.

`advance(work)`:

- Caps at 4096 iterations (same as `Session`).
- Generates the scenario once per replication and reuses it for all plans in the shard slice
  (correct and essential).
- For each plan: `simulate` with `trace = false`, push `delay` into `training[plan]`, push
  `(delay/arrivals, remaining)` into the density, and construct a `ReplayChoice` for the
  best/worst comparison.

`completed` = `replication·plans.len() + index`; `total` = `training_replications·plans.len()`.
`result` refuses while incomplete, then clones the `Moments` vector (up to 19 369 × 24 B ≈
465 KB — fine) and the distribution (20 KB).

Per-run waste (shared with `Session::advance`):

- `self.request.config.clone()` per simulation (E4).
- `ReplayChoice` construction per simulation: one `format!("{:016x}")` **and** one
  `String` (`"Search outcome".into()`) allocation per run, even when the run is neither the
  best nor the worst (E2). For 2.5 M training runs that is ~5 M allocations.
- `simulate(..., false)` still builds the full `Run` with 12 `LaneResult`s, a `frames` Vec, and
  a `vehicles` Vec, even though the shard needs only `delay`, `arrivals`, `remaining`
  (E1).
- `advance` returns after `work.min(4096)`; the caller loops. Fine, but the cap is silent —
  document it.

### `struct Session` — `lib.rs:415-453`

A flat mutable record holding: request, plans, per-plan training moments, RNG, stage and
counters, cached scenario + state, replay bookmarks (4 kinds), selected greens, three baselines
and their moments/savings, the selected-run accumulators (delay, queue, profile area,
throughput, backlog, wait), the detailed `Run`, samples, convergence, 2048 delays, sensitivity
state, and two densities. It is large but not redundant — each field has one owner.

Design assessment: this is the least "functional" part of the codebase. It is an explicit
state machine, which is actually the right *shape* for a resumable interactive job; the issue
is that every transition is written as mutation of `self` inside one 175-line method, which
makes it hard to test a single stage in isolation. See P5 for a reducer refactor that keeps the
same performance.

### `Session::new` — `lib.rs:455-544`

Validates config, replication bounds (2..=1e6), a one-million-expected-vehicle guard, feasible
plans, and integer/bounded input greens. Computes:

- the sensitivity scales `[0.5, 0.75, 1, 1.25, 1.5]` filtered so no arm exceeds 20 000 veh/h;
- `total` = `plans·training_reps + (4 + scales)·reps` (the exact number of simulations the job
  will run — this is what `Progress.total` reports);
- equal and demand-proportional baselines, projected onto the grid via `baseline`;
- initial `selected = input greens` (used directly in evaluation when `optimize = false`).

Correct and careful. Notes:

- The expected-vehicle guard is `horizon·Σλ/3600 ≤ 10⁶`; it is a good memory/CPU guard but it
  does not bound `reps × per-run cost`, so 5000 replications of a 1 M-arrival scenario is
  still accepted (hours of work). A preflight time estimate or a warning would help the
  interactive path (E10).
- `baselines` can contain duplicates of `selected` (e.g. equal greens == input greens), which
  re-simulates identical work (E5).
- `available = cycle − clearance` is a float; the proportional split uses it directly, so the
  baseline may be non-integer and is then projected — correct per the model.
- `scales` non-empty whenever `sensitivity` is true (scale 1.0 always passes because
  `validate` caps rates at 20 000), so the `Stage::Sensitivity` indexing is safe.

### `Session::advance(&mut self, work)` — `lib.rs:545-720`

The interactive engine. One loop iteration = one full simulation. `work` is clamped to 4096.

**Training** (`551-607`): generate the scenario once per replication (`current_state` is
captured *before* generation, which makes replay exact), then for each plan clone the config,
set `green`, simulate, push the delay, build/refresh the best/worst bookmarks, push the
density. After `plans.len()` plans, advance the replication; after the last replication,
select the plan with the smallest training mean (`min_by` → first on ties = enumeration
order, as documented), switch to Evaluation, and reset the replication counter.

Notes:
- The selection is done inline after incrementing the replication, before the next unit — so
  `completed` and `total` stay consistent. ✓
- A plan whose `Moments.n == 0` would have `mean = 0` and could win; impossible in practice
  because every plan is pushed once per replication, but a `filter(|m| m.n > 0)` would make the
  invariant explicit.
- `Training` computes the search density; `TrainingShard` does the same. The two code paths are
  duplicated (E7) — any change must be made twice, which is exactly how divergences appear.

**Evaluation** (`608-691`): generate one scenario per replication, then run four plans on it:
`index 0` = selected (with profile, trace only on replication 0), `index 1..3` = the three
baselines. For the selected run it accumulates delay/queue/throughput/backlog/wait/density
moments, stores the first run's summary and samples, records the first evaluation state for
replay bookmarks, and sprinkles convergence checkpoints (`n ≤ 16`, every
`ceil(reps/160)`-th, and the final n). For the baselines it accumulates their delay moments and
the **paired** difference `baseline − selected` on the *same* scenario. That pairing is the
statistically important part and it is implemented correctly.

Notes:
- The profile buffer is mutated across all replications, then scaled by
  `1/(reps·bin_width)` in `output` — correct interval average.
- `savings` are pushed as `baseline − selected`, so positive = selected is better, matching the
  UI text. ✓
- `self.selected_delay` is set by index 0 and read by indices 1-3 in the same replication; the
  ordering is guaranteed by the index sequence. ✓
- `convergence` may get a point at `n = 1`? Guarded by `n >= 2`. ✓
- `first_evaluation_state` is captured before scenario generation, like training. ✓
- When the last replication finishes, `replication` is reset to 0 and the stage flips. If
  `scales.is_empty()` (sensitivity off) it goes straight to Done. ✓

**Sensitivity** (`692-715`): for each scale, run `reps` **new** scenarios (not shared with
evaluation) with the selected greens and scaled rates, then summarize into a `DemandPoint`
whose `rate` is the scaled total veh/h. Resets the accumulators between scales. Correct and
consistent with `MODEL.md` line 56. Note that the scenario is generated per replication for
each scale; the `config` used to generate it already has the scaled rates, so the gap
distribution matches the scaled demand. ✓

**Done** (`716`): no-op.

Every iteration increments `completed` once, so `completed` counts simulations and matches
`total`. ✓

### `Session::adopt_training(&mut self, chunks)` — `lib.rs:721-782`

Merges shard results into a fresh session:

- Requires `Stage::Training`.
- Rejects a range that exceeds the plan count, a chunk whose `end_state` differs from the
  others (proof that all shards replayed identical scenarios), a duplicated plan, or a plan
  whose `n ≠ training_replications`.
- Merges each chunk's density, keeps the global best/worst bookmarks, requires full coverage,
  and requires `search_distribution.total == plans·training_replications` (exact outcome
  count).
- Advances the RNG to the shared `end_state`, selects the best plan by mean, sets
  `completed = total`, and switches to Evaluation.

This is careful validation and the right place for it. Remaining concerns:

- The chunks are not bound to the *request* they were produced from (no hash of config/plans).
  A stale or mismatched chunk set that happens to have the right shape would be accepted.
  Workers are local and short-lived, so this is hardening rather than a bug; a `request_hash`
  field would close it.
- `Distribution::merge` order-dependence (E6) means the parallel density can differ from the
  serial density. Fix the grid normalization if you want bit-identical output.
- If `adopt_training` is called after some serial training already ran, the partial moments are
  silently replaced; `completed` is reset to the full training total. Intentional, but worth a
  doc comment.

### `Session::replay(&self) -> Option<(&Run, [f64; 4])>` — `lib.rs:783-785`

Returns the first fresh selected run and its greens; `None` until evaluation index 0 of
replication 0. Used by the worker to push a replay preview as soon as it exists. Correct and
allocation-free.

### `Session::is_done` — `lib.rs:786-788`

`stage == Done`. Fine.

### `Session::progress(&self) -> Progress` — `lib.rs:789-820`

Pure view, but it **clones both distributions** (`distribution`, `search_distribution`) and
serializes both on every call. From `engine.worker.ts:105-108`, that is every 100 ms, plus 3
calls at startup (`engine.worker.ts:25,36,39`). Each call allocates ~40 KB and produces ~30-60 KB
of JSON, on the same worker that is trying to simulate. This is pure overhead in the
interactive path (E3). Fix: have `progress` borrow the distributions (`&Distribution`) and let
serde serialize by reference; the wasm wrapper can return a borrowed view. Or send only the
distribution for the current stage, and only when `total` changed. The `search_distribution`
field is redundant after training ends.

Also note `Progress.distribution_kind` is the only place that encodes which density the UI
should show; that is a UI concern leaking into the engine payload, but it is harmless.

### `Session::replay_choices(&self) -> Vec<ReplayChoice>` — `lib.rs:821-865`

Builds the replay menu lazily at `output()` time:

- Reconstructs the first evaluation scenario from `first_evaluation_state`, re-simulates the
  three baselines on it, and emits "same arrivals · <baseline>" entries plus the stored first
  selected run.
- Appends the four stored extrema (shortest/longest fresh, shortest/longest search), skipping
  duplicates keyed by `(state, green)`.

Correct: the first selected run is taken from `self.run` (already simulated with trace), and
the baselines are re-run on the *same* scenario, so the menu is a fair paired comparison. Note
that `green` can be the same for two labels with the same state only if the runs are identical,
so the skip rule is sound.

### `Session::output(&self) -> Result<Output, String>` — `lib.rs:866-927`

The final projection. Requires `Stage::Done`; builds candidates, comparisons, all statistics,
the queue profile (`120` bins + a duplicate final point at `T`), convergence, the detailed
`run`, replay choices, samples, delays, sensitivity, densities. Pure.

Details:

- The profile scale `1/(reps·width)` turns accumulated area into an average height; the final
  repeated point at `T` gives the chart a right edge. Correct.
- `run: self.run.clone().unwrap()` clones the whole trace (frames + vehicles) into the output
  — the same data was already sent by `replay()`, and the UI then *replaces* its replay with
  `data.result.run` (`App.tsx:174-179`) while also reading `lanes`/`accounting_error` from it
  (`App.tsx:1165,1185`). At 1 M arrivals that is ~100 MB sent twice (S2/E9). Since `Output.run`
  and the earlier `replay()` run are the same object, the final message could carry a
  `RunSummary` (lanes, accounting, no trace) and the UI could keep the replay it already has.
- `candidates` is empty when `optimize = false`; `comparisons` always has three entries.
- `paired_saving` is the only place where the paired design is visible; the comparison label
  "Input timing" can equal the selected timing, in which case the saving is identically zero
  by construction (correct but noisy).

### `fn execute(request) -> Result<Output, String>` — `lib.rs:929-935`

Runs the session to completion in 4096-simulation batches. Pure convenience wrapper; used by
the native study example and the sync `experiment` export. Correct.

### tests — `lib.rs:937-1063`

Excellent coverage of the *contract*: grid size, paired arithmetic, profile area == delay,
batch-size invariance, bounded summaries at 2500 replications, density conservation, invalid
grid, and **parallel == serial** for selection, means, candidate means, and search totals.
Also replays every choice and checks delay/remaining. Gaps:

- parallel vs serial **density equality** (it currently would fail for some seeds — see E6);
- `advance(1)` vs `advance(4096)` full-output equality (the existing test uses 3 and compares
  only delay);
- sensitivity rate/scale math;
- `Progress` monotonicity across stages with `optimize = false`;
- `feasible` against a brute-force reference for small grids;
- `ReplayChoice` de-duplication;
- a property test that the queue-area identity holds for random configs with `clearance = 0`
  and non-divisible horizons.

---

## 5. `crates/wasm` — the interactive boundary (function by function)

All exports are thin: parse JSON, call the core, serialize JSON. Errors become `JsValue`
strings via `error`. That is the right pattern.

### `fn experiment(input) -> Result<String, JsValue>` — `lib.rs:7-10`

Synchronous full run (`execute`). Not used by the browser (the worker uses `ExperimentSession`)
but useful for scripting. No work budget — a large request blocks the calling thread until
done. Document that.

### `struct ExperimentSession` + `new` / `advance` / `progress` / `replay` / `result` — `lib.rs:12-37`

`new` parses and constructs a `Session`; `advance(work)` forwards and returns `is_done`;
`progress`/`replay`/`result` serialize. The only lifetime issue is that wasm-bindgen owns the
`Session`, so the state machine is hidden behind `&mut self` — exactly where impurity belongs
for an interactive app. `result()` can fail ("still running") and the worker turns that into an
error message; the worker only calls it after `done`, so fine.

### `fn preview(input) -> Result<String, JsValue>` — `lib.rs:39-46`

Validates the config, generates the scenario from the seed, and simulates the **input** greens
with `trace = true`. This is the first replay the UI shows. It reuses `validate` but **not** the
million-vehicle guard from `Session::new`, and it always traces: at the UI's upper bound this
is the 630 MB payload measured in section 0. This is the highest-severity interactive issue
(S2).

### `fn replay_choice(input, state, green) -> Result<String, JsValue>` — `lib.rs:48-56`

Revalidates the modified request, parses the hex state and the green array, regenerates the
scenario, and simulates with trace. Correct; the `state` round-trip is the same one the tests
exercise. Same trace-payload concern as `preview` (the replay worker runs it on a button press,
so a huge run can freeze that worker).

### `struct ParallelTrainingShard` + `new` / `advance` / `completed` / `total` / `result` — `lib.rs:58-83`

Thin wrapper over `TrainingShard`. `new` re-runs `feasible` in every worker (see E8); the rest
is forwarding. `adopt_training` (lines 84-90) accepts the JSON chunk array.

### Worker loop observations (`src/engine.worker.ts`)

- Startup calls `progress()` three times and `preview()` once; the preview is unconditional.
- `advance(8)` in a 25 ms budget. Since one unit is a full simulation, the minimum latency
  granularity is one simulation; at 24 h/1 M arrivals a single `simulate` is ~450 ms, so the
  "25 ms" budget cannot be honored (the worker, not the main thread, blocks — the UI stays
  responsive, but progress stalls). A stage-aware work size (1 simulation per call for large
  scenarios) would smooth this.
- Parallel training is spawned when `candidates × training_reps ≥ 20 000`, with 2-16 workers.
  Each worker re-enumerates the plan grid and regenerates the shared scenarios (5 ms for a
  1 h case, 59 ms for a 24 h case) — the scenario cost is acceptable, the re-enumeration is
  not (E8).
- `session.progress()` is parsed on every 100 ms tick; see E3.

---

## 6. Pure-functional refactor (where it is possible without a cost)

Purity scorecard:

| unit | pure today? | impurity | can be pure at no cost? |
| --- | --- | --- | --- |
| `exponential` | yes | — | — |
| `Lcg::{new,from_state,state}` | yes | — | — |
| `Uniform::uniform` | **no** | RNG state | yes, as `next(state) -> (state, f64)` |
| `Config::validate` | yes | — | — |
| `scenario` | **no** | RNG | yes: `scenario(config, seed) -> (Scenario, u64)` |
| `Event` ordering | yes | — | — |
| `transition` | **yes** | — | already pure (value-taking) |
| `frame` | yes | — | — |
| `simulate` | **yes** | — | already pure |
| `simulate_with_profile` | **no** | caller buffer | yes: return a `Vec` (3.8 KB) |
| `Moments::push` | **no** | accumulator | fold step; keep for speed |
| `Distribution::{push,merge}` | **no** | accumulator | fold step; keep for speed |
| `feasible`, `baseline`, `statistics` | yes | — | — |
| `TrainingShard::advance` | **no** | state machine | yes, reducer |
| `Session::{new,progress,output,replay,replay_choices}` | yes | — | already |
| `Session::{advance,adopt_training}` | **no** | state machine | yes, reducer |
| wasm exports | **no** | handle | must stay impure (FFI boundary) |

### P1. Pure RNG core, stateful wrapper kept for callers

```rust
impl Lcg {
    /// One step of the generator: (next_state, uniform).
    pub fn step(state: u64) -> (u64, f64) {
        let x = state
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        (x, ((x >> 12) as f64 + 0.5) / 4_503_599_627_370_496.0)
    }
}

impl Uniform for Lcg {
    fn uniform(&mut self) -> f64 {
        let (next, u) = Lcg::step(self.0);
        self.0 = next;
        u
    }
}
```

`step` is a pure function; the trait stays for compatibility and for the `&mut impl Uniform`
signature that `scenario` uses (which also keeps the door open for a different generator).

### P2. Pure scenario

```rust
pub fn scenario_pure(config: &Config, seed: u64) -> (Scenario, u64) { … }
pub fn scenario(config: &Config, rng: &mut impl Uniform) -> Scenario { … } // existing wrapper
```

The wrapper delegates by threading the state. Then training can be written as
`fold(0..reps, |rng, r| { let (s, rng) = scenario_pure(config, rng); … })`, and tests can
compare scenarios without mutable setup.

### P3. Drop the caller-owned profile buffer

```rust
pub fn simulate_profile(config: &Config, scenario: &Scenario, trace: bool)
    -> (Run, [[f64; 4]; 120])
```

The buffer is 3.8 KB and is used only on fresh evaluation runs; returning it removes the last
aliasing parameter from the simulator and lets `simulate` stay a pure function of its inputs.
If you want to keep the allocation out of the hot path, keep the internal `&mut` implementation
private and expose the pure wrapper.

### P4. `SessionState` + pure `advance`

```rust
#[derive(Clone)]
pub struct SessionState { /* all current fields */ }

impl SessionState {
    pub fn new(request: Request) -> Result<Self, String> { … }
    /// Pure reducer: no interior mutability, same inputs -> same output.
    pub fn advance(mut self, work: usize) -> Self { /* existing body, on self */ }
    pub fn progress(&self) -> Progress<'_> { … }     // borrowing view
    pub fn output(&self) -> Result<Output, String> { … }
}
```

`Session` then becomes a 3-line wasm handle:

```rust
pub struct Session { state: SessionState }
impl Session { pub fn advance(&mut self, work: usize) { self.state = std::mem::take(&mut self.state).advance(work) } }
```

`std::mem::take` requires `Default`; or use `Option<SessionState>` / `replace_with`. This gives
you a testable `advance` (call it 1 step at a time, assert equality with 4096 steps), makes
snapshot/restore trivial (a clone of the state is a checkpoint), and costs nothing at runtime
because the state is moved, not copied. It also removes the 175-line `match` from a method that
mutates shared fields — you can split it into `advance_training`, `advance_evaluation`,
`advance_sensitivity`, each taking and returning `SessionState`.

Impurity that should *stay*: the wasm handle, the `&mut` accumulators inside hot loops
(`Moments::push`, `Distribution::push`, `profile`), and the worker's chunking loop. Those are
fold steps and FFI, not architectural impurity.

---

## 7. Optimizations, ranked

Work-count estimates are not wall-clock claims except where measured.

| # | Change | Where | Expected effect | Risk |
| --- | --- | --- | --- | --- |
| O1 | Bound the `feasible` enumeration (section 4) | `experiments:262-278` | 503 ms → µs worst case; ×17 in parallel mode | none (same plan order) |
| O2 | Batched event merge instead of rebuilding a `BinaryHeap` per candidate | `simulation:317-347` | removes N heap pushes + N pops per run; ~30-50% of event handling | medium — tie order must be preserved; add differential test |
| O3 | Per-lane lazy area/busy accounting; restrict the start scan to `phase·3..phase·3+3` | `simulation:179-224` | removes ~12 lane visits per event (≈2 M for an 80 k run) | low-medium; differential test vs current |
| O4 | Training-only `Metrics` path (no `Run`, `LaneResult`, `frames`, `vehicles`) | `simulation:399-438` + call sites | one 12-element array + 2 Vecs less per training observation; ~5-10% | low |
| O5 | Approach-level precomputation: cache `(start, green) → (delay, remaining)` per approach and compose plans | `simulation`/`experiments` training | 9× (4 s grid) to 42× (1 s grid) fewer local trajectories (work counts from `PERFORMANCE_ANALYSIS.md`) | high — must preserve ordering, partial waits, tie-breaks; differential test on every candidate |
| O6 | Lazy replay bookkeeping: store `(state: u64, green, delay, remaining)`; format hex and build `ReplayChoice` only for a new extreme | `experiments:378-390, 560-580` | removes ~2 allocations per training run (≈5 M for the 2.5 M-run case) | none |
| O7 | `progress()` borrows instead of cloning both densities; omit `search_distribution` after training | `experiments:789-820` | removes ~40 KB alloc + ~30-60 KB JSON every 100 ms | none |
| O8 | Cap/compact the trace: verify UX before decimating frames (App.tsx:236 needs per-event frames); prefer a compact binary transport and a hard trace budget with a "replay unavailable" flag | `simulation:355-398`, `wasm:39-56`, `Output.run` | 25 MB/1 h → bounded; prevents 630 MB/24 h worker death | medium — UI contract change |
| O9 | `Output.run` without `frames`/`vehicles`; the UI keeps the identical run it already received via `replay()` | `experiments:919`, `App.tsx:174-179` | halves the final payload | low — needs the UI to retain the replay message |
| O10 | Deduplicate identical baseline greens per fresh scenario | `experiments:613-627` | up to 3 runs saved per replication in degenerate cases | low |
| O11 | Hoist `Config` clone out of the per-simulation loop; reuse a scratch config | `experiments:550, 362` | small but free | none |
| O12 | 4-way merge of per-approach arrival streams instead of a global sort; reserve capacity | `simulation:109` | ~40-50% of scenario generation at 1 M arrivals (59 ms measured) | low |
| O13 | Precompute `1/rate` and cumulative turn probabilities outside the arrival loop | `simulation:72-92` | removes a divide + an add per arrival | none |
| O14 | Compute the density grid's growth in one step; define a canonical power-of-two grid so merge is associative | `experiments:127-182` | parallel density == serial density; fewer reallocs | low |
| O15 | Guard `preview` with the same one-million-vehicle limit as `Session::new` | `wasm:39-46` | prevents accidental OOM before the run starts | none |
| O16 | Preflight estimate/warning for `reps × events` | `Session::new` | UX: avoid 5000 × 450 ms surprises | none |

### O2/O3 sketch (the hot loop)

The static parts of the event stream are already sorted:

- arrivals: sorted by `(time, lane, id)` in `scenario`;
- phase boundaries: generated in increasing time by a tiny cursor over `(cycle, phase)`.

Only service completions need dynamic ordering, and there are at most 12 of them. Replace the
heap with a merge of three streams and a 12-slot completion array:

```rust
let mut next_arrival = 0;
let mut phase = PhaseCursor::new(config);          // yields (time, PhaseMark)
let mut completions = [Completion::NONE; 12];      // per lane: (time, seq)

loop {
    let ta = scenario.arrivals.get(next_arrival).map_or(f64::INFINITY, |a| a.time);
    let tp = phase.peek_time();
    let tc = completions.iter().copied().min().unwrap_or(f64::INFINITY);
    let t = ta.min(tp).min(tc);
    if t > config.horizon { break; }

    // same-time order: all departures, then phase end, then phase start, then arrivals
    while let Some(m) = take_completion_at(&mut completions, t) { state.departure(m); }
    if phase.is_end_at(t) { state.phase_end(); phase.advance(); }
    if phase.is_start_at(t) { state.phase_start(phase.phase(), phase.end()); }
    while scenario.arrivals.get(next_arrival).is_some_and(|a| a.time == t) { … }
    // only now: start services for the 3 permitted lanes
}
```

For accounting, keep `last_accounted: [f64; 12]` and `queued: [usize; 12]` and close a lane's
interval only when it changes:

```rust
#[inline]
fn close(lane: &mut Lane, now: f64) {
    lane.area += lane.waiting.len() as f64 * (now - lane.last_area_time);
    lane.last_area_time = now;
}
```

Busy time is even simpler: add `min(service_end, horizon) - service_start` when the service
finishes (or at the horizon for the residual), so `busy_time` never needs a per-event loop.

Do this behind a feature flag or with a differential test that asserts byte-identical `Run`
fields (delay, departed, remaining, in_service, area per lane, frames) against the current
implementation on seeded random configs — including `clearance = 0`, `headway = 0.25`,
saturation, and horizon-boundary cases. That is the only safe way to touch the event loop.

### O5 sketch (the algorithmic win)

For a fixed scenario, lane group `a` is independent of the other approaches: no shared server,
no spillback, no cross-approach transfer. So for a plan `(g_N, g_E, g_S, g_W)`,

```
delay(plan) = Σ_a approach_delay[a](start_a, g_a)
remaining(plan) = Σ_a approach_remaining[a](start_a, g_a)
```

with `start_N = 0`, `start_E = g_N + L/4`, `start_S = g_N + g_E + L/2`,
`start_W = g_N + g_E + g_S + 3L/4`. Cache by `(start, green, approach)` for the current
scenario and compose plans from 4 cache hits. The existing analysis counts 178 vs 1 660
approach-trajectories on the 4 s grid and 1 846 vs 77 476 on the 1 s grid, i.e. 9× / 42× less
local work. Keep the full simulator for the selected run, the fresh evaluation (needs the
profile and frames), and replay. Verify by comparing every candidate's delay/remaining against
the current engine for the same seeds before trusting the switch.

---

## 8. Concrete issues list (prioritized)

**High**

1. **Unbounded trace payload (S2/E9/O8).** `preview` and `replay_choice` always trace; `Run`
   serializes every frame and every vehicle. Measured 25 MB at 1 h/80 k arrivals, 105 MB at
   4 h, ~630 MB at the 24 h/1 M-vehicle UI limit. Remedy: hard trace budget with an explicit
   "replay unavailable" contract, plus compact transport (typed arrays) if the UI needs full
   fidelity; and stop duplicating the run in `Output.run`.
2. **`feasible` is O(max³) (E1/O1).** 503 ms native for one plan in the worst legal grid,
   multiplied by `Session::new` + every shard. Bounded enumeration fixes it with identical
   output order.
3. **Per-observation allocations in training (O4/O6).** `format!` + `String::into` per run plus
   a full `Run` per run. For 2.5 M observations this is a measurable chunk of the training
   time and GC/allocation churn in WASM.

**Medium**

4. Parallel density is not identical to serial density (E6/O14) because grid resolution
   depends on push/merge order. Normalize or document.
5. `progress()` clones/serializes two densities every 100 ms (E3/O7).
6. Worker-side `feasible` re-enumeration per shard (E8) — largely fixed by O1.
7. `adopt_training` does not bind chunks to the request (E11) — harden with a hash.
8. `simulate` accepts unvalidated configs and out-of-horizon arrivals (S5/S6) — validate at the
   public boundary or `debug_assert`.
9. `advance` silently caps at 4096 and one unit is one full simulation (E10/S5) — document and
   make batch size stage-aware.

**Low**

10. `Distribution` grows by repeated realloc + halving; compute the target level once.
11. `baseline` recomputes distances in the comparator.
12. `scenario` sorts four already-sorted streams and recomputes turn thresholds per arrival.
13. `Output.run` carries frames/vehicles the UI does not use there.
14. Two clippy warnings; duplicated training logic between `Session` and `TrainingShard`.
15. `started_wait` naming; duplicated LCG constants in the test.
16. `simulate` includes out-of-horizon arrivals in `vehicles` (ghost rows).

**Do not change** (these are deliberate and correct): event priority order, inclusive
`time + headway <= green_end`, the `(time, priority, order)` heap inversion, `min_by` tie-break
by enumeration order, the paired `baseline − selected` saving, the upper-52-bit uniform with
the half-ulp offset, the `1e-8`/`1e-9` validation tolerances, and the first-fresh-run replay
semantics.

---

## 9. Suggested tests for the refactors

- `feasible_fast == feasible_bruteforce` for a grid of small `(min,max,step,cycle,clearance)`
  tuples, including the 500 ms case (assert count and order).
- Differential simulator: random valid configs + scenarios, compare every `Run` field between
  the current heap implementation and the merged-stream/lazy-accounting version.
- `session_reducer`: `advance(1)*n == advance(n) == execute` for full `Output` equality
  (serialize and compare JSON).
- Parallel density equality: adopt chunks in several orders and compare `counts` exactly.
- Trace budget: a 1 M-arrival scenario must produce ≤ N frames or an explicit flag, and
  `preview` must refuse gracefully rather than allocate.
- `progress` does not change state and does not clone (assert via a borrowed view / size).
- `clearance = 0`, `clearance % 4 ≠ 0`, arrival at `T`, phase boundary at `T`.
- `exponential` matches `-ln(1-u)/rate` over `u ∈ (1e-15, 1-1e-15)`.

---

## 10. Measurements and reproduction

The throw-away benchmark was run in release mode with the workspace profile (LTO, opt-level 3,
codegen-units 1); it was deleted afterwards, so no source files were changed. Numbers:

```
feasible worst (min=1,max=600,step=1,total=4): 503 ms, 1 plan
scenario 24 h @ 10k/h × 4: 960k arrivals, 59 ms
simulate 24 h no-trace: 448 ms
simulate 1 h @ 20k/h × 4: 27.5 ms (80k arrivals), trace 45.3 ms, 84 915 frames, 25 MB JSON
simulate 4 h: 107 ms no-trace, 157 ms trace, 339 113 frames, 105 MB JSON
```

`cargo test --workspace`: pass. `cargo clippy`: 2 warnings (`simulation:304`, `simulation:385`).
