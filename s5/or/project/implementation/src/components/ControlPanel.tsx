import { createMemo, createSignal, For, Show } from "solid-js";
import {
  allocate,
  allocateVehicleCounts,
  demandScales,
  inputIssues,
  maximumVehicleCount,
  planCount,
  ratesFromVehicleCounts,
  replicationOptions,
  shiftNext,
  vehicleCountsFromRates,
  vehiclesPerRoadLimit,
} from "../controls";
import { approaches, colors, number, type Four, type Request } from "../types";
import studyCasesJson from "../study_cases.json";
import Slider from "./Slider";

const studyCases = studyCasesJson as {
  id: string;
  label: string;
  request: Request;
  source_note?: string;
  source_url?: string;
  record_url?: string;
  license_url?: string;
}[];

const budgets = [
  { name: "Quick check", search: 64, test: 128 },
  { name: "Standard", search: 256, test: 1000 },
  { name: "Thorough", search: 1000, test: 5000 },
  { name: "Extended", search: 1024, test: 10000 },
  { name: "Deep search", search: 4096, test: 25000 },
];
const countSteps = Array.from({ length: 1001 }, (_, i) =>
  Math.round(Math.expm1((Math.log1p(1000000) * i) / 1000)),
);
const durationSteps = Array.from({ length: 1001 }, (_, i) =>
  Math.round(30 * (86400 / 30) ** (i / 1000)),
);
const greenSteps = Array.from({ length: 1001 }, (_, i) => Math.round(600 * (i / 1000) ** 3));

export default function ControlPanel(props: {
  request: Request;
  busy: boolean;
  onChange: (r: Request) => void;
  onRun: () => void;
  onCancel: () => void;
}) {
  const change = (patch: Partial<Request>) => props.onChange({ ...props.request, ...patch });
  const config = (patch: Partial<Request["config"]>) =>
    change({ config: { ...props.request.config, ...patch } });
  const issues = createMemo(() => inputIssues(props.request));
  const canBalance = () => {
    const total = props.request.config.cycle - props.request.config.clearance;
    return (
      Number.isInteger(total) &&
      Number.isInteger(props.request.min_green) &&
      Number.isInteger(props.request.max_green) &&
      props.request.min_green > 0 &&
      props.request.max_green <= 600 &&
      total >= 4 * props.request.min_green &&
      total <= 4 * props.request.max_green
    );
  };
  const plans = createMemo(() => planCount(props.request));
  const searchWork = () =>
    props.request.optimize ? plans() * props.request.training_replications : 0;
  const testWork = () => 4 * props.request.replications;
  const demandWork = () => demandScales(props.request).length * props.request.replications;
  const totalWork = () => searchWork() + testWork() + demandWork();
  const [vehicles, setVehicles] = createSignal<Four>(
    vehicleCountsFromRates(props.request.config.rates, props.request.config.horizon),
  );
  const [weights, setWeights] = createSignal<Four>(vehicles());
  const selectedStudyCase = createMemo(
    () =>
      studyCases.find((item) => JSON.stringify(item.request) === JSON.stringify(props.request))
        ?.id ?? "",
  );
  const selectedStudyPreset = createMemo(() =>
    studyCases.find((item) => item.id === selectedStudyCase()),
  );
  const applyStudyCase = (id: string) => {
    const item = studyCases.find((caseItem) => caseItem.id === id);
    if (!item) return;
    const next = structuredClone(item.request);
    const counts = vehicleCountsFromRates(next.config.rates, next.config.horizon);
    setVehicles(counts);
    setWeights(counts);
    props.onChange(next);
  };
  const totalVehicles = () => vehicles().reduce((sum, count) => sum + count, 0);
  const perRoadMax = () => vehiclesPerRoadLimit(props.request.config.horizon);
  const totalMax = () =>
    Math.max(
      totalVehicles(),
      maximumVehicleCount(props.request.config.horizon, props.request.sensitivity),
    );
  const setCountAllocation = (counts: Four) => {
    setVehicles(counts);
    config({ rates: ratesFromVehicleCounts(counts, props.request.config.horizon) });
  };
  const green = (i: number, value: number) => {
    config({
      green: shiftNext(
        props.request.config.green,
        i,
        value,
        props.request.min_green,
        props.request.max_green,
      ),
    });
  };
  return (
    <aside class="control-panel">
      <div class="control-header">
        <span class="section-kicker">SET UP AN EXPERIMENT</span>
        <h2>Experiment setup</h2>
      </div>
      <fieldset disabled={props.busy}>
        <section class="control-section task-section">
          <label class="study-preset-label" for="study-preset">
            Scenario presets
          </label>
          <select
            id="study-preset"
            class="study-preset-select"
            value={selectedStudyCase()}
            onChange={(event) => applyStudyCase(event.currentTarget.value)}
          >
            <option value="" disabled>
              Custom settings
            </option>
            <For each={studyCases}>{(item) => <option value={item.id}>{item.label}</option>}</For>
          </select>
          <Show when={selectedStudyPreset()?.source_note}>
            {(note) => (
              <div class="study-preset-note">
                <p>{note()}</p>
                <a href={selectedStudyPreset()?.source_url} target="_blank" rel="noreferrer">
                  Dataset
                </a>
                <a href={selectedStudyPreset()?.record_url} target="_blank" rel="noreferrer">
                  Count table
                </a>
                <a href={selectedStudyPreset()?.license_url} target="_blank" rel="noreferrer">
                  Licence
                </a>
              </div>
            )}
          </Show>
          <div class="task-options" role="group" aria-label="Experiment goal">
            <button
              type="button"
              aria-pressed={props.request.optimize}
              onClick={() => change({ optimize: true })}
            >
              Find green times
            </button>
            <button
              type="button"
              aria-pressed={!props.request.optimize}
              onClick={() => change({ optimize: false })}
            >
              Test my timing
            </button>
          </div>
        </section>
        <section class="control-section traffic-section">
          <h3>Expected vehicles per run</h3>
          <p class="control-note">Split the expected arrivals between four roads.</p>
          <details class="control-subsection total-demand-control">
            <summary>
              Expected total vehicles <span>{number(totalVehicles())}</span>
            </summary>
            <Slider
              label="Expected total vehicles"
              value={totalVehicles()}
              min={0}
              max={totalMax()}
              options={countSteps}
              display={number(totalVehicles())}
              hint="Road counts stay whole numbers and add up to this total."
              help="This is the expected number of arrivals in one run. The Poisson process can generate a different actual count. Changing the total keeps the current road proportions; changing one road takes vehicles from the next road."
              onInput={(value) => {
                const target = Math.min(
                  Math.max(0, Math.round(value)),
                  maximumVehicleCount(props.request.config.horizon, props.request.sensitivity),
                );
                setCountAllocation(allocateVehicleCounts(target, weights(), perRoadMax()));
              }}
            />
          </details>
          <For each={approaches}>
            {(a, i) => (
              <div class="road-control" style={{ "--road-color": colors[i()] }}>
                <Slider
                  label={a}
                  value={vehicles()[i()]!}
                  min={0}
                  max={perRoadMax()}
                  options={countSteps}
                  display={number(vehicles()[i()]!)}
                  help={`${a}’s share of the expected vehicles in this run. Changing it transfers whole vehicles to or from ${approaches[(i() + 1) % 4]}; West transfers with North. The four displayed numbers always add up to the total.`}
                  onInput={(v) => {
                    const counts = shiftNext(vehicles(), i(), Math.round(v), 0, perRoadMax());
                    setWeights(counts);
                    setCountAllocation(counts);
                  }}
                />
              </div>
            )}
          </For>
          <details class="control-subsection">
            <summary>
              Turning split{" "}
              <span>{props.request.config.turns.map((p) => number(p * 100)).join(" / ")}%</span>
            </summary>
            <p class="control-note">
              Moving one slider changes the next turn; right turns change left turns.
            </p>
            <For each={["Turn left", "Go straight", "Turn right"]}>
              {(label, i) => (
                <Slider
                  label={label}
                  value={props.request.config.turns[i()]! * 100}
                  unit="%"
                  min={0}
                  max={100}
                  display={`${number(props.request.config.turns[i()]! * 100)}%`}

                  help="A pseudorandom draw assigns each arriving vehicle a movement. These are probabilities, so individual runs need not match the percentages exactly."
                  onInput={(v) => {
                    config({ turns: shiftNext(props.request.config.turns, i(), v / 100, 0, 1) });
                  }}
                />
              )}
            </For>
            <div
              class={
                Math.abs(props.request.config.turns.reduce((a, b) => a + b, 0) - 1) < 1e-9
                  ? "constraint-ok"
                  : "constraint-warning"
              }
            >
              Total {number(props.request.config.turns.reduce((a, b) => a + b, 0) * 100)}% / 100%
            </div>
          </details>
          <Slider
            label="Traffic duration per run"
            hint="Longer → same planned vehicles spread over more time."
            value={props.request.config.horizon}
            min={Math.max(30, Math.ceil((Math.max(...vehicles()) * 3600) / 20000))}
            max={86400}
            options={durationSteps}
            step={1}
            scale={60}
            unit="min"
            display={`${number(props.request.config.horizon / 60)} minutes`}

            help="The displayed vehicle counts stay fixed. A longer run lowers their implied hourly arrival rates; a shorter run raises them. The Poisson process still makes the actual count random."
            onInput={(v) => {
              const horizon = Math.max(v, Math.ceil((Math.max(...vehicles()) * 3600) / 20000), 30);
              config({ horizon, rates: ratesFromVehicleCounts(vehicles(), horizon) });
            }}
          />
        </section>
        <section class="control-section evidence-section">
          <h3>Calculation effort</h3>
          <p class="control-note">
            Extended settings can require millions of timing-run simulations. Review the work
            breakdown below before starting a fine-grid search.
          </p>

          <div class="budget-options" role="group" aria-label="Computation presets">
            <For each={budgets}>
              {(budget) => (
                <button
                  type="button"
                  title={`${number(budget.search)} training runs per timing and ${number(budget.test)} fresh test runs per plan`}
                  aria-label={`${budget.name}: ${number(budget.search)} training runs per timing and ${number(budget.test)} fresh test runs per plan`}
                  aria-pressed={
                    props.request.replications === budget.test &&
                    (!props.request.optimize ||
                      props.request.training_replications === budget.search)
                  }
                  onClick={() =>
                    change({ training_replications: budget.search, replications: budget.test })
                  }
                >
                  {budget.name}
                </button>
              )}
            </For>
          </div>

          <Show when={props.request.optimize}>
            <Slider
              label="Search runs per timing"
              hint="More → steadier timing choice; slower search."
              value={props.request.training_replications}
              options={replicationOptions}
              min={2}
              max={1000000}
              unit="runs"
              display={`${number(props.request.training_replications)} runs`}

              help="Choose the candidate with the lowest sample mean total waiting. More search runs make this choice less sensitive to random arrivals; they do not refine the timing grid."
              onInput={(v) => change({ training_replications: v })}
            />
            <Slider
              label="Timing step"
              hint={`Smaller → more plans (${number(plans())} now).`}
              value={props.request.grid_step}
              min={1}
              max={60}
              unit="s"
              display={`${props.request.grid_step} seconds`}

              help="Each green is minimum green + k × gap. The engine enumerates every combination on this grid that satisfies the cycle and bounds. If this grid has no feasible timings, change the step or bounds; other values stay as entered."
              onInput={(v) => change({ grid_step: v })}
            />
          </Show>

          <Slider
            label="Fresh test runs per plan"
            hint="More → more precise results; slower testing."
            value={props.request.replications}
            options={replicationOptions}
            min={2}
            max={1000000}
            unit="runs"
            display={`${number(props.request.replications)} runs`}

            help="Final testing uses fresh arrivals, separate from the search. Every plan faces matched traffic so differences can be compared fairly. More tests improve precision, not the search choice."
            formula="Standard error ≈ sample standard deviation / √runs"
            onInput={(v) => change({ replications: v })}
          />
          <details class="control-subsection">
            <summary>
              Extra demand test<span>{props.request.sensitivity ? "On" : "Off"}</span>
            </summary>{" "}
            <label class="toggle-control">
              <input
                type="checkbox"
                checked={props.request.sensitivity}
                onChange={(e) => change({ sensitivity: e.currentTarget.checked })}
              />
              Test quieter and busier traffic
            </label>
          </details>
          <details class="work-estimate" aria-label="Calculation workload">
            <summary>Work breakdown</summary>
            <dl>
              <Show when={props.request.optimize}>
                <div>
                  <dt>Search</dt>
                  <dd>
                    {number(plans())} timings × {number(props.request.training_replications)} runs{" "}
                    <b>= {number(searchWork())}</b>
                  </dd>
                </div>
              </Show>
              <div>
                <dt>Final test</dt>
                <dd>
                  4 plans × {number(props.request.replications)} runs <b>= {number(testWork())}</b>
                </dd>
              </div>
              <Show when={props.request.sensitivity}>
                <div>
                  <dt>Demand test</dt>
                  <dd>
                    {demandScales(props.request).length} levels ×{" "}
                    {number(props.request.replications)} runs <b>= {number(demandWork())}</b>
                  </dd>
                </div>
              </Show>
            </dl>
          </details>
        </section>
        <details class="control-section">
          <summary>
            <span class="summary-title">Traffic light settings</span>
            <span>Cycle & crossing time</span>
          </summary>

          <Slider
            label="Time for one full signal cycle"
            value={props.request.config.cycle}
            min={24}
            max={600}
            step={1}
            unit="s"
            display={`${props.request.config.cycle} seconds`}

            help="All four green durations plus clearance equal this cycle. Changing it keeps your other values. Adjust the greens so they and the safety gaps sum to the cycle."
            onInput={(v) => config({ cycle: v })}
          />
          <Slider
            label="Safety gap between roads"
            value={props.request.config.clearance / 4}
            min={0}
            max={15}
            step={0.25}
            unit="s each"
            display={`${props.request.config.clearance / 4} seconds each`}

            help="Clearance allows the transition between approaches. The model permits no vehicle service during the gap; amber and all-red animation illustrate it."
            onInput={(v) => config({ clearance: 4 * v })}
          />
          <Slider
            label="Seconds to serve one vehicle"
            value={props.request.config.headway}
            min={0.25}
            max={30}
            step={0.25}
            unit="s"
            display={`${props.request.config.headway} seconds`}

            help="A deterministic headway is also the service duration. A lane serves one vehicle at a time, and service can start only if it finishes within green. Queue waiting excludes service time."
            onInput={(v) => config({ headway: v })}
          />
        </details>
        <details class="control-section">
          <summary>
            <span class="summary-title">My green times</span>
            <span>{props.request.config.green.join(" / ")} s</span>
          </summary>
          <p class="control-note">
            {props.request.optimize
              ? "Comparison plan only. Search checks the full grid."
              : "The timing you will test."}{" "}
            Moving a green slider takes time from the next road; West changes North.
          </p>
          <For each={approaches}>
            {(a, i) => (
              <Slider
                label={`${a} green`}
                value={props.request.config.green[i()]!}
                min={Math.max(
                  props.request.min_green,
                  props.request.config.green[i()]! +
                    props.request.config.green[(i() + 1) % 4]! -
                    props.request.max_green,
                )}
                max={Math.min(
                  props.request.max_green,
                  props.request.config.green[i()]! +
                    props.request.config.green[(i() + 1) % 4]! -
                    props.request.min_green,
                )}
                options={greenSteps}
                unit="s"
                display={`${props.request.config.green[i()]} seconds`}

                help="Only this approach has green in its phase. Moving this slider transfers time to or from the next road, wrapping West to North. The other two roads keep their timing."
                onInput={(v) => green(i(), v)}
              />
            )}
          </For>
          <div
            class={
              Math.abs(
                props.request.config.green.reduce((a, b) => a + b, 0) +
                  props.request.config.clearance -
                  props.request.config.cycle,
              ) < 1e-8
                ? "constraint-ok"
                : "constraint-warning"
            }
          >
            Green {props.request.config.green.reduce((s, g) => s + g, 0)} s + safety gaps{" "}
            {props.request.config.clearance} s / cycle {props.request.config.cycle} s
          </div>
          <button
            type="button"
            class="balance-button"
            disabled={!canBalance()}
            onClick={() =>
              config({
                green: allocate(
                  props.request.config.cycle - props.request.config.clearance,
                  props.request.min_green,
                  props.request.max_green,
                  props.request.config.green,
                ),
              })
            }
          >
            Balance greens to fit cycle
          </button>
        </details>
        <details class="control-section">
          <summary>
            <span class="summary-title">Allowed green times</span>
            <span>
              {props.request.min_green}–{props.request.max_green} s
            </span>
          </summary>

          <Slider
            label="Shortest allowed green"
            value={props.request.min_green}
            min={1}
            max={600}
            unit="s"
            display={`${props.request.min_green} seconds`}

            help="Every road must get at least this much green and enough time to finish one service. Invalid combinations are flagged without changing your other settings."
            onInput={(v) => change({ min_green: v })}
          />
          <Slider
            label="Longest allowed green"
            value={props.request.max_green}
            min={1}
            max={600}
            unit="s"
            display={`${props.request.max_green} seconds`}

            help="Other roads must still receive their minimum green. The displayed candidate count reflects the current bounds and spacing."
            onInput={(v) => change({ max_green: v })}
          />
          <Show when={!props.request.optimize}>
            <Slider
              label="Reference plan timing gap"
              value={props.request.grid_step}
              min={1}
              max={60}
              unit="s"
              display={`${props.request.grid_step} seconds`}

              help="Your timing need not lie on the grid. Reference targets use the closest feasible grid allocation."
              onInput={(v) => change({ grid_step: v })}
            />
          </Show>
        </details>
        <details class="control-section">
          <summary>
            <span class="summary-title">Repeat the same experiment</span>
            <span>Random seed</span>
          </summary>
          <Slider
            label="Random seed"
            value={props.request.seed}
            min={1}
            max={1000000}
            display={String(props.request.seed)}

            help="The generator is a 64-bit LCG. Runs use successive portions of its sequence; this is a reproducible approximation to independent random scenarios, not a proof of independence."
            onInput={(v) => change({ seed: v })}
          />
        </details>
      </fieldset>
      <div class="run-area">
        <Show when={issues().length}>
          <p class="input-issue" role="status">
            {issues()[0]}
          </p>
        </Show>
        <div class="run-summary">
          <b>{number(totalWork())} simulations</b>
          <span>
            {props.request.optimize
              ? `${number(plans())} candidate timings`
              : "Your timing + references"}
          </span>
        </div>
        <button
          class={props.busy ? "cancel-button" : "run-button"}
          disabled={!props.busy && issues().length > 0}
          onClick={() => (props.busy ? props.onCancel() : props.onRun())}
        >
          {props.busy
            ? "Stop experiment"
            : props.request.optimize
              ? "Find better green times"
              : "Test my green times"}
          <span>{props.busy ? "■" : "→"}</span>
        </button>
      </div>
    </aside>
  );
}
