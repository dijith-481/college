import type { Request, Four, Run } from "./types";
interface Wasm {
  default: () => Promise<unknown>;
  replay_choice: (input: string, state: string, green: string) => string;
}
const url = `${self.location.origin}${import.meta.env.BASE_URL}wasm/traffic.js`;
self.onmessage = async (event: MessageEvent<{ request: Request; state: string; green: Four }>) => {
  try {
    const wasm: Wasm = await import(/* @vite-ignore */ url);
    await wasm.default();
    const run = JSON.parse(
      wasm.replay_choice(
        JSON.stringify(event.data.request),
        event.data.state,
        JSON.stringify(event.data.green),
      ),
    ) as Run;
    self.postMessage({ kind: "ready", run });
  } catch (e) {
    self.postMessage({ kind: "error", error: String(e) });
  }
};
