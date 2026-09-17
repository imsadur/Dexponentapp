"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { seedV3Farms, V3_STORAGE_KEY, type V3Farm } from "./model";

type ContextValue = {
  farms: V3Farm[];
  ready: boolean;
  saveFarm: (farm: V3Farm) => void;
  deposit: (id: string, amount: number) => void;
  withdraw: (id: string, amount: number) => void;
  togglePause: (id: string) => void;
};

const Context = createContext<ContextValue | null>(null);

export function useV3() {
  const value = useContext(Context);
  if (!value) throw new Error("V3Provider missing");
  return value;
}

export function V3Provider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<V3Farm[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(V3_STORAGE_KEY);
      setFarms(raw ? JSON.parse(raw) as V3Farm[] : seedV3Farms());
    } catch {
      setFarms(seedV3Farms());
    }
    setReady(true);
  }, []);
  function persist(next: V3Farm[]) {
    setFarms(next);
    localStorage.setItem(V3_STORAGE_KEY, JSON.stringify(next));
  }
  function saveFarm(farm: V3Farm) {
    persist(farms.some((item) => item.id === farm.id) ? farms.map((item) => item.id === farm.id ? farm : item) : [...farms, farm]);
  }
  function update(id: string, change: (farm: V3Farm) => V3Farm) {
    const farm = farms.find((item) => item.id === id);
    if (!farm) throw new Error("Farm not found");
    saveFarm(change(farm));
  }
  const value = useMemo<ContextValue>(() => ({
    farms,
    ready,
    saveFarm,
    deposit: (id, amount) => update(id, (farm) => {
      if (farm.status !== "ACTIVE" || amount < 100) throw new Error("Deposit at least 100 into an active Farm.");
      return { ...farm, position: farm.position + amount, tvl: farm.tvl + amount, events: [`Deposited ${amount.toLocaleString()} ${farm.depositAsset} · demo`, ...farm.events] };
    }),
    withdraw: (id, amount) => update(id, (farm) => {
      if (amount <= 0 || amount > farm.position) throw new Error("Enter an amount within your demo position.");
      return { ...farm, position: farm.position - amount, tvl: Math.max(0, farm.tvl - amount), events: [`Withdrew ${amount.toLocaleString()} ${farm.depositAsset} · demo`, ...farm.events] };
    }),
    togglePause: (id) => update(id, (farm) => {
      if (!farm.managerCanPause) throw new Error("Pause control is not enabled for this Farm.");
      const paused = farm.status !== "PAUSED";
      return { ...farm, status: paused ? "PAUSED" : "ACTIVE", events: [paused ? "Farm paused · demo" : "Farm resumed · demo", ...farm.events] };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [farms, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
