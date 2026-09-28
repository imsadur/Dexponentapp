"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import {
  ChartLineUp as Activity,
  ArrowDown,
  DownloadSimple as ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  ArrowsClockwise,
  ArrowsLeftRight,
  Bell,
  BookOpen,
  Briefcase,
  Buildings,
  CalendarBlank,
  Check,
  CaretDown as ChevronDown,
  Question as CircleHelp,
  Clock as Clock3,
  Compass,
  Copy,
  DiscordLogo,
  Drop as Droplets,
  ArrowSquareOut as ExternalLink,
  FileText,
  Lifebuoy,
  LinkedinLogo,
  SquaresFour as Grid2X2,
  ChartDonut as LayoutDashboard,
  Leaf,
  List as Menu,
  Moon,
  Graph as Network,
  Plus,
  MagnifyingGlass as Search,
  GearSix as Settings,
  Shield,
  SignOut,
  SlidersHorizontal,
  Sun,
  TelegramLogo,
  TrendDown,
  TrendUp,
  UserCircle,
  UserPlus,
  Users,
  Wallet,
  X,
  XLogo,
  RedditLogo,
  Scales,
} from "@phosphor-icons/react";
import {
  families,
  makeFarm,
  riskFor,
  simulate,
  templateById,
  templates,
  type Farm,
  type Scenario,
  type StrategyType,
} from "@/domain/strategy";
import {
  farmDetailHref,
  farmTradeHref,
  isFarmWizardRoute,
} from "@/domain/routes";
import {
  findPerpetualMarket,
  filledOrders,
  marketPair,
  maximumOrderNotional,
  percentageToSize,
  perpetualMarkets,
  perpetualPair,
  placeDemoOrder,
  sizeToPercentage,
  searchPerpetualMarkets,
  type PerpetualMarket,
} from "@/domain/trading";
import {
  farmFinancialMetrics,
  indexWeights,
  performanceForRange,
  perpetualHealth,
  portfolioMetrics,
  spotComposition,
} from "@/domain/metrics";
import {
  Brand,
  AnimatedValue,
  AssetIcon,
  AssetList,
  Badge,
  EmptyState,
  Metric,
  Modal,
  money,
  NetworkIcon,
  Notice,
  PageHeading,
  PerformanceChart,
  Risk,
  StrategyFlow,
  StrategyIcon,
} from "./ui";
import { useApp } from "./provider";
import { Wizard } from "./wizard";
import { TradingViewPerformanceChart } from "./tradingview-performance-chart";

const legacyNav = [
  { label: "Capital", section: "dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Explore Farms", section: "explore", href: "/app/explore", icon: Compass },
  { label: "Managed Farms", section: "farms", href: "/app/farms", icon: Leaf },
  { label: "Strategies", section: "strategies", href: "/app/strategies", icon: Network },
  { label: "Templates", section: "templates", href: "/app/templates", icon: Grid2X2 },
  { label: "Metrics", section: "analytics", href: "/app/analytics", icon: Activity },
];
const nav = [
  { label: "Dashboard", section: "dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Managed Farms", section: "farms", href: "/app/farms", icon: Leaf },
  { label: "Positions", section: "positions", href: "/app/positions", icon: Briefcase },
  { label: "Templates", section: "templates", href: "/app/templates", icon: Grid2X2 },
  { label: "Metrics", section: "analytics", href: "/app/analytics", icon: Activity },
];
export function Workspace({ previewVersion, routeSegments }: { previewVersion?: string; routeSegments?: string[] } = {}) {
  const path = usePathname();
  const searchParams = useSearchParams();
  const app = useApp();
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState("");
  const [network, setNetwork] = useState("All Chains");
  const [profileMenu, setProfileMenu] = useState(false);
  const [utilityMenu, setUtilityMenu] = useState(false);
  const [chainMenu, setChainMenu] = useState(false);
  const [workspaceMenu, setWorkspaceMenu] = useState(false);
  const [users, setUsers] = useState([
    { name: "Alex Morgan", workspace: "Personal workspace" },
    { name: "Priya Shah", workspace: "Growth workspace" },
  ]);
  const [newUserName, setNewUserName] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const segments = routeSegments || path.split("/").filter(Boolean);
  const section = previewVersion ? "dashboard" : segments[1] || "dashboard";
  const isTrade = section === "trade";
  const isV2 = previewVersion !== "v1";
  const activeNav = isV2 ? nav : legacyNav;
  const isWizard = isFarmWizardRoute(segments);
  const queryFarmId = searchParams.get("farm") || "";
  const queryMarket = searchParams.get("market") || "";
  const isFarmDetail = section === "farms" && !isWizard && segments.length > 2 && segments[2] !== "drafts";
  let content;
  if (isWizard)
    content = (
      <Wizard
        key={`${path}:${queryFarmId}`}
        farmId={
          segments[2] === "edit"
            ? queryFarmId
            : segments[3] === "edit"
              ? segments[2]
              : undefined
        }
      />
    );
  else if (section === "dashboard") content = <Dashboard network={network} enhanced={isV2} />;
  else if (section === "explore") content = <ExploreFarms network={network} />;
  else if (
    section === "farms" &&
    (segments.length === 2 || segments[2] === "drafts")
  )
    content = <FarmList drafts={segments[2] === "drafts"} network={network} />;
  else if (section === "farms")
    content = (
      <FarmDetail
        id={segments[2] === "manage" ? queryFarmId : segments[2]}
        tab={segments[3]}
        enhanced={isV2}
      />
    );
  else if (section === "trade")
    content = <TradingDashboard farmId={queryFarmId} initialPair={queryMarket} />;
  else if (section === "templates" || section === "strategies")
    content = (
      <TemplateLibrary strategies={section === "strategies"} id={segments[2]} />
    );
  else if (section === "analytics") content = <Analytics network={network} />;
  else if (section === "positions") content = <Positions network={network} />;
  else if (section === "settings")
    content = <WorkspaceSettings tab={segments[2]} />;
  else if (section === "resources") content = <Resources />;
  else
    content = (
      <EmptyState
        title="Page not found"
        description="Return to your overview to continue."
        href="/app/dashboard"
        label="Open overview"
      />
    );
  return (
    <div className={`app-shell ${isTrade ? "trade-shell" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {menu && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${isTrade ? "trade-sidebar" : ""} ${menu ? "open" : ""}`}>
        <Brand />
        {!isV2 && <span className="nav-caption">WORKSPACE</span>}
        <nav>
          {activeNav.map((item) => (
            <Link
              className={section === item.section ? "active" : ""}
              key={item.href}
              href={item.href}
              title={isTrade ? item.label : undefined}
              onClick={() => setMenu(false)}
            >
              <item.icon size={18} />
              {item.label}
              {item.section === "farms" && (
                <span className="nav-count">{app.farms.length}</span>
              )}
            </Link>
          ))}
        </nav>
        {!isV2 && <div className="sidebar-resources">
          <span className="nav-caption">LEARN & EXPLORE</span>
          <Link href="/app/resources">
            <BookOpen size={17} />
            Resources
          </Link>
          <Link href="/app/resources#documentation">
            <FileText size={17} />
            Documentation
            <ArrowUpRight size={13} />
          </Link>
          <button onClick={() => setModal("support")}>
            <CircleHelp size={17} />
            Support
          </button>
        </div>}
        <div className="sidebar-bottom">
          {isV2 ? (
            <div className="profile-account">
              {profileMenu && (
                <div className="profile-account-menu" role="menu">
                  <Link href="/app/settings" role="menuitem" onClick={() => setProfileMenu(false)}>
                    <UserCircle size={17} /> Profile
                  </Link>
                  <button role="menuitem" onClick={() => { setProfileMenu(false); setModal("wallet"); }}>
                    <Wallet size={17} />
                    {app.wallet ? "Connected wallet" : "Connect wallet"}
                  </button>
                  <Link href="/login" role="menuitem" onClick={() => setProfileMenu(false)}>
                    <SignOut size={17} /> Log out
                  </Link>
                </div>
              )}
              <button
                className="profile-row profile-trigger"
                aria-expanded={profileMenu}
                aria-haspopup="menu"
                onClick={() => setProfileMenu((open) => !open)}
              >
                <span className="avatar">
                  {app.profile.name.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                </span>
                <span className="profile-copy">
                  <strong>{app.profile.name}</strong>
                  <small>Fund manager</small>
                </span>
                <ChevronDown className={profileMenu ? "workspace-chevron open" : "workspace-chevron"} size={15} />
              </button>
            </div>
          ) : (
          <>
          <div className="workspace-account">
            {workspaceMenu && (
              <div className="workspace-account-menu">
                <div className="account-menu-heading">
                  <span>Switch user</span>
                  <small>{users.length} profiles</small>
                </div>
                {users.map((user) => (
                  <button
                    key={`${user.name}-${user.workspace}`}
                    className={app.profile.name === user.name ? "selected" : ""}
                    onClick={() => {
                      app.saveProfile(user);
                      setWorkspaceMenu(false);
                      app.toast(`Switched to ${user.name}`);
                    }}
                  >
                    <span className="avatar small-avatar">
                      {user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                    </span>
                    <span><strong>{user.name}</strong><small>{user.workspace}</small></span>
                    {app.profile.name === user.name && <Check size={15} />}
                  </button>
                ))}
                <button
                  className="add-user-button"
                  onClick={() => {
                    setWorkspaceMenu(false);
                    setModal("add-user");
                  }}
                >
                  <UserPlus size={16} /> Add user
                </button>
              </div>
            )}
            <button
              className="workspace-switch"
              aria-expanded={workspaceMenu}
              aria-haspopup="menu"
              onClick={() => setWorkspaceMenu((open) => !open)}
            >
              <span className="avatar small-avatar">
                {app.profile.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
              </span>
              <span>
                <strong>{app.profile.workspace}</strong>
                <small>Strategist workspace</small>
              </span>
              <ChevronDown className={workspaceMenu ? "workspace-chevron open" : "workspace-chevron"} size={15} />
            </button>
          </div>
          <Link
            className={section === "settings" ? "active" : ""}
            href="/app/settings"
          >
            <Settings size={17} />
            Settings
          </Link>
          <button onClick={() => setModal("wallet")}>
            <Wallet size={17} />
            Wallet
            <span className="muted small">
              {app.wallet ? "Connected" : "Connect"}
            </span>
          </button>
          <div className="profile-row">
            <span className="avatar">
              {app.profile.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{app.profile.name}</strong>
              <small>Fund manager</small>
            </div>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={app.toggleTheme}
            >
              {app.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          </>
          )}
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            {isTrade ? (
              <>
                <Link className="trade-top-back" href={farmDetailHref(queryFarmId)}>
                  <ArrowRight className="rotate-180" size={14} /> Back to Farm
                </Link>
                <span>/</span>
                <strong>Trade</strong>
              </>
            ) : isFarmDetail ? (
              <Link className="farm-top-back" href="/app/farms"><ArrowRight className="rotate-180" size={14} /> All farms</Link>
            ) : (
              <strong>{isWizard ? "Create farm" : activeNav.find((item) => item.section === section)?.label || section.charAt(0).toUpperCase() + section.slice(1)}</strong>
            )}
          </div>
          <div className="topbar-actions">
            {isV2 ? (
              <div className="chain-filter">
                <button
                  className="network-selector chain-trigger"
                  aria-label="Filter workspace by chain"
                  aria-expanded={chainMenu}
                  aria-haspopup="listbox"
                  onClick={() => setChainMenu((open) => !open)}
                >
                  <NetworkIcon network={network === "All Chains" ? "All" : network} size={20} />
                  <span>{network}</span>
                  <ChevronDown className={chainMenu ? "workspace-chevron open" : "workspace-chevron"} size={14} />
                </button>
                {chainMenu && (
                  <div className="chain-menu" role="listbox" aria-label="Available chains">
                    {["All Chains", "Arbitrum", "Base", "Ethereum"].map((chain) => (
                      <button
                        key={chain}
                        className={network === chain ? "selected" : ""}
                        role="option"
                        aria-selected={network === chain}
                        onClick={() => { setNetwork(chain); setChainMenu(false); }}
                      >
                        <NetworkIcon network={chain === "All Chains" ? "All" : chain} size={22} />
                        <span>{chain}</span>
                        {network === chain && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <label className="network-selector">
                <NetworkIcon network={network === "All Chains" ? "All" : network} size={20} />
                <select
                  aria-label="Filter workspace by chain"
                  value={network}
                  onChange={(event) => setNetwork(event.target.value)}
                >
                  {["All Chains", "Arbitrum", "Base", "Ethereum"].map((chain) => (
                    <option key={chain}>{chain}</option>
                  ))}
                </select>
              </label>
            )}
            <button className="button wallet-button" onClick={() => setModal("wallet")}>
              <Wallet size={16} />
              {app.wallet ? `${app.wallet.slice(0, 6)}…${app.wallet.slice(-4)}` : "Connect wallet"}
            </button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setModal("notifications")}>
              <Bell size={19} /><span />
            </button>
            {isV2 && (
              <div className="utility-account">
                <button
                  className="icon-button"
                  aria-label="Open company menu"
                  aria-expanded={utilityMenu}
                  aria-haspopup="menu"
                  onClick={() => setUtilityMenu((open) => !open)}
                >
                  <Menu size={19} />
                </button>
                {utilityMenu && (
                  <div className="utility-menu" role="menu">
                    <span>Dexponent</span>
                    <a href="https://dexponent.com/aboutus" target="_blank" rel="noreferrer" role="menuitem"><Buildings size={17} /> Company</a>
                    <a href="https://docs.dexponent.com/" target="_blank" rel="noreferrer" role="menuitem"><BookOpen size={17} /> Resources</a>
                    <a href="https://docs.dexponent.com/" target="_blank" rel="noreferrer" role="menuitem"><FileText size={17} /> Documentation</a>
                    <button className="utility-support" role="menuitem" onClick={() => { setUtilityMenu(false); setModal("support"); }}><Lifebuoy size={17} /> Help &amp; support</button>
                    <div className="utility-legal"><a href="https://dexponent.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a><span>|</span><a href="https://dexponent.com/terms" target="_blank" rel="noreferrer">Terms of Use</a></div>
                    <span>Join Dexponent</span>
                    <div className="utility-socials">
                      <a href="https://discord.com/invite/yermEKz6rc" target="_blank" rel="noreferrer" aria-label="Dexponent on Discord"><DiscordLogo size={20} /></a>
                      <a href="https://t.me/+5NZOk4DLnWE4ZjY1" target="_blank" rel="noreferrer" aria-label="Dexponent on Telegram"><TelegramLogo size={20} /></a>
                      <a href="https://x.com/Dexponentx" target="_blank" rel="noreferrer" aria-label="Dexponent on X"><XLogo size={20} /></a>
                      <a href="https://www.linkedin.com/company/dexponent/" target="_blank" rel="noreferrer" aria-label="Dexponent on LinkedIn"><LinkedinLogo size={20} /></a>
                      <a href="https://www.reddit.com/r/Dexponent_Official/" target="_blank" rel="noreferrer" aria-label="Dexponent on Reddit"><RedditLogo size={20} /></a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main
          id="main"
          className={isWizard ? "main-content wizard-content" : isTrade ? "main-content trade-content" : "main-content"}
        >
          {app.storageError && (
            <Notice tone="warning">
              {app.storageError}{" "}
              <Link href="/app/settings/security">Manage local data</Link>
            </Notice>
          )}
          {!app.ready ? (
            <div className="loading-shell">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : (
            content
          )}
        </main>
        <footer className="app-footer">
          <span>
            <span className="environment-dot" /> Local preview · Sample data only
          </span>
          <span>Dexponent capital operations</span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {activeNav.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            className={section === item.section ? "active" : ""}
            href={item.href}
          >
            <item.icon size={19} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      {modal && (
        <Modal
          title={
            modal === "wallet"
              ? "Connect your wallet"
              : modal === "notifications"
                ? "Notifications"
                : modal === "add-user"
                  ? "Add a workspace user"
                : "Workspace support"
          }
          onClose={() => setModal("")}
        >
          {modal === "add-user" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const user = {
                  name: newUserName.trim(),
                  workspace: newWorkspaceName.trim() || "Personal workspace",
                };
                if (!user.name) return;
                setUsers((current) => [...current, user]);
                app.saveProfile(user);
                setNewUserName("");
                setNewWorkspaceName("");
                setModal("");
                app.toast(`${user.name} added to this session`);
              }}
            >
              <p className="muted">Create another local profile for this browser session.</p>
              <div className="fields-grid single-column-fields">
                <label className="field"><span>User name</span><input autoFocus value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="Full name" maxLength={50} required /></label>
                <label className="field"><span>Workspace name</span><input value={newWorkspaceName} onChange={(event) => setNewWorkspaceName(event.target.value)} placeholder="Personal workspace" maxLength={50} /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="button" onClick={() => setModal("")}>Cancel</button>
                <button type="submit" className="button primary" disabled={!newUserName.trim()}><UserPlus size={15} /> Add and switch</button>
              </div>
            </form>
          ) : modal === "wallet" ? (
            <>
              <p className="muted">
                Connect your public address with an installed EVM browser
                wallet.
              </p>
              {app.wallet ? (
                <>
                  <div className="wallet-address">{app.wallet}</div>
                  <p className="small muted">
                    Wallet chain: {app.walletChain} · No signatures requested
                  </p>
                  <button className="button full" onClick={app.disconnect}>
                    Disconnect from this workspace
                  </button>
                </>
              ) : (
                <button
                  className="button primary full"
                  disabled={app.connecting}
                  onClick={app.connect}
                >
                  <Wallet size={16} />
                  {app.connecting
                    ? "Waiting for wallet…"
                    : "Connect browser wallet"}
                </button>
              )}
              {app.walletError && (
                <p role="alert" className="field-error">
                  {app.walletError}
                </p>
              )}
              <Notice>
                Demo exploration does not require a wallet. Live transactions
                are disabled in this prototype.
              </Notice>
            </>
          ) : modal === "notifications" ? (
            <EmptyState
              title="You’re all caught up"
              description="Saved drafts and preview results appear in your farms. Live monitoring notifications will arrive after integration."
            />
          ) : (
            <>
              <p>
                Everything you need to explore this prototype is in the
                workspace guide.
              </p>
              <Link
                className="button primary full"
                href="/app/resources"
                onClick={() => setModal("")}
              >
                Open workspace guide <ArrowRight size={16} />
              </Link>
              <Notice>
                This local prototype has no support messaging service connected.
              </Notice>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
function CreateButton() {
  return (
    <Link className="button primary" href="/app/farms/new">
      <Plus size={16} />
      Create farm
    </Link>
  );
}
function Positions({ network }: { network: string }) {
  const app = useApp();
  const farms = app.farms.filter(
    (farm) =>
      Number(farm.values.demoPosition || 0) > 0 &&
      (farm.status === "ACTIVE" || farm.status === "PAUSED") &&
      (network === "All Chains" || farm.network === network),
  );
  const positionValue = (farm: Farm) => Number(farm.values.demoPosition || 0);
  const capital = farms.reduce((total, farm) => total + positionValue(farm), 0);
  const weightedApy = capital
    ? farms.reduce((total, farm) => total + farm.apy * positionValue(farm), 0) / capital
    : 0;
  const weightedPerformance = capital
    ? farms.reduce(
        (total, farm) => total + farm.performance * positionValue(farm),
        0,
      ) / capital
    : 0;

  return (
    <>
      <PageHeading
        eyebrow="PORTFOLIO"
        title="Positions"
        description="Review active Farm exposure, allocation, yield, and performance across selected chains."
        action={<CreateButton />}
      />
      <div className="overview-metrics capital-metrics">
        <Metric label="Portfolio value" value={money(capital)} caption="active Farm capital · demo" />
        <Metric label="Open positions" value={String(farms.length).padStart(2, "0")} caption="across selected chains" />
        <Metric label="Blended APY" value={`${weightedApy.toFixed(2)}%`} caption="position-weighted · demo" />
        <Metric label="30D performance" value={`${weightedPerformance >= 0 ? "+" : ""}${weightedPerformance.toFixed(2)}%`} caption="position-weighted · demo" />
      </div>
      <div className="section-heading">
        <div>
          <h2>Portfolio positions</h2>
          <p>Farms where you hold a demo balance, including paused Farms that remain withdrawable.</p>
        </div>
      </div>
      <div className="farm-table-wrap">
        {!farms.length ? (
          <EmptyState title="No positions yet" description="Explore an active Farm and complete a demo deposit to open your first position." href="/app/explore" label="Explore Farms" />
        ) : (
          <table className="farm-table">
            <thead><tr><th>Farm / Strategy</th><th>Status</th><th>Your position</th><th>APY</th><th>30D performance</th><th>Network</th><th aria-label="Open Farm" /></tr></thead>
            <tbody>{farms.map((farm) => <tr key={farm.id}>
              <td><Link className="farm-name" href={farmDetailHref(farm.id)}><span className={`icon-tile ${farm.type.toLowerCase()}`}><StrategyIcon type={farm.type} size={18} /></span><span><strong>{farm.name}</strong><small>{farm.type} · Demo position</small></span></Link></td>
              <td><Badge tone={farm.status === "ACTIVE" ? "mint" : "amber"}>{farm.status.charAt(0) + farm.status.slice(1).toLowerCase()}</Badge></td>
              <td className="numeric">{money(positionValue(farm))}</td>
              <td className="numeric">{farm.apy}%</td>
              <td><span className="positive">+{farm.performance.toFixed(2)}%</span></td>
              <td><span className="network-name"><NetworkIcon network={farm.network} size={19} />{farm.network}</span></td>
              <td><Link className="icon-button" aria-label={`Open ${farm.name}`} href={farmDetailHref(farm.id)}><ArrowUpRight size={17} /></Link></td>
            </tr>)}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
function ExploreFarms({ network }: { network: string }) {
  const app = useApp();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All risk levels");
  const farms = app.farms.filter(
    (farm) =>
      farm.source === "demo" &&
      farm.status === "ACTIVE" &&
      (network === "All Chains" || farm.network === network) &&
      (risk === "All risk levels" || farm.risk === risk) &&
      farm.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="FARM EXPLORER"
        title="Find a Farm you can understand."
        description="Compare strategy, performance, fees, liquidity, and risk before deciding whether to deposit."
        action={<Link className="button" href="/app/farms">Manager workspace <ArrowRight size={15} /></Link>}
      />
      <section className="explore-intro panel">
        <div>
          <strong>Built for informed decisions</strong>
          <p>All figures are illustrative demo data. Review the strategy and risk details on each Farm profile.</p>
        </div>
        <div className="explore-stats">
          <span><strong>{farms.length}</strong> active Farms</span>
          <span><strong>{money(farms.reduce((sum, farm) => sum + farm.tvl, 0), true)}</strong> demo TVL</span>
        </div>
      </section>
      <div className="list-toolbar explore-toolbar">
        <label className="search-input"><Search size={16} /><input aria-label="Search public farms" placeholder="Search by Farm name…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select aria-label="Filter by risk" value={risk} onChange={(event) => setRisk(event.target.value)}>
          {["All risk levels", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((level) => <option key={level}>{level}</option>)}
        </select>
      </div>
      <div className="explore-grid">
        {farms.map((farm) => (
          <article className="explore-card" key={farm.id}>
            <div className="card-top">
              <span className={`icon-tile ${farm.type.toLowerCase()}`}>
                {farm.icon ? <img src={farm.icon} alt="" /> : <StrategyIcon type={farm.type} />}
              </span>
              <Risk level={farm.risk} />
            </div>
            <div>
              <span className="farm-kicker"><NetworkIcon network={farm.network} size={18} /> {farm.type} · {farm.network}</span>
              <h2>{farm.name}</h2>
              <p>{String(farm.values.description || "A transparent onchain Farm with clearly defined strategy controls.")}</p>
            </div>
            <div className="explore-card-metrics">
              <div><span>APY</span><strong>{farm.apy}%</strong></div>
              <div><span>TVL</span><strong>{money(farm.tvl, true)}</strong></div>
              <div><span>30D</span><strong className="positive">+{farm.performance}%</strong></div>
            </div>
            <div className="farm-manager-line"><span className="avatar small-avatar">AM</span><span>Managed by <strong>Alex Morgan</strong><small>Demo manager profile</small></span></div>
            <Link className="button primary full" href={farmDetailHref(farm.id)}>Review Farm <ArrowRight size={15} /></Link>
          </article>
        ))}
      </div>
      {!farms.length && <EmptyState title="No matching Farms" description="Try another Farm name, network, or risk level." />}
    </>
  );
}
function Dashboard({ network, enhanced }: { network: string; enhanced: boolean }) {
  const app = useApp();
  const farms = app.farms.filter(
    (f) => network === "All Chains" || f.network === network,
  );
  const aggregate = portfolioMetrics(farms);
  const { active, drafts, managedCapital: tvl } = aggregate;
  const [range, setRange] = useState(30);
  const curve = Array.from(
    { length: 60 },
    (_, i) =>
      tvl *
      (0.91 +
        i * 0.0015 +
        Math.sin(i * 1.5) * 0.004 +
        Math.cos(i * 0.6) * 0.007) *
      (range === 90 ? 0.85 + i * 0.0025 : 1),
  );
  const projectedYield = tvl * (aggregate.blendedApy / 100);
  const modeledManagementFee = tvl * 0.01;
  const modeledPerformanceFee = projectedYield * 0.1;
  const allocationAmount = (type: StrategyType) =>
    aggregate.allocation.find((item) => item.type === type)?.amount || 0;
  const indexAllocation = tvl ? allocationAmount("INDEX") / tvl * 100 : 0;
  const spotAllocation = tvl ? allocationAmount("SPOT") / tvl * 100 : 0;
  function exportCapitalReport() {
    const rows = [
      "Farm,Strategy,Network,TVL,APY,30D performance,Status",
      ...farms.map((farm) =>
        [farm.name, farm.type, farm.network, farm.tvl, farm.apy, farm.performance, farm.status].join(","),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dexponent-capital-overview.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    app.toast("Capital overview exported");
  }
  return (
    <>
      <PageHeading
        eyebrow="EXECUTIVE FINANCIAL SUMMARY"
        title={enhanced ? "Farm overview" : "Capital overview"}
        description="Monitor managed liquidity, capital flows, performance, and risk across every active Farm."
        action={
          <div className="heading-actions">
            {!enhanced && <button className="button" onClick={exportCapitalReport}>
              <ArrowDownToLine size={16} /> Export report
            </button>}
            <CreateButton />
          </div>
        }
      />
      <div className={`overview-metrics capital-metrics ${enhanced ? "six-metrics" : ""}`}>
        <Metric
          label="Managed capital"
          value={money(tvl)}
          caption="across active Farms · demo"
        />
        <Metric
          label="Active farms"
          value={String(active.length).padStart(2, "0")}
          caption={`${drafts.length} draft${drafts.length === 1 ? "" : "s"} in progress`}
        />
        <Metric
          label="Net trajectory · 30D"
          value={`${aggregate.netTrajectory30d >= 0 ? "+" : ""}${aggregate.netTrajectory30d.toFixed(2)}%`}
          caption="TVL-weighted · demo"
        />
        <Metric
          label="Blended APY"
          value={`${aggregate.blendedApy.toFixed(2)}%`}
          caption="TVL-weighted · demo"
        />
        {enhanced && <Metric
          label="Withdrawable capital"
          value={money(aggregate.withdrawableCapital, true)}
          caption={`${aggregate.withdrawablePct.toFixed(1)}% of managed capital · demo`}
        />}
        {enhanced && <Metric
          label="Total LPs"
          value={aggregate.totalLps.toLocaleString()}
          caption={`largest depositor ${aggregate.topHolderPct.toFixed(1)}% of managed capital`}
        />}
      </div>
      <div className="dashboard-middle">
        <section className="panel portfolio-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">TRAJECTORY</span>
              <h3>Portfolio performance</h3>
              <p>
                Value across your active farms{" "}
                <span className="subtle-label">DEMO DATA</span>
              </p>
            </div>
            <div className="segmented">
              {[30, 90, 365].map((d) => (
                <button
                  key={d}
                  className={range === d ? "active" : ""}
                  aria-pressed={range === d}
                  onClick={() => setRange(d)}
                >
                  {d === 365 ? "1Y" : `${d}D`}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-summary">
            <AnimatedValue value={money(tvl)} />
            <span className="positive">
              <ArrowUpRight size={15} />
              {performanceForRange(aggregate.netTrajectory30d, range).toFixed(2)}%{" "}
              <span className="muted">sample period</span>
            </span>
          </div>
          {tvl > 0 ? (
            <>
              <div className="chart-with-axis">
                <PerformanceChart
                  points={
                    range === 365
                      ? curve.map((v, i) => v * (0.7 + i * 0.005))
                      : curve
                  }
                />
                <div className="chart-y">
                  <span>{money(tvl * 1.02, true)}</span>
                  <span>{money(tvl * 0.95, true)}</span>
                  <span>{money(tvl * 0.88, true)}</span>
                </div>
              </div>
              <div className="chart-axis">
                <span>
                  {range === 365
                    ? "Sep 2025"
                    : range === 90
                      ? "Jun 2026"
                      : "Aug 08"}
                </span>
                <span>
                  {range === 365
                    ? "Jan 2026"
                    : range === 90
                      ? "Jul 2026"
                      : "Aug 18"}
                </span>
                <span>
                  {range === 365
                    ? "May 2026"
                    : range === 90
                      ? "Aug 2026"
                      : "Aug 28"}
                </span>
                <span>Sep 07</span>
              </div>
            </>
          ) : (
            <EmptyState
              title="No performance data"
              description="This network has no active demo farms."
            />
          )}
        </section>
        <section className="panel allocation-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">CAPITAL MIX</span>
              <h3>Capital allocation</h3>
            </div>
            <SlidersHorizontal size={15} />
          </div>
          <div
            className="allocation-donut"
            style={{
              background: tvl
                ? `conic-gradient(var(--accent) 0 ${indexAllocation}%, #f472b6 ${indexAllocation}% ${indexAllocation + spotAllocation}%, #94dcb5 ${indexAllocation + spotAllocation}% 100%)`
                : "var(--border)",
            }}
          >
            <div>
              <span>STRATEGIES</span>
              <AnimatedValue value={String(new Set(active.map((f) => f.type)).size)} />
              <small>in your portfolio</small>
            </div>
          </div>
          <div className="allocation-legend">
            {families.map((f) => {
              const amount = allocationAmount(f.type);
              return (
                <div key={f.type}>
                  <span className={`legend-dot ${f.type.toLowerCase()}`} />
                  <span>{f.title}</span>
                  <strong>{tvl ? Math.round((amount / tvl) * 100) : 0}%</strong>
                  <small>{money(amount, true)}</small>
                </div>
              );
            })}
          </div>
          <div className="allocation-note">
            <Shield size={13} />
            Demo risk mix: medium to high
          </div>
        </section>
      </div>
      <section className="panel cost-panel">
        <div className="cost-panel-copy">
          <span className="panel-kicker">COST BREAKDOWN</span>
          <h3>Modeled annual fee load</h3>
          <p>Estimated from a 1% management fee and 10% performance fee on projected yield. Review each Farm for configured terms.</p>
        </div>
        <div className="cost-rows">
          <div>
            <span>Management fees</span>
            <AnimatedValue value={money(modeledManagementFee, true)} />
            <i style={{ width: "68%" }} />
          </div>
          <div>
            <span>Performance fees</span>
            <AnimatedValue value={money(modeledPerformanceFee, true)} />
            <i style={{ width: "42%" }} />
          </div>
          <div>
            <span>Projected net yield</span>
            <AnimatedValue className="positive" value={money(Math.max(0, projectedYield - modeledManagementFee - modeledPerformanceFee), true)} />
            <i className="positive-bar" style={{ width: "84%" }} />
          </div>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <h2>
            Managed farms{" "}
            <span className="count-pill">
              {farms.filter((f) => f.status !== "DRAFT").length}
            </span>
          </h2>
          <p>A closer look at the Farms you’re managing.</p>
        </div>
        <Link className="text-link" href="/app/farms">
          View all farms <ArrowRight size={15} />
        </Link>
      </div>
      <FarmTable
        farms={farms.filter((f) => f.status !== "DRAFT").slice(0, 4)}
      />
      <div className="dashboard-bottom">
        <section className="start-banner">
          <div className="icon-tile">
            <Plus size={22} />
          </div>
          <div>
            <h3>Your next strategy starts here.</h3>
            <p>
              A curated template. A few thoughtful decisions. Your next farm.
            </p>
          </div>
          <Link className="button" href="/app/templates">
            Explore templates <ArrowRight size={15} />
          </Link>
        </section>
        <Link href="/app/farms/drafts" className="draft-banner">
          <FileText size={21} />
          <div>
            <h3>Pick up where you left off</h3>
            <p>{drafts.length} saved drafts in your workspace</p>
          </div>
          <ArrowRight size={17} />
        </Link>
      </div>
    </>
  );
}
function FarmTable({ farms }: { farms: Farm[] }) {
  return (
    <div className="farm-table-wrap">
      {!farms.length ? (
        <EmptyState
          title="Space for your next strategy"
          description="Create a farm from a template to get started."
          href="/app/farms/new"
        />
      ) : (
        <table className="farm-table">
          <thead>
            <tr>
              <th>Farm</th>
              <th>Status</th>
              <th>TVL</th>
              <th>APY</th>
              <th>30D performance</th>
              <th>Base token</th>
              <th aria-label="Manage" />
            </tr>
          </thead>
          <tbody>
            {farms.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link className="farm-name" href={farmDetailHref(f.id)}>
                    <span className={`icon-tile ${f.type.toLowerCase()}`}>
                      <StrategyIcon type={f.type} size={18} />
                    </span>
                    <span>
                      <strong>{f.name}</strong>
                      <small>
                        <span className={`strategy-tag ${f.type.toLowerCase()}`}>{f.type}</span>
                        <span>·</span>{" "}{f.network} Network
                      </small>
                    </span>
                  </Link>
                </td>
                <td>
                  <Badge
                    tone={
                      f.status === "ACTIVE"
                        ? "mint"
                        : f.status === "READY"
                          ? "blue"
                          : "amber"
                    }
                  >
                    {f.status.charAt(0) + f.status.slice(1).toLowerCase()}
                  </Badge>
                </td>
                <td className="numeric">
                  {f.source === "demo" ? money(f.tvl, true) : "—"}
                </td>
                <td className="numeric">
                  {f.source === "demo" ? `${f.apy}%` : "—"}
                </td>
                <td>
                  <div className="table-performance">
                    <span className="positive">
                      {f.source === "demo"
                        ? `+${f.performance.toFixed(2)}%`
                        : "No live data"}
                    </span>
                    {f.source === "demo" && (
                      <PerformanceChart
                        mini
                        points={Array.from(
                          { length: 22 },
                          (_, i) =>
                            100 +
                            (i * f.performance) / 14 +
                            Math.sin(i * 2) * 0.8,
                        )}
                      />
                    )}
                  </div>
                </td>
                <td>
                  <span className="network-name">
                    <AssetIcon symbol={String(f.values.asset || "USDC")} size={19} />
                    {String(f.values.asset || "USDC")}
                  </span>
                </td>
                <td>
                  <Link
                    className="icon-button"
                    aria-label={`Manage ${f.name}`}
                    href={farmDetailHref(f.id)}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
function FarmList({ drafts, network }: { drafts: boolean; network: string }) {
  const app = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All strategies");
  const [deleting, setDeleting] = useState<Farm | null>(null);
  const visible = app.farms.filter(
    (f) =>
      (network === "All Chains" || f.network === network) &&
      (!drafts || f.status === "DRAFT" || f.status === "SIMULATION") &&
      (filter === "All strategies" || f.type === filter) &&
      f.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR STRATEGY WORKSPACE"
        title={drafts ? "A place for your next ideas." : "My farms"}
        description={
          drafts
            ? "Your work is saved. Continue whenever inspiration strikes."
            : "Create, monitor, and fine-tune your Farms."
        }
        action={<CreateButton />}
      />
      <div className="tabs">
        <Link className={!drafts ? "active" : ""} href="/app/farms">
          All farms <span>{app.farms.length}</span>
        </Link>
        <Link className={drafts ? "active" : ""} href="/app/farms/drafts">
          Drafts{" "}
          <span>
            {
              app.farms.filter(
                (f) => f.status === "DRAFT" || f.status === "SIMULATION",
              ).length
            }
          </span>
        </Link>
      </div>
      <div className="list-toolbar">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Search farms"
            placeholder="Search farms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter strategy"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All strategies", "INDEX", "SPOT", "PERPETUAL"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="muted small">{visible.length} farms</span>
      </div>
      {drafts ? (
        <div className="draft-grid">
          {visible.map((f) => (
            <section className="panel draft-card" key={f.id}>
              <div className="card-top">
                <span className={`icon-tile ${f.type.toLowerCase()}`}>
                  <StrategyIcon type={f.type} />
                </span>
                <Badge>Draft</Badge>
              </div>
              <h3>{f.name || "Untitled farm"}</h3>
              <p>
                {f.type} · {f.network}
              </p>
              <div className="draft-progress">
                <div style={{ width: `${((f.step + 1) / 6) * 100}%` }} />
              </div>
              <small className="muted">
                Step {f.step + 1} of 6 · Updated{" "}
                {new Date(f.updatedAt).toLocaleDateString()}
              </small>
              <div className="card-actions">
                <Link
                  className="button primary"
                  href={`/app/farms/new?draft=${f.id}`}
                >
                  Continue draft <ArrowRight size={14} />
                </Link>
                <button
                  className="icon-button"
                  aria-label={`Delete ${f.name}`}
                  onClick={() => setDeleting(f)}
                >
                  <X size={17} />
                </button>
              </div>
            </section>
          ))}
          {visible.length === 0 && (
            <EmptyState
              title={query ? "No matching drafts" : "A clean slate"}
              description="Your new strategies will be saved here automatically."
              href="/app/farms/new"
            />
          )}
        </div>
      ) : (
        <FarmTable farms={visible} />
      )}
      <p className="table-footnote">
        Sample farm metrics are illustrative. Local strategies have no live TVL
        or performance.
      </p>
      {deleting && (
        <Modal title="Delete this draft?" onClose={() => setDeleting(null)}>
          <p>
            Remove “{deleting.name}” from this browser? This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setDeleting(null)}>
              Keep draft
            </button>
            <button
              className="button danger"
              onClick={() => {
                app.deleteFarm(deleting.id);
                setDeleting(null);
                app.toast("Draft deleted");
              }}
            >
              Delete draft
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function TemplateLibrary({
  strategies,
  id,
}: {
  strategies: boolean;
  id?: string;
}) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const t = id ? templateById(id) : null;
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("type");
    if (q && ["INDEX", "SPOT", "PERPETUAL"].includes(q)) setFilter(q);
  }, []);
  if (id && !t)
    return (
      <EmptyState
        title="Template not found"
        description="Explore the available strategies in your library."
        href="/app/templates"
        label="View templates"
      />
    );
  if (t)
    return (
      <>
        <PageHeading
          eyebrow={`${t.type} / TEMPLATE`}
          title={t.name}
          description={t.description}
          action={
            <Link
              className="button primary"
              href={`/app/farms/new?template=${t.id}`}
            >
              Start from template <ArrowRight size={16} />
            </Link>
          }
        />
        <div className="detail-grid">
          <section className="panel">
            <div className="panel-heading">
              <h3>At a glance</h3>
              <Risk level={t.risk} />
            </div>
            <div className="review-values">
              <div>
                <span>Complexity</span>
                <strong>{t.complexity}</strong>
              </div>
              <div>
                <span>Typical assets</span>
                <strong><AssetList symbols={t.assets} size={18} /></strong>
              </div>
              <div>
                <span>Modeled protocols</span>
                <strong>{t.protocols.join(", ")}</strong>
              </div>
              <div>
                <span>Preview networks</span>
                <strong>{t.networks.join(", ")}</strong>
              </div>
              <div>
                <span>Management fee default</span>
                <strong>{t.defaults.managementFee}%</strong>
              </div>
            </div>
            <Notice>
              Templates are configurable starting points. Risk labels are
              illustrative, and no underlying integration or audit is implied.
            </Notice>
            <h3 className="spaced">Configuration controls</h3>
            <div className="control-tags">
              {t.fields.map((f) => (
                <span key={f.key}>{f.label}</span>
              ))}
            </div>
          </section>
          <StrategyFlow
            type={t.type}
            values={t.defaults}
            allocations={makeFarm(t, "preview").allocations}
          />
        </div>
      </>
    );
  const filtered = templates.filter(
    (t) =>
      (filter === "ALL" || filter === t.type) &&
      `${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={
          strategies ? "FIND YOUR APPROACH" : "A THOUGHTFUL STARTING POINT"
        }
        title={
          strategies
            ? "Different strategies. One workspace."
            : "The template library."
        }
        description="Proven strategy concepts, with room for your own perspective."
        action={<CreateButton />}
      />
      {strategies && (
        <div className="family-grid strategy-library">
          {families.map((f) => (
            <button
              className={`family-card ${f.type.toLowerCase()} ${filter === f.type ? "selected" : ""}`}
              key={f.type}
              onClick={() => setFilter(f.type)}
            >
              <span className="icon-tile">
                <StrategyIcon type={f.type} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
              <Risk level={f.risk} />
            </button>
          ))}
        </div>
      )}
      <div className="library-toolbar">
        <div className="tabs">
          {["ALL", "INDEX", "SPOT", "PERPETUAL"].map((s) => (
            <button
              key={s}
              className={s === filter ? "active" : ""}
              onClick={() => setFilter(s)}
            >
              {s === "ALL"
                ? "All templates"
                : s.charAt(0) + s.slice(1).toLowerCase()}
              <span>
                {s === "ALL"
                  ? templates.length
                  : templates.filter((t) => t.type === s).length}
              </span>
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Search templates"
            placeholder="Find a template…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="template-grid">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/app/templates/${t.id}`}
            className="template-card"
          >
            <div className="card-top">
              <span className={`icon-tile ${t.type.toLowerCase()}`}>
                <StrategyIcon type={t.type} />
              </span>
              <span className="tag">{t.type}</span>
            </div>
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <div className="template-meta">
              <Risk level={t.risk} />
              <span>{t.complexity}</span>
            </div>
            <div className="template-bottom">
              <AssetList symbols={t.assets} size={17} />
              <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          title="No matching templates"
          description="Try a different search or strategy family."
        />
      )}
    </>
  );
}
type FarmTransaction = {
  hash: string;
  wallet: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  status: "Confirmed" | "Pending" | "Reverted";
  timestamp: string;
  failureReason?: string;
};

function demoHex(seed: string, length: number) {
  let state = 2166136261;
  let output = "";
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619) >>> 0;
  }
  for (let index = 0; output.length < length; index += 1) {
    state ^= index + 0x9e3779b9;
    state = Math.imul(state, 2246822519) >>> 0;
    output += state.toString(16).padStart(8, "0");
  }
  return output.slice(0, length);
}

function farmTransactions(farm: Farm): FarmTransaction[] {
  if (farm.source === "local" && farm.tvl === 0) return [];
  const base = Number.isNaN(Date.parse(farm.updatedAt))
    ? Date.UTC(2026, 8, 18, 10, 30)
    : Math.max(Date.parse(farm.updatedAt), Date.UTC(2026, 8, 12, 10, 30));
  const amounts = [25_000, 8_500, 42_000, 12_750, 6_200, 31_400, 18_000, 9_600, 14_250, 5_800, 21_750, 11_400];
  return Array.from({ length: 42 }, (_, index) => ({
    hash: `0x${demoHex(`${farm.id}:transaction:${index}`, 64)}`,
    wallet: `0x${demoHex(`${farm.id}:wallet:${index % 11}`, 40)}`,
    type: index % 4 === 3 || index % 9 === 6 ? "Withdrawal" as const : "Deposit" as const,
    amount: amounts[index % amounts.length] + Math.floor(index / amounts.length) * 650,
    status: index === 0 || index === 17
      ? "Pending" as const
      : index === 4 || index === 29
        ? "Reverted" as const
        : "Confirmed" as const,
    timestamp: new Date(base - index * 7_980_000).toISOString(),
    ...(index === 4 || index === 29 ? { failureReason: index === 4 ? "LP allowance changed before execution" : "Transaction exceeded its gas limit" } : {}),
  }));
}

function shortAddress(value: string, start = 6, end = 4) {
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

function FarmTransactionLedger({ farm, transactions }: { farm: Farm; transactions: FarmTransaction[] }) {
  const app = useApp();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | FarmTransaction["type"]>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | FarmTransaction["status"]>("All");
  const [range, setRange] = useState<"7" | "30" | "all">("7");
  const [page, setPage] = useState(1);
  const [failedTransaction, setFailedTransaction] = useState<FarmTransaction | null>(null);
  const pageSize = 5;
  const asset = String(farm.values.asset || "USDC");
  const newestTimestamp = transactions.length ? Math.max(...transactions.map((transaction) => Date.parse(transaction.timestamp))) : Date.now();
  const rangeStart = range === "all" ? 0 : newestTimestamp - Number(range) * 86_400_000;
  const sevenDayStart = newestTimestamp - 7 * 86_400_000;
  const sevenDayConfirmed = transactions.filter((transaction) => transaction.status === "Confirmed" && Date.parse(transaction.timestamp) >= sevenDayStart);
  const inflows = sevenDayConfirmed.filter((transaction) => transaction.type === "Deposit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const outflows = sevenDayConfirmed.filter((transaction) => transaction.type === "Withdrawal").reduce((sum, transaction) => sum + transaction.amount, 0);
  const activeWallets = new Set(sevenDayConfirmed.map((transaction) => transaction.wallet)).size;
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = transactions.filter((transaction) =>
    (!normalizedQuery || transaction.hash.toLowerCase().includes(normalizedQuery) || transaction.wallet.toLowerCase().includes(normalizedQuery))
    && (typeFilter === "All" || transaction.type === typeFilter)
    && (statusFilter === "All" || transaction.status === statusFilter)
    && Date.parse(transaction.timestamp) >= rangeStart,
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [query, typeFilter, statusFilter, range]);

  async function copyValue(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    app.toast(`${label} copied.`);
  }

  function exportCsv() {
    const rows = [
      ["Transaction hash", "LP wallet", "Type", "Amount", "Asset", "Status", "Timestamp UTC", "Failure reason"],
      ...filtered.map((transaction) => [transaction.hash, transaction.wallet, transaction.type, transaction.amount, asset, transaction.status, transaction.timestamp, transaction.failureReason || ""]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${farm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-transactions.csv`;
    link.click();
    URL.revokeObjectURL(url);
    app.toast(`${filtered.length} transactions exported.`);
  }

  return (
    <section className="panel transaction-ledger">
      <div className="transaction-ledger-head">
        <div><span className="eyebrow">LP CAPITAL ACTIVITY</span><h3>Farm transactions</h3><p>Deposits and withdrawals for this Farm.</p></div>
        <button className="button transaction-export" onClick={exportCsv} disabled={!filtered.length}><ArrowDownToLine size={17} />Export CSV</button>
      </div>
      {transactions.length ? (
        <>
          <div className="transaction-summary" aria-label="Seven day capital activity summary">
            <div><span>Total inflows (7d)</span><strong className="positive">+{money(inflows)}</strong></div>
            <div><span>Total outflows (7d)</span><strong>−{money(outflows)}</strong></div>
            <div><span>Net flow (7d)</span><strong className={inflows - outflows >= 0 ? "positive" : "negative"}>{inflows - outflows >= 0 ? "+" : "−"}{money(Math.abs(inflows - outflows))}</strong></div>
            <div><span>Unique LPs active</span><strong>{activeWallets}</strong></div>
          </div>
          <div className="transaction-toolbar">
            <label className="transaction-search"><Search size={18} /><input aria-label="Search wallet or transaction hash" placeholder="Search wallet or tx hash…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button aria-label="Clear transaction search" onClick={() => setQuery("")}><X size={14} /></button>}</label>
            <div className="transaction-filters">
              <label><span className="sr-only">Transaction type</span><select aria-label="Transaction type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}><option value="All">All types</option><option>Deposit</option><option>Withdrawal</option></select><ChevronDown size={13} /></label>
              <label><span className="sr-only">Transaction status</span><select aria-label="Transaction status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="All">All statuses</option><option>Confirmed</option><option>Pending</option><option>Reverted</option></select><ChevronDown size={13} /></label>
              <label className="date-filter"><CalendarBlank size={16} /><span className="sr-only">Transaction date range</span><select aria-label="Transaction date range" value={range} onChange={(event) => setRange(event.target.value as typeof range)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select><ChevronDown size={13} /></label>
            </div>
          </div>
          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead><tr><th>Transaction hash</th><th>LP wallet</th><th>Type</th><th>Amount</th><th>Status</th><th>Date &amp; time · UTC</th></tr></thead>
              <tbody>{visible.map((transaction) => (
                <tr key={transaction.hash}>
                  <td><span className="transaction-copy-value"><span className="mono transaction-hash" title={transaction.hash}>{shortAddress(transaction.hash, 10, 6)}</span><button aria-label={`Copy transaction hash ${shortAddress(transaction.hash)}`} onClick={() => copyValue(transaction.hash, "Transaction hash")}><Copy size={14} /></button></span></td>
                  <td><span className="transaction-copy-value"><span className="mono" title={transaction.wallet}>{shortAddress(transaction.wallet)}</span><button aria-label={`Copy LP wallet ${shortAddress(transaction.wallet)}`} onClick={() => copyValue(transaction.wallet, "LP wallet")}><Copy size={14} /></button></span></td>
                  <td><span className={`transaction-type ${transaction.type.toLowerCase()}`}>{transaction.type}</span></td>
                  <td><strong className={transaction.status === "Reverted" ? "muted" : transaction.type === "Deposit" ? "positive" : ""}>{transaction.type === "Withdrawal" ? "−" : "+"}{transaction.amount.toLocaleString()} {asset}</strong></td>
                  <td><span className={`transaction-status ${transaction.status.toLowerCase()}`}><i />{transaction.status}</span>{transaction.failureReason && <button className="transaction-error" onClick={() => setFailedTransaction(transaction)}>View error</button>}</td>
                  <td><time dateTime={transaction.timestamp}>{new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(transaction.timestamp))}</time></td>
                </tr>
              ))}</tbody>
            </table>
            {!visible.length && <div className="transaction-empty"><Search size={20} /><strong>No matching transactions</strong><span>Clear a filter or search for another wallet.</span></div>}
          </div>
          <div className="transaction-footer"><span>Showing {visible.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} transactions</span><div><button className="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {page} of {totalPages}</span><button className="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></div></div>
          <p className="table-footnote">Illustrative transactions for product demonstration. Hashes are not linked to a live network.</p>
        </>
      ) : <EmptyState title="No LP transactions yet" description="Deposits and withdrawals will appear here after this Farm receives capital." />}
      {failedTransaction && (
        <Modal title="Transaction reverted" onClose={() => setFailedTransaction(null)}>
          <div className="stack">
            <Notice tone="warning">
              <strong>{failedTransaction.failureReason}</strong>
              <p>The LP deposit or withdrawal was not completed and no Farm balance changed.</p>
            </Notice>
            <div className="review-list">
              <div><span>Transaction</span><strong className="mono">{shortAddress(failedTransaction.hash, 10, 6)}</strong></div>
              <div><span>LP wallet</span><strong className="mono">{shortAddress(failedTransaction.wallet)}</strong></div>
              <div><span>Attempted amount</span><strong>{failedTransaction.type === "Withdrawal" ? "−" : "+"}{failedTransaction.amount.toLocaleString()} {asset}</strong></div>
              <div><span>Status</span><strong className="negative">Reverted</strong></div>
            </div>
            <div className="modal-actions">
              <button className="button" onClick={() => copyValue(failedTransaction.hash, "Transaction hash")}><Copy size={15} />Copy transaction hash</button>
              <button className="button primary" onClick={() => setFailedTransaction(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function FarmDetail({ id, tab, enhanced }: { id: string; tab?: string; enhanced: boolean }) {
  const app = useApp();
  const farm = app.farms.find((f) => f.id === id);
  const [activeTab, setActiveTab] = useState(
    tab === "analytics" ? "Performance" : "Overview",
  );
  const [action, setAction] = useState("");
  const [period, setPeriod] = useState(30);
  const [actionError, setActionError] = useState("");
  if (!farm)
    return (
      <EmptyState
        title="Farm not found"
        description="It may be saved in another browser workspace."
        href="/app/farms"
        label="View farms"
      />
    );
  const t = templateById(farm.templateId)!;
  const data = simulate(
    { ...farm.values, assumedApr: farm.apy || 12 },
    farm.type,
    "Base",
    period,
  );
  const local = farm.source === "local";
  const demoPosition = Number(farm.values.demoPosition || 0);
  const configuredPair = perpetualPair(farm);
  const financial = farmFinancialMetrics(farm);
  const perpHealth = farm.type === "PERPETUAL" ? perpetualHealth(farm) : null;
  const currentIndexWeights = farm.type === "INDEX" ? indexWeights(farm) : [];
  const spotHealth = farm.type === "SPOT" ? spotComposition(farm) : null;
  const transactions = farmTransactions(farm);
  const farmAgeDays = Math.max(0, Math.floor((Date.now() - Date.parse(farm.createdAt)) / 86_400_000));
  const farmAgeMonths = Math.floor(farmAgeDays / 30.4375);
  const farmAge = farmAgeDays < 1
    ? "New"
    : farmAgeDays < 30
      ? `${farmAgeDays} day${farmAgeDays === 1 ? "" : "s"}`
      : farmAgeMonths < 12
        ? `${farmAgeMonths} month${farmAgeMonths === 1 ? "" : "s"}`
        : `${Math.floor(farmAgeMonths / 12)}y ${farmAgeMonths % 12}m`;
  const driftedAssets = currentIndexWeights.filter((weight) => weight.flagged);
  function closeAction() {
    setAction("");
    setActionError("");
  }
  function confirmAction() {
    if (!farm) return;
    try {
      const updated = action === "Rebalance index"
        ? {
            ...farm,
            values: currentIndexWeights.reduce(
              (values, weight) => ({ ...values, [`currentWeight_${weight.asset}`]: weight.weight }),
              { ...farm.values },
            ),
            updatedAt: new Date().toISOString(),
            events: [...farm.events, "Index rebalanced to target weights · local demo action"],
          }
        : {
            ...farm,
            updatedAt: new Date().toISOString(),
            events: [...farm.events, `${action} · local demo action`],
          };
      app.saveFarm(updated);
      closeAction();
      app.toast(
        action === "Rebalance index"
          ? "Demo rebalance completed. All assets now match their target weights."
          : "Demo Farm updated. No blockchain transaction was sent.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update Farm.",
      );
    }
  }
  return (
    <>
      <section className="farm-detail-hero">
        <div className={`farm-detail-mark ${farm.type.toLowerCase()}`}>
          {farm.icon ? <img src={farm.icon} alt="" /> : <StrategyIcon type={farm.type} />}
        </div>
        <div className="farm-detail-identity">
          <div className="farm-detail-tags">
            <span className={`strategy-tag ${farm.type.toLowerCase()}`}>{farm.type}</span>
            <span className="farm-network-tag"><NetworkIcon network={farm.network} size={16} />{farm.network}</span>
            <Badge tone={farm.status === "ACTIVE" ? "mint" : "amber"}>{farm.status}</Badge>
          </div>
          <h1>{farm.name || "Untitled farm"}</h1>
          <p>{String(farm.values.description || (local ? "Your strategy configuration and deployment plan." : "Performance, positions, and the decisions behind your strategy."))}</p>
        </div>
        <div className="heading-actions farm-detail-actions">
          {farm.type === "PERPETUAL" && !local && (
            <Link className="button primary" href={farmTradeHref(id)}><TrendUp size={16} /> Trade on Hyperliquid</Link>
          )}
          {enhanced && farm.type === "SPOT" && !local && (
            <>
              <button className="button" onClick={() => setAction("Swap assets")}><ArrowsLeftRight size={16} /> Swap</button>
              <button className="button primary" onClick={() => setAction("Buy or sell spot assets")}><TrendUp size={16} /> Buy / sell</button>
            </>
          )}
          {enhanced && farm.type === "INDEX" && !local && (
            <>
              <button className="button danger-soft" onClick={() => setAction("Liquidate index")}><Scales size={16} /> Liquidate</button>
              <button className="button primary rebalance-button" onClick={() => setAction("Rebalance index")}><ArrowsClockwise size={16} /> Rebalance</button>
            </>
          )}
          {local && <Link className="button primary" href={`/app/farms/new?draft=${id}`}>Continue setup <ArrowRight size={15} /></Link>}
        </div>
        <div className="farm-detail-facts">
          <span><AssetIcon symbol={String(farm.values.asset || "USDC")} size={26} /><small>Base token</small><strong>{String(farm.values.asset || "USDC")}</strong></span>
          <span><small>Strategy</small><strong>{farm.type === "INDEX" ? String(farm.values.allocationMethod || t.name) : farm.type === "SPOT" ? String(farm.values.strategy || t.name) : String(farm.values.direction || t.name)}</strong></span>
          <span><small>Farm age</small><strong>{farmAge}</strong></span>
          <span><small>TVL</small><strong>{local ? "—" : money(farm.tvl, true)}</strong></span>
          <span><small>Current APY</small><strong className="positive">{local ? "—" : `${financial.currentApy.toFixed(2)}%`}</strong></span>
        </div>
        {farm.type === "INDEX" && driftedAssets.length > 0 && (
          <div className="farm-rebalance-alert"><Shield size={17} />Rebalance due · {driftedAssets.map((weight) => `${weight.asset} drifted ${weight.drift >= 0 ? "+" : ""}${weight.drift.toFixed(1)}pp`).join(", ")}</div>
        )}
      </section>
      <div className="tabs detail-tabs">
        {[
          "Overview",
          "Positions",
          "Strategy",
          "Documents",
          "Transactions",
        ].map((s) => (
          <button
            key={s}
            className={activeTab === s ? "active" : ""}
            onClick={() => setActiveTab(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {farm.type === "PERPETUAL" && activeTab === "Overview" && (
        <section className="panel perp-market-card">
          <div className="perp-pair-identity">
            <span className="pair-icons">
              <AssetIcon symbol={String(farm.values.underlying || "ETH")} size={34} />
              <AssetIcon symbol={String(farm.values.quoteAsset || "USDC")} size={28} />
            </span>
            <div>
              <span className="eyebrow">MARKET PAIR</span>
              <h2>{configuredPair}</h2>
              <small>{String(farm.values.venue || "Hyperliquid")} · Demo execution venue</small>
            </div>
          </div>
          <div className="perp-market-facts">
            <div><span>Direction</span><strong>{String(farm.values.direction)}</strong></div>
            <div><span>Leverage</span><strong>{farm.values.leverage}×</strong></div>
            <div><span>Margin</span><strong>{Number(farm.values.margin).toLocaleString()} {String(farm.values.asset)}</strong></div>
            <div><span>Funding trigger</span><strong>{farm.values.fundingThreshold}% / 8h</strong></div>
          </div>
          {!local && (
            <Link className="button primary" href={farmTradeHref(id)}>
              Open trading dashboard <ArrowRight size={15} />
            </Link>
          )}
        </section>
      )}
      {local && (
        <Notice>
          This is a local strategy. No contract is deployed, no assets are held,
          and performance is unavailable.
        </Notice>
      )}
      {activeTab === "Overview" && (
        <>
          {enhanced ? (
            <>
              <div className="overview-metrics farm-health-metrics">
                <Metric label="Total value locked" value={local ? "—" : money(farm.tvl)} caption={local ? "Not deployed" : "Demo Farm liquidity"} />
                <Metric label="Current APY" value={local ? "—" : `${financial.currentApy.toFixed(2)}%`} caption="Trailing 30D · demo" />
                {farm.type === "PERPETUAL" && perpHealth ? <>
                  <div className="metric"><span>Margin health</span><AnimatedValue className={perpHealth.marginHealth >= 70 ? "positive" : perpHealth.marginHealth >= 40 ? "warning-text" : "negative"} value={`${perpHealth.marginHealth.toFixed(0)}%`} /><small>Liquidation buffer · demo</small></div>
                  <Metric label="Funding rate · 8h" value={`${perpHealth.fundingRate >= 0 ? "+" : ""}${perpHealth.fundingRate.toFixed(4)}%`} caption={perpHealth.fundingRate >= 0 ? "Received · demo" : "Paid · demo"} />
                </> : <>
                  <Metric label="30D performance" value={local ? "—" : `${farm.performance >= 0 ? "+" : ""}${farm.performance.toFixed(2)}%`} caption="Net performance · demo" />
                  <Metric label={farm.type === "SPOT" ? "Impermanent loss" : "Active LPs"} value={farm.type === "SPOT" && spotHealth ? `${spotHealth.impermanentLoss.toFixed(2)}%` : local ? "—" : financial.activeLps.toLocaleString()} caption={farm.type === "SPOT" ? "Current pool position · demo" : `top holder ${financial.topHolderPct.toFixed(1)}% of TVL`} />
                </>}
              </div>
              {farm.type === "SPOT" && spotHealth && <section className="panel spot-composition-panel"><div className="panel-heading"><div><h3>Asset composition</h3><p>Current token weights in the demo pool position.</p></div></div><div className="composition-track">{spotHealth.assets.map((asset) => <i key={asset.asset} style={{ width: `${asset.weight}%` }} title={`${asset.asset} ${asset.weight}%`} />)}</div><div className="composition-assets">{spotHealth.assets.map((asset) => <span key={asset.asset}><AssetIcon symbol={asset.asset} size={22} /><strong>{asset.asset}</strong><small>{asset.weight}%</small></span>)}</div></section>}
            </>
          ) : (
            <div className="overview-metrics">
              <Metric label="Total value locked" value={local ? "—" : money(farm.tvl)} caption={local ? "Not deployed" : "Sample data"} />
              <Metric label="APY" value={local ? "—" : `${farm.apy}%`} caption="Demo annualized yield" />
              <Metric label="30D performance" value={local ? "—" : `+${farm.performance}%`} caption="Sample net performance" />
              <Metric label="Strategy risk" value={farm.risk.charAt(0) + farm.risk.slice(1).toLowerCase()} caption="Illustrative risk category" />
            </div>
          )}
          {!local ? (
            <div className="farm-overview-story">
              <section className="panel farm-performance-panel">
                <div className="panel-heading">
                  <h3>
                    Performance history <span className="subtle-label">DEMO</span>
                  </h3>
                  <div className="segmented">
                    {[30, 90, 365].map((d) => (
                      <button
                        className={period === d ? "active" : ""}
                        key={d}
                        onClick={() => setPeriod(d)}
                      >
                        {d === 365 ? "All time" : `${d}D`}
                      </button>
                    ))}
                  </div>
                </div>
                <TradingViewPerformanceChart points={data.points} days={period} />
              </section>
              <FarmActivityCard farm={farm} transactions={transactions} onViewAll={() => setActiveTab("Transactions")} />
            </div>
          ) : (
            <EmptyState
              title="Performance begins after deployment"
              description="Review hypothetical outcomes in the creation flow while your strategy is being prepared."
            />
          )}
          {activeTab === "Overview" && farm.type === "INDEX" && (
            <IndexAllocationPanel weights={currentIndexWeights} tvl={farm.tvl} />
          )}
          {activeTab === "Overview" && farm.type === "PERPETUAL" && (
            <FarmPerpMarkets farm={farm} />
          )}
        </>
      )}
      {activeTab === "Strategy" && (
        <div className="strategy-workspace-grid">
          <section className="panel strategy-configuration-card">
            <div className="panel-heading">
              <div><span className="eyebrow">LIVE CONFIGURATION</span><h3>Strategy controls</h3></div>
              <Badge>{farm.type}</Badge>
            </div>
            <div className="review-values">
              {t.fields.filter((field) => !["name", "description", "asset", "capacity", "risk", "assumedApr", "managementFee", "performanceFee"].includes(field.key)).slice(0, 8).map((f) => (
                <div key={f.key}>
                  <span>{f.label}</span>
                  <strong>
                    {farm.values[f.key]} {f.unit}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <section className="panel strategy-risk-card">
            <div className="panel-heading">
              <div><span className="eyebrow">RISK &amp; SAFEGUARDS</span><h3>Manager guardrails</h3></div>
              <Risk level={riskFor(t, farm.values)} />
            </div>
            <div className="health-row"><Shield size={16} />Market risk · asset prices can fall</div>
            <div className="health-row"><Shield size={16} />Liquidity risk · exits may be delayed</div>
            <div className="health-row warning-text"><Shield size={16} />Contract verification unavailable</div>
            {farm.type === "PERPETUAL" && <div className="health-row warning-text"><Shield size={16} />Leverage and liquidation risk · {farm.values.leverage}× configured</div>}
            <Notice>Risk categories are illustrative and do not imply that capital is safe.</Notice>
          </section>
          <section className="panel strategy-capital-card">
            <div className="panel-heading"><div><span className="eyebrow">CAPITAL RULES</span><h3>Liquidity &amp; fees</h3></div><Droplets size={18} /></div>
            <div className="review-values">
              <div><span>Base token</span><strong className="token-line"><AssetIcon symbol={String(farm.values.asset)} size={20} />{String(farm.values.asset)}</strong></div>
              <div><span>Available capacity</span><strong>{money(Math.max(0, Number(farm.values.capacity) - farm.tvl), true)}</strong></div>
              <div><span>Withdrawal window</span><strong>24 hours · demo</strong></div>
              <div><span>Management fee</span><strong>{farm.values.managementFee}% / year</strong></div>
              <div><span>Performance fee</span><strong>{farm.values.performanceFee}% of gains</strong></div>
              <div><span>LP concentration</span><strong>{financial.topHolderPct.toFixed(1)}% largest</strong></div>
            </div>
          </section>
          <section className="panel strategy-operations-card">
            <div className="panel-heading"><div><span className="eyebrow">ONCHAIN OPERATIONS</span><h3>Contract &amp; execution</h3></div><Network size={18} /></div>
            <div className="health-row"><Check size={16} />Configuration saved</div>
            <div className="health-row muted"><Clock3 size={16} />Last rebalance: {local ? "Not deployed" : "2 hours ago · demo"}</div>
            <button className="button full" onClick={() => setAction("View contract")}>View contract <ExternalLink size={14} /></button>
          </section>
        </div>
      )}
      {activeTab === "Positions" &&
        (local ? (
          <EmptyState
            title="No live positions"
            description="Positions appear once your strategy is deployed and funded."
          />
        ) : (
          <section className="panel">
            <div className="panel-heading">
              <h3>Position allocation</h3>
              <Badge>DEMO</Badge>
            </div>
            <div className="demo-position-summary">
              <div>
                <span>Your demo position</span>
                <strong>
                  {demoPosition.toLocaleString()} {String(farm.values.asset)}
                </strong>
              </div>
            </div>
            {(farm.type === "INDEX"
              ? farm.allocations
              : [{ asset: String(farm.values.asset), weight: 100 }]
            ).map((a) => (
              <div className="position-row" key={a.asset}>
                <AssetIcon symbol={a.asset} size={28} />
                <strong>{a.asset}</strong>
                <span>{a.weight}%</span>
                <span>{money((farm.tvl * a.weight) / 100)}</span>
              </div>
            ))}
            <Notice>
              Illustrative holdings; these are not read from a wallet or
              protocol.
            </Notice>
          </section>
        ))}
      {activeTab === "Documents" && (
        <section className="panel">
          <div className="panel-heading"><div><h3>Farm documents</h3><p>Methodology and disclosures supplied by the Farm Manager.</p></div><FileText size={18} /></div>
          {(farm.documents || []).length ? farm.documents?.map((document) => (
            <div className="document-row" key={document.name}><FileText size={17} /><div><strong>{document.name}</strong><small>{Math.max(1, Math.round(document.size / 1024))} KB · Stored locally</small></div><Badge>PDF</Badge></div>
          )) : (
            <EmptyState title="No documents published" description="The Farm Manager has not attached a factsheet or methodology document yet." />
          )}
        </section>
      )}
      {activeTab === "Transactions" && (
        <FarmTransactionLedger farm={farm} transactions={transactions} />
      )}
      {action && (
        <Modal title={action} onClose={closeAction}>
          {action === "View contract" ? (
            <>
              <p>No live contract is connected to this demo Farm.</p>
              <button className="button full" onClick={closeAction}>Understood</button>
            </>
          ) : action === "Rebalance index" ? (
            <div className="rebalance-preview">
              <div className="rebalance-preview-summary">
                <span className="eyebrow">SIMULATION PREVIEW</span>
                <h3>{driftedAssets.length ? `${driftedAssets.length} asset${driftedAssets.length === 1 ? "" : "s"} outside target` : "Portfolio matches target"}</h3>
                <p>Dexponent will sell overweight assets and route the proceeds into underweight assets in one demo batch.</p>
              </div>
              <div className="rebalance-route">
                {currentIndexWeights.filter((weight) => Math.abs(weight.drift) >= 0.1).map((weight) => (
                  <div key={weight.asset}>
                    <AssetIcon symbol={weight.asset} size={24} />
                    <span><strong>{weight.drift > 0 ? "Sell" : "Buy"} {weight.asset}</strong><small>{Math.abs(weight.drift).toFixed(1)}pp · {money((Math.abs(weight.drift) / 100) * farm.tvl, true)}</small></span>
                    <b className={weight.drift > 0 ? "negative" : "positive"}>{weight.current.toFixed(1)}% → {weight.weight.toFixed(1)}%</b>
                  </div>
                ))}
              </div>
              <div className="rebalance-estimates"><span>Estimated price impact <strong>0.04%</strong></span><span>Estimated network fee <strong>$1.82</strong></span><span>Post-rebalance drift <strong>0.0pp</strong></span></div>
              <Notice>This is a demo simulation. No tokens will move and no blockchain transaction will be sent.</Notice>
              {actionError && <p className="field-error" role="alert">{actionError}</p>}
              <div className="modal-actions"><button className="button" onClick={closeAction}>Cancel</button><button className="button primary" onClick={confirmAction}><ArrowsClockwise size={16} /> Execute demo rebalance</button></div>
            </div>
          ) : (
            <>
              <p>
                {action} for “{farm.name}” in this demo workspace?
              </p>
              <Notice>
                This changes local demo state only. No protocol transaction will
                be sent.
              </Notice>
              {actionError && <p className="field-error" role="alert">{actionError}</p>}
              <div className="modal-actions">
                <button className="button" onClick={closeAction}>
                  Cancel
                </button>
                <button className="button primary" onClick={confirmAction}>
                  Confirm demo action
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function FarmPerpMarkets({ farm }: { farm: Farm }) {
  const [search, setSearch] = useState("");
  const markets = searchPerpetualMarkets(search);
  const configuredPair = perpetualPair(farm);
  const local = farm.source === "local";
  return (
    <section className="panel farm-perp-markets">
      <div className="farm-perp-markets-head">
        <div>
          <h2>Perp markets</h2>
          <p>Explore simulated perpetual markets available through this Farm’s {String(farm.values.venue || "configured")} venue.</p>
        </div>
        <div className="farm-perp-market-actions">
          <div className="farm-margin-chip"><span>Farm margin</span><strong>{Number(farm.values.margin).toLocaleString()} {String(farm.values.asset)}</strong></div>
          <label className="market-search farm-market-search">
            <Search size={16} />
            <input aria-label="Search Perp markets" placeholder="Search market" value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button aria-label="Clear Perp market search" onClick={() => setSearch("")}><X size={13} /></button>}
          </label>
        </div>
      </div>
      {markets.length ? (
        <div className="farm-perp-table-wrap">
          <table className="farm-perp-table">
            <thead><tr><th>Market</th><th>Mark price</th><th>24h change</th><th>24h volume</th><th>Funding / 8h</th><th>Max leverage</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {markets.map((market) => {
                const pair = marketPair(market);
                const configured = pair === configuredPair;
                const marketPrecision = market.price > 10_000 ? 0 : market.price < 1 ? 3 : 2;
                return (
                  <tr key={pair}>
                    <td data-label="Market">
                      <span className="farm-market-identity">
                        <span className="pair-icons"><AssetIcon symbol={market.base} size={27} /><AssetIcon symbol={market.quote} size={21} /></span>
                        <span><strong>{pair}</strong><small>{configured ? "Configured pair" : `${market.group} market`}</small></span>
                      </span>
                    </td>
                    <td data-label="Mark price"><strong>{market.price.toLocaleString(undefined, { minimumFractionDigits: marketPrecision, maximumFractionDigits: marketPrecision })}</strong> <small>{market.quote}</small></td>
                    <td data-label="24h change"><strong className={market.change >= 0 ? "positive" : "warning-text"}>{market.change >= 0 ? "+" : ""}{market.change}%</strong></td>
                    <td data-label="24h volume">{market.volume}</td>
                    <td data-label="Funding / 8h"><span className={market.funding >= 0 ? "positive" : "warning-text"}>{market.funding}%</span></td>
                    <td data-label="Max leverage">{market.maxLeverage}×</td>
                    <td>
                      {!local ? (
                        <Link className="button small farm-market-trade" href={farmTradeHref(farm.id, pair)}>Trade <ArrowUpRight size={14} /></Link>
                      ) : <span className="muted">Deploy to trade</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="market-empty"><Search size={20} /><strong>No matching market</strong><span>Try a token symbol such as BTC, ETH, or USDC.</span></div>
      )}
      <div className="farm-perp-footnote"><Shield size={14} /><span>Market values are simulated for this demo workspace. No live price feed or order execution is connected.</span></div>
    </section>
  );
}

function FarmActivityCard({ farm, transactions, onViewAll }: { farm: Farm; transactions: FarmTransaction[]; onViewAll: () => void }) {
  const managerActions = farm.events
    .filter((event) => /rebalance|deploy|pause|update/i.test(event))
    .slice(-2)
    .reverse()
    .map((event, index) => ({
      id: `manager-${index}-${event}`,
      role: "Farm Manager",
      title: /rebalance/i.test(event) ? "Portfolio rebalanced" : /deploy/i.test(event) ? "Farm deployed" : "Farm configuration updated",
      detail: /rebalance/i.test(event) ? "Target weights restored" : event.split(" · ")[0],
      time: index === 0 ? "Just now" : "2h ago",
      kind: "manager" as const,
    }));
  const fallbackManager = {
    id: "manager-review",
    role: "Farm Manager",
    title: farm.type === "INDEX" ? "Allocation reviewed" : farm.type === "SPOT" ? "Yield route reviewed" : "Margin health reviewed",
    detail: farm.type === "INDEX" ? "No execution submitted" : "Strategy remains within guardrails",
    time: "2h ago",
    kind: "manager" as const,
  };
  const lpActions = transactions.slice(0, 4).map((transaction) => ({
    id: transaction.hash,
    role: "Liquidity Provider",
    title: transaction.type === "Deposit" ? "Capital deposited" : "Capital withdrawn",
    detail: `${transaction.type === "Deposit" ? "+" : "−"}${transaction.amount.toLocaleString()} ${String(farm.values.asset || "USDC")} · ${shortAddress(transaction.wallet)}`,
    time: new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.max(-30, Math.round((Date.parse(transaction.timestamp) - Date.now()) / 3_600_000)),
      "hour",
    ),
    kind: transaction.type === "Deposit" ? "deposit" as const : "withdrawal" as const,
  }));
  const items = [...(managerActions.length ? managerActions : [fallbackManager]), ...lpActions].slice(0, 5);

  return (
    <section className="panel farm-activity-card">
      <div className="panel-heading">
        <div><h3>Activity</h3><p>Manager and LP actions in this Farm.</p></div>
        <span className="subtle-label">DEMO</span>
      </div>
      <div className="farm-activity-list">
        {items.map((item) => (
          <div className={`farm-activity-item ${item.kind}`} key={item.id}>
            <span className="activity-icon">{item.kind === "manager" ? <ArrowsClockwise size={16} /> : item.kind === "deposit" ? <ArrowDown size={16} /> : <ArrowUpRight size={16} />}</span>
            <span><small>{item.role}</small><strong>{item.title}</strong><em>{item.detail}</em></span>
            <time>{item.time}</time>
          </div>
        ))}
      </div>
      <button className="text-link activity-view-all" onClick={onViewAll}>View LP transactions <ArrowRight size={14} /></button>
    </section>
  );
}

function IndexAllocationPanel({ weights, tvl }: { weights: ReturnType<typeof indexWeights>; tvl: number }) {
  const colors = ["#f5a524", "#818cf8", "#f472b6", "#5fd0ae", "#61a5fa"];
  const flagged = weights.filter((weight) => weight.flagged);
  return (
    <section className="panel index-allocation-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">PORTFOLIO CONTROL</span><h3>Asset weights vs. target</h3><p>Compare the live demo allocation with the manager’s configured model.</p></div>
        {flagged.length ? <span className="allocation-alert"><Shield size={15} />{flagged.length} asset{flagged.length === 1 ? "" : "s"} over threshold</span> : <Badge tone="mint">ON TARGET</Badge>}
      </div>
      <div className="allocation-comparison">
        <div><span><i className="current-dot" />Current allocation</span><strong>100%</strong></div>
        <div className="allocation-segments current">{weights.map((weight, index) => <i key={weight.asset} style={{ width: `${weight.current}%`, background: colors[index % colors.length] }}><span>{weight.weight >= 12 ? `${weight.asset} ${weight.current.toFixed(0)}%` : ""}</span></i>)}</div>
        <div><span><i className="target-dot" />Target model</span><strong>100%</strong></div>
        <div className="allocation-segments target">{weights.map((weight, index) => <i key={weight.asset} style={{ width: `${weight.weight}%`, background: colors[index % colors.length] }}><span>{weight.weight >= 12 ? `${weight.weight.toFixed(0)}%` : ""}</span></i>)}</div>
      </div>
      <div className="allocation-assets">
        {weights.map((weight, index) => (
          <div className={weight.flagged ? "flagged" : ""} key={weight.asset}>
            <span className="allocation-asset-name"><AssetIcon symbol={weight.asset} size={24} /><span><strong>{weight.asset}</strong><small>{money((weight.current / 100) * tvl, true)}</small></span></span>
            <span><small>Current</small><strong>{weight.current.toFixed(1)}%</strong></span>
            <span><small>Target</small><strong>{weight.weight.toFixed(1)}%</strong></span>
            <b style={{ color: weight.flagged ? "var(--warning)" : colors[index % colors.length] }}>{weight.drift >= 0 ? "+" : ""}{weight.drift.toFixed(1)}pp</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function TradingDashboard({ farmId, initialPair = "" }: { farmId: string; initialPair?: string }) {
  const app = useApp();
  const farm = app.farms.find((item) => item.id === farmId);
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [orderType, setOrderType] = useState<"Market" | "Limit">("Market");
  const [size, setSize] = useState("");
  const [sizePercentage, setSizePercentage] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [leverage, setLeverage] = useState(2);
  const [timeframe, setTimeframe] = useState("1H");
  const [limitPrice, setLimitPrice] = useState("");
  const [orderError, setOrderError] = useState("");
  const [marketQuery, setMarketQuery] = useState("");
  const [marketGroup, setMarketGroup] = useState<"All" | "Major" | "Alt">("All");
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [orderStep, setOrderStep] = useState<"edit" | "review" | "confirmed">("edit");
  const [tradeSettingsPanel, setTradeSettingsPanel] = useState<"margin" | "leverage" | "account" | null>(null);
  const [accountType, setAccountType] = useState<"Unified" | "Portfolio Margin">("Unified");
  const [pendingAccountType, setPendingAccountType] = useState<"Unified" | "Portfolio Margin">("Unified");
  const [lastSubmitted, setLastSubmitted] = useState<{ quantity: number; notional: number; price: number } | null>(null);

  useEffect(() => {
    if (initialPair && findPerpetualMarket(initialPair)) {
      setSelectedPair(initialPair);
      return;
    }
    if (farm && !selectedPair) setSelectedPair(perpetualPair(farm));
  }, [farm, initialPair, selectedPair]);

  useEffect(() => {
    if (!tradeSettingsPanel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTradeSettingsPanel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [tradeSettingsPanel]);

  if (!app.ready)
    return <div className="loading-shell"><div className="skeleton" /></div>;
  if (!farm || farm.type !== "PERPETUAL")
    return (
      <EmptyState
        title="Perpetual Farm not found"
        description="Open trading from an active Perpetual Farm in your workspace."
        href="/app/farms"
        label="View Managed Farms"
      />
    );

  const configuredPair = perpetualPair(farm);
  const market =
    findPerpetualMarket(selectedPair || configuredPair) ||
    perpetualMarkets[0];
  const base = market.base;
  const quote = market.quote;
  const pair = marketPair(market);
  const filteredMarkets = searchPerpetualMarkets(marketQuery, marketGroup);
  const precision = market.price > 10_000 ? 0 : 2;
  const formattedPrice = market.price.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  const chartPoints = Array.from({ length: 72 }, (_, index) => {
    const trend = (index / 71) * market.change * 0.7;
    const wave = Math.sin(index * 0.42) * 0.72 + Math.cos(index * 0.18) * 0.34;
    return market.price * (1 + (trend + wave) / 100);
  });
  const asks = Array.from({ length: 7 }, (_, index) => ({
    price: market.price * (1 + (7 - index) * 0.00042),
    size: 18.4 + index * 7.9,
    total: 22 + index * 11,
  }));
  const bids = Array.from({ length: 7 }, (_, index) => ({
    price: market.price * (1 - (index + 1) * 0.00038),
    size: 23.8 + index * 6.1,
    total: 26 + index * 10,
  }));
  const positionSize = Number(farm.values.demoTradeSize || 0);
  const orderHistory = filledOrders(farm).toReversed();
  const positionSide = String(farm.values.demoTradeSide || "—");
  const positionPair = String(farm.values.demoTradePair || configuredPair);
  const positionMarket = findPerpetualMarket(positionPair) || market;
  const positionQuote = String(farm.values.demoTradeQuote || positionMarket.quote);
  const entryPrice = Number(farm.values.demoEntryPrice || market.price);
  const positionQuantity = Number(farm.values.demoTradeQuantity || (positionSize && entryPrice ? positionSize / entryPrice : 0));
  const positionLeverage = Number(farm.values.demoTradeLeverage || leverage);
  const positionMatchesMarket = positionPair === pair && positionSize > 0;
  const pnl = positionSize
    ? ((positionMarket.price - entryPrice) / entryPrice) * positionSize * (positionSide === "Short" ? -1 : 1)
    : 0;
  const numericSize = Number(size || 0);
  const executionPrice = orderType === "Market" ? market.price : Number(limitPrice);
  const configuredMargin = Math.max(0, Number(farm.values.margin || 0));
  const marginInUse = positionMatchesMarket ? positionSize / Math.max(1, positionLeverage) : 0;
  const availableMargin = Math.max(0, configuredMargin - marginInUse);
  const availableNotional = maximumOrderNotional({ availableMargin, leverage });
  const normalMaxSize = Number.isFinite(executionPrice) && executionPrice > 0 ? availableNotional / executionPrice : 0;
  const maxSize = reduceOnly && positionMatchesMarket ? positionQuantity : normalMaxSize;
  const orderNotional = Number.isFinite(executionPrice) && executionPrice > 0 ? numericSize * executionPrice : 0;
  const estimatedMargin = orderNotional / leverage;
  const estimatedFee = orderNotional * 0.00035;
  const liquidationMove = Math.max(2.5, 92 / leverage);
  const liquidationReference = Number.isFinite(executionPrice) && executionPrice > 0 ? executionPrice : market.price;
  const liquidationPrice = liquidationReference * (side === "Long" ? 1 - liquidationMove / 100 : 1 + liquidationMove / 100);

  function formatQuantity(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "";
    return value.toFixed(market.quantityPrecision).replace(/\.?0+$/, "");
  }

  function calculateMaxSize(price: number, nextLeverage = leverage, nextReduceOnly = reduceOnly) {
    if (nextReduceOnly) return positionMatchesMarket ? positionQuantity : 0;
    if (!Number.isFinite(price) || price <= 0) return 0;
    return maximumOrderNotional({ availableMargin, leverage: nextLeverage }) / price;
  }

  function setPercentage(nextPercentage: number, overrideMax = maxSize) {
    const next = Math.min(100, Math.max(0, nextPercentage));
    setSizePercentage(next);
    setSize(formatQuantity(percentageToSize({ percentage: next, maxSize: overrideMax, precision: market.quantityPrecision })));
    setOrderError("");
  }

  function setManualSize(next: string) {
    setSize(next);
    setSizePercentage(sizeToPercentage({ size: Number(next), maxSize }));
    setOrderError("");
  }

  function updateLeverage(nextLeverage: number) {
    const next = Math.min(market.maxLeverage, Math.max(1, nextLeverage));
    setLeverage(next);
    if (sizePercentage > 0) setPercentage(sizePercentage, calculateMaxSize(executionPrice, next));
  }

  function selectMarket(nextMarket: PerpetualMarket) {
    setSelectedPair(marketPair(nextMarket));
    setLimitPrice("");
    setOrderError("");
    setOrderStep("edit");
    setSize("");
    setSizePercentage(0);
    setReduceOnly(false);
  }

  function reviewOrder() {
    if (!Number.isFinite(numericSize) || numericSize <= 0) {
      setOrderError("Enter a position size greater than zero.");
      return;
    }
    if (numericSize < market.minQuantity) {
      setOrderError(`Minimum order size is ${market.minQuantity} ${base}.`);
      return;
    }
    if (numericSize > maxSize + 10 ** -(market.quantityPrecision + 1)) {
      setOrderError(reduceOnly ? "Reduce-only size cannot exceed the open position." : "Size exceeds the currently available buying power.");
      return;
    }
    if (orderType === "Limit" && (!Number.isFinite(executionPrice) || executionPrice <= 0)) {
      setOrderError("Enter a valid limit price.");
      return;
    }
    setOrderError("");
    setOrderStep("review");
  }

  function submitOrder() {
    try {
      const updated = placeDemoOrder(farm!, {
        side,
        type: orderType,
        size: orderNotional,
        leverage,
        price: executionPrice,
        market,
        quantity: numericSize,
        reduceOnly,
      });
      app.saveFarm(updated);
      setLastSubmitted({ quantity: numericSize, notional: orderNotional, price: executionPrice });
      setSize("");
      setSizePercentage(0);
      setOrderError("");
      setOrderStep("confirmed");
      app.toast(`${reduceOnly ? "Reduce" : side} ${pair} demo order filled.`);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Unable to place demo order.");
    }
  }

  return (
    <div className="trading-workspace">
      <section className="trade-market-header">
        <div className="trade-pair-title">
          <span className="pair-icons">
            <AssetIcon symbol={base} size={38} />
            <AssetIcon symbol={quote} size={28} />
          </span>
          <div>
            <h1>{pair}</h1>
            <span>Perpetual market · Demo execution</span>
          </div>
        </div>
        <div className="trade-market-stat trade-price-stat">
          <span>Simulated mark</span>
          <strong>{formattedPrice}</strong>
          <small className={market.change >= 0 ? "positive" : "warning-text"}>
            {market.change >= 0 ? "+" : ""}{market.change}% · 24h
          </small>
        </div>
        <div className="trade-market-stat"><span>Funding / 8h</span><strong>{market.funding}%</strong><small>Simulated</small></div>
        <div className="trade-market-stat"><span>Open interest</span><strong>{market.openInterest}</strong><small>Demo market</small></div>
        <div className="trade-market-stat"><span>24h volume</span><strong>{market.volume}</strong><small>Demo market</small></div>
      </section>

      <div className="trade-grid">
        <aside className="trade-panel market-list-panel">
          <div className="market-browser-heading">
            <div><strong>Markets</strong><span>{perpetualMarkets.length} demo pairs</span></div>
            <label className="market-search">
              <Search size={15} />
              <input
                aria-label="Search market pairs"
                placeholder="Search pair"
                value={marketQuery}
                onChange={(event) => setMarketQuery(event.target.value)}
              />
              {marketQuery && <button aria-label="Clear market search" onClick={() => setMarketQuery("")}><X size={13} /></button>}
            </label>
            <div className="market-group-tabs">
              {(["All", "Major", "Alt"] as const).map((group) => (
                <button key={group} className={marketGroup === group ? "active" : ""} onClick={() => setMarketGroup(group)}>{group}</button>
              ))}
            </div>
          </div>
          <div className="market-list-scroll">
            {filteredMarkets.map((item) => {
              const itemPair = marketPair(item);
              const itemPrecision = item.price > 10_000 ? 0 : item.price < 1 ? 3 : 2;
              return (
                <button
                  className={itemPair === pair ? "market-row active" : "market-row"}
                  key={itemPair}
                  onClick={() => selectMarket(item)}
                  aria-pressed={itemPair === pair}
                >
                  <AssetIcon symbol={item.base} size={27} />
                  <span><strong>{itemPair}</strong><small>{item.group} perpetual</small></span>
                  <span>
                    <strong>{item.price.toLocaleString(undefined, { maximumFractionDigits: itemPrecision })}</strong>
                    <small className={item.change >= 0 ? "positive" : "warning-text"}>{item.change >= 0 ? "+" : ""}{item.change}%</small>
                  </span>
                </button>
              );
            })}
            {!filteredMarkets.length && (
              <div className="market-empty"><Search size={20} /><strong>No matching pair</strong><span>Try BTC, ETH, USDC, or USDT.</span></div>
            )}
          </div>
        </aside>

        <main className="trade-center-column">
          <section className="trade-panel trade-chart-panel">
            <div className="trade-panel-heading">
              <div><strong>{pair}</strong><span>Simulated market chart</span></div>
              <div className="segmented trade-timeframes">
                {["5M", "15M", "1H", "4H", "1D"].map((item) => (
                  <button key={item} className={timeframe === item ? "active" : ""} onClick={() => setTimeframe(item)}>{item}</button>
                ))}
              </div>
            </div>
            <TradingChart points={chartPoints} pair={pair} timeframe={timeframe} precision={precision} />
          </section>

          <section className="trade-panel orderbook-panel">
            <div className="trade-panel-heading"><strong>Order book</strong><span>Price ({quote}) · Size ({base})</span></div>
            <div className="orderbook-columns"><span>Price</span><span>Size</span><span>Total</span></div>
            {asks.map((row) => <OrderBookRow key={`ask-${row.price}`} row={row} side="ask" precision={precision} />)}
            <div className="orderbook-mid"><strong>{formattedPrice}</strong><span><TrendUp size={13} /> Simulated mark</span></div>
            {bids.map((row) => <OrderBookRow key={`bid-${row.price}`} row={row} side="bid" precision={precision} />)}
          </section>
        </main>

        <aside className="trade-panel order-ticket">
          <div className="trade-panel-heading order-ticket-heading">
            <div className="order-heading-copy"><strong>{orderStep === "edit" ? "Build order" : orderStep === "review" ? "Review order" : "Order confirmed"}</strong><span>{pair} · demo environment</span></div>
            <div className="order-heading-tools">
              <div className="order-context-actions" aria-label="Order account settings">
                <button type="button" aria-label="Cross margin settings" onClick={() => setTradeSettingsPanel("margin")}>Cross <ChevronDown size={11} weight="bold" /></button>
                <button type="button" aria-label={`Adjust leverage, currently ${leverage}×`} onClick={() => setTradeSettingsPanel("leverage")}>{leverage}× <ChevronDown size={11} weight="bold" /></button>
                <button type="button" aria-label={`Account type, ${accountType}`} onClick={() => { setPendingAccountType(accountType); setTradeSettingsPanel("account"); }}>{accountType === "Unified" ? "Unified" : "Portfolio"} <ChevronDown size={11} weight="bold" /></button>
              </div>
              <div className="order-progress" aria-label={`Order step ${orderStep === "edit" ? 1 : orderStep === "review" ? 2 : 3} of 3`}>
                <i className="complete" /><i className={orderStep !== "edit" ? "complete" : ""} /><i className={orderStep === "confirmed" ? "complete" : ""} />
              </div>
            </div>
          </div>

          {orderStep === "edit" && (
            <div className="order-step-body">
              <div className="trade-intent-grid">
                <button className={side === "Long" ? "active long" : ""} disabled={reduceOnly} onClick={() => setSide("Long")}>
                  Long
                </button>
                <button className={side === "Short" ? "active short" : ""} disabled={reduceOnly} onClick={() => setSide("Short")}>
                  Short
                </button>
              </div>
              <div className="tabs order-type-tabs">
                {(["Market", "Limit"] as const).map((item) => <button key={item} className={orderType === item ? "active" : ""} onClick={() => {
                  setOrderType(item);
                  if (sizePercentage > 0) setPercentage(sizePercentage, calculateMaxSize(item === "Market" ? market.price : Number(limitPrice)));
                }}>{item}</button>)}
              </div>
              <div className="trade-balance-summary" aria-label="Trading capacity">
                <div><span>Available to trade</span><strong>${availableNotional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                <div><span>Current position</span><strong>{(positionMatchesMarket ? positionQuantity : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, market.quantityPrecision) })} {base}</strong></div>
              </div>
              {orderType === "Limit" && (
                <label className="field"><span>Limit price</span><div className="input-wrap"><input aria-label="Limit price" type="number" min="0" placeholder={formattedPrice} value={limitPrice} onChange={(event) => {
                  const next = event.target.value;
                  setLimitPrice(next);
                  if (sizePercentage > 0) setPercentage(sizePercentage, calculateMaxSize(Number(next)));
                }} /><small>{quote}</small></div></label>
              )}
              <label className="field"><span>Size</span><div className="input-wrap"><input aria-label="Position size" type="number" min="0" step={10 ** -market.quantityPrecision} placeholder={`0 ${base}`} value={size} onChange={(event) => setManualSize(event.target.value)} /><small>{base}</small></div></label>
              <PositionSizeSlider value={sizePercentage} onChange={setPercentage} disabled={maxSize <= 0 || (orderType === "Limit" && (!Number.isFinite(executionPrice) || executionPrice <= 0))} />
              <label className={`reduce-only-checkbox ${!positionMatchesMarket ? "disabled" : ""}`} title={positionMatchesMarket ? `Close up to ${formatQuantity(positionQuantity)} ${base}` : `No open ${pair} position`}>
                <input type="checkbox" checked={reduceOnly} disabled={!positionMatchesMarket} onChange={(event) => {
                  const next = event.target.checked;
                  setReduceOnly(next);
                  if (next) setSide(positionSide === "Long" ? "Short" : "Long");
                  setPercentage(sizePercentage, calculateMaxSize(executionPrice, leverage, next));
                }} />
                <span>Reduce only</span>
              </label>
              <div className="trade-order-summary compact">
                <div><span>Order value</span><strong>{orderNotional.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                <div><span>Required margin</span><strong>{estimatedMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                <div><span>Remaining margin</span><strong>{Math.max(0, availableMargin - estimatedMargin - estimatedFee).toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                <div><span>Est. liquidation</span><strong>{liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: precision })}</strong></div>
              </div>
              {orderError && <p className="field-error" role="alert">{orderError}</p>}
              <button className={`button full trade-submit ${side.toLowerCase()}`} onClick={reviewOrder}>
                Review {side} order <ArrowRight size={15} />
              </button>
              <p className="order-footnote">Simulated order. No wallet transaction will be sent.</p>
            </div>
          )}

          {orderStep === "review" && (
            <div className="order-step-body order-review">
              <div className={`review-intent ${side.toLowerCase()}`}>
                {side === "Long" ? <TrendUp size={22} /> : <TrendDown size={22} />}
                <div><span>{reduceOnly ? "Reduce" : side} {pair}</span><strong>{numericSize.toLocaleString(undefined, { maximumFractionDigits: market.quantityPrecision })} {base} at {leverage}×</strong></div>
              </div>
              <div className="trade-order-summary">
                <div><span>Order type</span><strong>{orderType}</strong></div>
                <div><span>Order value</span><strong>{orderNotional.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                <div><span>Execution price</span><strong>{executionPrice.toLocaleString(undefined, { maximumFractionDigits: precision })} {quote}</strong></div>
                <div><span>Required margin</span><strong>{estimatedMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                <div><span>Estimated fee</span><strong>{estimatedFee.toFixed(2)} {quote}</strong></div>
                <div><span>Est. liquidation</span><strong>{liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: precision })} {quote}</strong></div>
                <div><span>Venue</span><strong>{String(farm.values.venue)}</strong></div>
                <div><span>Position effect</span><strong>{reduceOnly ? "Reduce only" : "Open / increase"}</strong></div>
              </div>
              <Notice>Leverage amplifies gains and losses. This confirmation updates demo data stored in your browser.</Notice>
              {orderError && <p className="field-error" role="alert">{orderError}</p>}
              <div className="review-order-actions">
                <button className="button secondary" onClick={() => setOrderStep("edit")}>Back to edit</button>
                <button className={`button trade-submit ${side.toLowerCase()}`} onClick={submitOrder}>Confirm {side}</button>
              </div>
            </div>
          )}

          {orderStep === "confirmed" && (
            <div className="order-step-body order-confirmed">
              <div className="confirmation-mark"><Check size={24} weight="bold" /></div>
              <h2>{reduceOnly ? "Position reduced" : `${side} position opened`}</h2>
              <p>{lastSubmitted?.quantity.toLocaleString(undefined, { maximumFractionDigits: market.quantityPrecision })} {base} · {lastSubmitted?.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote} was filled in the demo account.</p>
              <div className="trade-order-summary">
                <div><span>Entry</span><strong>{lastSubmitted?.price.toLocaleString(undefined, { maximumFractionDigits: precision })}</strong></div>
                <div><span>Leverage</span><strong>{leverage}×</strong></div>
                <div><span>Status</span><strong className="positive">Open</strong></div>
              </div>
              <button className="button full" onClick={() => { setOrderStep("edit"); setReduceOnly(false); }}>Place another order</button>
              <Link className="text-link order-farm-link" href={farmDetailHref(farm.id)}>Return to Farm details <ArrowRight size={13} /></Link>
            </div>
          )}
        </aside>
      </div>

      <section className="trade-panel trade-positions-panel">
        <div className="trade-panel-heading"><div><strong>Positions</strong><span>Demo Farm account</span></div><Link className="text-link" href={farmDetailHref(farm.id)}>View Farm details</Link></div>
        {positionSize ? (
          <div className="trade-position-row">
            <div><span>Market</span><strong>{positionPair}</strong></div>
            <div><span>Side</span><strong className={positionSide === "Long" ? "positive" : "warning-text"}>{positionSide}</strong></div>
            <div><span>Size</span><strong>{positionQuantity.toLocaleString(undefined, { maximumFractionDigits: positionMarket.quantityPrecision })} {positionMarket.base}<small>{positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })} {positionQuote}</small></strong></div>
            <div><span>Entry</span><strong>{entryPrice.toLocaleString()}</strong></div>
            <div><span>Mark</span><strong>{positionMarket.price.toLocaleString()}</strong></div>
            <div><span>Unrealized PnL</span><strong className={pnl >= 0 ? "positive" : "warning-text"}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} {positionQuote}</strong></div>
          </div>
        ) : (
          <EmptyState title="No open demo position" description="Place a Long or Short demo order to populate this Farm’s position." />
        )}
      </section>

      <section className="trade-panel filled-orders-panel">
        <div className="trade-panel-heading">
          <div><strong>Filled orders</strong><span>Complete demo execution history</span></div>
          <span className="orders-count">{orderHistory.length} filled</span>
        </div>
        {orderHistory.length ? (
          <div className="filled-orders-table-wrap">
            <table className="filled-orders-table">
              <thead><tr><th>Time</th><th>Market</th><th>Side</th><th>Type</th><th>Size</th><th>Fill price</th><th>Leverage</th><th>Fee</th><th>Status</th></tr></thead>
              <tbody>
                {orderHistory.map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.filledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
                    <td><span className="order-pair"><AssetIcon symbol={order.pair.split("/")[0]} size={20} /><strong>{order.pair}</strong></span></td>
                    <td><span className={`order-side ${order.side.toLowerCase()}`}>{order.side}</span></td>
                    <td>{order.type}</td>
                    <td>{order.quantity ? `${order.quantity.toLocaleString()} ${order.base}` : `${order.size.toLocaleString()} ${order.quote}`}<small>{order.quantity ? `${order.size.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${order.quote}` : ""}</small></td>
                    <td>{order.price.toLocaleString()}</td>
                    <td>{order.leverage}×</td>
                    <td>{order.fee.toFixed(2)} {order.quote}</td>
                    <td><span className="filled-status"><Check size={12} weight="bold" /> Filled</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="orders-empty"><Clock3 size={19} /><span>Confirmed demo orders will appear here with their fill details.</span></div>
        )}
      </section>

      {tradeSettingsPanel && (
        <div className="trade-settings-layer">
          <button className="trade-settings-backdrop" aria-label="Close order settings" onClick={() => setTradeSettingsPanel(null)} />
          <aside className="trade-settings-drawer" role="dialog" aria-modal="true" aria-labelledby="trade-settings-title">
            <div className="trade-settings-header">
              <div>
                <span className="eyebrow">ORDER SETTINGS</span>
                <h2 id="trade-settings-title">
                  {tradeSettingsPanel === "margin" ? "Cross margin" : tradeSettingsPanel === "leverage" ? "Adjust leverage" : "Account type"}
                </h2>
              </div>
              <button type="button" aria-label="Close order settings" onClick={() => setTradeSettingsPanel(null)}><X size={18} /></button>
            </div>

            {tradeSettingsPanel === "margin" && (
              <div className="trade-settings-content">
                <div className="trade-settings-icon"><Scales size={22} /></div>
                <h3>Cross margin is active</h3>
                <p>All available margin in this Farm account can support the position. Profit, loss, and margin requirements are shared across open positions.</p>
                <div className="trade-settings-facts">
                  <div><span>Available margin</span><strong>{availableMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                  <div><span>Margin in use</span><strong>{marginInUse.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                  <div><span>Mode</span><strong>Cross</strong></div>
                </div>
                <Notice>Cross margin can reduce immediate liquidation risk, but losses can consume more of the shared account balance.</Notice>
                <button className="button full" type="button" onClick={() => setTradeSettingsPanel(null)}>Done</button>
              </div>
            )}

            {tradeSettingsPanel === "leverage" && (
              <div className="trade-settings-content">
                <div className="leverage-display"><span>Selected leverage</span><strong>{leverage}×</strong><small>Maximum {market.maxLeverage}× for {pair}</small></div>
                <div className="leverage-quick-actions">
                  {Array.from(new Set([1, 2, 5, 10, market.maxLeverage])).filter((value) => value <= market.maxLeverage).map((value) => (
                    <button type="button" key={value} className={leverage === value ? "active" : ""} onClick={() => updateLeverage(value)}>{value}×</button>
                  ))}
                </div>
                <label className="drawer-leverage-slider">
                  <span>Leverage</span>
                  <input aria-label="Trade leverage" type="range" min="1" max={market.maxLeverage} step="0.5" value={leverage} onChange={(event) => updateLeverage(Number(event.target.value))} />
                  <div><small>1×</small><small>{market.maxLeverage}×</small></div>
                </label>
                <div className="trade-settings-facts">
                  <div><span>Available to trade</span><strong>${availableNotional.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
                  <div><span>Estimated liquidation</span><strong>{liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: precision })}</strong></div>
                </div>
                <Notice>Higher leverage increases buying power and liquidation risk. This setting applies to the order you are building.</Notice>
                <button className="button full" type="button" onClick={() => setTradeSettingsPanel(null)}>Apply leverage</button>
              </div>
            )}

            {tradeSettingsPanel === "account" && (
              <div className="trade-settings-content">
                <p>Choose how this demo trading account groups collateral and risk. This preference does not send an on-chain transaction.</p>
                <div className="account-type-options" role="radiogroup" aria-label="Trading account type">
                  <button type="button" role="radio" aria-checked={pendingAccountType === "Unified"} className={pendingAccountType === "Unified" ? "active" : ""} onClick={() => setPendingAccountType("Unified")}>
                    <span><strong>Unified Account</strong><small>Use one balance for collateral, positions, fees, and settlement.</small></span><i>{pendingAccountType === "Unified" && <Check size={13} weight="bold" />}</i>
                  </button>
                  <button type="button" role="radio" aria-checked={pendingAccountType === "Portfolio Margin"} className={pendingAccountType === "Portfolio Margin" ? "active" : ""} onClick={() => setPendingAccountType("Portfolio Margin")}>
                    <span><strong>Portfolio Margin</strong><small>Evaluate eligible position offsets together for portfolio-level risk.</small></span><i>{pendingAccountType === "Portfolio Margin" && <Check size={13} weight="bold" />}</i>
                  </button>
                </div>
                <Notice>Account modes are simulated in this demo. Production eligibility and risk requirements can vary by venue.</Notice>
                <button className="button full" type="button" onClick={() => { setAccountType(pendingAccountType); setTradeSettingsPanel(null); }}>Save account type</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function PositionSizeSlider({ value, onChange, disabled }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  const safeValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={`position-size-slider ${disabled ? "disabled" : ""}`} style={{ "--size-fill": `${safeValue}%` } as CSSProperties}>
      <div className="position-size-slider-track">
        <input
          aria-label="Position size percentage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(safeValue)}
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={safeValue}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Home") {
              event.preventDefault();
              onChange(0);
            }
            if (event.key === "End") {
              event.preventDefault();
              onChange(100);
            }
          }}
        />
        <span className="position-slider-value">{Math.round(safeValue)}%</span>
        {[0, 25, 50, 75, 100].map((mark) => <i key={mark} style={{ left: `${mark}%` }} />)}
      </div>
      <div className="position-size-marks">
        {[0, 25, 50, 75, 100].map((mark) => <button type="button" key={mark} disabled={disabled} aria-label={`Use ${mark}% of position capacity`} onClick={() => onChange(mark)}>{mark}%</button>)}
      </div>
    </div>
  );
}

function TradingChart({
  points,
  pair,
  timeframe,
  precision,
}: {
  points: number[];
  pair: string;
  timeframe: string;
  precision: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const candles = points.slice(-52).map((close, index, values) => {
    const open = index ? values[index - 1] : close * 0.998;
    const spread = close * (0.0018 + (index % 5) * 0.0003);
    return {
      open,
      close,
      high: Math.max(open, close) + spread,
      low: Math.min(open, close) - spread * 0.82,
      volume: 28 + ((index * 37) % 68),
    };
  });
  const min = Math.min(...candles.map((candle) => candle.low));
  const max = Math.max(...candles.map((candle) => candle.high));
  const range = max - min || 1;
  const y = (value: number) => ((max - value) / range) * 78 + 4;
  const active = hovered === null ? candles.at(-1)! : candles[hovered];
  const activeIndex = hovered === null ? candles.length - 1 : hovered;
  const up = active.close >= active.open;
  const price = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return (
    <div className="dex-trading-chart" onMouseLeave={() => setHovered(null)}>
      <div className="chart-market-toolbar">
        <div className="chart-ohlc">
          <span>O <strong>{price(active.open)}</strong></span>
          <span>H <strong>{price(active.high)}</strong></span>
          <span>L <strong>{price(active.low)}</strong></span>
          <span>C <strong className={up ? "positive" : "warning-text"}>{price(active.close)}</strong></span>
        </div>
        <div className="chart-feed"><i /> Simulated feed · {timeframe}</div>
      </div>
      <div className="chart-plot" role="img" aria-label={`${pair} interactive simulated candlestick chart`}>
        <div className="chart-grid-lines">{[0, 1, 2, 3, 4].map((line) => <i key={line} style={{ top: `${line * 20}%` }} />)}</div>
        <div className="chart-candles">
          {candles.map((candle, index) => {
            const left = (index / candles.length) * 100;
            const bodyTop = y(Math.max(candle.open, candle.close));
            const bodyHeight = Math.max(1.1, Math.abs(y(candle.open) - y(candle.close)));
            const rising = candle.close >= candle.open;
            return (
              <button
                type="button"
                key={index}
                className={`chart-candle ${rising ? "rising" : "falling"} ${activeIndex === index ? "active" : ""}`}
                style={{ left: `${left}%`, width: `${100 / candles.length}%` } as CSSProperties}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                aria-label={`Candle ${index + 1}: open ${price(candle.open)}, close ${price(candle.close)}`}
              >
                <i className="candle-wick" style={{ top: `${y(candle.high)}%`, height: `${y(candle.low) - y(candle.high)}%` }} />
                <i className="candle-body" style={{ top: `${bodyTop}%`, height: `${bodyHeight}%` }} />
                <i className="candle-volume" style={{ height: `${candle.volume * 0.15}%` }} />
              </button>
            );
          })}
        </div>
        <div className="chart-crosshair-x" style={{ left: `${((activeIndex + 0.5) / candles.length) * 100}%` }} />
        <div className="chart-crosshair-y" style={{ top: `${y(active.close)}%` }} />
        <div className={`chart-price-marker ${up ? "up" : "down"}`} style={{ top: `${y(active.close)}%` }}>{price(active.close)}</div>
        {hovered !== null && (
          <div className="chart-hover-card" style={{ left: hovered > candles.length * 0.7 ? "18px" : "auto", right: hovered > candles.length * 0.7 ? "auto" : "72px" }}>
            <span>{pair} · {timeframe}</span>
            <strong>{price(active.close)} {pair.split("/")[1]}</strong>
            <small className={up ? "positive" : "warning-text"}>{up ? "+" : ""}{((active.close - active.open) / active.open * 100).toFixed(2)}%</small>
          </div>
        )}
        <div className="chart-price-axis">
          {[0, .25, .5, .75, 1].map((step) => <span key={step} style={{ top: `${step * 96}%` }}>{price(max - range * step)}</span>)}
        </div>
      </div>
      <div className="chart-time-axis"><span>06:00</span><span>10:00</span><span>14:00</span><span>18:00</span><span>Now</span></div>
    </div>
  );
}

function OrderBookRow({
  row,
  side,
  precision,
}: {
  row: { price: number; size: number; total: number };
  side: "ask" | "bid";
  precision: number;
}) {
  return (
    <div className={`orderbook-row ${side}`}>
      <i style={{ width: `${Math.min(94, row.total)}%` }} />
      <strong>{row.price.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}</strong>
      <span>{row.size.toFixed(2)}</span>
      <span>{row.total.toFixed(2)}</span>
    </div>
  );
}

function Analytics({ network }: { network: string }) {
  const app = useApp();
  const [scenario, setScenario] = useState<Scenario>("Base");
  const [days, setDays] = useState(90);
  const demo = app.farms.filter(
    (f) =>
      f.source === "demo" &&
      (network === "All Chains" || f.network === network),
  );
  const total = demo.reduce((s, f) => s + f.tvl, 0);
  const apy = total ? demo.reduce((s, f) => s + f.apy * f.tvl, 0) / total : 0;
  const result = simulate(
    { ...templates[0].defaults, assumedApr: apy },
    "INDEX",
    scenario,
    days,
  );
  function exportCsv() {
    const rows = [
      "Farm,Strategy,TVL,APY,30D performance,Source",
      ...demo.map((f) =>
        [f.name, f.type, f.tvl, f.apy, f.performance, "demo"].join(","),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "farm-manager-demo-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow="SEE THE BIGGER PICTURE"
        title="Portfolio analytics"
        description="Understand your strategy mix and explore hypothetical outcomes."
        action={
          <button className="button" onClick={exportCsv}>
            <ArrowDownToLine size={16} />
            Export demo report
          </button>
        }
      />
      <div className="overview-metrics">
        <Metric label="Demo portfolio TVL" value={money(total)} />
        <Metric label="Weighted APY" value={`${apy.toFixed(2)}%`} />
        <Metric label="Strategies" value={String(demo.length)} />
        <Metric
          label="Data source"
          value="Demo"
          caption="No live feeds connected"
        />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Hypothetical portfolio explorer</h3>
            <p>$10,000 starting balance · synthetic scenario model</p>
          </div>
          <Badge tone="amber">HYPOTHETICAL</Badge>
        </div>
        <div className="simulation-controls">
          <div className="segmented">
            {(["Bull", "Base", "Bear", "Stress"] as Scenario[]).map((s) => (
              <button
                className={scenario === s ? "active" : ""}
                key={s}
                onClick={() => setScenario(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="segmented">
            {[30, 90, 365].map((d) => (
              <button
                key={d}
                className={days === d ? "active" : ""}
                onClick={() => setDays(d)}
              >
                {d === 365 ? "1Y" : `${d}D`}
              </button>
            ))}
          </div>
        </div>
        <PerformanceChart points={result.points} />
        <div className="simulation-metrics">
          <Metric
            label="Scenario return"
            value={`${result.returnPct.toFixed(2)}%`}
          />
          <Metric
            label="Volatility"
            value={`${result.volatility.toFixed(2)}%`}
          />
          <Metric
            label="Max drawdown"
            value={`${result.drawdown.toFixed(2)}%`}
          />
        </div>
        <Notice>
          Uses demo weighted APY as a gross annual assumption, a 1% management
          fee and a 10% performance fee. Synthetic market shocks; no historical
          data. Gas, slippage, liquidity and contract failures are excluded.
        </Notice>
      </section>
      <div className="section-heading">
        <h2>Farm comparison</h2>
      </div>
      <FarmTable farms={demo} />
    </>
  );
}
function WorkspaceSettings({ tab }: { tab?: string }) {
  const app = useApp();
  const [name, setName] = useState(app.profile.name);
  const [workspace, setWorkspace] = useState(app.profile.workspace);
  const [reset, setReset] = useState(false);
  const [saved, setSaved] = useState(false);
  const selected = tab || "general";
  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="Workspace settings"
        description="Manage your preferences, wallet, and local workspace data."
      />
      <div className="tabs">
        {["general", "wallet", "team", "security"].map((t) => (
          <Link
            className={selected === t ? "active" : ""}
            key={t}
            href={t === "general" ? "/app/settings" : `/app/settings/${t}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </div>
      <div className="settings-content">
        {selected === "general" && (
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              app.saveProfile({
                name: name.trim(),
                workspace: workspace.trim(),
              });
              setSaved(true);
            }}
          >
            <div className="panel-heading">
              <div>
                <h3>Profile & workspace</h3>
                <p>Personalize this browser’s workspace.</p>
              </div>
            </div>
            <div className="fields-grid">
              <label className="field">
                <span>Display name</span>
                <input
                  required
                  maxLength={40}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                />
              </label>
              <label className="field">
                <span>Workspace name</span>
                <input
                  required
                  maxLength={40}
                  value={workspace}
                  onChange={(e) => {
                    setWorkspace(e.target.value);
                    setSaved(false);
                  }}
                />
              </label>
            </div>
            <div className="settings-row">
              <div>
                <h3>Appearance</h3>
                <p>Use {app.theme === "dark" ? "light" : "dark"} mode.</p>
              </div>
              <button
                type="button"
                className="button"
                onClick={app.toggleTheme}
              >
                {app.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                Switch theme
              </button>
            </div>
            <button
              className="button primary"
              disabled={!name.trim() || !workspace.trim()}
              type="submit"
            >
              {saved ? "Preferences saved" : "Save preferences"}
              {saved && <Check size={15} />}
            </button>
          </form>
        )}
        {selected === "wallet" && (
          <section className="panel">
            <h3>Connected wallet</h3>
            <p className="muted">
              Browser wallet access uses your public account only.
            </p>
            {app.wallet ? (
              <>
                <div className="wallet-address">{app.wallet}</div>
                <p className="muted small">Chain ID: {app.walletChain}</p>
                <button className="button" onClick={app.disconnect}>
                  Disconnect workspace
                </button>
              </>
            ) : (
              <button
                className="button primary"
                disabled={app.connecting}
                onClick={app.connect}
              >
                <Wallet size={16} />
                {app.connecting
                  ? "Waiting for wallet…"
                  : "Connect browser wallet"}
              </button>
            )}
            {app.walletError && (
              <p className="field-error" role="alert">
                {app.walletError}
              </p>
            )}
            <Notice>
              Changing the workspace network filter does not switch your
              wallet’s chain. Live execution will verify the actual chain before
              asking you to sign.
            </Notice>
          </section>
        )}
        {selected === "team" && (
          <section className="panel">
            <h3>Your team</h3>
            <div className="settings-row">
              <div className="profile-row">
                <span className="avatar">{app.profile.name[0]}</span>
                <div>
                  <strong>{app.profile.name}</strong>
                  <small>Local demo profile</small>
                </div>
              </div>
              <Badge>Owner</Badge>
            </div>
            <Notice>
              Team invitations and role permissions require an authenticated
              backend. This prototype is a personal local workspace.
            </Notice>
          </section>
        )}
        {selected === "security" && (
          <section className="panel">
            <h3>Local data & security</h3>
            <p className="muted">
              Drafts and preferences are stored in this browser. No private keys
              or credentials are collected.
            </p>
            <div className="settings-row">
              <div>
                <h3>Export workspace</h3>
                <p>Save all farm configurations as JSON.</p>
              </div>
              <button
                className="button"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(app.farms, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "farm-workspace.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export data
              </button>
            </div>
            <div className="settings-row">
              <div>
                <h3>Reset demo workspace</h3>
                <p>Delete local farms and restore sample data.</p>
              </div>
              <button className="button danger" onClick={() => setReset(true)}>
                Reset workspace
              </button>
            </div>
            <Notice>
              Wallet connection is not authentication. Production
              authentication, authorization, audit logs, and security policies
              are not connected.
            </Notice>
          </section>
        )}
      </div>
      {reset && (
        <Modal title="Reset this workspace?" onClose={() => setReset(false)}>
          <p>
            All farm configurations in this browser will be deleted and the demo
            farms restored. Export your work first if you need to keep it.
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setReset(false)}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                app.reset();
                setReset(false);
                app.toast("Demo workspace restored");
              }}
            >
              Delete local farms & reset
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function Resources() {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CONTEXT GOES A LONG WAY"
        title="The workspace guide"
        description="Everything you need to explore Dexponent."
      />
      <div className="resource-grid">
        {[
          {
            title: "Create your first farm",
            description:
              "Choose Index, Spot, or Perpetual. Start with a template, configure its parameters, review, and explore a scenario. Finish with a deployment preview.",
            href: "/app/farms/new",
            label: "Create farm",
          },
          {
            title: "Pick up a draft",
            description:
              "Changes are autosaved locally after template selection. Resume drafts from any saved stage. Your draft stays in this browser.",
            href: "/app/farms/drafts",
            label: "Open drafts",
          },
          {
            title: "Understand the demo",
            description:
              "Sample farms demonstrate portfolio views. Simulations use synthetic assumptions. Ready means the configuration is saved, not that a contract is deployed.",
            href: "/app/templates",
            label: "Explore templates",
          },
        ].map((r) => (
          <section className="panel" key={r.title}>
            <BookOpen className="positive" size={22} />
            <h3>{r.title}</h3>
            <p className="muted">{r.description}</p>
            <Link className="text-link" href={r.href}>
              {r.label}
              <ArrowRight size={15} />
            </Link>
          </section>
        ))}
      </div>
      <section className="panel" id="documentation">
        <div className="panel-heading">
          <h3>Product documentation</h3>
          <Badge>LOCAL PROJECT</Badge>
        </div>
        <div className="review-values">
          <div>
            <span>Product scope & journey</span>
            <strong>docs/PRODUCT.md</strong>
          </div>
          <div>
            <span>Architecture & integration boundaries</span>
            <strong>docs/ARCHITECTURE.md</strong>
          </div>
          <div>
            <span>Template fields & validation</span>
            <strong>docs/STRATEGY_ENGINE.md</strong>
          </div>
          <div>
            <span>Deployment adapter</span>
            <strong>docs/DEPLOYMENT.md</strong>
          </div>
          <div>
            <span>Research & sources</span>
            <strong>docs/research/web3-defi-product-research.md</strong>
          </div>
        </div>
      </section>
    </>
  );
}
