"use client";
import { perpetualMarkets } from "@/domain/trading";
import { AssetIcon } from "./ui";

/** One entry per asset, from the USDC markets. */
const tickers = perpetualMarkets
  .filter((m) => m.quote === "USDC")
  .map((m) => ({ symbol: m.base, price: m.price, change: m.change }));

const priceText = (price: number) => {
  const digits = price >= 1000 ? 0 : price >= 1 ? 2 : 4;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};
const changeText = (change: number) => `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change).toFixed(2)}%`;

function Items({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="price-ticker-list" aria-hidden={hidden || undefined}>
      {tickers.map((t) => (
        <li key={t.symbol}>
          <AssetIcon symbol={t.symbol} size={15} />
          <strong>{t.symbol}</strong>
          <span className="price-ticker-price">{priceText(t.price)}</span>
          <span className={`price-ticker-change ${t.change < 0 ? "negative" : "positive"}`}>{changeText(t.change)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Scrolling price strip under the top bar. Values come from the static market list, not a live feed. */
export function PriceTicker() {
  return (
    <section className="price-ticker" aria-label="Token prices and 24 hour change">
      <div className="price-ticker-track">
        <div className="price-ticker-run">
          <Items />
          <Items hidden />
        </div>
      </div>
    </section>
  );
}
