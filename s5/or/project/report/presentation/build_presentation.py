from pathlib import Path

ROOT = Path(__file__).resolve().parent
slides = []


def slide(number, title, body, label):
    slides.append(
        f"""<section class="slide{' title-slide' if number == 1 else ''}">
  <header class="top"><span>OPERATIONS RESEARCH · PBCBT504</span><span>{label}</span></header>
  <main class="content">
    <h1>{title}</h1>
    {body}
  </main>
  <footer class="bottom">
    <span>October 26, 2026</span>
    <span>Operations Research · PBCBT504</span>
    <span>{number}/08</span>
  </footer>
</section>"""
    )


def fig(name, alt):
    return f'<img src="../assets/{name}" alt="{alt}">'


slide(
    1,
    "Stochastic Traffic Signal Timing Optimization",
    """<p class="lead">A queuing and Monte Carlo study</p>
    <div class="authors">
      <strong>Dijith Dinesh</strong><strong>Athuljith S</strong>
      <strong>Peter Joe Menachery</strong><strong>Pranav Manoj</strong>
    </div>
    <p class="minor">Department of Computer Engineering<br>
      Government Model Engineering College, Thrikkakara<br>
      Semester S5 · October 2026</p>""",
    "PROJECT PRESENTATION",
)

slide(
    2,
    "A precise, limited question",
    """<div class="three-cards">
      <article class="panel"><h2>Decision</h2>
        <p>Choose green durations for North, East, South, and West.</p>
        <div class="formula">g<sub>N</sub> + g<sub>E</sub> + g<sub>S</sub> + g<sub>W</sub> = 80 s</div>
        <p>The search compares feasible allocations on a fixed grid.</p>
      </article>
      <article class="panel"><h2>Signal operation</h2>
        <p>A 96-second cycle contains four protected phases and 16 seconds of clearance.</p>
        <p>Vehicles are served at a fixed two-second headway while their movement has green.</p>
      </article>
      <article class="panel"><h2>Scenario scope</h2>
        <p>Initially empty queues, assumed Poisson arrivals, 12 movement queues, and a 600-second horizon.</p>
        <p>No field measurements are used in this primary experiment.</p>
      </article>
    </div>
    <p class="objective"><strong>Objective:</strong> minimize expected cumulative waiting, measured in vehicle-seconds.</p>""",
    "MODEL AND DECISION",
)

slide(
    3,
    "From arrivals to waiting cost",
    """<div class="two-cards">
      <article class="panel"><h2>Poisson arrivals</h2>
        <p>Uniform pseudorandom draws are transformed into exponential interarrival gaps:</p>
        <div class="formula">Δt = −ln(1 − U) / λ</div>
        <p>A turning draw assigns each vehicle to a dedicated left, through, or right queue.</p>
      </article>
      <article class="panel"><h2>Queue-area objective</h2>
        <div class="formula">D<sub>T</sub>(g) = Σ<sub>m=1</sub><sup>12</sup> ∫<sub>0</sub><sup>T</sup> Q<sub>m</sub>(t; g) dt</div>
        <p>Cumulative waiting in vehicle-seconds, including partial waiting still in progress at the horizon.</p>
      </article>
    </div>
    <p class="objective">Every candidate timing uses the same training arrivals to reduce noise in the comparison.</p>""",
    "MATHEMATICAL MODEL",
)

slide(
    4,
    "Search, then evaluate on fresh traffic",
    """<div class="steps">
      <article><b>1</b><strong>Enumerate</strong><span>Feasible timings</span></article>
      <article><b>2</b><strong>Score</strong><span>Shared training arrivals</span></article>
      <article><b>3</b><strong>Select</strong><span>Lowest estimated mean</span></article>
      <article><b>4</b><strong>Evaluate</strong><span>New matched arrivals</span></article>
    </div>
    <div class="two-cards lower">
      <article class="panel"><h2>Why simulation?</h2>
        <p>Service is gated by protected green phases and deterministic headways. A continuously serving M/M/1 formula does not represent this operation exactly.</p>
      </article>
      <article class="panel"><h2>Reported measures</h2>
        <p>Mean waiting, paired differences, queue profiles, residual backlog, and uncertainty intervals.</p>
      </article>
    </div>""",
    "OPERATIONS RESEARCH METHOD",
)

slide(
    5,
    "The ten-minute reference result",
    f"""<div class="chart-row">
      <div class="chart">{fig("fig-timing.svg", "Waiting cost by timing plan")}</div>
      <article class="stat">
        <h2>Four-second-grid result</h2>
        <span>Selected green (N/E/S/W)</span><strong>28 / 16 / 24 / 12 s</strong>
        <span>Fresh mean</span><strong>10,507.8 vehicle-seconds/run</strong>
        <span>Saving vs entered timing</span><strong>104.2 vehicle-seconds/run</strong>
        <small>1,000 fresh runs · paired 95% interval: 69.6–138.8</small>
      </article>
    </div>
    <p class="footnote">The selected plan equals the demand-proportional baseline; the mean reduction is modest.</p>""",
    "PRIMARY RESULT",
)

slide(
    6,
    "Fine-grid timing result",
    f"""<div class="chart-row">
      <div class="chart">{fig("fig-grid-timing.svg", "Selected green allocation by timing grid")}</div>
      <article class="stat">
        <span>Selected green (N/E/S/W)</span><strong>26 / 16 / 24 / 14 s</strong>
        <span>Feasible allocations · training runs each</span><strong>19,369 · 128</strong>
        <span>Search runtime</span><strong>6.86 seconds</strong>
        <span>Saving on 5,000 matched fresh runs</span><strong>44.8 vehicle-seconds/run</strong>
        <small>0.42% · paired 95% interval: 34.8–54.8</small>
      </article>
    </div>
    <p class="footnote">The result supports a small difference between the selected plans for this model; it does not establish a global optimum.</p>""",
    "FINE-GRID EVALUATION",
)

slide(
    7,
    "Heavy demand can exceed modeled capacity",
    f"""<div class="chart-row">
      <div class="chart">{fig("fig-capacity.svg", "Demand and capacity by approach")}</div>
      <article class="stat">
        <span>Heavy-scenario total arrival rate</span><strong>2,700 veh/h</strong>
        <span>Green required by straight streams</span><strong>86.4 seconds</strong>
        <span>Green available per cycle</span><strong>80 seconds</strong>
      </article>
    </div>
    <p class="footnote">Mean backlog: 54.4 vehicles at 10 minutes and 110.1 vehicles at 32 minutes.</p>""",
    "CAPACITY LIMIT",
)

slide(
    8,
    "Interpret the recommendation within its scope",
    f"""<div class="chart-row">
      <div class="chart">{fig("fig-horizon.svg", "Timing advantage by operating period")}</div>
      <article class="stat">
        <span>10-minute horizon</span><strong>105.5 vehicle-seconds/run saved</strong>
        <small>Paired 95% interval: 88.5–122.5</small>
        <span>32-minute horizon</span><strong>15.0 vehicle-seconds/run saved</strong>
        <small>Paired 95% interval: −40.3–70.2; no resolved difference.</small>
      </article>
    </div>
    <p class="footnote">Field counts and calibration are needed before applying the timing outside this model.</p>""",
    "INTERPRETATION",
)

assert len(slides) == 8

css = """
@page { size: 13.333in 7.5in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #e7ebf0; color: #203540; font-family: Arial, "DejaVu Sans", sans-serif; }
.slide {
  container-type: inline-size; position: relative; overflow: hidden;
  width: min(1280px, calc(100vw - 40px)); aspect-ratio: 16 / 9;
  display: none; margin: 24px auto; background: #fff; break-after: page;
}
.slide.active { display: block; }
.top { display: none; }
.content { position: absolute; top: 4%; left: 0; right: 0; bottom: 11%; padding: 0 3.2%; }
h1 {
  margin: 0 0 3%; padding: 1.25cqw 2.2cqw; background: #3733b8; color: #fff;
  text-align: left; font-size: 2.15cqw; line-height: 1.15; font-weight: 700;
}
h2 { margin: 0 0 1.2%; color: #3733b8; font-size: 1.6cqw; line-height: 1.2; }
p { margin: 0 0 1.5%; font-size: 1.45cqw; line-height: 1.35; }
.lead { color: #203540; font-size: 2.0cqw; }
.minor { margin-top: 3%; color: #536a78; font-size: 1.32cqw; line-height: 1.5; }
.authors { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4% 5%; width: 68%; margin: 3.5% auto 0; font-size: 1.72cqw; text-align: left; }
.title-slide .content { text-align: center; top: 13%; left: 4%; right: 4%; bottom: 11%; }
.title-slide h1 {
  max-width: 100%; margin: 0 auto 2.5%; padding: 2.0cqw 3.0cqw;
  text-align: center; font-size: 3.2cqw; line-height: 1.1; border-radius: .6cqw;
}
.title-slide .minor { margin-top: 3%; }
.bottom {
  position: absolute; left: 0; right: 0; bottom: 0; height: 5.6%;
  display: grid; grid-template-columns: 20% 60% 20%; align-items: center;
  background: #3733b8; color: #fff; padding: 0 2.2%; font-size: 1.02cqw;
}
.bottom span:first-child { text-align: left; }
.bottom span:nth-child(2) { text-align: center; font-weight: 700; }
.bottom span:last-child { text-align: right; }
.three-cards, .two-cards { display: grid; gap: 1.8%; align-items: stretch; }
.three-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.two-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.panel { min-width: 0; padding: .3cqw 1.1cqw .3cqw 0; }
.panel + .panel { border-left: 1px solid #d8dee9; padding-left: 1.4cqw; }
.panel p { font-size: 1.36cqw; }
.formula { margin: 2.0% 0; color: #203540; font: 1.9cqw "DejaVu Serif", Georgia, serif; text-align: center; }
.objective { margin-top: 2.4%; padding: 1.2cqw 1.5cqw; border-left: .45cqw solid #3733b8; background: #f1f3fb; }
.steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.7%; margin: 2.2% 0 4%; }
.steps article { min-width: 0; padding: 1.2cqw 1.1cqw; border-top: 1px solid #d8dee9; }
.steps b, .steps strong, .steps span { display: block; }
.steps b { margin-bottom: 5%; color: #3733b8; font-size: 2.8cqw; }
.steps strong { font-size: 1.58cqw; }
.steps span { margin-top: 4%; color: #536a78; font-size: 1.25cqw; line-height: 1.25; }
.lower .panel p { font-size: 1.45cqw; }
.chart-row { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, .95fr); gap: 2.3%; height: 66%; min-height: 0; }
.chart { min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center; }
.chart img { display: block; width: 100%; height: 100%; object-fit: contain; }
.stat { min-width: 0; padding: .3cqw 0 0 1.4cqw; border-left: 1px solid #d8dee9; overflow: hidden; }
.stat span, .stat strong, .stat small { display: block; }
.stat span { margin: 1.4% 0 .4%; color: #536a78; font-size: 1.22cqw; line-height: 1.2; }
.stat strong { color: #203540; font-size: 1.55cqw; line-height: 1.2; }
.stat small { margin-top: 1.6%; color: #536a78; font-size: 1.16cqw; line-height: 1.25; }
.footnote { position: absolute; left: 0; right: 0; bottom: 0; color: #536a78; font-size: 1.2cqw; line-height: 1.25; }
.nav { position: fixed; z-index: 5; right: 16px; bottom: 16px; display: flex; gap: 6px; }
.nav button { border: 0; padding: 10px 14px; background: #3733b8; color: #fff; font-size: 18px; cursor: pointer; }
@media screen and (max-width: 700px) {
  .slide { width: calc(100vw - 16px); margin: 8px auto; }
}
@media print {
  html, body { background: #fff; }
  .slide { display: block !important; width: 13.333in; height: 7.5in; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .nav { display: none; }
}
"""

script = """<script>
let current = 0;
const slides = [...document.querySelectorAll('.slide')];
function show(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((item, i) => item.classList.toggle('active', i === current));
}
document.addEventListener('keydown', event => {
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { show(current + 1); event.preventDefault(); }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { show(current - 1); event.preventDefault(); }
});
show(0);
</script>"""

html = (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    '<title>Traffic Signal Timing Presentation</title>'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    f'<style>{css}</style></head><body>{"".join(slides)}'
    '<div class="nav"><button onclick="show(current-1)">←</button>'
    '<button onclick="show(current+1)">→</button></div>'
    f'{script}</body></html>'
)
(ROOT / "presentation.html").write_text(html)
print("Wrote 8 presentation slides")
