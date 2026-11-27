"use client";
import { useCallback, useEffect, useState } from "react";
import { emptyPortfolio, parsePortfolio, portfolioKey, type DtfPortfolio } from "@/domain/dtf-portfolio";
import { useApp } from "./provider";

/** Positions belong to the wallet that made them, not to a sign-in. */
const walletKey = (address: string) => portfolioKey(`wallet:${address}`);

/**
 * The connected wallet's simulated DTF positions, synced across tabs. Depositing needs a
 * wallet only; signing in is never required. Positions saved under an account before this
 * change are carried over to the wallet the first time it connects in this browser.
 */
export function useDtfPortfolio() {
  const { wallet, session, ready } = useApp();
  const key = wallet ? walletKey(wallet) : null;
  const [portfolio, setPortfolio] = useState<DtfPortfolio>(emptyPortfolio);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!key) {
      setPortfolio(emptyPortfolio());
      setLoaded(true);
      return;
    }
    try {
      let raw = localStorage.getItem(key);
      if (!raw && session) {
        const legacy = localStorage.getItem(portfolioKey(session.identifier));
        if (legacy) {
          localStorage.setItem(key, legacy);
          raw = legacy;
        }
      }
      setPortfolio(parsePortfolio(raw));
    } catch {
      setPortfolio(emptyPortfolio());
    }
    setLoaded(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) setPortfolio(parsePortfolio(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, ready, session]);

  /** Persists first, so a failed write never shows as a recorded position. */
  const save = useCallback(
    (next: DtfPortfolio) => {
      if (!key) throw new Error("Connect a wallet to deposit.");
      localStorage.setItem(key, JSON.stringify(next));
      setPortfolio(next);
    },
    [key],
  );

  return { connected: Boolean(wallet), wallet, loaded, portfolio, save };
}
