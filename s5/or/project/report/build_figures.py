import csv
import json
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "assets"
OUT.mkdir(exist_ok=True)
RESULTS = HERE / "results"
COLORS = ["#087f72", "#bd5720", "#6355b4", "#2464b3"]
INK = "#203540"
MUTED = "#536a78"
GRID = "#dce6eb"


def raw(name):
    return json.loads((RESULTS / "raw" / f"{name}.json").read_text())


def el(tag, **attrs):
    return "<" + tag + " " + " ".join(f'{k.replace("_", "-")}="{escape(str(v))}"' for k, v in attrs.items()) + "/>"


def text(x, y, value, size=16, color=INK, weight=400, anchor="start"):
    return f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(value))}</text>'


def line(x1, y1, x2, y2, color=GRID, width=1, dash=None):
    attrs = {"x1": x1, "y1": y1, "x2": x2, "y2": y2, "stroke": color, "stroke_width": width}
    if dash:
        attrs["stroke_dasharray"] = dash
    return el("line", **attrs)


def rect(x, y, w, h, fill, radius=0, stroke="none"):
    return el("rect", x=x, y=y, width=w, height=h, rx=radius, fill=fill, stroke=stroke)


def circle(x, y, radius, fill):
    return el("circle", cx=x, cy=y, r=radius, fill=fill)


def polyline(points, color, width=3):
    return el("polyline", points=" ".join(f"{x:.2f},{y:.2f}" for x, y in points), fill="none", stroke=color, stroke_width=width, stroke_linejoin="round", stroke_linecap="round")


def svg(name, width, height, body, title):
    content = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{escape(title)}"><style>text{{font-family:Inter,Arial,sans-serif}}</style>{rect(0,0,width,height,"#ffffff")}{body}</svg>'
    (OUT / name).write_text(content)


reference = raw("baseline-reference")
plans = [{"label": "Recommended", "green": reference["selected"], "stat": reference["delay"]}]
plans += [{"label": item["label"], "green": item["green"], "stat": item["delay"]} for item in reference["comparisons"]]
body = [text(55, 44, "Fresh waiting by timing plan", 25, INK, 700), text(55, 72, "Four-second grid · 1,000 matched fresh scenarios · vehicle-seconds per 10-minute run", 15, MUTED)]
xmin, xmax, left, right = 10000, 12200, 350, 940
for tick in (10000, 10500, 11000, 11500, 12000):
    x = left + (tick - xmin) / (xmax - xmin) * (right - left)
    body += [line(x, 100, x, 425), text(x, 450, f"{tick/1000:.1f}k", 14, MUTED, anchor="middle")]
for i, plan in enumerate(plans):
    y = 135 + i * 72
    stat = plan["stat"]
    xp = lambda value: left + (value - xmin) / (xmax - xmin) * (right - left)
    color = COLORS[0] if i == 0 else "#657e8b"
    body += [text(55, y + 5, plan["label"], 17, INK, 650), text(55, y + 25, "/".join(str(round(v)) for v in plan["green"]) + " s green", 13, MUTED), line(xp(stat["low"]), y, xp(stat["high"]), y, color, 5), circle(xp(stat["mean"]), y, 8, color), text(945, y - 12, f'{stat["mean"]:,.0f}', 16, color, 700, "end")]
body += [text(350, 485, "Horizontal axis starts at 10,000; whiskers are pointwise 95% intervals for each mean.", 13, MUTED)]
svg("fig-timing.svg", 1000, 510, "".join(body), "Fresh waiting by timing plan")

baseline = reference
profile = baseline["queue_profile"]
left, right, top, bottom = 95, 945, 100, 410
max_queue = max(max(point["queues"]) for point in profile)
ymax = max(8, int(max_queue + 2))
body = [text(55, 43, "Average queues over the ten-minute period", 25, INK, 700), text(55, 72, "Mean waiting vehicles across 1,000 fresh runs; each curve is one incoming approach", 15, MUTED)]
for tick in (0, 2, 4, 6, 8, 10):
    x = left + tick / 10 * (right - left)
    body += [line(x, bottom, x, bottom + 5, MUTED), text(x, 438, tick, 14, MUTED, anchor="middle")]
for tick in range(0, ymax + 1, 2):
    y = bottom - tick / ymax * (bottom - top)
    body += [line(left, y, right, y), text(74, y + 5, tick, 14, MUTED, anchor="end")]
for approach, label in enumerate(("North", "East", "South", "West")):
    points = [(left + point["time"] / 600 * (right - left), bottom - point["queues"][approach] / ymax * (bottom - top)) for point in profile]
    body.append(polyline(points, COLORS[approach], 3))
    body += [line(130 + approach * 180, 475, 155 + approach * 180, 475, COLORS[approach], 4), text(165 + approach * 180, 480, label, 15, INK, 600)]
body += [text(945, 438, "minutes", 14, MUTED, anchor="end"), text(55, 99, "vehicles", 14, MUTED)]
svg("fig-queues.svg", 1000, 510, "".join(body), "Average queues by approach over time")

points = baseline["convergence"]
final_mean = baseline["delay"]["mean"]
body = [text(55, 42, "Monte Carlo estimate as replications accumulate", 25, INK, 700), text(55, 72, "Selected timing · running mean total waiting · dashed reference is the 1,000-run estimate", 15, MUTED)]
for panel, subset, label, xmax in ((0, [p for p in points if p["n"] <= 100], "First 100 fresh runs", 100), (1, points, "All 1,000 fresh runs", 1000)):
    x0 = 85 + panel * 490
    x1 = x0 + 405
    y0, y1 = 125, 410
    values = [p["mean"] for p in subset if p["n"] >= 2]
    lo = min(values + [final_mean]) - 100
    hi = max(values + [final_mean]) + 100
    xp = lambda value: x0 + value / xmax * (x1 - x0)
    yp = lambda value: y1 - (value - lo) / (hi - lo) * (y1 - y0)
    for k in range(4):
        v = lo + (hi - lo) * k / 3
        y = yp(v)
        body += [line(x0, y, x1, y), text(x0 - 10, y + 5, f"{v/1000:.1f}k", 12, MUTED, anchor="end")]
    body += [line(x0, yp(final_mean), x1, yp(final_mean), "#bd5720", 2, "7 5"), polyline([(xp(p["n"]), yp(p["mean"])) for p in subset], COLORS[0], 3), text((x0+x1)/2, 455, label, 17, INK, 650, "middle"), text(x0, 112, "vehicle-seconds", 13, MUTED), text(x0, 432, "0", 13, MUTED), text(x1, 432, str(xmax), 13, MUTED, anchor="end")]
body += [text(55, 490, "The running mean settles around the modeled expectation; it does not prove that traffic in the field follows the model.", 13, MUTED)]
svg("fig-convergence.svg", 1100, 510, "".join(body), "Monte Carlo convergence of mean total waiting")

scenario_ids = ["quiet-reference", "baseline-reference", "heavy-reference", "south-heavy-reference"]
labels = ["Quiet", "Baseline", "Heavy", "South-heavy"]
body = [text(55, 44, "Selected green allocation across demand scenarios", 25, INK, 700), text(55, 73, "Four-second timing grid · 80 seconds of green available in each 96-second cycle", 15, MUTED)]
for row, (scenario_id, label) in enumerate(zip(scenario_ids, labels)):
    item = raw(scenario_id)
    y = 120 + row * 82
    body += [text(55, y + 17, label, 18, INK, 650), text(55, y + 39, f'{sum(item["request"]["config"]["rates"]):,.0f} veh/h', 13, MUTED)]
    x = 300
    for j, green in enumerate(item["selected"]):
        width = green / 80 * 620
        body += [rect(x, y, width, 44, COLORS[j], 0), text(x + width/2, y + 29, str(round(green)), 16, "#fff", 700, "middle")]
        x += width
for j, label in enumerate(("North", "East", "South", "West")):
    body += [circle(325 + 150*j, 470, 6, COLORS[j]), text(339 + 150*j, 475, label, 14, INK)]
svg("fig-demand.svg", 1000, 510, "".join(body), "Green allocations for demand scenarios")

with (RESULTS / "audit" / "fixed_plan_horizon_comparison.csv").open() as file:
    horizon_rows = list(csv.DictReader(file))
body = [text(55, 43, "The timing advantage depends on the operating period", 25, INK, 700), text(55, 72, "Input minus demand-proportional waiting; positive values favor 28/16/24/12 s", 15, MUTED)]
left, right, top, bottom = 110, 920, 110, 410
for tick in (-50, 0, 50, 100, 150):
    y = bottom - (tick + 50) / 200 * (bottom - top)
    body += [line(left, y, right, y, "#9eb4bd" if tick == 0 else GRID, 2 if tick == 0 else 1), text(85, y + 5, tick, 14, MUTED, anchor="end")]
for row in horizon_rows:
    horizon = int(float(row["horizon_s"]))
    x = left + (horizon - 600) / (1920 - 600) * (right - left)
    y = lambda value: bottom - (float(value) + 50) / 200 * (bottom - top)
    lo, hi, mean = row["saving_low_95"], row["saving_high_95"], row["input_minus_proportional_vehicle_seconds"]
    body += [line(x, y(lo), x, y(hi), COLORS[0], 5), circle(x, y(mean), 9, COLORS[0]), text(x, 445, f"{horizon//60} min", 15, INK, 650, "middle"), text(x, y(mean)-17, f"{float(mean):.0f}", 16, COLORS[0], 700, "middle")]
body += [text(55, 485, "5,000 matched fresh runs per horizon, seed 2027; the 32-minute interval crosses zero.", 13, MUTED)]
svg("fig-horizon.svg", 1000, 510, "".join(body), "Horizon sensitivity of timing savings")

with (RESULTS / "audit" / "straight_lane_capacity.csv").open() as file:
    rows = [row for row in csv.DictReader(file) if row["case"] == "heavy-reference"]
body = [text(55, 43, "Heavy demand exceeds ideal straight-lane capacity", 25, INK, 700), text(55, 72, "Vehicles/hour · selected 28/16/24/12 s timing · one straight lane per approach", 15, MUTED)]
left, right, top, bottom = 105, 945, 110, 405
for tick in (0, 150, 300, 450, 600):
    y = bottom - tick / 600 * (bottom - top)
    body += [line(left, y, right, y), text(80, y + 5, tick, 14, MUTED, anchor="end")]
for j, row in enumerate(rows):
    x = 175 + j * 195
    d = float(row["straight_demand_vehicles_per_hour"])
    c = float(row["straight_ideal_capacity_vehicles_per_hour"])
    body += [rect(x-25, bottom-d/600*(bottom-top), 48, d/600*(bottom-top), "#bd5720", 3), rect(x+30, bottom-c/600*(bottom-top), 48, c/600*(bottom-top), COLORS[0], 3), text(x+28, 437, row["approach"], 16, INK, 650, "middle")]
body += [rect(250, 468, 18, 18, "#bd5720"), text(277, 483, "Straight demand", 14, INK), rect(525, 468, 18, 18, COLORS[0]), text(552, 483, "Ideal capacity", 14, INK)]
svg("fig-capacity.svg", 1000, 510, "".join(body), "Heavy straight-lane demand exceeds capacity")

print("Built six SVG figures")
