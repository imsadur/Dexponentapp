"use client";
import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";
import type { SeriesPoint } from "@/domain/dtf";
import { useApp } from "./provider";

function alpha(color: string, amount: number) {
  const hex = color.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return color;
  const n = parseInt(hex, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${amount})`;
}

/** Area chart for DTF history. Reports the hovered point so the page headline can follow it. */
export function DtfChart({
  points,
  tone,
  format,
  intraday,
  zeroLine,
  label,
  onHover,
}: {
  points: SeriesPoint[];
  tone: "up" | "down";
  format: (value: number) => string;
  intraday: boolean;
  zeroLine?: boolean;
  label: string;
  onHover: (point: SeriesPoint | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useApp();
  const hover = useRef(onHover);
  const formatter = useRef(format);
  useEffect(() => {
    hover.current = onHover;
    formatter.current = format;
  });

  useEffect(() => {
    const el = container.current;
    if (!el || !points.length) return;
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const line = tone === "up" ? token("--success", "#3dc486") : token("--danger", "#e8a293");
    const muted = token("--text-muted", "#71717a");
    const border = token("--border", "#27272a");
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: muted,
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: border, style: LineStyle.Dotted } },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: muted, labelVisible: false, style: LineStyle.Dashed },
        horzLine: { visible: false, labelVisible: false },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderVisible: false, timeVisible: intraday, secondsVisible: false, fixLeftEdge: true, fixRightEdge: true },
      localization: { priceFormatter: (value: number) => formatter.current(value) },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: line,
      topColor: alpha(line, 0.26),
      bottomColor: alpha(line, 0.02),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: line,
      crosshairMarkerBackgroundColor: line,
    });
    series.setData(points.map((p) => ({ time: Math.floor(p.time / 1000) as UTCTimestamp, value: p.value })));
    if (zeroLine) series.createPriceLine({ price: 0, color: muted, lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: "" });
    chart.timeScale().fitContent();
    chart.subscribeCrosshairMove((param) => {
      const data = param.seriesData.get(series);
      hover.current(data && "value" in data && param.time ? { time: Number(param.time) * 1000, value: data.value } : null);
    });
    return () => chart.remove();
  }, [points, tone, intraday, zeroLine, theme]);

  return <div ref={container} className="dtfd-chart-canvas" role="img" aria-label={label} />;
}
