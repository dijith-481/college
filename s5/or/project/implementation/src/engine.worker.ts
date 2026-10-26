import type { Output, Progress, Reply, Request, Run, Four } from "./types";
interface Session {
  advance: (work: number) => boolean;
  progress: () => string;
  result: () => string;
  replay: () => string;
  adopt_training: (chunks: string) => void;
  free: () => void;
}
interface Wasm {
  preview: (input: string) => string;
  default: () => Promise<unknown>;
  ExperimentSession: new (input: string) => Session;
}
const url = `${self.location.origin}${import.meta.env.BASE_URL}wasm/traffic.js`;
self.onmessage = async (event: MessageEvent<Request>) => {
  const start = performance.now();
  let session: Session | undefined;
  try {
    const wasm: Wasm = await import(/* @vite-ignore */ url);
    await wasm.default();
    session = new wasm.ExperimentSession(JSON.stringify(event.data));
    self.postMessage({
      kind: "progress",
      progress: JSON.parse(session.progress()) as Progress,
    } satisfies Reply);
    self.postMessage({
      kind: "replay",
      run: JSON.parse(wasm.preview(JSON.stringify(event.data))) as Run,
      green: event.data.config.green,
      phase: "input",
    } satisfies Reply);
    if (
      event.data.optimize &&
      navigator.hardwareConcurrency > 1 &&
      (JSON.parse(session.progress()) as Progress).candidates * event.data.training_replications >=
        20000
    ) {
      const initial = JSON.parse(session.progress()) as Progress;
      const workers = Math.min(
        16,
        Math.max(2, Math.floor(navigator.hardwareConcurrency * 0.75)),
        Math.floor((initial.candidates * event.data.training_replications) / 1000),
        initial.candidates,
      );
      const progress = Array<number>(workers).fill(0);
      let lastParallel = 0;
      const children: Worker[] = [];
      try {
        const chunks = await Promise.all(
          Array.from(
            { length: workers },
            (_, index) =>
              new Promise<unknown>((resolve, reject) => {
                const start = Math.floor((index * initial.candidates) / workers);
                const end = Math.floor(((index + 1) * initial.candidates) / workers);
                const child = new Worker(new URL("./training.worker.ts", import.meta.url), {
                  type: "module",
                });
                children.push(child);
                child.onmessage = (
                  message: MessageEvent<
                    | { kind: "progress"; completed: number }
                    | { kind: "result"; result: unknown }
                    | { kind: "error"; error: string }
                  >,
                ) => {
                  const data = message.data;
                  if (data.kind === "error") reject(new Error(data.error));
                  if (data.kind === "result") resolve(data.result);
                  if (data.kind === "progress") {
                    progress[index] = data.completed;
                    const now = performance.now();
                    if (now - lastParallel > 100) {
                      lastParallel = now;
                      self.postMessage({
                        kind: "progress",
                        progress: { ...initial, completed: progress.reduce((a, b) => a + b, 0) },
                      } satisfies Reply);
                    }
                  }
                };
                child.onerror = (e) => reject(new Error(e.message));
                child.postMessage({ request: event.data, start, end });
              }),
          ),
        );
        session.adopt_training(JSON.stringify(chunks));
        self.postMessage({
          kind: "progress",
          progress: JSON.parse(session.progress()) as Progress,
        } satisfies Reply);
      } finally {
        for (const child of children) child.terminate();
      }
    }
    let done = false,
      last = 0,
      selectedReplay = false;
    while (!done) {
      const chunk = performance.now();
      do {
        done = session.advance(8);
      } while (!done && performance.now() - chunk < 25);
      if (done || performance.now() - last >= 100) {
        last = performance.now();
        const progress = JSON.parse(session.progress()) as Progress;
        self.postMessage({ kind: "progress", progress } satisfies Reply);
        if (progress.replications_done > 0 && !selectedReplay) {
          const replay = JSON.parse(session.replay()) as [Run, Four] | null;
          if (replay) {
            self.postMessage({
              kind: "replay",
              run: replay[0],
              green: replay[1],
              phase: "selected",
            } satisfies Reply);
            selectedReplay = true;
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    self.postMessage({
      kind: "result",
      result: JSON.parse(session.result()) as Output,
      elapsed: performance.now() - start,
    } satisfies Reply);
  } catch (e) {
    self.postMessage({ kind: "error", error: String(e) } satisfies Reply);
  } finally {
    session?.free();
  }
};
