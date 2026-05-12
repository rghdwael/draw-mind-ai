import React, { useEffect, useRef } from "react";
import type { DrawPath, DrawingAreaProps, Point, Tool } from "./DrawingArea";

// ── helpers ───────────────────────────────────────────────────────────────────
function toolWidth(tool: Tool)            { return tool === "brush" ? 10 : tool === "eraser" ? 28 : 4; }
function toolColor(tool: Tool, c: string) { return tool === "eraser" ? "#FFFFFF" : c; }

function renderPath(ctx: CanvasRenderingContext2D, pts: Point[], color: string, width: number) {
  if (pts.length === 0) return;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All committed strokes live here — purely in a ref, never in React state
  const committedRef = useRef<DrawPath[]>([]);
  const liveRef      = useRef<Point[]>([]);   // points of the in-progress stroke
  const isDrawing    = useRef(false);
  const toolRef      = useRef<Tool>(activeTool);
  const colorRef     = useRef(selectedColor);
  const rafRef       = useRef(0);

  useEffect(() => { toolRef.current  = activeTool;    }, [activeTool]);
  useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);

  // ── Bootstrap: size canvas + start RAF render loop ───────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set the canvas's intrinsic pixel size to match its CSS rendered size.
    // ResizeObserver handles the initial layout and any future container resizes.
    function syncSize() {
      const w = Math.round(canvas!.offsetWidth);
      const h = Math.round(canvas!.offsetHeight);
      if (w > 0 && h > 0 && (canvas!.width !== w || canvas!.height !== h)) {
        canvas!.width  = w;
        canvas!.height = h;
        // canvas is cleared by the width assignment — the RAF loop redraws it
      }
    }
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    syncSize();

    // RAF loop — single source of visual truth.
    // Draws ALL committed paths PLUS the live in-progress stroke every frame.
    // Completely independent of React state; reads only refs.
    function render() {
      const ctx = canvas!.getContext("2d");
      if (ctx && canvas!.width > 0 && canvas!.height > 0) {
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);

        // Draw every saved stroke
        for (const p of committedRef.current) {
          renderPath(ctx, p.points, p.color, p.width);
        }

        // Draw the stroke currently being drawn
        if (liveRef.current.length > 1) {
          renderPath(
            ctx,
            liveRef.current,
            toolColor(toolRef.current, colorRef.current),
            toolWidth(toolRef.current),
          );
        }
      }
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  // ── Sync: detect Clear button (paths resets to []) ───────────────────────
  useEffect(() => {
    if (paths.length === 0) {
      committedRef.current = [];
      liveRef.current      = [];
    }
  }, [paths.length]);

  // ── Pointer coordinate helper ─────────────────────────────────────────────
  function getPos(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    // Scale CSS pixels → canvas pixels (handles devicePixelRatio / zoom)
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top)  * sy,
    };
  }

  // ── Pointer handlers ──────────────────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawing.current  = true;
    liveRef.current    = [getPos(e)];
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    liveRef.current.push(getPos(e));   // mutate in place — RAF reads it next frame
  }

  function handlePointerUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (liveRef.current.length > 0) {
      const stroke: DrawPath = {
        points:   [...liveRef.current],
        color:    toolColor(toolRef.current, colorRef.current),
        width:    toolWidth(toolRef.current),
        isEraser: toolRef.current === "eraser",
      };

      // Add to local persistent ref FIRST so RAF renders it immediately
      committedRef.current = [...committedRef.current, stroke];
      liveRef.current      = [];

      // Then notify parent (for analysis/save) — async React state update is fine
      onStrokeComplete(stroke);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        display:     "block",
        width:       "100%",
        height:      "100%",
        touchAction: "none",
        cursor:      activeTool === "eraser" ? "cell" : "crosshair",
      }}
    />
  );
}
