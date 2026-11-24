"use client";
import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
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
  label,
  target,
  onHover,
}: {
  points: SeriesPoint[];
  tone: "up" | "down";
  format: (value: number) => string;
  intraday: boolean;
  label: string;
  /** Dashed reference line (e.g. target pace), labelled at its right end. */
  target?: { points: SeriesPoint[]; label: string };
  onHover: (point: SeriesPoint | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
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
    const secondary = token("--text-secondary", "#a1a1aa");
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
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: muted, labelVisible: false, style: LineStyle.Dashed },
        horzLine: { visible: false, labelVisible: false },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.14, bottom: 0.1 } },
      timeScale: { borderVisible: true, borderColor: border, timeVisible: intraday, secondsVisible: false, fixLeftEdge: true, fixRightEdge: true },
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
    const toData = (list: SeriesPoint[]) => list.map((p) => ({ time: Math.floor(p.time / 1000) as UTCTimestamp, value: p.value }));
    const data = toData(points);
    series.setData(data);
    const last = data[data.length - 1];
    createSeriesMarkers(series, [{ time: last.time, position: "atPriceMiddle", price: last.value, shape: "circle", color: line, size: 1 }]);

    // The solid baseline is the time axis border; the only other line is the dashed target.
    let reference: ReturnType<typeof chart.addSeries> | null = null;
    if (target?.points.length) {
      reference = chart.addSeries(LineSeries, {
        color: alpha(secondary, 0.75),
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      reference.setData(toData(target.points));
    }
    chart.timeScale().fitContent();

    const placeTag = () => {
      const node = tag.current;
      if (!node) return;
      const end = target?.points.at(-1);
      const y = end && reference ? reference.priceToCoordinate(end.value) : null;
      if (y === null || y === undefined) {
        node.style.display = "none";
        return;
      }
      node.style.display = "";
      node.style.top = `${y}px`;
      node.style.right = `${chart.priceScale("right").width() + 6}px`;
    };
    const frame = requestAnimationFrame(placeTag);
    const resize = new ResizeObserver(() => requestAnimationFrame(placeTag));
    resize.observe(el);
    chart.subscribeCrosshairMove((param) => {
      const data = param.seriesData.get(series);
      hover.current(data && "value" in data && param.time ? { time: Number(param.time) * 1000, value: data.value } : null);
    });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      chart.remove();
    };
  }, [points, tone, intraday, theme, target]);

  return (
    <div className="dtfd-chart-wrap">
      <div ref={container} className="dtfd-chart-canvas" role="img" aria-label={target ? `${label}. ${target.label}` : label} />
      {target && <span ref={tag} className="dtfd-chart-tag" aria-hidden="true">{target.label}</span>}
    </div>
  );
}
