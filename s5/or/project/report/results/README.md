# Saved simulation study

[summary.md](summary.md) is the readable result. [summary.csv](summary.csv) contains the numerical table. [PLAN.md](PLAN.md) records the scenario design and limits.

The [results audit](audit/AUDIT.md) adds alternate seeds, horizon checks, a fixed-plan comparison, and an analytical capacity check. Its own [manifest](audit/manifest.json) records the additional raw files and hashes. It states which conclusions are suitable for the report.

The seven exact inputs are in `requests/`; their complete Rust engine outputs are in `raw/`. `graph_data/<case>/` has plot-ready CSVs for convergence, average queue over time, plan comparisons, candidate training scores, fixed-timing demand sensitivity, and outcome densities. `graph_data/demand_timing_comparison.csv` compares scenarios; `graph_data/paired_grid_savings.csv` records the matched coarse-versus-fine comparison. The last row of each average-queue CSV repeats the final interval value only to extend the plot to the horizon; integrate the first 120 rows to recover the objective.

`manifest.json` records the seed, engine version, input/output hashes, source revision, and measured native runtimes. The repository contains uncommitted study files, so its Git revision alone does not identify the exact source state. These files were generated with the current local implementation; preserve this folder alongside the source when using the numbers in a report.

To reproduce from the project root:

```sh
python report/results/prepare_requests.py
cd implementation
cargo build --release -p experiments --example study --example compare_grids
cd ..
mkdir -p report/results/raw
for case in baseline-quick baseline-reference baseline-precise quiet-reference heavy-reference south-heavy-reference fine-grid-verification; do
  implementation/target/release/examples/study "report/results/requests/$case.json" "report/results/raw/$case.json"
done
implementation/target/release/examples/compare_grids report/results/requests/baseline-precise.json report/results/raw/baseline-precise.json report/results/raw/fine-grid-verification.json report/results/raw/paired-grid-comparison.json
python report/results/export_results.py
```

The original fine-grid case took 209 seconds. After approach-level caching, the same request took 6.86 seconds on this machine (30.5× faster); see [`optimization-runtimes.json`](optimization-runtimes.json). Timings can differ elsewhere. After regenerating `implementation/src/study_cases.json`, run `vp check --fix` from `implementation/` to apply the project's formatter. The seven exact study requests remain selectable in the app; it also includes a separate Toronto data-based demonstration preset with an explicitly assumed equal approach split. Editing any selected setting makes it a custom configuration, which needs a new run; saved results are never substituted for that run.

All rates are assumed, not measured. The seed fixes pseudorandom draws; replications still represent different simulated arrival scenarios. The paired comparison estimates the benefit of the two **selected** timings under this model and seed. It does not establish the true optimum among all one-second timings or validate a signal plan for field use.
