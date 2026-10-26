# Traffic Signal Timing Optimization Using Queuing Theory and Monte Carlo Simulation

**Operations Research Project · PBCBT504 · Semester S5**

| Name | Roll No. |
| --- | --- |
| Dijith Dinesh | 23 |
| Athuljith S | 21 |
| Peter Joe Menachery | 48 |
| Pranav Manoj | 49 |

## Abstract

Traffic signals allocate limited intersection capacity among competing vehicle movements. Uneven demand and stochastic arrivals make the consequences of a timing decision uncertain. This project formulates fixed-time signal allocation at an isolated four-way intersection as a constrained stochastic optimization problem, minimizing expected cumulative vehicle waiting over a finite operating horizon from an initially empty system.

Each approach has three dedicated incoming lanes for left-turn, through, and right-turn movements. Traffic demand is modeled by independent homogeneous Poisson arrival processes and independent turning assignments with fixed probabilities. A seeded linear congruential generator and exponential inverse-transform sampling produce reproducible arrival schedules. Each lane follows first-come, first-served service with a deterministic service duration equal to its discharge headway. Waiting excludes time in a separate in-service state. Service begins only when it can finish within the movement’s permitted green interval; clearance intervals permit no discharge events. Four protected phases serve the approaches in a fixed sequence, with only one approach permitted at a time.

The decision variables are integer-second green durations. For fixed cycle length $C$, total clearance time $L$, and specified green-time bounds, the feasible set is

$$
\Omega=\left\{\mathbf g\in\mathbb Z_{\geq0}^{4}:\ \sum_{i=1}^{4}g_i=C-L,\quad g_i^{\min}\leq g_i\leq g_i^{\max}\right\}.
$$

Here, green denotes the modeled service interval without additional effective-green adjustments. With $Q_m(t;\mathbf g)$ counting vehicles awaiting service in movement $m$, the objective is

$$
\min_{\mathbf g\in\Omega}\mathbb E[D_T(\mathbf g)],\qquad D_T(\mathbf g)=\sum_{m=1}^{12}\int_0^T Q_m(t;\mathbf g)\,\mathrm dt.
$$

This measure, in vehicle-seconds, includes unfinished waiting accumulated up to horizon $T$.

A deterministic next-event simulation evaluates feasible allocations on a specified discrete grid of integer-second green durations. Arrival schedules are generated independently of signal decisions and replayed across candidates for paired Monte Carlo comparisons. Replications estimate expected waiting, queue lengths, throughput, residual backlog, and approximate confidence intervals for performance estimates. The allocation with the lowest estimated waiting among grid candidates is assessed on fresh scenarios against feasible grid approximations to equal-green and demand-proportional baselines. Convergence analysis examines replication uncertainty, while sensitivity experiments vary arrival demand.

Verification uses hand-calculated event traces, vehicle conservation, and agreement between queue-area integration and accumulated waiting. The study assumes unlimited upstream storage and excludes downstream blocking, pedestrians, lane changes, and microscopic vehicle dynamics. A Rust/WebAssembly engine with a SolidJS interface and SVG traffic visualization presents the experiments.
