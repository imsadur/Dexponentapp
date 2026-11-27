"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Crosshair, SlidersHorizontal } from "@phosphor-icons/react";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const timeframeSeconds: Record<string, number> = {
  "1M": 60,
  "5M": 300,
  "15M": 900,
  "30M": 1_800,
  "1H": 3_600,
  "4H": 14_400,
  "1D": 86_400,
};

function candleData(points: number[], timeframe: string): Candle[] {
  const step = timeframeSeconds[timeframe] || 3_600;
  const end = Math.floor(Date.UTC(2026, 8, 29, 10, 0) / 1000 / step) * step;
  return points.slice(-72).map((close, index, values) => {
    const open = index ? values[index - 1] : close * 0.998;
    const spread = close * (0.0015 + ((index * 7) % 5) * 0.00028);
    return {
      time: (end - (values.length - 1 - index) * step) as UTCTimestamp,
      open,
      high: Math.max(open, close) + spread,
      low: Math.min(open, close) - spread * 0.84,
      close,
      volume: 180 + ((index * 193) % 1_260),
    };
  });
}

export function PerpTradingChart({
  points,
  pair,
  timeframe,
  precision,
  onTimeframeChange,
}: {
  points: number[];
  pair: string;
  timeframe: string;
  precision: number;
  onTimeframeChange: (timeframe: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const candles = useMemo(() => candleData(points, timeframe), [points, timeframe]);
  const [active, setActive] = useState(candles.at(-1)!);
  const [view, setView] = useState<"chart" | "overview" | "data">("chart");
  const price = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  useEffect(() => {
    setActive(candles.at(-1)!);
  }, [candles]);

  useEffect(() => {
    if (view !== "chart" || !container.current || !candles.length) return;
    const styles = getComputedStyle(document.documentElement);
    const text = styles.getPropertyValue("--text-muted").trim() || "#85858f";
    const border = styles.getPropertyValue("--border-soft").trim() || "#292932";
    const surface = styles.getPropertyValue("--surface").trim() || "#151519";
    const down = styles.getPropertyValue("--danger").trim() || "#ff5f4f";
    let chart: IChartApi | undefined;
    let candleSeries: ISeriesApi<"Candlestick"> | undefined;

    chart = createChart(container.current, {
      autoSize: true,
      height: 415,
      layout: {
        background: { type: ColorType.Solid, color: surface },
        textColor: text,
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: border, style: 1 },
        horzLines: { color: border, style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#777a8c", width: 1, style: 2, labelBackgroundColor: "#30323b" },
        horzLine: { color: "#777a8c", width: 1, style: 2, labelBackgroundColor: "#30323b" },
      },
      rightPriceScale: {
        borderColor: border,
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: border,
        timeVisible: timeframe !== "1D",
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: timeframe === "1M" ? 6 : 8,
        minBarSpacing: 3,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });

    candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#52d3a2",
      downColor: down,
      borderUpColor: "#52d3a2",
      borderDownColor: down,
      wickUpColor: "#7fe2bb",
      wickDownColor: down,
      priceLineColor: "#8b8dff",
      priceLineWidth: 1,
      lastValueVisible: true,
      priceFormat: { type: "price", precision, minMove: 10 ** -precision },
    });
    candleSeries.setData(candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeSeries.setData(candles.map((candle) => ({
      time: candle.time,
      value: candle.volume,
      color: candle.close >= candle.open ? "rgba(82,211,162,.28)" : "rgba(199,27,0,.3)",
    })));

    const averageSeries = chart.addSeries(LineSeries, {
      color: "#e2b96b",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    averageSeries.setData(candles.slice(8).map((candle, index) => ({
      time: candle.time,
      value: candles.slice(index, index + 9).reduce((sum, item) => sum + item.close, 0) / 9,
    })));

    chart.timeScale().fitContent();
    chart.subscribeCrosshairMove((param) => {
      if (!candleSeries) return;
      const point = param.seriesData.get(candleSeries);
      if (point && "close" in point) {
        const candle = candles.find((item) => item.time === point.time);
        if (candle) setActive(candle);
      } else setActive(candles.at(-1)!);
    });
    return () => chart?.remove();
  }, [candles, precision, timeframe, view]);

  const change = ((active.close - active.open) / active.open) * 100;

  return (
    <div className="perp-tv-chart">
      <div className="perp-chart-tabs">
        <div>
          <button className={view === "chart" ? "active" : ""} onClick={() => setView("chart")}>Chart</button>
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>Overview</button>
          <button className={view === "data" ? "active" : ""} onClick={() => setView("data")}>Data</button>
        </div>
      </div>
      <div className="perp-chart-controls">
        <div className="perp-chart-timeframes">
          {["1M", "5M", "15M", "30M", "1H", "4H", "1D"].map((item) => (
            <button key={item} className={timeframe === item ? "active" : ""} onClick={() => onTimeframeChange(item)}>{item.toLowerCase()}</button>
          ))}
        </div>
        <div className="perp-chart-tools"><Crosshair size={15} /><SlidersHorizontal size={15} /><span>Last traded price</span></div>
      </div>
      {view === "chart" ? (
        <>
          <div className="perp-chart-legend" aria-live="polite">
            <span>{pair} Perpetual · {timeframe}</span>
            <div>
              <span>O <strong>{price(active.open)}</strong></span>
              <span>H <strong>{price(active.high)}</strong></span>
              <span>L <strong>{price(active.low)}</strong></span>
              <span>C <strong>{price(active.close)}</strong></span>
              <b className={change >= 0 ? "positive" : "warning-text"}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</b>
            </div>
            <small>MA 9 <strong>{price(candles.slice(-9).reduce((sum, candle) => sum + candle.close, 0) / 9)}</strong></small>
          </div>
          <div ref={container} className="perp-chart-canvas" aria-label={`${pair} TradingView candlestick chart with volume and moving average`} />
        </>
      ) : view === "overview" ? (
        <div className="perp-chart-overview">
          <article><span>Period high</span><strong>{price(Math.max(...candles.map((candle) => candle.high)))}</strong><small>{pair.split("/")[1]}</small></article>
          <article><span>Period low</span><strong>{price(Math.min(...candles.map((candle) => candle.low)))}</strong><small>{pair.split("/")[1]}</small></article>
          <article><span>Average volume</span><strong>{Math.round(candles.reduce((sum, candle) => sum + candle.volume, 0) / candles.length).toLocaleString()}</strong><small>Simulated contracts</small></article>
          <article><span>Bars loaded</span><strong>{candles.length}</strong><small>{timeframe} candles</small></article>
        </div>
      ) : (
        <div className="perp-chart-data-wrap">
          <table className="perp-chart-data"><thead><tr><th>Time</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th></tr></thead><tbody>
            {candles.slice(-9).toReversed().map((candle) => <tr key={candle.time}><td>{new Date(Number(candle.time) * 1000).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td><td>{price(candle.open)}</td><td>{price(candle.high)}</td><td>{price(candle.low)}</td><td className={candle.close >= candle.open ? "positive" : "warning-text"}>{price(candle.close)}</td><td>{candle.volume.toLocaleString()}</td></tr>)}
          </tbody></table>
        </div>
      )}
      <div className="perp-chart-footer"><span>Volume</span><span>UTC · % · log · auto</span></div>
    </div>
  );
}
