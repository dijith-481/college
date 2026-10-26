# Reproducible simulation study — executed specification

## What this study can answer

Without measured traffic counts, the actual arrival rates at a junction cannot be inferred. The conditional OR question is: **for each stated hypothetical demand pattern, which feasible signal timing minimizes expected cumulative queue waiting in this model?** The study also examines whether a timing remains useful when those assumptions change. These are model results, not field recommendations.

This plan freezes one seed and varies only named inputs. A seed makes the pseudorandom experiment reproducible; it does not mean that every replication sees the same arrivals. All reported demand numbers are **expected** arrivals under the Poisson model, not fixed vehicle counts.

## Fixed model for the main study

| Input | Value | Meaning |
| --- | ---: | --- |
| Seed | `2026` | Reproducible pseudorandom stream |
| Operating horizon | `600 s` | Ten minutes, starting with empty queues |
| Signal cycle / total clearance | `96 s` / `16 s` | `80 s` available for green each cycle |
| Discharge headway | `2 s` | Deterministic lane service time |
| Turning probabilities | left `0.20`, straight `0.60`, right `0.20` | Sampled independently for arriving vehicles |
| Input green times, N/E/S/W | `[24, 16, 24, 16] s` | The unoptimized comparison plan |
| Green bounds and grid | `8–44 s`, step `4 s` | `415` feasible four-phase timings to enumerate |
| Optimization | on | Train on common scenarios, select minimum mean cumulative waiting |

Rates below are in **vehicles/hour** in North, East, South, West order. Expected arrivals in a ten-minute run equal `sum(rates) × 600 / 3600`. Each road's actual count remains random.

## Main experiment matrix

`Search` is the number of training scenarios evaluated for **each** feasible timing. `Fresh` is the number of new scenarios used to evaluate the chosen plan and the three comparison plans. More fresh scenarios improve the precision of reported performance; more search scenarios can also change which plan wins.

| ID / app quick pick | Rates N/E/S/W | Expected arrivals/run | Search | Fresh | Purpose |
| --- | --- | ---: | ---: | ---: | --- |
| `baseline-quick` · Baseline / quick | 600 / 350 / 550 / 300 | 300 | 64 | 128 | Fast, low-precision preview |
| `baseline-reference` · Baseline / reference | 600 / 350 / 550 / 300 | 300 | 256 | 1,000 | Main result and fixed-timing sensitivity sweep |
| `baseline-precise` · Baseline / precise | 600 / 350 / 550 / 300 | 300 | 256 | 5,000 | Test precision of the **same trained choice** |
| `quiet-reference` · Quiet / reference | 300 / 175 / 275 / 150 | 150 | 256 | 1,000 | Half the baseline demand |
| `heavy-reference` · Heavy / reference | 900 / 525 / 825 / 450 | 450 | 256 | 1,000 | One-and-a-half times baseline demand |
| `south-heavy-reference` · South-heavy / reference | 300 / 350 / 850 / 300 | 300 | 256 | 1,000 | Shift demand toward South while keeping total demand fixed |

Only `baseline-reference` enables the engine's optional sensitivity sweep. That sweep tests multipliers `0.5, 0.75, 1, 1.25, 1.5` while **holding its selected green times fixed**. The separate quiet/heavy cases **re-optimize** at their own demand levels. Both views are needed: one measures how a fixed decision survives changing demand; the other shows how the preferred decision changes.

The baseline reference and precise cases use identical search inputs, so they should select the same timing. Their first 1,000 fresh scenarios should match; the precise case then adds 4,000 scenarios. This isolates fresh-estimate precision. The quick case changes both search and fresh counts, so it measures the cost and behavior of a fast setting, **not** a clean precision comparison.

The study requires about 599,000 individual timing/scenario simulations including the reference sensitivity sweep. Run the quick case first and record its wall time before scheduling the others. If runtime is unreasonable, reduce the grid or run counts in a revised plan before generating report numbers. Do not silently change the specification midway.

## Fine-grid verification

Add `fine-grid-verification`: baseline demand, seed `2026`, the same physical model, **1-second green grid**, `128` training scenarios per timing, and `5,000` fresh evaluation scenarios. This enumerates `19,369` feasible timings and makes `2,499,232` timing/scenario simulations. The recorded search runtime was **6.86 seconds**. The finer grid includes every coarse-grid timing, but because its training set and post-training random-stream position differ, a lower training minimum does **not** by itself prove a lower expected waiting cost. Judge its selected timing by fresh performance and confidence interval, and interpret a small apparent advantage cautiously. This is computational verification within the model, not real-world validation.

To compare the chosen 4-second and 1-second timings fairly, `compare_grids` skips the coarse study's 256 training scenarios and evaluates both decisions on its same 5,000 fresh scenarios. The paired difference measures coarse waiting minus fine waiting. Its confidence interval is the direct evidence for a benefit; the two independently generated fresh means should not be subtracted as if paired.

## What to extract for the report

For each case, save the exact request and complete engine response. Summarize:

1. Feasible candidate count; chosen N/E/S/W green times; training mean for the chosen candidate.
2. Fresh mean cumulative waiting in vehicle-seconds and its 95% confidence interval. This is the **objective value**, not vehicles per second.
3. Fresh accumulated waiting per arrival, mean queue length, throughput, and end backlog, with intervals and units.
4. Paired waiting savings versus input, equal-green, and demand-proportional timings on the same fresh arrivals. State the sign convention: positive savings favor the selected timing.
5. The baseline reference's fixed-plan demand sweep, clearly distinguished from the re-optimized quiet/heavy cases.
6. Convergence plot: running mean and interval as fresh replication count increases. Compare reference and precise interval widths.
7. Across-demand table/plot: rates, expected arrivals, selected green allocation, mean waiting, and backlog. The South-heavy case tests allocation response without changing total demand.

Keep charts selective: a timing comparison, a convergence chart with a useful y-axis range, a demand-versus-timing comparison, and a compact results table. The full queue and outcome-distribution plots can support interpretation without becoming separate claims of validity. State that confidence intervals describe Monte Carlo uncertainty **conditional on this model**, not uncertainty about real traffic rates or whether the model matches a real junction.

## Reproducible files and execution

The exact request JSON for each ID is under `report/results/requests/`, the full engine responses are under `report/results/raw/`, and `summary.csv`, `summary.md`, and `manifest.json` record results and provenance. Generate tables and charts from those saved responses; never transcribe numbers by hand.

Use a small native runner calling the existing Rust `experiments::execute` function for batch production. That keeps the academic data source identical to the browser's Rust engine. The runner should accept a request file and output file and fail on invalid configurations. Run cases sequentially, validate completion and request/response identity, then derive the summary. Do not use browser screenshots as the source of numerical results.

## Application quick picks

Expose the seven **primary tested requests** as named presets, together with the recorded longer-horizon and alternate-seed audit cases and a separately labelled Toronto data-based demonstration preset. Selecting a preset fills every input, including the frontend's derived expected-vehicle controls, then the user can inspect or edit it before running. The Toronto preset uses a measured AM peak intersection total but assumes an equal approach split and default turn probabilities; it is not one of the report's tested requests. Mark edited settings as `Custom` so the label never implies that altered inputs have precomputed report results. Keep the Quick / Standard / Thorough / Extended / Deep search controls as **compute-budget choices** and label them separately from the scenario presets. A preset should not show a stored result as if it were the result of the user's new run; link its source or saved study summary separately.

Keep one shared preset definition or generated manifest for the native requests and UI to prevent numerical drift. The UI needs to update its local vehicle-count slider state when applying a quick pick, because it currently initializes that state from the request only once.

## Before claiming practical relevance

All seven cases are synthetic, use one seed, one short empty-start horizon, common turning probabilities, and the same simple intersection/service rules. A selected plan can be preferred on this grid without being optimal for a real junction. A useful **separate** robustness check is a longer horizon and different seed(s); that would test empty-start and pseudorandom-stream sensitivity before any stronger claim. Measured approach and movement counts, signal constraints, pedestrian needs, and field validation would still be required for deployment.
