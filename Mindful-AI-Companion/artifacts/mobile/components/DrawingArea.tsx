import React, { useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface Point    { x: number; y: number }
export interface DrawPath { points: Point[]; color: string; width: number; isEraser: boolean }
export type Tool = "pencil" | "brush" | "eraser";

export interface DrawingAreaProps {
  paths: DrawPath[];
  activeTool: Tool;
  selectedColor: string;
  onStrokeComplete: (stroke: DrawPath) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  /** Called once on mount with a function that returns a PNG data URI snapshot */
  onCanvasReady?: (getSnapshot: () => string | null) => void;
}

function toolWidth(tool: Tool)            { return tool === "brush" ? 10 : tool === "eraser" ? 28 : 4; }
function toolColor(tool: Tool, c: string) { return tool === "eraser" ? "#FFFFFF" : c; }

function toSvgD(pts: Point[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
}

export function DrawingArea({ paths, activeTool, selectedColor, onStrokeComplete }: DrawingAreaProps) {
  const [livePoints, setLivePoints] = useState<Point[]>([]);

  const currentRef   = useRef<Point[]>([]);
  const toolRef      = useRef<Tool>("pencil");
  const colorRef     = useRef("#4A3070");

  React.useEffect(() => { toolRef.current  = activeTool;    }, [activeTool]);
  React.useEffect(() => { colorRef.current = selectedColor; }, [selectedColor]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      onPanResponderGrant: (e) => {
        const pt = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        currentRef.current = [pt];
        setLivePoints([pt]);
      },
      onPanResponderMove: (e) => {
        const pt = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        currentRef.current = [...currentRef.current, pt];
        setLivePoints((p) => [...p, pt]);
      },
      onPanResponderRelease: () => {
        if (currentRef.current.length > 0) {
          onStrokeComplete({
            points:   [...currentRef.current],
            color:    toolColor(toolRef.current, colorRef.current),
            width:    toolWidth(toolRef.current),
            isEraser: toolRef.current === "eraser",
          });
          currentRef.current = [];
          setLivePoints([]);
        }
      },
      onPanResponderTerminate: () => {
        currentRef.current = [];
        setLivePoints([]);
      },
    })
  ).current;

  const liveColor = toolColor(activeTool, selectedColor);
  const liveWidth = toolWidth(activeTool);

  return (
    <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((p, i) => (
            <Path
              key={i}
              d={toSvgD(p.points)}
              stroke={p.color}
              strokeWidth={p.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {livePoints.length > 1 && (
            <Path
              d={toSvgD(livePoints)}
              stroke={liveColor}
              strokeWidth={liveWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
    </View>
  );
}
