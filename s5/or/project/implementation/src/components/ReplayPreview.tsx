import { For } from "solid-js";
import { colors, type Four } from "../types";

export default function ReplayPreview(props: { green: Four }) {
  const total = () => props.green.reduce((sum, seconds) => sum + seconds, 0);
  return (
    <div class="replay-preview" aria-hidden="true">
      <svg viewBox="0 0 160 80">
        <rect width="160" height="80" fill="#e4ede7" />
        <path d="M57 0h46v80H57zM0 17h160v46H0z" fill="#56616a" />
        <path
          d="M76 0v17m0 46v17M0 40h57m46 0h57"
          stroke="#cfdae0"
          stroke-width="1"
          stroke-dasharray="4 5"
        />
        <path d="M91 0v17M69 63v17M0 29h57m46 22h57" stroke="#d9c780" stroke-width="1" />
        <path d="M80 12v8M148 40h-8M80 68v-8M12 40h8" stroke="#f7fbfa" stroke-width="2" />
        <circle cx="107" cy="14" r="4" fill="#42d281" stroke="#243a37" stroke-width="2" />
        <circle cx="146" cy="66" r="4" fill="#e56a67" stroke="#243a37" stroke-width="2" />
        <circle cx="53" cy="66" r="4" fill="#e56a67" stroke="#243a37" stroke-width="2" />
        <circle cx="14" cy="14" r="4" fill="#e56a67" stroke="#243a37" stroke-width="2" />
      </svg>
      <div class="replay-green-bars">
        <For each={props.green}>
          {(seconds, index) => (
            <span style={{ width: `${(seconds / total()) * 100}%`, background: colors[index()] }} />
          )}
        </For>
      </div>
    </div>
  );
}
