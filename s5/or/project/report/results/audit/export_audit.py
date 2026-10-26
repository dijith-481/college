import csv
import hashlib
import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def result(name):
    path = ROOT / "raw" / f"{name}.json" if name in ("baseline-reference", "heavy-reference", "paired-grid-comparison") else HERE / "raw" / f"{name}.json"
    return json.loads(path.read_text())


def write(name, columns, rows):
    with (HERE / name).open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


horizons = []
for name in ("horizon-576", "baseline-reference", "horizon-624", "horizon-672", "horizon-960", "horizon-1920"):
    output = result(name)
    horizons.append({
        "case": name,
        "horizon_s": output["request"]["config"]["horizon"],
        **dict(zip(("north_green_s", "east_green_s", "south_green_s", "west_green_s"), output["selected"])),
        "mean_wait_per_arrival_s": output["waiting_per_arrival"]["mean"],
        "wait_per_arrival_low_95": output["waiting_per_arrival"]["low"],
        "wait_per_arrival_high_95": output["waiting_per_arrival"]["high"],
        "mean_end_backlog": output["backlog"]["mean"],
    })
write("horizon_comparison.csv", list(horizons[0]), horizons)

fixed = []
for horizon in (600, 960, 1920):
    output = result(f"fixed-horizon-{horizon}")
    proportional = next(item for item in output["comparisons"] if item["label"] == "Demand proportional")
    saving = proportional["paired_saving"]
    fixed.append({
        "horizon_s": horizon,
        "replications": output["delay"]["n"],
        "input_mean_vehicle_seconds": output["delay"]["mean"],
        "proportional_mean_vehicle_seconds": proportional["delay"]["mean"],
        "input_minus_proportional_vehicle_seconds": -saving["mean"],
        "saving_low_95": -saving["high"],
        "saving_high_95": -saving["low"],
    })
write("fixed_plan_horizon_comparison.csv", list(fixed[0]), fixed)

seeds = []
for name in ("baseline-reference", "seed-2027", "seed-2028", "seed-2029"):
    output = result(name)
    seeds.append({
        "seed": output["request"]["seed"],
        **dict(zip(("north_green_s", "east_green_s", "south_green_s", "west_green_s"), output["selected"])),
        "mean_wait_vehicle_seconds": output["delay"]["mean"],
        "wait_low_95": output["delay"]["low"],
        "wait_high_95": output["delay"]["high"],
    })
write("seed_search_stability.csv", list(seeds[0]), seeds)

paired = []
for seed in (2026, 2027, 2028, 2029):
    output = result("paired-grid-comparison" if seed == 2026 else f"paired-seed-{seed}")
    saving = output["paired_saving_coarse_minus_fine"]
    paired.append({
        "seed": seed,
        "replications": output["matched_fresh_scenarios"],
        "coarse_minus_fine_vehicle_seconds": saving["mean"],
        "saving_low_95": saving["low"],
        "saving_high_95": saving["high"],
    })
write("fine_grid_seed_validation.csv", list(paired[0]), paired)

capacity = []
for name in ("baseline-reference", "heavy-reference"):
    output = result(name)
    config = output["request"]["config"]
    for approach, rate, green in zip(("North", "East", "South", "West"), config["rates"], output["selected"]):
        straight_demand = rate * config["turns"][1]
        ideal_capacity = math.floor(green / config["headway"]) * 3600 / config["cycle"]
        capacity.append({
            "case": name,
            "approach": approach,
            "straight_demand_vehicles_per_hour": straight_demand,
            "straight_ideal_capacity_vehicles_per_hour": ideal_capacity,
            "demand_capacity_ratio": straight_demand / ideal_capacity,
        })
write("straight_lane_capacity.csv", list(capacity[0]), capacity)

artifacts = []
for path in sorted((HERE / "raw").glob("*.json")):
    request = HERE / "requests" / path.name
    artifacts.append({
        "id": path.stem,
        "request": f"requests/{path.name}",
        "request_sha256": hashlib.sha256(request.read_bytes()).hexdigest(),
        "raw": f"raw/{path.name}",
        "raw_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    })
(HERE / "manifest.json").write_text(json.dumps({
    "generated_utc": datetime.now(timezone.utc).isoformat(),
    "source_revision": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=HERE, text=True).strip(),
    "source_has_uncommitted_audit_changes": True,
    "artifacts": artifacts,
}, indent=2) + "\n")

print("Wrote five audit tables")
