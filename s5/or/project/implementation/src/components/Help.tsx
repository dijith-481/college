import { createSignal, createUniqueId, Show } from "solid-js";
import { Portal } from "solid-js/web";
export default function Help(props: { label: string; text: string; formula?: string }) {
  const id = createUniqueId(),
    [hover, setHover] = createSignal(false),
    [focus, setFocus] = createSignal(false),
    [pinned, setPinned] = createSignal(false),
    [position, setPosition] = createSignal({ left: "12px", top: "12px" });
  const open = () => hover() || focus() || pinned();
  const locate = (button: HTMLButtonElement) => {
    const r = button.getBoundingClientRect();
    setPosition({
      left: `${Math.max(12, Math.min(window.innerWidth - 324, r.left - 130))}px`,
      top: `${Math.max(12, r.bottom + 245 > window.innerHeight ? r.top - 240 : r.bottom + 10)}px`,
    });
  };
  return (
    <span class="help">
      <button
        type="button"
        class="help-button"
        aria-label={`Explain ${props.label}`}
        aria-describedby={open() ? id : undefined}
        aria-expanded={open()}
        onMouseEnter={(e) => {
          locate(e.currentTarget);
          setHover(true);
        }}
        onMouseLeave={() => setHover(false)}
        onFocus={(e) => {
          locate(e.currentTarget);
          setFocus(true);
        }}
        onBlur={() => setFocus(false)}
        onClick={(e) => {
          e.preventDefault();
          locate(e.currentTarget);
          setPinned((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setPinned(false);
            setHover(false);
            setFocus(false);
            e.currentTarget.blur();
          }
        }}
      >
        ?
      </button>
      <Show when={open()}>
        <Portal>
          <span id={id} role="tooltip" class="help-content" style={position()}>
            <b>{props.label}</b>
            <span>{props.text}</span>
            <Show when={props.formula}>
              <code>{props.formula}</code>
            </Show>
            <Show when={pinned()}>
              <button
                aria-label="Close explanation"
                onClick={() => {
                  setPinned(false);
                  setFocus(false);
                  setHover(false);
                }}
              >
                Close ×
              </button>
            </Show>
          </span>
        </Portal>
      </Show>
    </span>
  );
}
