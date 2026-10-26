# Rust backend performance review

## Changes applied and measured

The training search now exploits an exact structural property of this model: queues on one approach do not interact with queues on another approach. For each shared traffic scenario, it simulates each distinct `(approach, phase start, green duration)` case once, then combines the four approach results for every complete timing plan. The cache is scoped to one scenario, so random arrivals and turns stay identical across plans.

The reference request was run in release mode immediately before and after the change on the same machine:

| Request | Before | After | Speedup |
| --- | ---: | ---: | ---: |
| 415-plan reference | 10.49 s | 1.72 s | 6.1× |
| 19,369-plan, one-second grid | 209.02 s saved baseline | 6.86 s | 30.5× vs saved baseline |

The one-second baseline is the previously recorded native timing in `report/results/runtimes.json`; it was not rerun against the old source in this comparison. Both versions selected the same reference plan. The reference run's fresh-evaluation delays and histograms matched exactly; candidate training means differed by at most `7.3e-12` from summing independent approach costs in a different floating-point order. The fine-grid result selected the same plan recorded in the report (`26 / 16 / 24 / 14 s`). These are native release timings, not browser/WASM latency claims.

The archived fine-grid response was also compared with the optimized rerun: selected timing, all 5,000 fresh delays, evaluation histogram, and training histogram match; candidate training means differ by at most `1.1e-11`, and the winning candidate is unchanged.

Other changes reduce repeated overhead: service-start checks now visit only the lane affected by an arrival/departure or the three lanes activated at a phase start; replay-state strings are formatted only when a new low/high outcome is kept; and feasible-plan enumeration and cache-result composition use iterator transformations. The one-second timing search is now well beyond the original fivefold target on the measured native workload.

## Hot-path findings

Before caching, a full candidate simulation built a `BinaryHeap` containing all scenario arrivals and every phase boundary, then added service-completion events as vehicles started. Each event integrated queue area for all 12 lanes and checked all 12 lanes for service starts. Training also built detailed run summaries and formatted replay state strings despite only needing delay, arrivals, and end backlog for most outcomes. The one-second study repeated that work for 2,479,232 candidate/scenario pairs.

After caching, that request does 2,212 approach/phase simulations per shared training scenario (283,136 training calls total) instead of 19,369 full simulations per scenario. Each cached simulation sees only one approach's arrivals and one phase schedule. The 20,000 fresh evaluation calls still use the detailed simulator because they supply report statistics, queue profiles, and replay. The native before/after timings are end-to-end; no sampling profiler or browser flamegraph was captured, so the remaining priorities below are source-level opportunities rather than measured CPU shares.

## Why the cache is valid

There is no spillback, blocking, shared service resource, or cross-approach queue transfer. Each approach's three queues therefore contribute an independent waiting cost. A phase case is determined by its approach, the phase's start offset, and its green duration. The preceding greens determine the start offsets:

- North: `0`
- East: `gN + clearance/4`
- South: `gN + clearance/4 + gE + clearance/4`
- West: `gN + clearance/4 + gE + clearance/4 + gS + clearance/4`

The training path caches the delay and remaining queue count for those cases and combines them in phase order. The detailed full-simulation path remains in use for fresh evaluation, queue profiles, vehicle traces, and replay. This keeps the visible output features out of the millions of search-only simulations.

With the current bounds, the 415-plan four-second grid has 1,660 approach contributions but only 178 distinct phase cases (9.3× fewer local trajectories). The 19,369-plan one-second grid has 77,476 approach contributions but 2,212 distinct cases (35× fewer). These are work-count ratios; the measured wall-clock speedups are lower because cache construction, result aggregation, and evaluation still take time.

## Remaining optimization opportunities

1. **Stream static events.** Arrivals are already sorted and signal changes are deterministic. A merge of those two streams with a small structure for live departures could replace building a full event heap for every approach case. Equal-time event priority must match the existing departure/phase-end/phase-start/arrival order.
2. **Reduce lane-area work for training.** The current simulator still integrates all 12 lanes at every event. A compact training-only simulator could maintain total waiting count for delay and update lane-specific state only on that lane's events. This is more invasive and needs careful comparison around phase boundaries and horizon accounting.
3. **Deduplicate evaluation timings.** Selected, input, equal-green, and demand-proportional plans can coincide. Reusing one run for equal timings is a small evaluation-stage saving.
4. **Profile the browser path separately.** Browser workers, startup, message transfer, and chunk yielding affect latency. Native timings should not be presented as browser timings.

Compiler flag changes are lower priority: the release profile already enables LTO, `opt-level = 3`, and one codegen unit. The largest gain came from avoiding repeated simulation work, not different loop syntax.

## Functional style and the state machine

The plan generator and the cached-result composition now use `flat_map`, `filter_map`, `map`, and `fold`, which express those transformations without mutating an output accumulator. The event transition remains a deterministic function that consumes a `State` and returns its next `State`; its internal queue and event-heap updates use local mutation to avoid cloning the queues and heap at every event. Replacing the hot event loop with immutable copies or recursive folds would add allocations/copies and risks making the engine slower. In Rust, local mutation inside a deterministic state transition does not make the transition externally stateful.

## Exponential-arrival transform

`scenario()` already generates exponential gaps once for each approach in a traffic scenario. The same sorted arrivals are reused across all candidate plans, so the logarithm is not repeated for every timing plan. A lookup table would quantize the 52-bit uniform samples and change seeded arrivals; computing the log is also a small part of the old full-search cost compared with replaying queue events millions of times. I left the exact `ln_1p` inverse transform and its seeded behavior unchanged. If profiling later shows scenario generation matters for very high-demand, no-search requests, a separately validated approximation can be measured then.

## Hypothetical JavaScript comparison

There is no pure-JavaScript backend in the repository, so there is no measured Rust-versus-JavaScript ratio. For a careful implementation in the same browser, my planning estimate is **near parity, within roughly 1.5× either way**; a direct object-heavy port may be slower, while a tuned JavaScript version could approach the same peak throughput. Browser engines differ, and JavaScript needs to stay on its optimizing fast path. Chrome's WebAssembly guidance likewise says both can reach similar peak performance, while highlighting that JavaScript's fast path can be less predictable: [Chrome for Developers](https://developer.chrome.com/blog/hotpath-with-wasm?hl=en).

The approach-case cache is an algorithmic improvement, not a Rust feature. A JavaScript rewrite using the same cache could receive a similar multiplicative gain. It should not be described as inherently five times faster than the current implementation. A valid comparison needs the same seeded arrivals, browser, warm-up, worker count, requested plans, and output checks.
