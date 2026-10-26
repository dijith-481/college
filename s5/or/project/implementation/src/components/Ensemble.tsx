import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { number, type Distribution } from "../types";
export default function Ensemble(props: { data: Distribution | undefined }) {
  let canvas: HTMLCanvasElement | undefined;
  const [view, setView] = createSignal({ zoom: 1, x: 0, y: 0 });
  let drag: { x: number; y: number; start: ReturnType<typeof view>; moved: boolean } | undefined;
  const clamp = (v: number, zoom: number) => Math.max(0, Math.min(1 - 1 / zoom, v));
  const move = (x: number, y: number) =>
    setView((v) => ({ ...v, x: clamp(x, v.zoom), y: clamp(y, v.zoom) }));
  const zoomBy = (factor: number) => {
    const v = view(),
      zoom = Math.max(1, Math.min(8, v.zoom * factor));
    setView({
      zoom,
      x: clamp(v.x + 0.5 / v.zoom - 0.5 / zoom, zoom),
      y: clamp(v.y + 0.5 / v.zoom - 0.5 / zoom, zoom),
    });
    setCell(undefined);
    setPinned(false);
  };
  const reset = () => {
    setView({ zoom: 1, x: 0, y: 0 });
    setPinned(false);
    setCell(undefined);
  };
  const [cell, setCell] = createSignal<{ count: number; x: number; y: number }>();
  const [pinned, setPinned] = createSignal(false);
  const draw = () => {
    if (!canvas) return;
    const width = canvas.clientWidth,
      height = canvas.clientHeight,
      ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    const left = 54,
      top = 25,
      w = width - 78,
      h = height - 78;
    ctx.font = "11px system-ui";
    ctx.textAlign = "right";
    ctx.strokeStyle = "#dbe4e9";
    ctx.fillStyle = "#526575";
    const data = props.data,
      maxX = data?.max_wait ?? 32,
      maxY = data?.max_backlog ?? 16,
      v = view();
    for (let i = 0; i <= 4; i++) {
      const y = top + h - (i * h) / 4;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + w, y);
      ctx.stroke();
      ctx.fillText(
        number(maxY * (v.y + i / (4 * v.zoom)), maxY / v.zoom < 8 ? 1 : 0),
        left - 10,
        y + 4,
      );
      ctx.textAlign = "center";
      ctx.fillText(
        number(maxX * (v.x + i / (4 * v.zoom)), maxX / v.zoom < 8 ? 1 : 0),
        left + (i * w) / 4,
        top + h + 21,
      );
      ctx.textAlign = "right";
    }
    ctx.textAlign = "left";
    ctx.fillText("Vehicles still waiting at the end", left, 14);
    ctx.textAlign = "right";
    ctx.fillText("Accumulated waiting per arrival · seconds", left + w, height - 5);
    if (data) {
      const max = Math.max(1, ...data.counts);
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, w, h);
      ctx.clip();
      for (let row = 0; row < data.rows; row++) {
        for (let col = 0; col < data.columns; col++) {
          const count = data.counts[row * data.columns + col]!;
          if (!count) continue;
          const x = left + ((col + 0.5) / data.columns - v.x) * w * v.zoom,
            y = top + h - ((row + 0.5) / data.rows - v.y) * h * v.zoom;
          const strength = Math.log1p(count) / Math.log1p(max);
          ctx.beginPath();
          ctx.arc(x, y, 2.4 + strength * 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,112,98,${0.28 + 0.65 * strength})`;
          ctx.fill();
        }
      }
      ctx.restore();
    }
  };
  createEffect(draw);
  onMount(() => {
    if (!canvas) return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    onCleanup(() => observer.disconnect());
    draw();
  });
  const inspect = (event: MouseEvent) => {
    if (pinned()) return;
    const data = props.data;
    if (!data || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(
      (view().x + (event.clientX - rect.left - 54) / (rect.width - 78) / view().zoom) *
        data.columns,
    );
    const row = Math.floor(
      (view().y +
        (rect.height - 53 - (event.clientY - rect.top)) / (rect.height - 78) / view().zoom) *
        data.rows,
    );
    if (
      event.clientX >= rect.left + 54 &&
      event.clientX <= rect.right - 24 &&
      event.clientY >= rect.top + 25 &&
      event.clientY <= rect.bottom - 53 &&
      col >= 0 &&
      col < data.columns &&
      row >= 0 &&
      row < data.rows
    )
      setCell({ count: data.counts[row * data.columns + col]!, x: col, y: row });
    else setCell(undefined);
  };
  return (
    <div class="ensemble">
      <div class="ensemble-toolbar">
        <span>
          <b>{number(props.data?.total ?? 0)}</b> outcomes represented · larger dots mean more
          outcomes
        </span>
        <div class="ensemble-navigation" role="group" aria-label="Graph view">
          <button onClick={() => zoomBy(0.5)} disabled={view().zoom === 1} aria-label="Zoom out">
            −
          </button>
          <output aria-label="Graph zoom">{number(view().zoom)}×</output>
          <button onClick={() => zoomBy(2)} disabled={view().zoom === 8} aria-label="Zoom in">
            +
          </button>
          <button onClick={reset}>Fit all</button>
        </div>
      </div>
      <div class="ensemble-stage">
        <canvas
          ref={(element) => {
            canvas = element;
          }}
          role="img"
          tabindex="0"
          classList={{ "is-zoomed": view().zoom > 1 }}
          aria-label={`Outcome density for ${props.data?.total ?? 0} simulation outcomes: waiting per arrival against remaining queue`}
          onPointerDown={(e) => {
            if (e.pointerType === "touch" || e.button !== 0) return;
            drag = { x: e.clientX, y: e.clientY, start: view(), moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag && view().zoom > 1 && canvas) {
              const dx = e.clientX - drag.x,
                dy = e.clientY - drag.y;
              if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
              move(
                drag.start.x - dx / (canvas.clientWidth - 78) / drag.start.zoom,
                drag.start.y + dy / (canvas.clientHeight - 78) / drag.start.zoom,
              );
              setCell(undefined);
              setPinned(false);
            } else inspect(e);
          }}
          onPointerUp={(e) => {
            if (!drag?.moved) {
              inspect(e);
              if (cell()) setPinned((v) => !v);
            }
            drag = undefined;
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            drag = undefined;
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setPinned(false);
              setCell(undefined);
            }
            if (e.key === "Home") {
              e.preventDefault();
              reset();
            }
            if (
              view().zoom > 1 &&
              ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
            ) {
              e.preventDefault();
              const v = view(),
                step = 0.15 / v.zoom;
              move(
                v.x + (e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0),
                v.y + (e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0),
              );
              setCell(undefined);
              setPinned(false);
            }
          }}
          onMouseLeave={() => {
            if (!pinned()) setCell(undefined);
          }}
        />
        <Show when={cell()}>
          <div class="density-tip">
            <b>{number(cell()!.count)} outcomes</b>
            <span>
              {number((cell()!.x / (props.data?.columns ?? 64)) * (props.data?.max_wait ?? 32), 1)}–
              {number(
                ((cell()!.x + 1) / (props.data?.columns ?? 64)) * (props.data?.max_wait ?? 32),
                1,
              )}{" "}
              seconds / arrival
            </span>
            <span>
              {number((cell()!.y / (props.data?.rows ?? 40)) * (props.data?.max_backlog ?? 16), 1)}–
              {number(
                ((cell()!.y + 1) / (props.data?.rows ?? 40)) * (props.data?.max_backlog ?? 16),
                1,
              )}{" "}
              vehicles remaining
            </span>
            <small>{pinned() ? "Pinned · click again to release" : "Click to pin"}</small>
          </div>
        </Show>
        <Show when={!props.data?.total}>
          <div class="empty-ensemble">
            Each completed replication will appear here.
            <small>Every result contributes, even in a million-run experiment.</small>
          </div>
        </Show>
      </div>
      <p class="chart-caption">
        Each dot is a density cell, not a vehicle. Every outcome in this view contributes exactly
        once. Hover for counts. Scroll to move the page; use + / − to zoom and drag to pan.
      </p>
    </div>
  );
}
