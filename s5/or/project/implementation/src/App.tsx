import { signalState } from "./signals";
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import ControlPanel from "./components/ControlPanel";
import Intersection from "./components/Intersection";
import ReplayPreview from "./components/ReplayPreview";
import Ensemble from "./components/Ensemble";
import Chart from "./components/Chart";
import Help from "./components/Help";
import SavedComparisons from "./components/SavedComparisons";
import {
  approaches,
  clock,
  colors,
  defaults,
  number,
  type Config,
  type Four,
  type Frame,
  type Output,
  type Progress,
  type Reply,
  type Request,
  type Run,
  type ReplayChoice,
  type Saved,
  type Statistics,
} from "./types";
const empty: Frame = {
  time: 0,
  phase: 0,
  queues: Array<number>(12).fill(0),
  busy: Array<boolean>(12).fill(false),
  departed: 0,
  delay: 0,
};
const key = "traffic-experiments-v2";
function loadSaved(): Saved[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as Saved[];
  } catch {
    return [];
  }
}
export default function App() {
  const [request, setRequest] = createSignal<Request>(structuredClone(defaults)),
    [output, setOutput] = createSignal<Output>(),
    [progress, setProgress] = createSignal<Progress>(),
    [busy, setBusy] = createSignal(false),
    [error, setError] = createSignal(""),
    [dirty, setDirty] = createSignal(false);
  const [replay, setReplay] = createSignal<{
      run: Run;
      green: Four;
      config: Config;
      phase: "input" | "selected";
    }>(),
    [time, setTime] = createSignal(0),
    [playing, setPlaying] = createSignal(false),
    [speed, setSpeed] = createSignal(8),
    [view, setView] = createSignal("flow"),
    [queueView, setQueueView] = createSignal<"average" | "replay">("replay"),
    [convergenceView, setConvergenceView] = createSignal<"early" | "all">("early"),
    [densityView, setDensityView] = createSignal("evaluation");
  const [elapsed, setElapsed] = createSignal(0),
    [liveCurve, setLiveCurve] = createSignal<Statistics[]>([]),
    [saved, setSaved] = createSignal<Saved[]>(loadSaved()),
    [name, setName] = createSignal(""),
    [savedNotice, setSavedNotice] = createSignal("");
  let worker: Worker | undefined;
  let replayWorker: Worker | undefined;
  let flowPanel: HTMLElement | undefined;
  let replayStrip: HTMLDivElement | undefined;
  const [fullscreen, setFullscreen] = createSignal(false);
  const [replayIndex, setReplayIndex] = createSignal(0);
  const [replayLoading, setReplayLoading] = createSignal(false);
  const chooseReplay = (index: number) => {
    const result = output(),
      choice: ReplayChoice | undefined = result?.replay_choices[index];
    if (!result || !choice) return;
    replayWorker?.terminate();
    setReplayIndex(index);
    setQueueView("replay");
    setTime(0);
    setPlaying(false);
    if (index === 0) {
      setReplay({
        run: result.run,
        green: choice.green,
        config: result.request.config,
        phase: "selected",
      });
      setReplayLoading(false);
      return;
    }
    setReplayLoading(true);
    replayWorker = new Worker(new URL("./replay.worker.ts", import.meta.url), { type: "module" });
    replayWorker.onmessage = (
      event: MessageEvent<{ kind: "ready"; run: Run } | { kind: "error"; error: string }>,
    ) => {
      if (event.data.kind === "error") setError(event.data.error);
      else
        setReplay({
          run: event.data.run,
          green: choice.green,
          config: result.request.config,
          phase: "selected",
        });
      setReplayLoading(false);
      replayWorker?.terminate();
      replayWorker = undefined;
    };
    replayWorker.onerror = (event) => {
      setError(event.message || "Could not load this replay.");
      setReplayLoading(false);
    };
    replayWorker.postMessage({ request: result.request, state: choice.state, green: choice.green });
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === flowPanel) await document.exitFullscreen();
      else await flowPanel?.requestFullscreen();
    } catch (e) {
      setError(String(e));
    }
  };
  const run = () => {
    worker?.terminate();
    replayWorker?.terminate();
    setReplayLoading(false);
    setReplayIndex(0);
    const submitted = structuredClone(request());
    setBusy(true);
    setError("");
    setOutput(undefined);
    setQueueView("replay");
    setProgress(undefined);
    setReplay(undefined);
    setTime(0);
    setPlaying(false);
    setLiveCurve([]);
    setDirty(false);
    setSavedNotice("");
    worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<Reply>) => {
      const data = event.data;
      if (data.kind === "error") {
        setBusy(false);
        setError(data.error);
        setPlaying(false);
        return;
      }
      if (data.kind === "progress") {
        setProgress(data.progress);
        if (data.progress.estimate.n >= 2)
          setLiveCurve((points) =>
            points.at(-1)?.n === data.progress.estimate.n
              ? points
              : [...points.slice(-159), data.progress.estimate],
          );
        return;
      }
      if (data.kind === "replay") {
        setReplay({ ...data, config: submitted.config });
        setTime(0);
        setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        return;
      }
      setOutput(data.result);
      setQueueView("average");
      setReplayIndex(0);
      setElapsed(data.elapsed);
      setBusy(false);
      setName(`Experiment ${saved().length + 1}`);
      setReplay({
        run: data.result.run,
        green: data.result.selected,
        config: data.result.request.config,
        phase: "selected",
      });
    };
    worker.onerror = (event) => {
      setBusy(false);
      setError(event.message || "The calculation could not start.");
    };
    worker.postMessage(submitted);
  };
  const cancel = () => {
    worker?.terminate();
    setBusy(false);
    setPlaying(false);
    setSavedNotice(
      "Stopped. Partial progress is visible; incomplete results are not saved as a completed experiment.",
    );
  };
  onMount(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === flowPanel);
    document.addEventListener("fullscreenchange", syncFullscreen);
    onCleanup(() => document.removeEventListener("fullscreenchange", syncFullscreen));
    let frameId = 0,
      last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (playing() && replay()) {
        setTime((t) => Math.min(t + delta * speed(), replay()!.config.horizon));
        if (time() >= replay()!.config.horizon) setPlaying(false);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    onCleanup(() => cancelAnimationFrame(frameId));
  });
  onCleanup(() => {
    worker?.terminate();
    replayWorker?.terminate();
  });
  const frame = createMemo(() => {
    const frames = replay()?.run.frames;
    if (!frames?.length) return empty;
    let low = 0,
      high = frames.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (frames[mid]!.time <= time()) low = mid + 1;
      else high = mid;
    }
    return low ? frames[low - 1]! : empty;
  });
  const signal = () =>
    signalState(
      time(),
      replay()?.config.cycle ?? request().config.cycle,
      replay()?.config.clearance ?? request().config.clearance,
      replay()?.green ?? request().config.green,
    );
  const liveWaiting = () =>
    frame().delay + frame().queues.reduce((a, b) => a + b, 0) * (time() - frame().time);
  const queueSeries = createMemo(() =>
    colors.map((color, a) => ({
      label: approaches[a]!,
      color,
      values: (replay()?.run.frames ?? [])
        .filter(
          (_, i) => i % Math.max(1, Math.ceil((replay()?.run.frames.length ?? 0) / 500)) === 0,
        )
        .map(
          (f) =>
            [f.time / 60, f.queues.slice(a * 3, a * 3 + 3).reduce((s, v) => s + v, 0)] as [
              number,
              number,
            ],
        ),
    })),
  );
  const averageQueueSeries = createMemo(() =>
    colors.map((color, a) => ({
      label: approaches[a]!,
      color,
      values: (output()?.queue_profile ?? []).map(
        (point) => [point.time / 60, point.queues[a]!] as [number, number],
      ),
    })),
  );
  const convergence = createMemo(() => {
    const all = output()?.convergence ?? liveCurve();
    const limit = Math.min(100, output()?.delay.n ?? progress()?.replications_done ?? 100);
    const focused = convergenceView() === "early";
    const values = focused ? all.filter((v) => v.n <= limit) : all;
    return [
      {
        label: "Estimated total waiting",
        color: "#087f72",
        values: values.map((v) => [v.n, v.mean] as [number, number]),
        low: focused ? undefined : values.map((v) => [v.n, v.low] as [number, number]),
        high: focused ? undefined : values.map((v) => [v.n, v.high] as [number, number]),
      },
    ];
  });
  const planRows = createMemo(() => {
    const result = output();
    return result
      ? [
          {
            label: result.request.optimize ? "Recommended" : "Evaluated",
            green: result.selected,
            delay: result.delay,
            paired_saving: undefined as Statistics | undefined,
          },
          ...result.comparisons,
        ]
      : [];
  });
  const fraction = () => (progress() ? progress()!.completed / Math.max(1, progress()!.total) : 0);
  const density = () =>
    busy() || !output()
      ? progress()?.distribution
      : densityView() === "search"
        ? output()?.search_distribution
        : output()?.distribution;
  const insight = () => {
    const o = output();
    if (!o) return "";
    if (o.request.config.rates.every((r) => r === 0))
      return "No traffic was requested. All timings are tied under zero demand.";
    const c = o.comparisons[1]!,
      difference = c.paired_saving;
    if (difference.low > 0)
      return "Fresh scenarios support a reduction in waiting compared with equal green.";
    if (difference.high < 0)
      return "Fresh scenarios favor equal green. The training winner needs further investigation.";
    return "The difference from equal green is uncertain: the paired 95% interval includes zero.";
  };
  const savingPercent = () => {
    const o = output();
    if (!o) return 0;
    const base = o.comparisons[1]!.delay.mean;
    return base > 0 ? ((base - o.delay.mean) / base) * 100 : 0;
  };
  const persist = (items: Saved[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      setSaved(items);
    } catch {
      setError(
        "Browser storage is full or unavailable. Download the result JSON to keep your work.",
      );
    }
  };
  const save = () => {
    const o = output();
    if (!o) return;
    const entry: Saved = {
      id: crypto.randomUUID(),
      name: name().trim() || `Experiment ${saved().length + 1}`,
      created: new Date().toISOString(),
      request: o.request,
      selected: o.selected,
      delay: o.delay,
      wait: o.waiting_per_arrival,
      throughput: o.throughput,
      backlog: o.backlog,
    };
    persist([entry, ...saved()].slice(0, 30));
    setSavedNotice(`Saved “${entry.name}” in this browser. Open Saved comparisons to compare it.`);
  };
  const download = (data: unknown, filename: string) => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div class="app-shell">
      <header class="app-header">
        <a class="brand" href="#">
          <span class="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 2v7H2v6h7v7h6v-7h7V9h-7V2Z" />
            </svg>
          </span>
          <span>
            Traffic signal experiments<small>Operations Research · Queuing & simulation</small>
          </span>
        </a>
        <div class="header-note">
          <span class="online-dot" />
          Computed locally · reproducible
        </div>
      </header>
      <div class="app-layout">
        <div class="control-column">
          <ControlPanel
            request={request()}
            busy={busy()}
            onChange={(r) => {
              setRequest(r);
              setDirty(true);
            }}
            onRun={run}
            onCancel={cancel}
          />
          <section class="storage-panel">
            <h3>
              Keep & compare results
              <Help
                label="Save results"
                text="Save a compact summary in this browser, retaining the input demand, timing, replication count, and statistical results. Download JSON for the complete result, including replay data. Saved comparisons survive a page reload."
              />
            </h3>
            <label>
              Result name
              <input
                type="text"
                aria-label="Result name"
                value={name()}
                placeholder="e.g. Morning traffic"
                onInput={(e) => setName(e.currentTarget.value)}
              />
            </label>
            <button class="secondary-button" disabled={!output() || busy()} onClick={save}>
              Save result <span>＋</span>
            </button>
            <button
              class="text-button"
              disabled={!output() || busy()}
              onClick={() => download(output(), "traffic-experiment.json")}
            >
              Download full result JSON ↓
            </button>
            <button
              class="text-button"
              disabled={!saved().length}
              onClick={() => download(saved(), "saved-traffic-experiments.json")}
            >
              Download saved summaries ↓
            </button>
          </section>
        </div>
        <main class="visual-workspace">
          <div class="workspace-heading">
            <div>
              <span class="section-kicker">A STOCHASTIC QUEUING EXPERIMENT</span>
              <h1>How should green time be shared?</h1>
              <p>Set the demand. Test signal timings. See what changes.</p>
            </div>
            <Help
              label="The Operations Research problem"
              text="Four competing approaches share a fixed cycle. We enumerate feasible integer-second green allocations and use repeated discrete-event simulations to estimate total waiting. The recommendation is the best estimated plan on that grid, checked on fresh arrival scenarios."
              formula="min E[Σ ∫ Qₘ(t) dt] subject to Σgᵢ + L = C"
            />
          </div>
          <nav class="view-tabs" aria-label="Result views">
            <button class={view() === "flow" ? "active" : ""} onClick={() => setView("flow")}>
              Intersection & results
            </button>
            <button
              class={view() === "ensemble" ? "active" : ""}
              onClick={() => setView("ensemble")}
            >
              All simulation outcomes{" "}
              <span>
                {number(
                  busy()
                    ? (progress()?.distribution.total ?? 0)
                    : (output()?.distribution.total ?? 0),
                )}
              </span>
            </button>
            <button class={view() === "saved" ? "active" : ""} onClick={() => setView("saved")}>
              Saved comparisons <span>{saved().length}</span>
            </button>
          </nav>
          <Show when={error()}>
            <div class="error" role="alert">
              {error()}
            </div>
          </Show>
          <Show when={savedNotice()}>
            <div class="notice" role="status">
              {savedNotice()}
            </div>
          </Show>
          <Show when={dirty() && (output() || progress())}>
            <div class="notice">
              Controls have changed. The visual results below still belong to the submitted
              experiment.
            </div>
          </Show>
          <Show when={busy() || (progress() && !output())}>
            <section
              class={`progress-panel ${busy() ? "running" : ""}`}
              aria-label="Experiment progress"
            >
              <div>
                <span class="online-dot" />
                <b>
                  {busy()
                    ? (progress()?.stage ?? "Preparing experiment")
                    : output()
                      ? "Experiment complete"
                      : "Experiment stopped"}
                </b>
                <strong>{number(fraction() * 100, 1)}%</strong>
              </div>
              <div
                class="progress-track"
                role="progressbar"
                aria-valuenow={Math.round(fraction() * 100)}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Simulation progress"
              >
                <span style={{ width: `${fraction() * 100}%` }} />
              </div>
              <p>
                {number(progress()?.completed ?? 0)} of {number(progress()?.total ?? 0)} simulations
                completed
                <span>
                  {number(progress()?.replications_done ?? 0)} fresh replications measured
                </span>
              </p>
            </section>
          </Show>
          <Show
            when={view() === "saved"}
            fallback={
              <>
                <Show
                  when={output()}
                  fallback={
                    <div class="experiment-intro">
                      <div>
                        <span class="intro-symbol">↗</span>
                        <div>
                          <h2>
                            {busy()
                              ? "Your experiment is running"
                              : "Ready to test your intersection"}
                          </h2>
                          <p>
                            {busy()
                              ? "Watch traffic flow while the engine compares outcomes. Results and uncertainty update as fresh runs finish."
                              : "Choose arrivals in the left panel and run. We will show the recommended green times and explain their effect on waiting."}
                          </p>
                        </div>
                      </div>
                      <span class="intro-badge">12 queues · 4 protected phases</span>
                    </div>
                  }
                >
                  <section class="recommendation">
                    <div class="recommendation-header">
                      <div>
                        <span class="section-kicker">
                          {output()!.request.optimize
                            ? "BEST ESTIMATED TIMING ON THE TESTED GRID"
                            : "YOUR EVALUATED TIMING"}
                        </span>
                        <h2>
                          {output()!.request.optimize
                            ? "Recommended green times"
                            : "Your signal timing"}
                        </h2>
                      </div>
                      <Help
                        label="What optimal means here"
                        text="The search evaluates every feasible grid allocation on matched training arrivals and picks the smallest estimated total waiting. Fresh replications then evaluate that plan. This is not a proof of the true stochastic optimum; uncertainty matters when plans are close."
                      />
                    </div>
                    <div class="green-results">
                      <For each={approaches}>
                        {(a, i) => (
                          <div>
                            <span>
                              <i style={{ background: colors[i()] }} />
                              {a}
                            </span>
                            <strong>
                              {output()!.selected[i()]}
                              <small>seconds</small>
                            </strong>
                            <span>
                              {number(output()!.request.config.rates[i()]!)} arrivals/hour
                            </span>
                            <div class="green-result-track">
                              <span
                                style={{
                                  width: `${(output()!.selected[i()]! / output()!.request.config.cycle) * 100}%`,
                                  background: colors[i()],
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                    <div class="recommendation-bottom">
                      <span>
                        {output()!.request.config.cycle}s cycle ·{" "}
                        {output()!.request.config.clearance}s clearance ·{" "}
                        {number(output()!.candidates.length)} plans searched
                      </span>
                      <span>{insight()}</span>
                    </div>
                  </section>
                  <div class="outcome-cards">
                    <article>
                      <div>
                        Waiting per arrival
                        <Help
                          label="Waiting per arrival"
                          text="This reports fresh-test results for the displayed timing: the search recommendation in optimization mode, or your input timing in test mode. For each replication, total queued waiting divided by its arrivals, then averaged across replications. Includes partial waits of vehicles still queued at the horizon. Service time is excluded. It is not a completed-trip travel-time metric."
                          formula="Mean over runs of Dₜ / arrivals"
                        />
                      </div>
                      <strong>
                        {number(output()!.waiting_per_arrival.mean, 1)}
                        <small>seconds</small>
                      </strong>
                      <p>
                        {output()!.request.optimize ? "Recommended timing" : "My timing"} · 95%
                        interval {number(output()!.waiting_per_arrival.low, 1)}–
                        {number(output()!.waiting_per_arrival.high, 1)}s
                      </p>
                    </article>
                    <article>
                      <div>
                        Compared with equal green
                        <Help
                          label="Waiting saved against equal green"
                          text="Both timings face identical fresh arrivals. Subtract selected-plan total waiting from equal-green waiting for each scenario. This percent compares their estimated means; the recommendation note reports whether the paired interval supports a difference."
                          formula="100 × (baseline mean − chosen mean) / baseline mean"
                        />
                      </div>
                      <strong>
                        {number(Math.abs(savingPercent()), 1)}
                        <small>% {savingPercent() < 0 ? "more" : "less"} total waiting</small>
                      </strong>
                      <p>{number(output()!.request.replications)} fresh replications per timing</p>
                    </article>
                    <article>
                      <div>
                        Traffic served
                        <Help
                          label="Completed throughput"
                          text="Completed departures divided by the operating duration, converted to vehicles per hour and averaged across replications. Vehicles waiting or still in service at the horizon are not counted as departed."
                          formula="Departures × 3600 / horizon seconds"
                        />
                      </div>
                      <strong>
                        {number(output()!.throughput.mean)}
                        <small>vehicles/hour</small>
                      </strong>
                      <p>{number(output()!.backlog.mean, 1)} vehicles still waiting at the end</p>
                    </article>
                  </div>
                </Show>
                <Show
                  when={view() === "flow"}
                  fallback={
                    <section class="panel ensemble-panel">
                      <div class="panel-heading">
                        <div>
                          <span class="section-kicker">THE WHOLE EXPERIMENT, NOT JUST ONE RUN</span>
                          <h2>See the spread of outcomes</h2>
                          <p>Where do the runs cluster? How often do long queues remain?</p>
                        </div>
                        <Help
                          label="All simulation outcomes"
                          text="Each density cell aggregates runs with similar accumulated waiting per arrival and final queue. Every outcome contributes once; no sampling is used. Cells expand their axis range when necessary, so their boundaries are approximate. Search outcomes mix different timings; fresh outcomes describe the selected timing only."
                        />
                      </div>
                      <div class="density-switch">
                        <button
                          class={densityView() === "evaluation" ? "active" : ""}
                          disabled={busy()}
                          onClick={() => setDensityView("evaluation")}
                        >
                          Selected timing · {number(output()?.distribution.total ?? 0)} runs
                        </button>
                        <button
                          class={densityView() === "search" ? "active" : ""}
                          disabled={busy() || !output()?.search_distribution.total}
                          onClick={() => setDensityView("search")}
                        >
                          All search outcomes · {number(output()?.search_distribution.total ?? 0)}
                        </button>
                        <Show when={busy()}>
                          <span>{progress()?.distribution_kind}</span>
                        </Show>
                      </div>
                      <Ensemble data={density()} />
                    </section>
                  }
                >
                  <section
                    class="panel flow-panel"
                    ref={(element) => {
                      flowPanel = element;
                    }}
                  >
                    <div class="panel-heading">
                      <div>
                        <span class="section-kicker">
                          ONE ARRIVAL SCENARIO · EVENT-DRIVEN PLAYBACK
                        </span>
                        <h2>Follow the traffic</h2>
                        <p>
                          {replay()?.phase === "input"
                            ? "Input timing preview while the experiment runs."
                            : replay()
                              ? (output()?.replay_choices[replayIndex()]?.label ??
                                "One fresh scenario using the evaluated timing.")
                              : "Each incoming road has a left, straight, and right lane."}
                        </p>
                      </div>
                      <button
                        type="button"
                        class="fullscreen-button"
                        aria-label={
                          fullscreen() ? "Exit fullscreen simulation" : "Fullscreen simulation"
                        }
                        onClick={toggleFullscreen}
                      >
                        {fullscreen() ? "Exit full screen" : "Full screen"}
                      </button>
                      <Help
                        label="Traffic animation"
                        text="Rust supplies vehicle IDs, incoming lanes, arrivals, service starts, and scheduled completions. SVG paths animate left-hand traffic into the corresponding outgoing road. Queues can continue off screen; the counters include every waiting vehicle. Motion between events and downstream travel are visual only; they do not change the queue model or results."
                      />
                    </div>
                    <Show when={output()?.replay_choices.length}>
                      <div class="replay-picker">
                        <div class="replay-picker-heading">
                          <b>Play a calculated run</b>
                          <Show when={replayLoading()}>
                            <span role="status">Loading replay…</span>
                          </Show>
                          <div class="replay-scroll-controls">
                            <button
                              type="button"
                              aria-label="Scroll calculated runs left"
                              onClick={() =>
                                replayStrip?.scrollBy({ left: -360, behavior: "smooth" })
                              }
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              aria-label="Scroll calculated runs right"
                              onClick={() =>
                                replayStrip?.scrollBy({ left: 360, behavior: "smooth" })
                              }
                            >
                              →
                            </button>
                          </div>
                        </div>
                        <div
                          class="replay-strip"
                          ref={(element) => {
                            replayStrip = element;
                          }}
                          role="group"
                          aria-label="Calculated run previews"
                        >
                          <For each={output()?.replay_choices ?? []}>
                            {(choice, index) => (
                              <button
                                type="button"
                                class="replay-card"
                                classList={{ selected: replayIndex() === index() }}
                                aria-pressed={replayIndex() === index()}
                                aria-label={`${choice.label}; ${number(choice.delay)} vehicle-seconds waiting; ${choice.remaining} left`}
                                disabled={replayLoading() || busy()}
                                onClick={() => chooseReplay(index())}
                              >
                                <ReplayPreview green={choice.green} />
                                <strong>{choice.label.replace("Same arrivals · ", "")}</strong>
                                <span>
                                  {number(choice.delay)} s wait · {choice.remaining} left
                                </span>
                              </button>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>
                    <div class="flow-layout">
                      <Intersection
                        vehicles={replay()?.run.vehicles ?? []}
                        time={time()}
                        frame={frame()}
                        config={replay()?.config ?? request().config}
                        green={replay()?.green ?? request().config.green}
                      />
                      <div class="flow-side">
                        <div class="live-label">
                          <span class="online-dot" />
                          LIVE SCENARIO
                        </div>
                        <h3>
                          {clock(time())}
                          <small>
                            of {clock(replay()?.config.horizon ?? request().config.horizon)}
                          </small>
                        </h3>
                        <For each={approaches}>
                          {(a, i) => (
                            <div class="approach-status">
                              <div>
                                <i style={{ background: colors[i()] }} />
                                <b>{a}</b>
                                <span
                                  class={
                                    frame().phase === i()
                                      ? "green-label"
                                      : signal().amber === i()
                                        ? "amber-label"
                                        : "red-label"
                                  }
                                >
                                  {frame().phase === i()
                                    ? "GREEN"
                                    : signal().amber === i()
                                      ? "AMBER"
                                      : "RED"}
                                </span>
                              </div>
                              <strong>
                                {frame()
                                  .queues.slice(i() * 3, i() * 3 + 3)
                                  .reduce((s, v) => s + v, 0)}
                                <small>waiting</small>
                              </strong>
                              <p>
                                ↰ {frame().queues[i() * 3]}
                                <span>↑ {frame().queues[i() * 3 + 1]}</span>↱{" "}
                                {frame().queues[i() * 3 + 2]}
                              </p>
                            </div>
                          )}
                        </For>
                        <div class="live-accounting">
                          <span>{frame().departed} vehicles served</span>
                          <span>
                            {number(liveWaiting())} vehicle-seconds waiting
                            <Help
                              label="Queue-area waiting"
                              text="The integral of the waiting population over elapsed time. Ten waiting vehicles for six seconds contribute sixty vehicle-seconds. Partial waits remain included."
                              formula="D(t) = Σ queue × elapsed time"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="playback">
                      <button
                        aria-label={playing() ? "Pause playback" : "Play playback"}
                        disabled={!replay()}
                        onClick={() => {
                          if (time() >= (replay()?.config.horizon ?? 0)) setTime(0);
                          setPlaying((p) => !p);
                        }}
                      >
                        {playing() ? "Ⅱ" : "▶"}
                      </button>
                      <button
                        class="restart"
                        aria-label="Restart playback"
                        disabled={!replay()}
                        onClick={() => setTime(0)}
                      >
                        ↺
                      </button>
                      <input
                        type="range"
                        aria-label="Playback time"
                        min="0"
                        max={replay()?.config.horizon ?? 600}
                        step=".1"
                        value={time()}
                        disabled={!replay()}
                        onInput={(e) => {
                          setTime(+e.currentTarget.value);
                          setPlaying(false);
                        }}
                      />
                      <span>{clock(time())}</span>
                      <label>
                        Speed{" "}
                        <input
                          type="range"
                          aria-label="Playback speed"
                          min="0"
                          max="7"
                          value={[1, 2, 4, 8, 16, 32, 64, 128].indexOf(speed())}
                          onInput={(e) =>
                            setSpeed([1, 2, 4, 8, 16, 32, 64, 128][+e.currentTarget.value]!)
                          }
                        />
                        <b>{speed()}×</b>
                      </label>
                    </div>
                  </section>
                </Show>
                <div class="graph-grid">
                  <section class="panel">
                    <div class="panel-heading">
                      <div>
                        <h3>
                          {view() === "ensemble"
                            ? "How the estimate settles"
                            : queueView() === "average" && output()
                              ? "Average queues across fresh runs"
                              : "Queues in this replay"}
                        </h3>
                        <p>
                          {view() === "ensemble"
                            ? convergenceView() === "early"
                              ? "Early runs magnified against the estimate from all fresh runs."
                              : "All runs; the line estimates mean total waiting."
                            : queueView() === "average" && output()
                              ? `Mean waiting vehicles across ${number(output()!.delay.n)} fresh runs of the selected timing.`
                              : "One replay scenario, grouped by incoming road."}
                        </p>
                      </div>
                      <Help
                        label={view() === "ensemble" ? "Monte Carlo convergence" : "Queue length"}
                        text={
                          view() === "ensemble"
                            ? "Each point averages total waiting over the completed fresh runs of the selected timing. The focused view hides the confidence band so the early movement is readable; All runs shows the approximate 95% Student t interval for the mean, not the range of individual runs. The dashed line is the final estimate from all fresh runs, not a known theoretical value. The vertical axis is zoomed and may not start at zero."
                            : queueView() === "average" && output()
                              ? "For each of 120 time intervals, the engine integrates the waiting queue of each incoming road across every fresh evaluation run of the selected timing. Dividing by the interval length and run count gives the mean number waiting. The area under all four curves equals the mean total waiting time."
                              : "Waiting vehicles across the three dedicated lanes are summed for each approach. Data comes from event snapshots; display points are downsampled. The underlying queue and waiting accounting use every event."
                        }
                        formula={
                          view() === "ensemble"
                            ? "SE = s / √R; interval = mean ± t × SE"
                            : queueView() === "average" && output()
                              ? "Mean Q = Σᵣ ∫ Qᵣ(t) dt / (R × interval width)"
                              : "Q_approach = Q_left + Q_straight + Q_right"
                        }
                      />
                    </div>
                    <Show when={view() === "flow" && output()}>
                      <div class="queue-view-switch" role="group" aria-label="Queue graph view">
                        <button
                          type="button"
                          classList={{ active: queueView() === "average" }}
                          aria-pressed={queueView() === "average"}
                          onClick={() => setQueueView("average")}
                        >
                          Average of {number(output()!.delay.n)} runs
                        </button>
                        <button
                          type="button"
                          classList={{ active: queueView() === "replay" }}
                          aria-pressed={queueView() === "replay"}
                          onClick={() => setQueueView("replay")}
                        >
                          This replay
                        </button>
                      </div>
                    </Show>
                    <Show when={view() === "ensemble"}>
                      <div
                        class="queue-view-switch"
                        role="group"
                        aria-label="Convergence graph range"
                      >
                        <button
                          type="button"
                          classList={{ active: convergenceView() === "early" }}
                          aria-pressed={convergenceView() === "early"}
                          onClick={() => setConvergenceView("early")}
                        >
                          First{" "}
                          {number(
                            Math.min(
                              100,
                              output()?.delay.n ?? progress()?.replications_done ?? 100,
                            ),
                          )}{" "}
                          runs
                        </button>
                        <button
                          type="button"
                          classList={{ active: convergenceView() === "all" }}
                          aria-pressed={convergenceView() === "all"}
                          onClick={() => setConvergenceView("all")}
                        >
                          All runs
                        </button>
                      </div>
                    </Show>
                    <Chart
                      series={
                        view() === "ensemble"
                          ? convergence()
                          : queueView() === "average" && output()
                            ? averageQueueSeries()
                            : queueSeries()
                      }
                      xLabel={view() === "ensemble" ? "Completed replications" : "Elapsed minutes"}
                      yLabel={
                        view() === "ensemble"
                          ? "Total waiting · vehicle-seconds"
                          : "Vehicles waiting"
                      }
                      step={view() === "flow"}
                      zeroBaseline={view() !== "ensemble"}
                      reference={
                        view() === "ensemble" && output()
                          ? { value: output()!.delay.mean, label: "All-run estimate" }
                          : undefined
                      }
                    />
                  </section>
                  <section class="panel">
                    <div class="panel-heading">
                      <div>
                        <h3>Which timing performs better?</h3>
                        <p>Mean total waiting per run. Lower is better.</p>
                      </div>
                      <Help
                        label="Matched-scenario comparison"
                        text="Chosen, input, equal-green, and demand-proportional timings face the same fresh scenarios. Bars compare mean total waiting. Hover on the information markers to inspect uncertainty. Equal and proportional targets are mapped to the nearest feasible grid plan."
                      />
                    </div>
                    <div class="plan-bars">
                      <For each={planRows()}>
                        {(p, i) => (
                          <div>
                            <div>
                              <b>{p.label}</b>
                              <span>
                                {number(p.delay.mean)} vehicle-seconds
                                <Help
                                  label={`${p.label} performance`}
                                  text={`95% interval: ${number(p.delay.low)} to ${number(p.delay.high)} vehicle-seconds. Standard error: ${number(p.delay.se)}. Lower total waiting is better.`}
                                  formula="Average of cumulative waiting over fresh replications"
                                />
                              </span>
                            </div>
                            <small class="plan-green-split">
                              Green seconds N/E/S/W: {p.green.join(" / ")}
                            </small>
                            <div class="plan-bar-track">
                              <span
                                style={{
                                  width: `${(p.delay.mean / Math.max(1, output()!.delay.mean, ...output()!.comparisons.map((c) => c.delay.mean))) * 100}%`,
                                  background: i() === 0 ? "#087f72" : "#8b9dab",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </For>
                      <Show when={!output()}>
                        <div class="empty-chart">
                          Timing comparisons appear when the experiment finishes.
                        </div>
                      </Show>
                    </div>
                    <Show when={output()}>
                      <p class="plan-unit-note">
                        Each second one vehicle waits adds one vehicle-second. This is total waiting
                        across all vehicles, averaged over fresh runs—not vehicles per second.
                      </p>
                    </Show>
                    <Show when={output()}>
                      <details class="plan-table">
                        <summary>Exact comparison and uncertainty</summary>
                        <div class="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>Timing</th>
                                <th>Green N/E/S/W · s</th>
                                <th>Mean total wait · vehicle-seconds</th>
                                <th>95% interval · vehicle-seconds</th>
                                <th>Extra wait vs chosen · vehicle-seconds</th>
                              </tr>
                            </thead>
                            <tbody>
                              <For each={planRows()}>
                                {(plan) => (
                                  <tr>
                                    <td>{plan.label}</td>
                                    <td>{plan.green.join(" / ")}</td>
                                    <td>{number(plan.delay.mean)}</td>
                                    <td>
                                      {number(plan.delay.low)}–{number(plan.delay.high)}
                                    </td>
                                    <td>
                                      {plan.paired_saving
                                        ? `${number(plan.paired_saving.mean)} (${number(plan.paired_saving.low)}–${number(plan.paired_saving.high)})`
                                        : "—"}
                                    </td>
                                  </tr>
                                )}
                              </For>
                            </tbody>
                          </table>
                        </div>
                        <p>
                          Extra waiting is measured on the same fresh arrival scenarios; positive
                          values favor the chosen timing. Parentheses show a paired 95% interval.
                        </p>
                      </details>
                    </Show>
                  </section>
                </div>
                <Show when={output()?.sensitivity.length}>
                  <section class="panel">
                    <div class="panel-heading">
                      <div>
                        <h3>How does more traffic change waiting?</h3>
                        <p>The evaluated timing stays fixed as demand changes.</p>
                      </div>
                      <Help
                        label="Demand sensitivity"
                        text="All road arrival rates are multiplied by the same factor. Additional fresh replications estimate performance for each demand. We do not re-optimize at these points."
                      />
                    </div>
                    <Chart
                      series={[
                        {
                          label: "Expected total waiting",
                          color: "#6355b4",
                          values: (output()?.sensitivity ?? []).map((p) => [p.rate, p.delay.mean]),
                          low: (output()?.sensitivity ?? []).map((p) => [p.rate, p.delay.low]),
                          high: (output()?.sensitivity ?? []).map((p) => [p.rate, p.delay.high]),
                        },
                      ]}
                      xLabel="Total incoming vehicles/hour"
                      yLabel="Total waiting · vehicle-seconds"
                    />
                  </section>
                </Show>
                <details class="panel audit-panel">
                  <summary>
                    Inspect the OR measurements & assumptions <span>＋</span>
                  </summary>
                  <div>
                    <p>
                      Total expected waiting:{" "}
                      <b>{output() ? number(output()!.delay.mean) : "—"} vehicle-seconds</b>.
                      Average waiting population:{" "}
                      <b>{output() ? number(output()!.queue.mean, 2) : "—"}</b>. These are related
                      by queue area divided by the observation horizon.
                    </p>
                    <p>
                      The experiment starts empty. Each approach receives its own protected phase;
                      lanes serve independently. Service must fit entirely within green. Unlimited
                      upstream storage and no downstream blocking are assumed. The display uses
                      left-hand traffic paths; it does not calculate car-following or physical
                      collisions.
                    </p>
                    <p>
                      The LCG uses 64-bit state; non-overlapping draws do not prove independence.
                      Confidence intervals are approximate and describe sampling uncertainty under
                      the chosen model.
                    </p>
                    <Show when={output()}>
                      <div class="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Lane</th>
                              <th>Arrived</th>
                              <th>Served</th>
                              <th>Waiting at end</th>
                              <th>In service</th>
                              <th>Mean queue</th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={output()?.run.lanes}>
                              {(l, i) => (
                                <tr>
                                  <td>
                                    {approaches[Math.floor(i() / 3)]} ·{" "}
                                    {["Left", "Straight", "Right"][i() % 3]}
                                  </td>
                                  <td>{l.arrived}</td>
                                  <td>{l.departed}</td>
                                  <td>{l.remaining}</td>
                                  <td>{l.in_service ? 1 : 0}</td>
                                  <td>{number(l.mean_queue, 2)}</td>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                      <p class="audit-ok">
                        Vehicle conservation checked · queue-area error{" "}
                        {output()!.run.accounting_error.toExponential(2)} vehicle-seconds
                      </p>
                    </Show>
                  </div>
                </details>
              </>
            }
          >
            <SavedComparisons
              saved={saved()}
              onDelete={(id) => persist(saved().filter((s) => s.id !== id))}
            />
          </Show>
          <footer class="workspace-footer">
            <span>Operations Research · PBCBT504</span>
            <span>
              {busy()
                ? "Batched Rust / WebAssembly computation"
                : output()
                  ? `Completed in ${number(elapsed() / 1000, 1)}s · seed ${output()!.request.seed}`
                  : "No experiment run yet"}
            </span>
            <span>Hover or focus a ? for the mathematics</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
