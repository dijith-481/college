export type Four = [number, number, number, number];
export interface Config {
  horizon: number;
  cycle: number;
  clearance: number;
  headway: number;
  rates: Four;
  turns: [number, number, number];
  green: Four;
}
export interface Request {
  config: Config;
  replications: number;
  training_replications: number;
  grid_step: number;
  min_green: number;
  max_green: number;
  seed: number;
  optimize: boolean;
  sensitivity: boolean;
}
export interface Statistics {
  n: number;
  mean: number;
  sd: number;
  se: number;
  low: number;
  high: number;
}
export interface Frame {
  time: number;
  phase: number | null;
  queues: number[];
  busy: boolean[];
  departed: number;
  delay: number;
}
export interface Vehicle {
  id: number;
  lane: number;
  arrived: number;
  started: number | null;
  departed: number | null;
}
export interface LaneResult {
  arrived: number;
  departed: number;
  remaining: number;
  in_service: boolean;
  delay: number;
  mean_queue: number;
  max_queue: number;
  utilization: number;
}
export interface Run {
  delay: number;
  mean_queue: number;
  max_queue: number;
  arrivals: number;
  departures: number;
  remaining: number;
  in_service: number;
  throughput: number;
  accounting_error: number;
  lanes: LaneResult[];
  frames: Frame[];
  vehicles: Vehicle[];
}
export interface Sample {
  approach: number;
  uniform: number;
  gap: number;
  time: number;
  movement: number;
}
export interface Candidate {
  green: Four;
  delay: Statistics;
}
export interface Comparison extends Candidate {
  label: string;
  paired_saving: Statistics;
}
export interface DemandPoint {
  scale: number;
  rate: number;
  delay: Statistics;
  backlog: Statistics;
}
export interface Distribution {
  columns: number;
  rows: number;
  counts: number[];
  max_wait: number;
  max_backlog: number;
  total: number;
}
export interface Progress {
  stage: string;
  completed: number;
  total: number;
  done: boolean;
  replications_done: number;
  replications: number;
  candidates: number;
  estimate: Statistics;
  distribution_kind: string;
  distribution: Distribution;
  search_distribution: Distribution;
}
export interface ReplayChoice {
  label: string;
  state: string;
  green: Four;
  delay: number;
  remaining: number;
}
export interface QueuePoint {
  time: number;
  queues: Four;
}
export interface Output {
  engine_version: string;
  request: Request;
  selected: Four;
  candidates: Candidate[];
  comparisons: Comparison[];
  delay: Statistics;
  queue: Statistics;
  queue_profile: QueuePoint[];
  throughput: Statistics;
  backlog: Statistics;
  waiting_per_arrival: Statistics;
  convergence: Statistics[];
  run: Run;
  replay_choices: ReplayChoice[];
  samples: Sample[];
  replicate_delays: number[];
  sensitivity: DemandPoint[];
  distribution: Distribution;
  search_distribution: Distribution;
}
export interface Saved {
  id: string;
  name: string;
  created: string;
  request: Request;
  selected: Four;
  delay: Statistics;
  wait: Statistics;
  throughput: Statistics;
  backlog: Statistics;
}
export type Reply =
  | { kind: "replay"; run: Run; green: Four; phase: "input" | "selected" }
  | { kind: "progress"; progress: Progress }
  | { kind: "result"; result: Output; elapsed: number }
  | { kind: "error"; error: string };
export const approaches = ["North", "East", "South", "West"];
export const movements = ["Left", "Straight", "Right"];
export const destinations = [
  ["East", "South", "West"],
  ["South", "West", "North"],
  ["West", "North", "East"],
  ["North", "East", "South"],
];
export const colors = ["#087f72", "#bd5720", "#6355b4", "#2464b3"];
export const defaults: Request = {
  config: {
    horizon: 600,
    cycle: 96,
    clearance: 16,
    headway: 2,
    rates: [600, 350, 550, 300],
    turns: [0.2, 0.6, 0.2],
    green: [24, 16, 24, 16],
  },
  replications: 1000,
  training_replications: 256,
  grid_step: 4,
  min_green: 8,
  max_green: 44,
  seed: 2026,
  optimize: true,
  sensitivity: false,
};
export const number = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const clock = (v: number) =>
  `${Math.floor(v / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(v % 60)
    .toString()
    .padStart(2, "0")}`;
