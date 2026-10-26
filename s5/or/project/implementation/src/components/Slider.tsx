import { createUniqueId, Show } from "solid-js";
import Help from "./Help";
export default function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  options?: number[];
  scale?: number;
  unit?: string;
  display?: string;
  help: string;
  hint?: string;
  formula?: string;
  disabled?: boolean;
  onInput: (v: number) => void;
}) {
  const id = createUniqueId();
  const scale = () => props.scale ?? 1;
  const position = () =>
    props.options
      ? props.options.reduce(
          (best, value, i, values) =>
            Math.abs(value - props.value) < Math.abs(values[best]! - props.value) ? i : best,
          0,
        )
      : props.value;
  return (
    <div class="slider">
      <div class="slider-label">
        <span>
          <label for={id}>{props.label}</label>
          <Help label={props.label} text={props.help} formula={props.formula} />
        </span>
        <span class="value-entry">
          <input
            id={id}
            aria-label={`${props.label} value`}
            type="number"
            min={props.min / scale()}
            max={props.max / scale()}
            step="any"
            value={Number((props.value / scale()).toFixed(6))}
            disabled={props.disabled}
            onInput={(e) => {
              if (Number.isFinite(e.currentTarget.valueAsNumber))
                props.onInput(e.currentTarget.valueAsNumber * scale());
            }}
            onBlur={(e) => {
              e.currentTarget.value = String(Number((props.value / scale()).toFixed(6)));
            }}
          />
          <Show when={props.unit}>
            <span>{props.unit}</span>
          </Show>
        </span>
      </div>
      <input
        aria-label={props.label}
        aria-valuetext={props.display}
        aria-valuemin={props.options ? props.min : undefined}
        aria-valuemax={props.options ? props.max : undefined}
        aria-valuenow={props.options ? props.value : undefined}
        aria-describedby={props.hint ? `${id}-hint` : undefined}
        type="range"
        min={props.options ? 0 : props.min}
        max={props.options ? props.options.length - 1 : props.max}
        step={props.options ? 1 : (props.step ?? 1)}
        value={position()}
        disabled={props.disabled || props.max <= props.min}
        onInput={(e) =>
          props.onInput(
            props.options ? props.options[+e.currentTarget.value]! : +e.currentTarget.value,
          )
        }
        onKeyDown={(e) => {
          if (!props.options) return;
          const forward = e.key === "ArrowRight" || e.key === "ArrowUp";
          const backward = e.key === "ArrowLeft" || e.key === "ArrowDown";
          if (!forward && !backward) return;
          e.preventDefault();
          const next = forward
            ? props.options.find((value) => value > props.value)
            : [...props.options].reverse().find((value) => value < props.value);
          if (next !== undefined) props.onInput(next);
        }}
      />
      <Show when={props.hint}>
        <span id={`${id}-hint`} class="slider-hint">
          {props.hint}
        </span>
      </Show>
    </div>
  );
}
