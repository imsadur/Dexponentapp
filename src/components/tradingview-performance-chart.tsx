"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

type ChartPoint = { time: UTCTimestamp; value: number };

function chartData(points: number[], days: number): ChartPoint[] {
  const end = Date.UTC(2026, 8, 18) / 1000;
  const step = Math.max(1, Math.round(days / Math.max(1, points.length - 1))) * 86_400;
  return points.map((value, index) => ({
    time: (end - (points.length - 1 - index) * step) as UTCTimestamp,
    value,
  }));
}

export function TradingViewPerformanceChart({
  points,
  days,
}: {
  points: number[];
  days: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(points.at(-1) || 0);
  const start = points[0] || 0;
  const change = start ? ((hovered / start) - 1) * 100 : 0;

  useEffect(() => {
    if (!container.current) return;
    const styles = getComputedStyle(document.documentElement);
    const text = styles.getPropertyValue("--text-muted").trim() || "#85858f";
    const border = styles.getPropertyValue("--border").trim() || "#292932";
    const surface = styles.getPropertyValue("--surface").trim() || "#151519";
    let chart: IChartApi | undefined;
    let series: ISeriesApi<"Area"> | undefined;

    chart = createChart(container.current, {
      autoSize: true,
      height: 290,
      layout: {
        background: { type: ColorType.Solid, color: surface },
        textColor: text,
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: border, style: 2 },
        horzLines: { color: border, style: 2 },
      },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: {
        borderColor: border,
        scaleMargins: { top: 0.14, bottom: 0.12 },
      },
      timeScale: {
        borderColor: border,
        timeVisible: days <= 30,
        secondsVisible: false,
        rightOffset: 1,
        barSpacing: days >= 365 ? 5 : 9,
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });
    series = chart.addSeries(AreaSeries, {
      lineColor: "#8b8dff",
      topColor: "rgba(139, 141, 255, .28)",
      bottomColor: "rgba(139, 141, 255, .015)",
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: "#111116",
      crosshairMarkerBackgroundColor: "#a5a7ff",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    series.setData(chartData(points, days));
    chart.timeScale().fitContent();
    chart.subscribeCrosshairMove((param) => {
      if (!series) return;
      const point = param.seriesData.get(series);
      if (point && "value" in point) setHovered(point.value);
      else setHovered(points.at(-1) || 0);
    });
    return () => chart?.remove();
  }, [days, points]);

  return (
    <div className="tv-performance-chart">
      <div className="tv-chart-legend" aria-live="polite">
        <span>Simulated portfolio value</span>
        <strong>${hovered.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
        <small className={change >= 0 ? "positive" : "negative"}>
          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
        </small>
      </div>
      <div ref={container} className="tv-chart-canvas" aria-label="Interactive performance history chart" />
    </div>
  );
}
