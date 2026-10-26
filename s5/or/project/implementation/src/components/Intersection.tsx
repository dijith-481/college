import { signalState } from "../signals";
import { createMemo, createSignal, For, Show } from "solid-js";
import {
  approaches,
  colors,
  destinations,
  movements,
  number,
  type Config,
  type Frame,
  type Vehicle,
} from "../types";

function route(m: number, t: number): { x: number; y: number; angle: number } {
  const curves = [
    [
      [438, 236],
      [438, 304],
      [444, 310],
      [490, 310],
    ],
    [
      [410, 236],
      [410, 320],
      [410, 410],
      [410, 490],
    ],
    [
      [382, 236],
      [382, 390],
      [350, 410],
      [230, 410],
    ],
  ];
  const p = curves[m]!;
  if (t > 1) {
    const d = (t - 1) * 260;
    return m === 0
      ? { x: 490 + d, y: 310, angle: -90 }
      : m === 1
        ? { x: 410, y: 490 + d, angle: 0 }
        : { x: 230 - d, y: 410, angle: 90 };
  }
  const u = 1 - t,
    point = (axis: number) =>
      u * u * u * p[0]![axis]! +
      3 * u * u * t * p[1]![axis]! +
      3 * u * t * t * p[2]![axis]! +
      t * t * t * p[3]![axis]!;
  const tangent = (axis: number) =>
    3 * u * u * (p[1]![axis]! - p[0]![axis]!) +
    6 * u * t * (p[2]![axis]! - p[1]![axis]!) +
    3 * t * t * (p[3]![axis]! - p[2]![axis]!);
  return {
    x: point(0),
    y: point(1),
    angle: (Math.atan2(tangent(1), tangent(0)) * 180) / Math.PI - 90,
  };
}
export default function Intersection(props: {
  vehicles: Vehicle[];
  time: number;
  frame: Frame;
  config: Config;
  green: number[];
}) {
  const [hover, setHover] = createSignal<Vehicle>();
  const lanes = createMemo(() =>
    Array.from({ length: 12 }, (_, m) => props.vehicles.filter((v) => v.lane === m)),
  );
  const visible = createMemo(() => {
    const t = props.time,
      result: { vehicle: Vehicle; x: number; y: number; angle: number }[] = [];
    for (let lane = 0; lane < 12; lane++) {
      const list = lanes()[lane]!,
        waiting = list.filter((v) => v.arrived <= t && (v.started === null || v.started > t));
      const ranks = new Map(waiting.map((v, i) => [v.id, i]));
      let future = 0;
      const lastStart = list.reduce(
        (last, v) => (v.started !== null && v.started <= t ? Math.max(last, v.started) : last),
        -100,
      );
      for (const v of list) {
        if (t < v.arrived - 6 || (v.departed !== null && t > v.departed + 4)) continue;
        let position: { x: number; y: number; angle: number };
        if (v.started !== null && t >= v.started) {
          const end = v.departed!;
          const fraction = t <= end ? (t - v.started) / (end - v.started) : 1 + (t - end) / 4;
          position = route(lane % 3, fraction);
        } else {
          const rank = v.arrived <= t ? ranks.get(v.id)! : waiting.length + future++;
          if (rank > 10) continue;
          const y = 236 - rank * 25;
          const advance = v.arrived > t ? Math.max(0, Math.min(1, (t - (v.arrived - 6)) / 6)) : 1;
          position = {
            x: [438, 410, 382][lane % 3]!,
            y:
              v.arrived > t
                ? -26 + (y + 26) * advance
                : y - 25 * (1 - Math.min(1, (t - lastStart) / 0.5)),
            angle: 0,
          };
        }
        if (position.y < -25 && (v.started === null || v.started > t)) continue;
        result.push({ vehicle: v, ...position });
      }
    }
    return result;
  });
  const phaseProgress = () =>
    signalState(props.time, props.config.cycle, props.config.clearance, props.green);
  return (
    <div class="intersection-wrap">
      <svg
        class="intersection"
        viewBox="0 0 720 720"
        role="img"
        aria-label="Left-hand traffic intersection with three incoming and three outgoing lanes per approach. Vehicles follow their assigned turns."
      >
        <defs>
          <pattern id="paving" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 0H16V16" fill="none" stroke="#c6d5cf" stroke-width=".4" />
          </pattern>
          <clipPath id="world">
            <rect width="720" height="720" rx="12" />
          </clipPath>
        </defs>
        <g clip-path="url(#world)">
          <rect width="720" height="720" fill="#e4ede7" />
          <rect width="720" height="720" fill="url(#paving)" />
          <For
            each={[
              [25, 25],
              [487, 25],
              [25, 487],
              [487, 487],
            ]}
          >
            {(p) => (
              <g>
                <rect x={p[0]} y={p[1]} width="208" height="208" rx="20" fill="#d5e2d2" />
                <rect
                  x={p[0] + 22}
                  y={p[1] + 24}
                  width="124"
                  height="86"
                  rx="7"
                  fill="#f4f1e6"
                  stroke="#bac9b9"
                  stroke-width="2"
                />
                <path d={`M${p[0] + 30} ${p[1] + 34}h108v65h-108Z`} fill="#e8e2d4" />
                <For each={[0, 1, 2]}>
                  {(i) => (
                    <g>
                      <circle cx={p[0] + 38 + i * 59} cy={p[1] + 157} r="17" fill="#a5bf9c" />
                      <circle cx={p[0] + 34 + i * 59} cy={p[1] + 152} r="12" fill="#bed1b1" />
                    </g>
                  )}
                </For>
              </g>
            )}
          </For>
          <path d="M258 0H462V258H720V462H462V720H258V462H0V258H258Z" fill="#56616a" />
          <rect x="258" y="258" width="204" height="204" fill="#505c64" />
          <For each={[0, 1, 2, 3]}>
            {(a) => (
              <g transform={`rotate(${a * 90} 360 360)`}>
                <path d="M360 0V252" stroke="#f0d27d" stroke-width="2" />
                <For each={[396, 424]}>
                  {(x) => (
                    <path
                      d={`M${x} 0V245`}
                      stroke="#e4e9ed"
                      stroke-width="1.5"
                      stroke-dasharray="9 13"
                    />
                  )}
                </For>
                <For each={[296, 324]}>
                  {(x) => (
                    <path
                      d={`M${x} 0V252`}
                      stroke="#bfc9d0"
                      stroke-width="1.2"
                      stroke-dasharray="9 13"
                    />
                  )}
                </For>
                <path d="M368 251H455" stroke="#fff" stroke-width="5" />
                <path
                  d="M438 198v26h18m-5-5 5 5-5 5M410 198v27m-5-6 5 6 5-6M382 198v26h-12m5-5-5 5 5 5"
                  fill="none"
                  stroke="#d9e3e7"
                  stroke-width="2"
                />
                <path d="M310 160v-24m-5 6 5-6 5 6" stroke="#aab9c1" stroke-width="2" fill="none" />
                <rect x="467" y="213" width="17" height="44" rx="6" fill="#1f2930" />
                <circle
                  cx="475.5"
                  cy="223"
                  r="5"
                  fill={
                    props.frame.phase === a || phaseProgress().amber === a ? "#693632" : "#ef4444"
                  }
                />
                <circle
                  cx="475.5"
                  cy="235"
                  r="4"
                  fill={phaseProgress().amber === a ? "#fbbf24" : "#614d29"}
                />
                <circle
                  cx="475.5"
                  cy="247"
                  r="5"
                  fill={props.frame.phase === a ? "#4ade80" : "#244338"}
                />
                <For each={visible().filter((v) => Math.floor(v.vehicle.lane / 3) === a)}>
                  {(v) => (
                    <g
                      transform={`translate(${v.x} ${v.y}) rotate(${v.angle})`}
                      class="car"
                      tabindex="0"
                      role="img"
                      aria-label={`Vehicle ${v.vehicle.id + 1}, ${approaches[a]} ${movements[v.vehicle.lane % 3]}`}
                      onMouseEnter={() => setHover(v.vehicle)}
                      onMouseLeave={() => setHover(undefined)}
                      onFocus={() => setHover(v.vehicle)}
                      onBlur={() => setHover(undefined)}
                    >
                      <rect
                        x="-8"
                        y="-13"
                        width="16"
                        height="26"
                        rx="4"
                        fill={colors[a]}
                        stroke="#f8fafc"
                        stroke-width="1.2"
                      />
                      <path d="M-5 3H5V8H-5Z" fill="#c7e5ea" />
                      <path d="M-5-9H5V-6H-5Z" fill="#b3cfd2" />
                      <path d="M-6 11h3m6 0h3" stroke="#fff7c0" stroke-width="2" />
                    </g>
                  )}
                </For>
              </g>
            )}
          </For>
          <For
            each={[
              [410, 22],
              [699, 410],
              [310, 700],
              [20, 310],
            ]}
          >
            {(p, i) => (
              <g>
                <circle cx={p[0]} cy={p[1]} r="14" fill="#fff" />
                <text
                  x={p[0]}
                  y={p[1] + 4}
                  text-anchor="middle"
                  font-size="12"
                  font-weight="700"
                  fill="#243b46"
                >
                  {approaches[i()]![0]}
                </text>
              </g>
            )}
          </For>
        </g>
      </svg>
      <div class="signal-key">
        <span
          class={
            phaseProgress().amber !== null
              ? "signal-amber"
              : props.frame.phase === null
                ? "signal-red"
                : "signal-green"
          }
        />
        <b>
          {props.frame.phase === null
            ? phaseProgress().amber !== null
              ? `${approaches[phaseProgress().amber!]} amber · clearance`
              : "All red · clearance"
            : `${approaches[props.frame.phase]} has green`}
        </b>
        <span>{number(phaseProgress().remaining, 0)}s left</span>
      </div>
      <Show when={hover()}>
        <div class="vehicle-tip" role="tooltip">
          <b>Vehicle {hover()!.id + 1}</b>
          <span>
            From {approaches[Math.floor(hover()!.lane / 3)]} →{" "}
            {destinations[Math.floor(hover()!.lane / 3)]![hover()!.lane % 3]}
          </span>
          <span>
            {movements[hover()!.lane % 3]} lane · arrived {number(hover()!.arrived, 1)}s
          </span>
          <span>
            Waiting: {number(Math.max(0, (hover()!.started ?? props.time) - hover()!.arrived), 1)}s
          </span>
        </div>
      </Show>
    </div>
  );
}
