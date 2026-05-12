import React, { useEffect, useRef } from "react";
import type { DrawPath, DrawingAreaProps, Point, Tool } from "./DrawingArea";

function toolWidth(tool: Tool)            { return tool === "brush" ? 10 : tool === "eraser" ? 28 : 4; }
function toolColor(tool: Tool, c: string) { return tool === "eraser" ? "#FFFFFF" : c; }

export function DrawingArea({ paths, activeTool, selectedColor, onStrokeComplete }: DrawingAreaProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const isDrawing       = useRef(false);
  const currentPts      = useRef<Point[]>([]);
  const toolRef         = useRef<Tool>(activeTool);
  const colorRef        = useRef(selectedColor);
  const prevLenRef      = useRef(0);

  useEffect(() => { toolRef.current  = activeTool;    }, [activeTool]);
  useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);

  // ── Size the canvas once, as soon as the container has a non-zero layout ──
  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    let sized = false;

    function trySize() {
      if (sized) return;
      const { width, height } = container!.getBoundingClientRect();
      if (width > 0 && height > 0) {
        canvas!.width  = width;
        canvas!.height = height;
        sized = true;
        ro.disconnect();
      }
    }

    const ro = new ResizeObserver(trySize);
    ro.observe(container);
    trySize();
    return () => ro.disconnect();
  }, []);

  // ── Only react to path LENGTH changes ──────────────────────────────────────
  // Incrementally-drawn pixels live on the canvas permanently.
  // The ONLY time we touch the canvas here is when paths resets to 0
  // (the user pressed Clear), in which case we clear the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    if (paths.length === 0 && prevLenRef.current > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    prevLenRef.current = paths.length;
  }, [paths.length]);

  // ── Pointer helpers ────────────────────────────────────────────────────────
  function getPos(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const pt = getPos(e);
    currentPts.current = [pt];

    // Draw the starting dot so single taps are visible
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.fillStyle = toolColor(toolRef.current, colorRef.current);
    ctx.arc(pt.x, pt.y, toolWidth(toolRef.current) / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const pt   = getPos(e);
    const prev = currentPts.current[currentPts.current.length - 1];
    currentPts.current.push(pt);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !prev) return;

    // Draw the new segment directly on the persistent canvas
    ctx.beginPath();
    ctx.strokeStyle = toolColor(toolRef.current, colorRef.current);
    ctx.lineWidth   = toolWidth(toolRef.current);
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }

  function handlePointerUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentPts.current.length > 0) {
      // Pixels are already on the canvas — do NOT clear or redraw.
      // Just notify the parent so it can track paths for analysis/save.
      onStrokeComplete({
        points:   [...currentPts.current],
        color:    toolColor(toolRef.current, colorRef.current),
        width:    toolWidth(toolRef.current),
        isEraser: toolRef.current === "eraser",
      });
      currentPts.current = [];
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
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
    </div>
  );
}
