import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = {
    "config": {
        "horizon": 600,
        "cycle": 96,
        "clearance": 16,
        "headway": 2,
        "rates": [600, 350, 550, 300],
        "turns": [0.2, 0.6, 0.2],
        "green": [24, 16, 24, 16],
    },
    "replications": 1000,
    "training_replications": 256,
    "grid_step": 4,
    "min_green": 8,
    "max_green": 44,
    "seed": 2026,
    "optimize": True,
    "sensitivity": False,
}
CASES = [
    ("baseline-quick", "Baseline / quick", {}, {"training_replications": 64, "replications": 128}),
    ("baseline-reference", "Baseline / reference", {}, {"sensitivity": True}),
    ("baseline-precise", "Baseline / precise", {}, {"replications": 5000}),
    ("quiet-reference", "Quiet / reference", {"rates": [300, 175, 275, 150]}, {}),
    ("heavy-reference", "Heavy / reference", {"rates": [900, 525, 825, 450]}, {}),
    ("south-heavy-reference", "South-heavy / reference", {"rates": [300, 350, 850, 300]}, {}),
    ("fine-grid-verification", "Fine-grid verification", {}, {"grid_step": 1, "training_replications": 128, "replications": 5000}),
]
TORONTO_DEMO_PRESET = {
    "id": "toronto-eglinton-victoria-am-peak",
    "label": "Toronto: Eglinton / Victoria Park (AM peak)",
    "source_note": (
        "Observed AM peak total: 3,139 vehicles/hour on 2026-09-16. The public summary is not directional, "
        "so this preset splits the total evenly across four approaches and retains the default 20/60/20 turn "
        "probabilities. Both splits are assumptions, not measured approach or movement counts."
    ),
    "source_url": "https://open.toronto.ca/dataset/traffic-volumes-at-intersections-for-all-modes/",
    "record_url": "https://www.toraffic.ca/data/intersection-counts",
    "license_url": "https://open.toronto.ca/open-data-licence/",
    "request": {
        **BASE,
        "config": {
            **BASE["config"],
            "rates": [784.75, 784.75, 784.75, 784.75],
        },
        "replications": 128,
        "training_replications": 64,
    },
}

requests = HERE / "requests"
requests.mkdir(exist_ok=True)
catalog = []
for identifier, label, config_changes, changes in CASES:
    request = {**BASE, **changes, "config": {**BASE["config"], **config_changes}}
    (requests / f"{identifier}.json").write_text(json.dumps(request, indent=2) + "\n")
    catalog.append({"id": identifier, "label": label, "request": request})
(HERE / "cases.json").write_text(json.dumps(catalog, indent=2) + "\n")
(HERE.parents[1] / "implementation" / "src" / "study_cases.json").write_text(
    json.dumps(catalog + [TORONTO_DEMO_PRESET], indent=2) + "\n"
)
