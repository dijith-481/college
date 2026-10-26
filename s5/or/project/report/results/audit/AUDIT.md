# Results audit for the OR report

## Verdict

The saved results are sufficient for a **reproducible, model-based OR report** if the question is stated precisely: minimize expected queue waiting over a specified finite operating period for hypothetical Poisson demand at this simplified four-phase junction. They are **not** sufficient to recommend timings for an actual junction or to infer its arrival rates. The most defensible contribution is the formulation, controlled simulation, constrained comparison, and explanation of when the recommendation changes.

The extra audit matters. The original ten-minute winner is stable across four seeds, but its advantage over the input timing becomes smaller as the operating period grows and is not resolved at 32 minutes. This must appear in the report; omitting it would make the ten-minute result look more general than it is.

## Data integrity

[`validate.py`](validate.py) checked all 23 saved engine outputs and paired comparisons, including exact request/response identity, replication counts, density totals, first-run vehicle conservation, queue-area accounting, and equality between the averaged queue-profile area and mean cumulative waiting. The saved requests, raw outputs, plot data, and reproducibility manifest are under [`../`](../). These checks support internal numerical consistency; they do not establish that the traffic assumptions match a real intersection.

## What the ten-minute study actually shows

With seed 2026, 4-second green steps, 256 training replications per timing and 1,000 fresh replications, the selected green split was **28/16/24/12 s** (N/E/S/W). Against the input **24/16/24/16 s** plan, paired fresh waiting was lower by **104.2 vehicle-s per ten-minute run** (95% interval **69.6 to 138.8**). This is about 0.35 seconds per *expected* arrival, so the practical effect is modest. The selected 4-second plan is exactly the demand-proportional plan on that grid; the optimizer did not outperform that simple baseline there.

The 1-second search evaluated 19,369 feasible timings and selected **26/16/24/14 s**. On 5,000 matched fresh scenarios it improved on the selected 4-second plan by **44.8 vehicle-s per run**, or **0.42%** (paired 95% interval **34.8 to 54.8**). The same two fixed plans were evaluated with three further seeds, each on 5,000 matched scenarios:

| Seed | Mean saving of 1-second plan (vehicle-s/run) | Paired 95% interval |
| ---: | ---: | ---: |
| 2026 | 44.8 | 34.8 to 54.8 |
| 2027 | 46.4 | 36.2 to 56.6 |
| 2028 | 46.8 | 36.9 to 56.7 |
| 2029 | 56.0 | 46.0 to 66.0 |

These held-out seed checks support the small ten-minute improvement of **these two chosen plans**. They do not prove that either is the true expected-value optimum over its entire grid. The finer search used 128 training runs per timing versus 256 for the coarse search, so grid spacing and training effort were changed together. Fresh evaluation and alternate-seed checks distinguish out-of-sample performance from a low training score alone.

## Horizon sensitivity

The original 600-second experiment ends after **6.25 signal cycles**. Its endpoint and initially empty queues are part of the objective. Nearby endpoints and longer periods were therefore re-optimized on the 4-second grid:

| Horizon | Chosen green N/E/S/W (s) | Mean waiting per arrival (s) | Mean end backlog |
| ---: | --- | ---: | ---: |
| 576 s | 28/16/24/12 | 35.11 | 22.10 |
| 600 s | 28/16/24/12 | 35.08 | 18.77 |
| 624 s | 28/16/24/12 | 35.42 | 20.91 |
| 672 s | 28/16/24/12 | 35.55 | 22.28 |
| 960 s | 28/16/24/12 | 36.35 | 22.26 |
| 1,920 s | 24/16/24/16 | 37.58 | 23.53 |

The end backlog changes with where the observation stops in the signal cycle; it is not by itself proof that a queue is unstable. Mean waiting per arrival is higher at the longer horizons under this empty-start model. Raw cumulative vehicle-seconds from different horizons should **not** be compared as though they were the same objective; the period contains different numbers of arrivals.

To isolate the timing comparison, seed 2027 evaluated the fixed input and demand-proportional plans on 5,000 matched scenarios at each horizon. Positive values below favor the demand-proportional **28/16/24/12 s** plan:

| Horizon | Input minus proportional (vehicle-s/run) | Paired 95% interval |
| ---: | ---: | ---: |
| 600 s | 105.5 | 88.5 to 122.5 |
| 960 s | 64.0 | 35.8 to 92.2 |
| 1,920 s | 15.0 | −40.3 to 70.2 |

The longer-period difference is unresolved. At 1,920 seconds the search selected the input plan, while the fresh point estimate slightly favored demand-proportional timing; its paired interval includes both signs. This is ordinary selection/Monte Carlo uncertainty, not a reason to hide the case. The report may recommend 28/16/24/12 **for the stated ten-minute objective**, but should not call it the generally optimal split.

## Why heavy traffic behaves differently

With separate lanes and a 2-second discharge headway, an ideal continuously queued straight lane can complete at most `floor(gᵢ/2) × 3600/96` vehicles/hour. The 20/60/20 turning split makes straight-ahead demand the binding movement on every approach. Under the selected baseline timing:

| Approach | Baseline straight demand / ideal capacity (veh/h) | Heavy straight demand / ideal capacity (veh/h) |
| --- | ---: | ---: |
| North | 360 / 525 | 540 / 525 |
| East | 210 / 300 | 315 / 300 |
| South | 330 / 450 | 495 / 450 |
| West | 180 / 225 | 270 / 225 |

The heavy case's straight demand exceeds the ideal capacity of every approach under that selected timing. More strongly, even ignoring integer rounding, the four heavy straight streams need at least **86.4 green seconds per 96-second cycle**, while the fixed 16-second clearance leaves only **80 green seconds**. No permitted reallocation can serve all four heavy straight streams on average under these assumptions. Its mean end backlog rose from **54.4** vehicles at 600 seconds to **110.1** at 1,920 seconds, and mean observed waiting per arrival rose from **51.9** to **91.1** seconds. Present this as an infeasible-capacity stress case, not as a failed optimization.

## How this fits the required report

- **A–D:** State the hypothetical demand source, finite horizon, queue-area objective, four-green equality/bounds, Poisson arrivals, deterministic phase service, exhaustive grid search, and separate fresh evaluation. Explain why ordinary M/M/1 formulas are not the exact solution for periodic service.
- **E:** Use the ten-minute case as the primary finite-horizon result. Show one compact plan-comparison table, the paired savings and interval, and a convergence plot. Name the selected plan and its objective value with units. Keep training and fresh results separate.
- **F:** Use the demand/capacity calculation, fixed-timing versus re-optimized demand study, seed checks, and horizon comparison. Report the small 1-second-grid gain and the long-horizon ambiguity. The queue-profile and density plots support interpretation but do not require separate claims of optimality.

The current outputs are ample for those sections. More millions of replications would narrow Monte Carlo error while leaving the larger uncertainty untouched: synthetic arrival rates, fixed turn probabilities, one simplified phase pattern, no measured travel times or pedestrian constraints, and empty-start finite horizons. If the report must claim relevance to a named real junction, the missing input is **field traffic and movement counts**, not a larger random simulation set. Confidence intervals here are pointwise, conditional on the model and pseudorandom generator, and should not be described as 95% certainty about real traffic performance or the global optimizer.

The audit's exact requests and raw outputs are in [`requests/`](requests/) and [`raw/`](raw/). Plot-ready data are [`horizon_comparison.csv`](horizon_comparison.csv), [`fixed_plan_horizon_comparison.csv`](fixed_plan_horizon_comparison.csv), [`seed_search_stability.csv`](seed_search_stability.csv), [`fine_grid_seed_validation.csv`](fine_grid_seed_validation.csv), and [`straight_lane_capacity.csv`](straight_lane_capacity.csv).
