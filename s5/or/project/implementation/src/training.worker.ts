import type { Request } from "./types";
interface TrainingShard {
  advance: (work: number) => boolean;
  completed: () => number;
  total: () => number;
  result: () => string;
  free: () => void;
}
interface Wasm {
  default: () => Promise<unknown>;
  ParallelTrainingShard: new (input: string, start: number, end: number) => TrainingShard;
}
const url = `${self.location.origin}${import.meta.env.BASE_URL}wasm/traffic.js`;
self.onmessage = async (event: MessageEvent<{ request: Request; start: number; end: number }>) => {
  let shard: TrainingShard | undefined;
  try {
    const wasm: Wasm = await import(/* @vite-ignore */ url);
    await wasm.default();
    shard = new wasm.ParallelTrainingShard(
      JSON.stringify(event.data.request),
      event.data.start,
      event.data.end,
    );
    let done = false,
      last = 0;
    while (!done) {
      const chunk = performance.now();
      do {
        done = shard.advance(8);
      } while (!done && performance.now() - chunk < 25);
      if (done || performance.now() - last > 100) {
        last = performance.now();
        self.postMessage({ kind: "progress", completed: shard.completed() });
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    self.postMessage({ kind: "result", result: JSON.parse(shard.result()) });
  } catch (e) {
    self.postMessage({ kind: "error", error: String(e) });
  } finally {
    shard?.free();
  }
};
