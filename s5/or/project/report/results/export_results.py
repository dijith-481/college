import csv
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent


def write_csv(path, columns, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def stats(row, prefix):
    return {f"{prefix}_{key}": row[key] for key in ("n", "mean", "sd", "se", "low", "high")}


def density_rows(distribution):
    columns = distribution["columns"]
    rows = distribution["rows"]
    for index, count in enumerate(distribution["counts"]):
        if count:
            y, x = divmod(index, columns)
            yield {
                "wait_lower_s": x * distribution["max_wait"] / columns,
                "wait_upper_s": (x + 1) * distribution["max_wait"] / columns,
                "backlog_lower_vehicles": y * distribution["max_backlog"] / rows,
                "backlog_upper_vehicles": (y + 1) * distribution["max_backlog"] / rows,
                "count": count,
            }


cases = json.loads((HERE / "cases.json").read_text())
runtimes = json.loads((HERE / "runtimes.json").read_text()) if (HERE / "runtimes.json").exists() else {}
summary = []
manifest_cases = []
for case in cases:
    identifier = case["id"]
    raw_path = HERE / "raw" / f"{identifier}.json"
    if not raw_path.exists():
        continue
    output = json.loads(raw_path.read_text())
    request = json.loads((HERE / "requests" / f"{identifier}.json").read_text())
    if output["request"] != request:
        raise ValueError(f"request mismatch: {identifier}")
    if output["delay"]["n"] != request["replications"]:
        raise ValueError(f"incomplete fresh evaluation: {identifier}")
    if output["distribution"]["total"] != request["replications"]:
        raise ValueError(f"incomplete fresh distribution: {identifier}")
    profile = output["queue_profile"]
    width = request["config"]["horizon"] / (len(profile) - 1)
    area = sum(sum(point["queues"]) * width for point in profile[:-1])
    if abs(area - output["delay"]["mean"]) > 1e-6:
        raise ValueError(f"queue area disagrees with mean waiting: {identifier}")
    selected = next(
        (candidate for candidate in output["candidates"] if candidate["green"] == output["selected"]),
        None,
    )
    graph_dir = HERE / "graph_data" / identifier
    write_csv(
        graph_dir / "convergence.csv",
        ["replications", "mean_vehicle_seconds", "low_95", "high_95", "se"],
        ({"replications": point["n"], "mean_vehicle_seconds": point["mean"],
          "low_95": point["low"], "high_95": point["high"], "se": point["se"]}
         for point in output["convergence"]),
    )
    write_csv(
        graph_dir / "mean_queue_over_time.csv",
        ["time_s", "north", "east", "south", "west"],
        ({"time_s": point["time"], **dict(zip(("north", "east", "south", "west"), point["queues"]))}
         for point in output["queue_profile"]),
    )
    write_csv(
        graph_dir / "timing_comparison.csv",
        ["label", "north_green_s", "east_green_s", "south_green_s", "west_green_s",
         "mean_vehicle_seconds", "low_95", "high_95", "paired_saving_mean_vehicle_seconds",
         "paired_saving_low_95", "paired_saving_high_95"],
        ({"label": comparison["label"],
          **dict(zip(("north_green_s", "east_green_s", "south_green_s", "west_green_s"), comparison["green"])),
          "mean_vehicle_seconds": comparison["delay"]["mean"],
          "low_95": comparison["delay"]["low"],
          "high_95": comparison["delay"]["high"],
          "paired_saving_mean_vehicle_seconds": comparison["paired_saving"]["mean"],
          "paired_saving_low_95": comparison["paired_saving"]["low"],
          "paired_saving_high_95": comparison["paired_saving"]["high"]}
         for comparison in output["comparisons"]),
    )
    write_csv(
        graph_dir / "candidate_search.csv",
        ["north_green_s", "east_green_s", "south_green_s", "west_green_s", "training_mean_vehicle_seconds"],
        ({**dict(zip(("north_green_s", "east_green_s", "south_green_s", "west_green_s"), candidate["green"])),
          "training_mean_vehicle_seconds": candidate["delay"]["mean"]}
         for candidate in output["candidates"]),
    )
    write_csv(
        graph_dir / "fixed_timing_sensitivity.csv",
        ["demand_multiplier", "total_rate_vehicles_per_hour", "mean_vehicle_seconds", "low_95", "high_95",
         "mean_end_backlog_vehicles"],
        ({"demand_multiplier": point["scale"], "total_rate_vehicles_per_hour": point["rate"],
          "mean_vehicle_seconds": point["delay"]["mean"], "low_95": point["delay"]["low"],
          "high_95": point["delay"]["high"], "mean_end_backlog_vehicles": point["backlog"]["mean"]}
         for point in output["sensitivity"]),
    )
    for name, distribution in (("fresh_outcome_density", output["distribution"]),
                               ("search_outcome_density", output["search_distribution"])):
        write_csv(
            graph_dir / f"{name}.csv",
            ["wait_lower_s", "wait_upper_s", "backlog_lower_vehicles", "backlog_upper_vehicles", "count"],
            density_rows(distribution),
        )
    rates = request["config"]["rates"]
    row = {
        "id": identifier,
        "label": case["label"],
        "seed": request["seed"],
        "horizon_s": request["config"]["horizon"],
        "grid_step_s": request["grid_step"],
        "candidate_count": len(output["candidates"]),
        "training_runs_per_candidate": request["training_replications"],
        "fresh_runs": request["replications"],
        "rate_north_h": rates[0], "rate_east_h": rates[1],
        "rate_south_h": rates[2], "rate_west_h": rates[3],
        "expected_arrivals": sum(rates) * request["config"]["horizon"] / 3600,
        "selected_north_s": output["selected"][0], "selected_east_s": output["selected"][1],
        "selected_south_s": output["selected"][2], "selected_west_s": output["selected"][3],
        "selected_training_mean_vehicle_seconds": selected["delay"]["mean"] if selected else "",
        **stats(output["delay"], "fresh_wait_vehicle_seconds"),
        **stats(output["waiting_per_arrival"], "wait_per_arrival_seconds"),
        **stats(output["queue"], "mean_queue_vehicles"),
        **stats(output["throughput"], "throughput_vehicles_per_hour"),
        **stats(output["backlog"], "end_backlog_vehicles"),
    }
    summary.append(row)
    request_path = HERE / "requests" / f"{identifier}.json"
    manifest_cases.append({
        "id": identifier,
        "request": f"requests/{identifier}.json",
        "request_sha256": hashlib.sha256(request_path.read_bytes()).hexdigest(),
        "raw": f"raw/{identifier}.json",
        "raw_sha256": hashlib.sha256(raw_path.read_bytes()).hexdigest(),
        "engine_version": output["engine_version"],
        "runtime_seconds": runtimes.get(identifier),
    })

if not summary:
    raise SystemExit("No completed raw results found")
write_csv(HERE / "summary.csv", list(summary[0]), summary)
write_csv(
    HERE / "graph_data" / "demand_timing_comparison.csv",
    ["case", "rate_north_h", "rate_east_h", "rate_south_h", "rate_west_h", "expected_arrivals",
     "selected_north_s", "selected_east_s", "selected_south_s", "selected_west_s",
     "mean_wait_vehicle_seconds", "wait_low_95", "wait_high_95", "mean_end_backlog_vehicles"],
    ({"case": row["id"], **{key: row[key] for key in (
        "rate_north_h", "rate_east_h", "rate_south_h", "rate_west_h", "expected_arrivals",
        "selected_north_s", "selected_east_s", "selected_south_s", "selected_west_s")},
      "mean_wait_vehicle_seconds": row["fresh_wait_vehicle_seconds_mean"],
      "wait_low_95": row["fresh_wait_vehicle_seconds_low"],
      "wait_high_95": row["fresh_wait_vehicle_seconds_high"],
      "mean_end_backlog_vehicles": row["end_backlog_vehicles_mean"]}
     for row in summary),
)
lines = [
    "# Simulation results — generated from saved Rust outputs",
    "",
    "The rates and arrival counts are hypothetical. Waiting is cumulative queue waiting within a 10-minute empty-start run; confidence intervals quantify simulation uncertainty conditional on the model.",
    "",
    "| Case | Expected arrivals | Grid | Search/fresh runs | Selected green N/E/S/W (s) | Mean waiting (vehicle-s) | 95% CI | End backlog |",
    "| --- | ---: | ---: | ---: | --- | ---: | --- | ---: |",
]
for row in summary:
    green = "/".join(str(round(row[f"selected_{road}_s"])) for road in ("north", "east", "south", "west"))
    lines.append(
        f"| {row['label']} | {row['expected_arrivals']:,.0f} | {row['grid_step_s']} s | "
        f"{row['training_runs_per_candidate']:,}/{row['fresh_runs']:,} | {green} | "
        f"{row['fresh_wait_vehicle_seconds_mean']:,.1f} | "
        f"[{row['fresh_wait_vehicle_seconds_low']:,.1f}, {row['fresh_wait_vehicle_seconds_high']:,.1f}] | "
        f"{row['end_backlog_vehicles_mean']:.2f} |"
    )
lines += [
    "",
    "All plans in a case use the same training scenarios. Fresh comparisons use matched arrivals. The fine-grid and coarse-grid cases do not have paired fresh scenarios, so compare their intervals cautiously.",
]
baseline_output = json.loads((HERE / "raw" / "baseline-reference.json").read_text())
baseline_savings = next(item for item in baseline_output["comparisons"] if item["label"] == "Input timing")["paired_saving"]
lines += [
    "",
    f"For the main baseline, the selected timing saves {baseline_savings['mean']:.1f} vehicle-s "
    f"per run against the input timing on matched fresh arrivals "
    f"(paired 95% CI [{baseline_savings['low']:.1f}, {baseline_savings['high']:.1f}]). "
    "The selected 4-second-grid plan is also the demand-proportional baseline on this grid, "
    "so those two labels have identical results here.",
]
paired_path = HERE / "raw" / "paired-grid-comparison.json"
paired_manifest = None
if paired_path.exists():
    paired = json.loads(paired_path.read_text())
    if paired["matched_fresh_scenarios"] != 5000 or paired["training_scenarios_skipped"] != 256:
        raise ValueError("unexpected paired comparison scenario allocation")
    coarse = next(row for row in summary if row["id"] == "baseline-precise")
    if abs(paired["coarse"]["mean"] - coarse["fresh_wait_vehicle_seconds_mean"]) > 1e-7:
        raise ValueError("paired comparison does not reproduce baseline-precise fresh mean")
    values = paired["paired_savings"]
    total = 0.0
    rows = []
    for index, value in enumerate(values, 1):
        total += value
        rows.append({"replication": index, "coarse_minus_fine_vehicle_seconds": value,
                     "running_mean_saving_vehicle_seconds": total / index})
    write_csv(HERE / "graph_data" / "paired_grid_savings.csv",
              ["replication", "coarse_minus_fine_vehicle_seconds", "running_mean_saving_vehicle_seconds"], rows)
    gain = paired["paired_saving_coarse_minus_fine"]
    lines += [
        "",
        "## Matched fine-grid verification",
        "",
        f"The 1-second search took {runtimes['fine-grid-verification']:.2f} s and selected "
        f"`{'/'.join(str(round(value)) for value in paired['fine_green'])}` instead of the 4-second grid's "
        f"`{'/'.join(str(round(value)) for value in paired['coarse_green'])}`. On the **same 5,000 fresh scenarios**, "
        f"the fine timing reduced cumulative waiting by **{gain['mean']:.1f} vehicle-s per 10-minute run** "
        f"({100 * gain['mean'] / paired['coarse']['mean']:.2f}% of the coarse timing's mean; "
        f"paired 95% CI [{gain['low']:.1f}, {gain['high']:.1f}]). "
        "The matched scenarios begin after the 256 training scenarios used by the coarse precise case; its mean is reproduced exactly. "
        "This is a small model-conditional gain, not proof of the real junction's optimum.",
    ]
    paired_manifest = {
        "raw": "raw/paired-grid-comparison.json",
        "raw_sha256": hashlib.sha256(paired_path.read_bytes()).hexdigest(),
        "runtime_seconds": runtimes.get("paired-grid-comparison"),
        "comparison": "baseline-precise versus fine-grid-verification on matched fresh arrivals",
    }
lines += [
    "",
    "Raw engine results, exact requests, and plot-ready CSV files are in this folder. No real traffic measurements were used.",
    "",
]
(HERE / "summary.md").write_text("\n".join(lines))
revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=HERE, text=True).strip()
(HERE / "manifest.json").write_text(json.dumps({
    "generated_utc": datetime.now(timezone.utc).isoformat(),
    "source_revision": revision,
    "source_has_uncommitted_study_changes": True,
    "cases": manifest_cases,
    "paired_grid_comparison": paired_manifest,
}, indent=2) + "\n")
