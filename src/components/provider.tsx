"use client";
export type ThemePreference = "light" | "dark" | "system";
import {
  CheckCircle,
  Info,
  SpinnerGap,
  WarningCircle,
  X,
  XCircle,
} from "@phosphor-icons/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { type Farm, type User } from "@/domain/strategy";
import { localDataAdapter, seedFarms } from "@/adapters/data";
import { SESSION_KEY, type Session } from "@/adapters/auth";
import {
  mapOrderEvent,
  type OrderToastAction,
  type OrderToastEvent,
  type OrderToastOrder,
  type OrderToastView,
} from "@/domain/order-toast";
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
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  profile: User;
  saveProfile: (user: User) => void;
  wallet: string;
  walletChain: string;
  walletError: string;
  connecting: boolean;
  connect: () => Promise<void>;
  /** Connects the preview wallet address when no browser wallet is available. Nothing is signed. */
  connectDemo: () => void;
  disconnect: () => void;
  session: Session | null;
  signIn: (session: Session) => void;
  signOut: () => void;
  toast: (text: string) => void;
  /** Top-right notification with a title and optional detail line. */
  notify: (notice: Omit<Notice, "id">) => void;
  orderToast: {
    start: (order: OrderToastOrder, initialStatus?: OrderToastEvent["status"]) => string;
    update: (id: string, event: OrderToastEvent) => void;
    dismiss: (id: string) => void;
  };
};
export type Notice = { id: string; kind: "success" | "error"; title: string; body?: string; meta?: string };
/** Preview wallet address. Nothing is ever signed with it. */
const DEMO_WALLET = "0x7a3F9c21B4e8D05a6C1f2E9b8D3c4A5e6F7b8C9d";
const DEMO_WALLET_KEY = "fm:demo-wallet";
type OrderToastRecord = { id: string; order: OrderToastOrder; event: OrderToastEvent; view: OrderToastView };
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
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("dark");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("dark");
  const theme = themePreference === "system" ? systemTheme : themePreference;
  const [profile, setProfile] = useState<User>({
    name: "Alex Morgan",
    workspace: "Personal workspace",
  });
  const [session, setSession] = useState<Session | null>(null);
  const [wallet, setWallet] = useState("");
  const [walletChain, setWalletChain] = useState("");
  const [walletError, setWalletError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [orderToasts, setOrderToasts] = useState<OrderToastRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const dismissNotice = useCallback((id: string) => setNotices((list) => list.filter((n) => n.id !== id)), []);
  const notify = useCallback((notice: Omit<Notice, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotices((list) => [...list.slice(-2), { ...notice, id }]);
  }, []);
  useEffect(() => {
    try {
      setFarms(localDataAdapter.read());
      const storedTheme = localStorage.getItem("fm:theme");
      if (storedTheme === "light" || storedTheme === "system")
        setThemePreferenceState(storedTheme);
      const raw = localStorage.getItem("fm:profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.name === "string" && typeof p.workspace === "string")
          setProfile(p);
      }
      if (localStorage.getItem(DEMO_WALLET_KEY) === "1") {
        setWallet(DEMO_WALLET);
        setWalletChain("Base");
      }
      const rawSession = localStorage.getItem(SESSION_KEY);
      if (rawSession) {
        const s = JSON.parse(rawSession);
        if (typeof s.name === "string" && typeof s.identifier === "string")
          setSession(s);
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
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => setSystemTheme(query.matches ? "light" : "dark");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
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
        "Could not save changes. Keep this tab open and export your DTFs from Settings.",
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
        "No browser wallet found. Install an EVM wallet, or continue with the preview wallet.",
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
  function signIn(next: Session) {
    setSession(next);
    setProfile((p) => ({ ...p, name: next.name }));
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      const raw = localStorage.getItem("fm:profile");
      const p = raw ? JSON.parse(raw) : { workspace: "Personal workspace" };
      localStorage.setItem("fm:profile", JSON.stringify({ ...p, name: next.name }));
    } catch {
      /* session stays in memory for this visit */
    }
  }
  function signOut() {
    setSession(null);
    setWallet("");
    setWalletChain("");
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* nothing persisted */
    }
  }
  function toggleTheme() {
    setThemePreference(theme === "dark" ? "light" : "dark");
  }
  function setThemePreference(next: ThemePreference) {
    setThemePreferenceState(next);
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
  const dismissOrderToast = useCallback((id: string) => {
    setOrderToasts((items) => items.filter((item) => item.id !== id));
  }, []);
  const startOrderToast = useCallback((order: OrderToastOrder, initialStatus: OrderToastEvent["status"] = "sending") => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `order-${Date.now()}`;
    const event: OrderToastEvent = { status: initialStatus };
    setOrderToasts((items) => [...items.filter((item) => item.id !== id), { id, order, event, view: mapOrderEvent(order, event) }]);
    return id;
  }, []);
  const updateOrderToast = useCallback((id: string, event: OrderToastEvent) => {
    if (event.rawError) console.error("Order submission failed", event.rawError);
    setOrderToasts((items) => items.map((item) => item.id === id ? { ...item, event, view: mapOrderEvent(item.order, event) } : item));
  }, []);
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
        themePreference,
        setThemePreference,
        toggleTheme,
        profile,
        saveProfile,
        wallet,
        walletChain,
        walletError,
        connecting,
        connect,
        connectDemo: () => {
          setWalletError("");
          setWallet(DEMO_WALLET);
          setWalletChain("Base");
          try {
            localStorage.setItem(DEMO_WALLET_KEY, "1");
          } catch {
            /* preview wallet lasts for this visit only */
          }
        },
        disconnect: () => {
          setWallet("");
          setWalletChain("");
          try {
            localStorage.removeItem(DEMO_WALLET_KEY);
          } catch {
            /* nothing stored */
          }
        },
        session,
        signIn,
        signOut,
        toast: setMessage,
        notify,
        orderToast: {
          start: startOrderToast,
          update: updateOrderToast,
          dismiss: dismissOrderToast,
        },
      }}
    >
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
        </div>
      )}
      <div className="notice-stack" aria-label="Notifications">
        {notices.map((notice) => <NoticeItem key={notice.id} notice={notice} dismiss={dismissNotice} />)}
      </div>
      <div className="order-toast-stack" aria-label="Order updates">
        {orderToasts.map((toast) => <OrderToastItem key={toast.id} toast={toast} dismiss={dismissOrderToast} />)}
      </div>
    </AppContext.Provider>
  );
}

function NoticeItem({ notice, dismiss }: { notice: Notice; dismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(notice.id), 6000);
    return () => window.clearTimeout(timer);
  }, [dismiss, notice.id]);
  return (
    <section className={`notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
      {notice.kind === "success" ? <CheckCircle size={20} weight="fill" /> : <XCircle size={20} weight="fill" />}
      <div>
        <strong>{notice.title}</strong>
        {notice.body && <p>{notice.body}</p>}
        {notice.meta && <code>{notice.meta}</code>}
      </div>
      <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(notice.id)}><X size={15} /></button>
    </section>
  );
}

const orderActionLabels: Record<OrderToastAction, string> = {
  view_position: "View position",
  view_order: "View order",
  view_history: "View history",
  details: "Details",
  cancel_rest: "Cancel rest",
  retry_market: "Retry at market",
  edit_price: "Edit price",
  edit_trigger: "Edit trigger",
  add_funds: "Add funds",
  lower_size: "Lower size",
  turn_off_reduce_only: "Turn off Reduce Only",
  approve: "Approve",
  try_again: "Try again",
  copy_ref: "Copy ref",
};

function OrderToastItem({ toast, dismiss }: { toast: OrderToastRecord; dismiss: (id: string) => void }) {
  useEffect(() => {
    if (!toast.view.autoDismissMs) return;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.view.autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id, toast.view.autoDismissMs, toast.view.state]);
  const icon = toast.view.spinner
    ? <SpinnerGap size={24} className="order-toast-spinner" />
    : toast.view.kind === "success"
      ? <CheckCircle size={24} weight="fill" />
      : toast.view.kind === "error"
        ? <XCircle size={24} weight="fill" />
        : toast.view.kind === "warning"
          ? <WarningCircle size={24} weight="fill" />
          : <Info size={24} weight="fill" />;
  const actionHref = (action: OrderToastAction) => {
    if (action === "details") return "#filled-orders";
    if (action === "view_position" || action === "view_history") return toast.order.farmId ? `/app/farms/manage/?farm=${toast.order.farmId}` : "/app/positions";
    if (action === "view_order") return "#filled-orders";
    if (action === "add_funds") return "/app/positions";
    return "";
  };
  return (
    <section
      className={`order-toast ${toast.view.kind}`}
      role={toast.view.kind === "error" ? "alert" : "status"}
      aria-live={toast.view.kind === "error" ? "assertive" : "polite"}
      style={{ "--toast-duration": `${toast.view.autoDismissMs || 0}ms` } as CSSProperties}
    >
      <span className="order-toast-icon">{icon}</span>
      <div className="order-toast-copy">
        <strong>{toast.view.title}</strong>
        <p>{toast.view.body}</p>
        {!!toast.view.actions.length && (
          <div className="order-toast-actions">
            {toast.view.actions.map((action) => {
              const href = actionHref(action);
              return href
                ? <a key={action} href={href} onClick={() => dismiss(toast.id)}>{orderActionLabels[action]}</a>
                : <button key={action} type="button" onClick={() => dismiss(toast.id)}>{orderActionLabels[action]}</button>;
            })}
          </div>
        )}
      </div>
      <button className="order-toast-dismiss" type="button" aria-label="Dismiss order update" onClick={() => dismiss(toast.id)}><X size={17} /></button>
      {toast.view.autoDismissMs && <span className="order-toast-countdown" />}
    </section>
  );
}
