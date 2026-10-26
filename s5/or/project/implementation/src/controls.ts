import type { Four, Request } from "./types";
export const replicationOptions = [
  16, 32, 64, 128, 256, 512, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
];
export function allocate(
  total: number,
  min: number,
  max: number,
  target: number[],
  locked = -1,
): Four {
  const green = target.map((v) => Math.max(min, Math.min(max, Math.round(v)))) as Four;
  let difference = total - green.reduce((s, g) => s + g, 0);
  while (difference !== 0) {
    const sign = Math.sign(difference);
    let best = -1,
      cost = Infinity;
    for (let i = 0; i < 4; i++) {
      if (i === locked || green[i]! + sign < min || green[i]! + sign > max) continue;
      const c = (green[i]! + sign - target[i]!) ** 2 - (green[i]! - target[i]!) ** 2;
      if (c < cost) {
        cost = c;
        best = i;
      }
    }
    if (best < 0) throw new Error("No feasible allocation");
    green[best] = green[best]! + sign;
    difference -= sign;
  }
  return green;
}
export function shiftNext<T extends number[]>(
  values: T,
  index: number,
  target: number,
  min: number,
  max: number,
): T {
  const next = (index + 1) % values.length;
  const lower = Math.max(min, values[index]! + values[next]! - max);
  const upper = Math.min(max, values[index]! + values[next]! - min);
  if (lower > upper) return [...values] as T;
  const chosen = Math.max(lower, Math.min(upper, target));
  const result = [...values] as T;
  result[next] = values[next]! - (chosen - values[index]!);
  result[index] = chosen;
  return result;
}

export const expectedVehicles = (rates: Four, horizon: number) =>
  (rates.reduce((sum, rate) => sum + rate, 0) * horizon) / 3600;

export const vehiclesPerRoadLimit = (horizon: number) => Math.floor((20000 * horizon) / 3600);

export const maximumVehicleCount = (horizon: number, sensitivity: boolean) =>
  Math.min(Math.floor(1000000 / (sensitivity ? 1.5 : 1)), 4 * vehiclesPerRoadLimit(horizon));

export function allocateVehicleCounts(total: number, weights: Four, maxPerRoad: number): Four {
  const cap = Math.max(0, Math.floor(maxPerRoad));
  const counts: Four = [0, 0, 0, 0];
  let remaining = Math.max(0, Math.min(Math.round(total), 4 * cap));
  let open = [0, 1, 2, 3];
  while (remaining && open.length) {
    const weightSum = open.reduce((sum, i) => sum + Math.max(0, weights[i]!), 0);
    const quota = open.map((i) =>
      weightSum ? (remaining * Math.max(0, weights[i]!)) / weightSum : remaining / open.length,
    );
    const saturated = open.filter((_, index) => quota[index]! >= cap);
    if (saturated.length) {
      for (const i of saturated) {
        counts[i] = cap;
        remaining -= cap;
      }
      open = open.filter((i) => !saturated.includes(i));
      continue;
    }
    for (let index = 0; index < open.length; index++) {
      const floor = Math.floor(quota[index]!);
      counts[open[index]!] = floor;
      remaining -= floor;
    }
    const order = open
      .map((i, index) => ({ i, fraction: quota[index]! - Math.floor(quota[index]!) }))
      .sort((a, b) => b.fraction - a.fraction || a.i - b.i);
    for (let i = 0; i < remaining; i++) counts[order[i]!.i]!++;
    break;
  }
  return counts;
}

export const vehicleCountsFromRates = (rates: Four, horizon: number) =>
  allocateVehicleCounts(
    Math.round(expectedVehicles(rates, horizon)),
    rates,
    vehiclesPerRoadLimit(horizon),
  );

export const ratesFromVehicleCounts = (counts: Four, horizon: number): Four =>
  counts.map((count) => (count * 3600) / horizon) as Four;

export function planCount(request: Request): number {
  const total = request.config.cycle - request.config.clearance;
  if (
    !Number.isInteger(total) ||
    total < 1 ||
    total > 600 ||
    !Number.isInteger(request.min_green) ||
    request.min_green < 1 ||
    !Number.isInteger(request.max_green) ||
    request.max_green < request.min_green ||
    request.max_green > 600 ||
    !Number.isInteger(request.grid_step) ||
    request.grid_step < 1 ||
    request.grid_step > 60
  )
    return 0;
  let dp = Array<number>(total + 1).fill(0);
  dp[0] = 1;
  for (let phase = 0; phase < 4; phase++) {
    const next = Array<number>(total + 1).fill(0);
    for (let sum = 0; sum <= total; sum++) {
      if (!dp[sum]) continue;
      for (
        let g = request.min_green;
        g <= request.max_green && sum + g <= total;
        g += request.grid_step
      )
        next[sum + g]! += dp[sum]!;
    }
    dp = next;
  }
  return dp[total] ?? 0;
}
export const demandScales = (r: Request) =>
  r.sensitivity
    ? [0.5, 0.75, 1, 1.25, 1.5].filter((scale) =>
        r.config.rates.every((rate) => rate * scale <= 20000),
      )
    : [];

export function inputIssues(r: Request): string[] {
  const c = r.config,
    issues: string[] = [];
  if (!Number.isFinite(c.horizon) || c.horizon < 30 || c.horizon > 86400)
    issues.push("Traffic duration must be between 0.5 and 1,440 minutes.");
  if (!Number.isInteger(c.cycle) || c.cycle < 24 || c.cycle > 600)
    issues.push("Signal cycle must be a whole number from 24 to 600 seconds.");
  if (!Number.isFinite(c.clearance) || c.clearance < 0 || c.clearance >= c.cycle)
    issues.push("Safety gaps must total less than the signal cycle.");
  if (!Number.isFinite(c.headway) || c.headway < 0.25 || c.headway > 30)
    issues.push("Vehicle service time must be between 0.25 and 30 seconds.");
  if (c.rates.some((v) => !Number.isFinite(v) || v < 0 || v > 20000))
    issues.push("Each arrival rate must be between 0 and 20,000 vehicles/hour.");
  if (
    c.turns.some((v) => !Number.isFinite(v) || v < 0 || v > 1) ||
    Math.abs(c.turns.reduce((a, b) => a + b, 0) - 1) > 1e-9
  )
    issues.push("Turning percentages must add up to 100%. Open Turning split to adjust them.");
  if (Math.abs(c.green.reduce((a, b) => a + b, 0) + c.clearance - c.cycle) > 1e-8)
    issues.push("Greens + safety gaps must equal the cycle. Open My green times to adjust.");
  if (
    !Number.isInteger(r.min_green) ||
    !Number.isInteger(r.max_green) ||
    r.min_green < c.headway ||
    r.min_green < 1 ||
    r.max_green < r.min_green ||
    r.max_green > 600
  )
    issues.push("Green bounds must be whole seconds, ordered, and at least one service time.");
  if (c.green.some((v) => !Number.isInteger(v) || v < r.min_green || v > r.max_green))
    issues.push("Each road’s green must be a whole number within the allowed green bounds.");
  if (!planCount(r))
    issues.push("No timings fit this grid. Adjust Timing step or Allowed green times.");
  else if (planCount(r) > 100000) issues.push("Too many candidate timings. Increase Timing step.");
  if (
    ![r.replications, r.training_replications].every(
      (v) => Number.isInteger(v) && v >= 2 && v <= 1000000,
    )
  )
    issues.push("Run counts must be whole numbers from 2 to 1,000,000.");
  if (!Number.isInteger(r.seed) || r.seed < 0 || r.seed > 4294967295)
    issues.push("Random seed must be a whole number from 0 to 4,294,967,295.");
  const expected =
    ((c.rates.reduce((a, b) => a + b, 0) * c.horizon) / 3600) * Math.max(1, ...demandScales(r));
  if (expected > 1000000)
    issues.push("Over a million expected arrivals per run. Reduce demand or traffic duration.");
  return issues;
}
