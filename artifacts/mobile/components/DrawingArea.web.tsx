import React, { useEffect, useRef } from "react";
import type { DrawPath, DrawingAreaProps, Point, Tool } from "./DrawingArea";

// ── tiny helpers ──────────────────────────────────────────────────────────────
function tw(t: Tool) { return t === "brush" ? 10 : t === "eraser" ? 28 : 4; }
function tc(t: Tool, c: string) { return t === "eraser" ? "#FFFFFF" : c; }

function paint(ctx: CanvasRenderingContext2D, pts: Point[], color: string, width: number) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = width;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  if (pts.length === 1) {
    ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

// ── component ─────────────────────────────────────────────────────────────────
export function DrawingArea({ paths, activeTool, selectedColor, onStrokeComplete }: DrawingAreaProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  // All rendering state lives in refs — completely outside React's render cycle
  const committed    = useRef<DrawPath[]>([]);   // every finished stroke
  const live         = useRef<Point[]>([]);       // points being drawn right now
  const drawing      = useRef(false);
  const toolRef      = useRef<Tool>(activeTool);
  const colorRef     = useRef(selectedColor);
  const rafId        = useRef(0);
  const prevLenRef   = useRef(0);                 // track paths.length across renders

  // Keep tool/color refs in sync with props
  useEffect(() => { toolRef.current  = activeTool;    }, [activeTool]);
  useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);

  // ── One-time setup: size canvas then start RAF loop ───────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size the canvas intrinsic pixels to its CSS rendered size.
    // We do this ONCE and never again — resetting canvas.width clears all pixels.
    function size() {
      const w = Math.round(canvas!.offsetWidth);
      const h = Math.round(canvas!.offsetHeight);
      if (w > 0 && h > 0) {
        canvas!.width  = w;
        canvas!.height = h;
        ro.disconnect();          // disconnect immediately — we never want another resize
      }
    }
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();                       // try immediately in case already laid out

    // RAF loop — the one and only place pixels are written to screen.
    // Clears the canvas then redraws ALL committed strokes + current live stroke.
    // Reads only refs so it is immune to React re-render timing.
    function loop() {
      const ctx = canvas!.getContext("2d");
      if (ctx && canvas!.width > 0 && canvas!.height > 0) {
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        for (const p of committed.current) paint(ctx, p.points, p.color, p.width);
        if (live.current.length > 1) paint(ctx, live.current, tc(toolRef.current, colorRef.current), tw(toolRef.current));
      }
      rafId.current = requestAnimationFrame(loop);
    }
    rafId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId.current);
      ro.disconnect();
    };
  }, []); // runs once on mount

  // ── Detect Clear button: paths.length drops from >0 → 0 ──────────────────
  // Guard with prevLenRef so mounting with paths=[] does NOT wipe committed.
  useEffect(() => {
    const prev = prevLenRef.current;
    prevLenRef.current = paths.length;

    if (paths.length === 0 && prev > 0) {
      // User pressed Clear — wipe both the ref and the live stroke
      committed.current = [];
      live.current      = [];
    }
  });  // intentionally no dep array — runs after every render, compares prev vs current

  // ── Pointer coordinate helper (CSS px → canvas px) ───────────────────────
  function pos(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const c    = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (c.width  / rect.width),
      y: (e.clientY - rect.top)  * (c.height / rect.height),
    };
  }

  // ── Pointer handlers ──────────────────────────────────────────────────────
  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    live.current    = [pos(e)];
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    live.current.push(pos(e));   // mutate in place — RAF reads it next frame
  }

  function onUp() {
    if (!drawing.current) return;
    drawing.current = false;

    if (live.current.length > 0) {
      const stroke: DrawPath = {
        points:   [...live.current],
        color:    tc(toolRef.current, colorRef.current),
        width:    tw(toolRef.current),
        isEraser: toolRef.current === "eraser",
      };
      // Commit the stroke to our persistent ref FIRST — visible on next RAF frame
      committed.current = [...committed.current, stroke];
      live.current      = [];

      // Notify parent (async React state update — irrelevant to our rendering)
      onStrokeComplete(stroke);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      style={{
        display:     "block",
        width:       "100%",
        height:      "100%",
        touchAction: "none",
        outline:     "none",     // prevent focus ring from causing layout shifts
        cursor:      activeTool === "eraser" ? "cell" : "crosshair",
      }}
    />
  );
}
