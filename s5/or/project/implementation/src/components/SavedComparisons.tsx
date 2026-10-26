import { createMemo, createSignal, For, Show } from "solid-js";
import { approaches, colors, number, type Saved } from "../types";
import Help from "./Help";
export default function SavedComparisons(props: {
  saved: Saved[];
  onDelete: (id: string) => void;
}) {
  const [chosen, setChosen] = createSignal<string[] | null>(null);
  const selected = createMemo(() => {
    const ids = chosen();
    return ids !== null
      ? props.saved.filter((s) => ids.includes(s.id)).slice(0, 3)
      : props.saved.slice(0, 3);
  });
  const toggle = (id: string) =>
    setChosen((ids) => {
      const current = ids ?? props.saved.slice(0, 3).map((s) => s.id);
      return current.includes(id) ? current.filter((i) => i !== id) : [...current.slice(-2), id];
    });
  return (
    <section class="saved-view">
      <div class="view-heading">
        <div>
          <span class="section-kicker">COMPARE EXPERIMENTS</span>
          <h2>What changes when demand changes?</h2>
          <p>
            Save a result, change your arrivals, and run again. Compare up to three experiments.
          </p>
        </div>
        <Help
          label="Comparing saved experiments"
          text="These are descriptive comparisons of different input conditions, not paired causal estimates. Each result retains its own demand, timing, horizon, seed, and confidence interval. Saved summaries persist in this browser."
        />
      </div>
      <Show
        when={props.saved.length}
        fallback={
          <div class="empty-state">
            <span>↗</span>
            <h3>Your experiments belong here</h3>
            <p>
              Complete a run and use “Save result” in the control panel. Your traffic demand and
              recommended green times will be stored together.
            </p>
          </div>
        }
      >
        <div class="saved-cards">
          <For each={props.saved}>
            {(s) => (
              <div class={`saved-card ${selected().includes(s) ? "checked" : ""}`}>
                <label>
                  <input
                    type="checkbox"
                    aria-label={`Compare ${s.name}`}
                    checked={selected().includes(s)}
                    onChange={() => toggle(s.id)}
                  />
                  <span>
                    <b>{s.name}</b>
                    <small>{new Date(s.created).toLocaleString()}</small>
                  </span>
                </label>
                <button
                  class="delete-saved"
                  aria-label={`Delete ${s.name}`}
                  onClick={() => props.onDelete(s.id)}
                >
                  ×
                </button>
                <div>
                  <strong>{number(s.wait.mean, 1)}s</strong>
                  <span>accumulated waiting / arrival</span>
                </div>
              </div>
            )}
          </For>
        </div>
        <div class="panel">
          <div class="panel-heading">
            <h3>Arrival demand → green allocation</h3>
            <Help
              label="Demand and green allocation"
              text="Each bar shows green seconds as a share of its experiment's cycle. Compare how a busier road's allocation changes. The best split depends on turning proportions, phase order, service time, bounds, horizon, and stochastic arrivals—not just demand."
            />
          </div>
          <div class="road-comparisons">
            <For each={approaches}>
              {(a, i) => (
                <section>
                  <h4>
                    <i style={{ background: colors[i()] }} />
                    {a}
                  </h4>
                  <For each={selected()}>
                    {(s, j) => (
                      <div class="road-comparison">
                        <span>{s.name}</span>
                        <div class="comparison-track">
                          <span
                            style={{
                              width: `${(s.selected[i()]! / s.request.config.cycle) * 100}%`,
                              background: ["#087f72", "#3467b4", "#ac5b24"][j()],
                            }}
                          />
                        </div>
                        <strong>{s.selected[i()]}s</strong>
                        <small>{number(s.request.config.rates[i()]!)} vehicles/hour</small>
                      </div>
                    )}
                  </For>
                </section>
              )}
            </For>
          </div>
        </div>
        <div class="panel table-scroll">
          <table>
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Operating period</th>
                <th>Replications</th>
                <th>Waiting / arrival</th>
                <th>Mean total waiting · vehicle-seconds</th>
                <th>Throughput</th>
                <th>Remaining queue</th>
              </tr>
            </thead>
            <tbody>
              <For each={selected()}>
                {(s) => (
                  <tr>
                    <td>{s.name}</td>
                    <td>{s.request.config.horizon / 60} min</td>
                    <td>{number(s.request.replications)}</td>
                    <td>{number(s.wait.mean, 1)}s</td>
                    <td>{number(s.delay.mean)} vehicle-seconds</td>
                    <td>{number(s.throughput.mean)} / h</td>
                    <td>{number(s.backlog.mean, 1)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </section>
  );
}
