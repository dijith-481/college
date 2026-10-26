import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
validated = 0
for folder in (ROOT, HERE):
    for path in (folder / "raw").glob("*.json"):
        if path.stem.startswith("paired-"):
            continue
        request_path = folder / "requests" / path.name
        request = json.loads(request_path.read_text())
        result = json.loads(path.read_text())
        assert result["request"] == request, path
        assert result["delay"]["n"] == request["replications"], path
        assert result["distribution"]["total"] == request["replications"], path
        expected_search = len(result["candidates"]) * request["training_replications"]
        assert result["search_distribution"]["total"] == expected_search, path
        run = result["run"]
        assert run["arrivals"] == run["departures"] + run["remaining"] + run["in_service"], path
        assert run["accounting_error"] < 1e-7, path
        profile = result["queue_profile"]
        width = request["config"]["horizon"] / (len(profile) - 1)
        area = sum(sum(point["queues"]) * width for point in profile[:-1])
        assert abs(area - result["delay"]["mean"]) < 1e-6, path
        validated += 1

for path in (ROOT / "raw" / "paired-grid-comparison.json", *(HERE / "raw").glob("paired-*.json")):
    result = json.loads(path.read_text())
    assert len(result["paired_savings"]) == result["matched_fresh_scenarios"], path
    assert abs(result["coarse"]["mean"] - result["fine"]["mean"]
               - result["paired_saving_coarse_minus_fine"]["mean"]) < 1e-7, path
    validated += 1

print(f"Validated {validated} saved experiments and paired comparisons")
