"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Farm, type User } from "@/domain/strategy";
import { localDataAdapter, seedFarms } from "@/adapters/data";
type ProviderRpc = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (data: unknown) => void) => void;
  removeListener?: (event: string, cb: (data: unknown) => void) => void;
};
declare global {
  interface Window {
    ethereum?: ProviderRpc;
  }
}
type Context = {
  farms: Farm[];
  ready: boolean;
  storageError: string;
  saveFarm: (farm: Farm) => void;
  deleteFarm: (id: string) => void;
  reset: () => void;
  theme: string;
  toggleTheme: () => void;
  profile: User;
  saveProfile: (user: User) => void;
  wallet: string;
  walletChain: string;
  walletError: string;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  toast: (text: string) => void;
};
const AppContext = createContext<Context | null>(null);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppProvider missing");
  return ctx;
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [profile, setProfile] = useState<User>({
    name: "Alex Morgan",
    workspace: "Personal workspace",
  });
  const [wallet, setWallet] = useState("");
  const [walletChain, setWalletChain] = useState("");
  const [walletError, setWalletError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      setFarms(localDataAdapter.read());
      const theme = localStorage.getItem("fm:theme");
      if (theme === "light") setTheme("light");
      const raw = localStorage.getItem("fm:profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.name === "string" && typeof p.workspace === "string")
          setProfile(p);
      }
    } catch (e) {
      setStorageError(
        e instanceof Error ? e.message : "Local storage is unavailable.",
      );
      setFarms(seedFarms());
    }
    setReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;
    const accounts = (value: unknown) => {
      const a = value as string[];
      setWallet(a[0] || "");
    };
    const chain = (value: unknown) => setWalletChain(String(value));
    provider.on?.("accountsChanged", accounts);
    provider.on?.("chainChanged", chain);
    return () => {
      provider.removeListener?.("accountsChanged", accounts);
      provider.removeListener?.("chainChanged", chain);
    };
  }, []);
  function persist(next: Farm[]) {
    setFarms(next);
    try {
      localDataAdapter.write(next);
      setStorageError("");
    } catch {
      setStorageError(
        "Could not save in this browser. Keep this tab open or export your workspace.",
      );
    }
  }
  function saveFarm(farm: Farm) {
    const index = farms.findIndex((f) => f.id === farm.id);
    persist(
      index === -1
        ? [...farms, farm]
        : farms.map((f) => (f.id === farm.id ? farm : f)),
    );
  }
  async function connect() {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError(
        "No browser wallet found. Install an EVM wallet, or continue with the demo workspace.",
      );
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      setWallet(accounts[0] || "");
      setWalletChain(String(chain));
    } catch (e) {
      const code = (e as { code?: number }).code;
      setWalletError(
        code === 4001
          ? "Connection declined in your wallet. You can try again."
          : "Wallet connection failed. Open your wallet and try again.",
      );
    } finally {
      setConnecting(false);
    }
  }
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("fm:theme", next);
    } catch {
      setMessage(
        "Theme changed for this visit. Browser storage is unavailable.",
      );
    }
  }
  function saveProfile(next: User) {
    setProfile(next);
    try {
      localStorage.setItem("fm:profile", JSON.stringify(next));
      setMessage("Workspace preferences saved");
    } catch {
      setMessage("Preferences changed for this visit only.");
    }
  }
  return (
    <AppContext.Provider
      value={{
        farms,
        ready,
        storageError,
        saveFarm,
        deleteFarm: (id) => persist(farms.filter((f) => f.id !== id)),
        reset: () => persist(seedFarms()),
        theme,
        toggleTheme,
        profile,
        saveProfile,
        wallet,
        walletChain,
        walletError,
        connecting,
        connect,
        disconnect: () => {
          setWallet("");
          setWalletChain("");
        },
        toast: setMessage,
      }}
    >
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
        </div>
      )}
    </AppContext.Provider>
  );
}
