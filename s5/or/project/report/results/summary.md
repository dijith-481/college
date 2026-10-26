# Simulation results — generated from saved Rust outputs

The rates and arrival counts are hypothetical. Waiting is cumulative queue waiting within a 10-minute empty-start run; confidence intervals quantify simulation uncertainty conditional on the model.

| Case | Expected arrivals | Grid | Search/fresh runs | Selected green N/E/S/W (s) | Mean waiting (vehicle-s) | 95% CI | End backlog |
| --- | ---: | ---: | ---: | --- | ---: | --- | ---: |
| Baseline / quick | 300 | 4 s | 64/128 | 28/16/24/12 | 10,507.3 | [10,300.9, 10,713.7] | 18.19 |
| Baseline / reference | 300 | 4 s | 256/1,000 | 28/16/24/12 | 10,507.8 | [10,430.7, 10,584.9] | 18.77 |
| Baseline / precise | 300 | 4 s | 256/5,000 | 28/16/24/12 | 10,542.9 | [10,508.8, 10,577.0] | 18.69 |
| Quiet / reference | 150 | 4 s | 256/1,000 | 36/12/20/12 | 4,580.6 | [4,548.9, 4,612.3] | 8.27 |
| Heavy / reference | 450 | 4 s | 256/1,000 | 28/16/24/12 | 23,431.5 | [23,189.5, 23,673.6] | 54.40 |
| South-heavy / reference | 300 | 4 s | 256/1,000 | 16/16/36/12 | 10,077.9 | [10,004.5, 10,151.4] | 18.50 |
| Fine-grid verification | 300 | 1 s | 128/5,000 | 26/16/24/14 | 10,495.0 | [10,462.8, 10,527.2] | 18.67 |

All plans in a case use the same training scenarios. Fresh comparisons use matched arrivals. The fine-grid and coarse-grid cases do not have paired fresh scenarios, so compare their intervals cautiously.

For the main baseline, the selected timing saves 104.2 vehicle-s per run against the input timing on matched fresh arrivals (paired 95% CI [69.6, 138.8]). The selected 4-second-grid plan is also the demand-proportional baseline on this grid, so those two labels have identical results here.

## Matched fine-grid verification

The original 1-second search took 209.02 s and selected `26/16/24/14` instead of the 4-second grid's `28/16/24/12`. After approach-level caching, the same request took 6.86 s (30.5× faster) and selected the same plan. On the **same 5,000 fresh scenarios**, the fine timing reduced cumulative waiting by **44.8 vehicle-s per 10-minute run** (0.42% of the coarse timing's mean; paired 95% CI [34.8, 54.8]). The matched scenarios begin after the 256 training scenarios used by the coarse precise case; its mean is reproduced exactly. This is a small model-conditional gain, not proof of the real junction's optimum. See [`optimization-runtimes.json`](optimization-runtimes.json) for timing details.

Raw engine results, exact requests, and plot-ready CSV files are in this folder. No real traffic measurements were used.
