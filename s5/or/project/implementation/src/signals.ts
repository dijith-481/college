export function signalState(
  time: number,
  cycle: number,
  clearance: number,
  green: number[],
): { approach: number | null; amber: number | null; remaining: number } {
  let offset = time % cycle;
  for (let a = 0; a < 4; a++) {
    if (offset < green[a]!) return { approach: a, amber: null, remaining: green[a]! - offset };
    offset -= green[a]!;
    if (offset < clearance / 4)
      return {
        approach: null,
        amber: offset < Math.min(2, clearance / 8) ? a : null,
        remaining: clearance / 4 - offset,
      };
    offset -= clearance / 4;
  }
  return { approach: null, amber: null, remaining: 0 };
}
