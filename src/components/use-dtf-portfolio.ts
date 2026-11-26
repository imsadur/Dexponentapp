"use client";
import { useCallback, useEffect, useState } from "react";
import { emptyPortfolio, parsePortfolio, portfolioKey, type DtfPortfolio } from "@/domain/dtf-portfolio";
import { useApp } from "./provider";

/** The signed-in user's DTF positions, synced across tabs. */
export function useDtfPortfolio() {
  const { session, ready } = useApp();
  const key = session ? portfolioKey(session.identifier) : null;
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
      setPortfolio(parsePortfolio(localStorage.getItem(key)));
    } catch {
      setPortfolio(emptyPortfolio());
    }
    setLoaded(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) setPortfolio(parsePortfolio(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, ready]);

  /** Persists first, so a failed write never shows as a recorded position. */
  const save = useCallback(
    (next: DtfPortfolio) => {
      if (!key) throw new Error("Sign in to keep a position.");
      localStorage.setItem(key, JSON.stringify(next));
      setPortfolio(next);
    },
    [key],
  );

  return { signedIn: Boolean(session), loaded, portfolio, save };
}
