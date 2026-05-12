import React, { useEffect, useRef } from "react";
import type { DrawPath, DrawingAreaProps, Point, Tool } from "./DrawingArea";

// ── helpers ───────────────────────────────────────────────────────────────────
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
export function DrawingArea({
  paths,
  activeTool,
  selectedColor,
  onStrokeComplete,
  canvasWidth,
  canvasHeight,
}: DrawingAreaProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // All state lives in refs — rendering is fully independent of React
  const committed  = useRef<DrawPath[]>([]);
  const live       = useRef<Point[]>([]);
  const drawing    = useRef(false);
  const toolRef    = useRef<Tool>(activeTool);
  const colorRef   = useRef(selectedColor);
  const rafId      = useRef(0);
  const prevLen    = useRef(0);

  useEffect(() => { toolRef.current  = activeTool;    }, [activeTool]);
  useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);

  // ── Apply explicit canvas dimensions when parent provides them ────────────
  // canvasWidth/canvasHeight come from React Native's onLayout, which always
  // returns correct pixel dimensions on both native and web.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasWidth || !canvasHeight) return;
    if (canvas.width === canvasWidth && canvas.height === canvasHeight) return;

    // Preserve existing drawing before resize (save → resize → restore)
    const ctx = canvas.getContext("2d");
    let saved: ImageData | null = null;
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      try { saved = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch { /* ignore */ }
    }
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;
    if (saved && ctx) ctx.putImageData(saved, 0, 0);
  }, [canvasWidth, canvasHeight]);

  // ── RAF render loop (single source of visual truth) ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function loop() {
      const ctx = canvas!.getContext("2d");
      if (ctx && canvas!.width > 0 && canvas!.height > 0) {
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        for (const p of committed.current) paint(ctx, p.points, p.color, p.width);
        if (live.current.length > 1) {
          paint(ctx, live.current, tc(toolRef.current, colorRef.current), tw(toolRef.current));
        }
      }
      rafId.current = requestAnimationFrame(loop);
    }
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, []); // runs once — reads only refs

  // ── Detect Clear (paths.length drops from >0 to 0) ───────────────────────
  useEffect(() => {
    const prev = prevLen.current;
    prevLen.current = paths.length;
    if (paths.length === 0 && prev > 0) {
      committed.current = [];
      live.current      = [];
    }
  }); // no dep array — runs after every render, prev guards against false clears

  // ── Pointer coordinate helper ─────────────────────────────────────────────
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
    live.current.push(pos(e));
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
      committed.current = [...committed.current, stroke];
      live.current      = [];
      onStrokeComplete(stroke);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth  ?? 300}
      height={canvasHeight ?? 150}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      style={{
        position:    "absolute",
        top:         0,
        left:        0,
        width:       canvasWidth  ? `${canvasWidth}px`  : "100%",
        height:      canvasHeight ? `${canvasHeight}px` : "100%",
        touchAction: "none",
        outline:     "none",
        cursor:      activeTool === "eraser" ? "cell" : "crosshair",
      }}
    />
  );
}
