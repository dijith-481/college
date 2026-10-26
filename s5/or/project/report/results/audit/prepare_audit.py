import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
base = json.loads((HERE.parent / "requests" / "baseline-reference.json").read_text())
cases = [
    ("horizon-576", {"horizon": 576}, 2026),
    ("horizon-624", {"horizon": 624}, 2026),
    ("horizon-672", {"horizon": 672}, 2026),
    ("horizon-960", {"horizon": 960}, 2026),
    ("horizon-1920", {"horizon": 1920}, 2026),
    ("seed-2027", {}, 2027),
    ("seed-2028", {}, 2028),
    ("seed-2029", {}, 2029),
    ("heavy-horizon-1920", {"horizon": 1920, "rates": [900, 525, 825, 450]}, 2026),
]
path = HERE / "requests"
path.mkdir(exist_ok=True)
for identifier, config_changes, seed in cases:
    request = {
        **base,
        "seed": seed,
        "sensitivity": False,
        "config": {**base["config"], **config_changes},
    }
    (path / f"{identifier}.json").write_text(json.dumps(request, indent=2) + "\n")

precise = json.loads((HERE.parent / "requests" / "baseline-precise.json").read_text())
for seed in (2027, 2028, 2029):
    request = {**precise, "seed": seed}
    (path / f"paired-seed-{seed}.json").write_text(json.dumps(request, indent=2) + "\n")

for horizon in (600, 960, 1920):
    request = {
        **precise,
        "seed": 2027,
        "optimize": False,
        "sensitivity": False,
        "config": {**precise["config"], "horizon": horizon},
    }
    (path / f"fixed-horizon-{horizon}.json").write_text(json.dumps(request, indent=2) + "\n")
