import { createMemo, createSignal, For, Show } from "solid-js";
import { number } from "../types";
export interface Series {
  label: string;
  color: string;
  values: [number, number][];
  low?: [number, number][];
  high?: [number, number][];
}
export default function Chart(props: {
  series: Series[];
  xLabel: string;
  yLabel: string;
  step?: boolean;
  zeroBaseline?: boolean;
  reference?: { value: number; label: string };
}) {
  const [hover, setHover] = createSignal<number>();
  const bounds = createMemo(() => {
    const values = props.series.flatMap((s) => [...s.values, ...(s.high ?? []), ...(s.low ?? [])]);
    if (props.reference) values.push([0, props.reference.value]);
    const bottom = Math.min(0, ...values.map((p) => p[1]));
    const rawMin = values.length ? Math.min(...values.map((p) => p[1])) : 0;
    const top = Math.max(1, ...values.map((p) => p[1]));
    const padding = Math.max((top - rawMin) * 0.08, top * 0.005, 0.01);
    return {
      x: Math.max(1, ...values.map((p) => p[0])),
      y: props.zeroBaseline === false ? top + padding : top * 1.12,
      min: props.zeroBaseline === false ? rawMin - padding : bottom,
    };
  });
  const x = (v: number) => 56 + (v / bounds().x) * 510,
    y = (v: number) => 188 - ((v - bounds().min) / (bounds().y - bounds().min)) * 158;
  const path = (values: [number, number][]) =>
    values
      .map(
        (p, i) =>
          `${i ? (props.step ? `H${x(p[0])}V` : "L") : "M"}${i && props.step ? y(p[1]) : `${x(p[0])},${y(p[1])}`}`,
      )
      .join(" ");
  const nearby = createMemo(() =>
    props.series
      .filter((s) => s.values.length)
      .map((s) => ({
        ...s,
        point: s.values.reduce((a, b) =>
          Math.abs(a[0] - (hover() ?? 0)) < Math.abs(b[0] - (hover() ?? 0)) ? a : b,
        ),
      })),
  );
  const compact = (n: number) =>
    Math.abs(n) >= 1000 ? `${number(n / 1000, 1)}k` : number(n, Math.abs(n) < 10 ? 1 : 0);
  return (
    <div class="chart">
      <Show when={props.zeroBaseline === false && bounds().min > 0}>
        <span class="chart-scale-note">Vertical axis starts at {number(bounds().min)}.</span>
      </Show>
      <svg
        viewBox="0 0 600 235"
        role="img"
        tabindex="0"
        aria-label={`${props.yLabel} against ${props.xLabel}. Move over the plot to inspect values.`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(
            Math.max(
              0,
              Math.min(
                bounds().x,
                ((((e.clientX - r.left) / r.width) * 600 - 56) / 510) * bounds().x,
              ),
            ),
          );
        }}
        onMouseLeave={() => setHover(undefined)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            setHover((v) =>
              Math.max(
                0,
                Math.min(
                  bounds().x,
                  (v ?? 0) + ((e.key === "ArrowRight" ? 1 : -1) * bounds().x) / 20,
                ),
              ),
            );
          }
        }}
      >
        <For each={[0, 0.5, 1]}>
          {(v) => (
            <g>
              <line
                x1="56"
                x2="566"
                y1={y(bounds().min + (bounds().y - bounds().min) * v)}
                y2={y(bounds().min + (bounds().y - bounds().min) * v)}
                stroke="#dbe4e9"
                stroke-dasharray="3 4"
              />
              <text
                x="45"
                y={y(bounds().min + (bounds().y - bounds().min) * v) + 4}
                text-anchor="end"
              >
                {compact(bounds().min + (bounds().y - bounds().min) * v)}
              </text>
            </g>
          )}
        </For>
        <For each={[0, 0.25, 0.5, 0.75, 1]}>
          {(v) => (
            <text x={x(v * bounds().x)} y="210" text-anchor="middle">
              {compact(v * bounds().x)}
            </text>
          )}
        </For>
        <Show when={props.reference}>
          {(reference) => (
            <line
              x1="56"
              x2="566"
              y1={y(reference().value)}
              y2={y(reference().value)}
              stroke="#a14e1b"
              stroke-width="1.5"
              stroke-dasharray="5 4"
            />
          )}
        </Show>
        <For each={props.series}>
          {(s) => (
            <g>
              <Show when={s.low?.length && s.high?.length}>
                <path
                  d={`${path(s.high!)} ${[...s.low!]
                    .reverse()
                    .map((p) => `L${x(p[0])},${y(p[1])}`)
                    .join(" ")} Z`}
                  fill={s.color}
                  opacity=".12"
                />
              </Show>
              <path
                d={path(s.values)}
                fill="none"
                stroke={s.color}
                stroke-width="2.5"
                stroke-linejoin="round"
              />
            </g>
          )}
        </For>
        <Show when={hover() !== undefined}>
          <line
            x1={x(hover()!)}
            x2={x(hover()!)}
            y1="25"
            y2="188"
            stroke="#253b49"
            stroke-dasharray="3 4"
          />
          <For each={nearby()}>
            {(s) => (
              <circle cx={x(s.point[0])} cy={y(s.point[1])} r="4" fill={s.color} stroke="white" />
            )}
          </For>
        </Show>
        <text x="56" y="14" class="chart-unit">
          {props.yLabel}
        </text>
        <text x="566" y="232" text-anchor="end" class="chart-unit">
          {props.xLabel}
        </text>
      </svg>
      <Show when={hover() !== undefined}>
        <div class="chart-tooltip">
          <For each={nearby()}>
            {(s) => (
              <span>
                <i style={{ background: s.color }} />
                {s.label}: <b>{number(s.point[1], 1)}</b> at {number(s.point[0], 1)}
              </span>
            )}
          </For>
        </div>
      </Show>
      <div class="chart-legend">
        <For each={props.series}>
          {(s) => (
            <span>
              <i style={{ background: s.color }} />
              {s.label}
            </span>
          )}
        </For>
        <Show when={props.reference}>
          {(reference) => (
            <span>
              <i class="chart-reference-key" />
              {reference().label}: {number(reference().value)}
            </span>
          )}
        </Show>
      </div>
    </div>
  );
}
