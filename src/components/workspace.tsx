"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChartLineUp as Activity,
  DownloadSimple as ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Briefcase,
  Buildings,
  Check,
  CaretDown as ChevronDown,
  Question as CircleHelp,
  Clock as Clock3,
  Compass,
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
  UserCircle,
  UserPlus,
  Users,
  Wallet,
  X,
  XLogo,
  RedditLogo,
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
  farmEditHref,
  isFarmWizardRoute,
} from "@/domain/routes";
import {
  canPauseFarm,
  depositToDemoFarm,
  setFarmPaused,
  withdrawFromDemoFarm,
} from "@/domain/farm-actions";
import {
  Brand,
  AnimatedValue,
  AssetIcon,
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

const legacyNav = [
  { label: "Capital", section: "dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Explore Farms", section: "explore", href: "/app/explore", icon: Compass },
  { label: "Managed Farms", section: "farms", href: "/app/farms", icon: Leaf },
  { label: "Strategies", section: "strategies", href: "/app/strategies", icon: Network },
  { label: "Templates", section: "templates", href: "/app/templates", icon: Grid2X2 },
  { label: "Metrics", section: "analytics", href: "/app/analytics", icon: Activity },
];
const nav = [
  { label: "Capital", section: "dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Managed Farms", section: "farms", href: "/app/farms", icon: Leaf },
  { label: "Positions", section: "positions", href: "/app/positions", icon: Briefcase },
  { label: "Templates", section: "templates", href: "/app/templates", icon: Grid2X2 },
  { label: "Metrics", section: "analytics", href: "/app/analytics", icon: Activity },
];
export function Workspace({ previewVersion }: { previewVersion?: string } = {}) {
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
  const segments = path.split("/").filter(Boolean);
  const section = previewVersion ? "dashboard" : segments[1] || "dashboard";
  const isV2 = previewVersion !== "v1";
  const activeNav = isV2 ? nav : legacyNav;
  const isWizard = isFarmWizardRoute(segments);
  const queryFarmId = searchParams.get("farm") || "";
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
  else if (section === "dashboard") content = <Dashboard network={network} />;
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
      />
    );
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
    <div className="app-shell">
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
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Brand />
        {!isV2 && <span className="nav-caption">WORKSPACE</span>}
        <nav>
          {activeNav.map((item) => (
            <Link
              className={section === item.section ? "active" : ""}
              key={item.href}
              href={item.href}
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
            <span>Workspace</span>
            <span>/</span>
            <strong>
              {isWizard
                ? "Create farm"
                : activeNav.find((item) => item.section === section)?.label ||
                  section.charAt(0).toUpperCase() + section.slice(1)}
            </strong>
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
            <span className="topbar-divider" />
            {isV2 && (
              <button
                className="icon-button"
                aria-label="Support"
                onClick={() => setModal("support")}
              >
                <Lifebuoy size={18} />
              </button>
            )}
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setModal("notifications")}
            >
              <Bell size={18} />
              <span />
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
                    <a href="https://dexponent.com/privacy" target="_blank" rel="noreferrer" role="menuitem"><Shield size={17} /> Privacy policy</a>
                    <a href="https://dexponent.com/terms" target="_blank" rel="noreferrer" role="menuitem"><FileText size={17} /> Terms of use</a>
                    <span>Social</span>
                    <div className="utility-socials">
                      <a href="https://discord.com/invite/yermEKz6rc" target="_blank" rel="noreferrer" aria-label="Dexponent on Discord"><DiscordLogo size={18} /></a>
                      <a href="https://t.me/+5NZOk4DLnWE4ZjY1" target="_blank" rel="noreferrer" aria-label="Dexponent on Telegram"><TelegramLogo size={18} /></a>
                      <a href="https://x.com/Dexponentx" target="_blank" rel="noreferrer" aria-label="Dexponent on X"><XLogo size={18} /></a>
                      <a href="https://www.linkedin.com/company/dexponent/" target="_blank" rel="noreferrer" aria-label="Dexponent on LinkedIn"><LinkedinLogo size={18} /></a>
                      <a href="https://www.reddit.com/r/Dexponent_Official/" target="_blank" rel="noreferrer" aria-label="Dexponent on Reddit"><RedditLogo size={18} /></a>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              className="button wallet-button"
              onClick={() => setModal("wallet")}
            >
              <Wallet size={15} />
              {app.wallet
                ? `${app.wallet.slice(0, 6)}…${app.wallet.slice(-4)}`
                : "Connect wallet"}
            </button>
          </div>
        </header>
        <main
          id="main"
          className={isWizard ? "main-content wizard-content" : "main-content"}
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
      farm.status === "ACTIVE" &&
      (network === "All Chains" || farm.network === network),
  );
  const capital = farms.reduce((total, farm) => total + farm.tvl, 0);
  const weightedApy = capital
    ? farms.reduce((total, farm) => total + farm.apy * farm.tvl, 0) / capital
    : 0;
  const weightedPerformance = capital
    ? farms.reduce(
        (total, farm) => total + farm.performance * farm.tvl,
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
        <Metric label="Blended APY" value={`${weightedApy.toFixed(2)}%`} caption="TVL-weighted · demo" />
        <Metric label="30D performance" value={`${weightedPerformance >= 0 ? "+" : ""}${weightedPerformance.toFixed(2)}%`} caption="TVL-weighted · demo" />
      </div>
      <div className="section-heading">
        <div>
          <h2>Portfolio positions</h2>
          <p>Active managed Farms included in your current chain filter.</p>
        </div>
      </div>
      <FarmTable farms={farms} />
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
function Dashboard({ network }: { network: string }) {
  const app = useApp();
  const farms = app.farms.filter(
    (f) => network === "All Chains" || f.network === network,
  );
  const active = farms.filter((f) => f.status === "ACTIVE");
  const drafts = farms.filter(
    (f) => f.status === "DRAFT" || f.status === "SIMULATION",
  );
  const tvl = active.reduce((s, f) => s + f.tvl, 0);
  const weighted = (key: "apy" | "performance") =>
    tvl ? active.reduce((s, f) => s + f[key] * f.tvl, 0) / tvl : 0;
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
  const projectedYield = tvl * (weighted("apy") / 100);
  const modeledManagementFee = tvl * 0.01;
  const modeledPerformanceFee = projectedYield * 0.1;
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
        title="Capital overview"
        description="Monitor managed liquidity, capital flows, performance, and risk across every active Farm."
        action={
          <div className="heading-actions">
            <button className="button" onClick={exportCapitalReport}>
              <ArrowDownToLine size={16} /> Export report
            </button>
            <CreateButton />
          </div>
        }
      />
      <div className="overview-metrics capital-metrics">
        <Metric
          label="Managed capital"
          value={money(tvl)}
          change="+3.61%"
          caption="across active Farms · demo"
        />
        <Metric
          label="Active farms"
          value={String(active.length).padStart(2, "0")}
          caption={`${drafts.length} draft${drafts.length === 1 ? "" : "s"} in progress`}
        />
        <Metric
          label="Net trajectory · 30D"
          value={`${weighted("performance") >= 0 ? "+" : ""}${weighted("performance").toFixed(2)}%`}
          caption="TVL-weighted · demo"
        />
        <Metric
          label="Blended APY"
          value={`${weighted("apy").toFixed(2)}%`}
          caption="TVL-weighted · demo"
        />
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
              {range === 30 ? "3.61" : range === 90 ? "8.42" : "12.87"}%{" "}
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
              <span className="panel-kicker">REVENUE SOURCES</span>
              <h3>Yield composition</h3>
            </div>
            <SlidersHorizontal size={15} />
          </div>
          <div
            className="allocation-donut"
            style={{
              background: tvl
                ? `conic-gradient(var(--accent) 0 ${(active.filter((f) => f.type === "PERPETUAL").reduce((s, f) => s + f.tvl, 0) / tvl) * 100}%, #9aa3dc 0 ${(active.filter((f) => f.type !== "SPOT").reduce((s, f) => s + f.tvl, 0) / tvl) * 100}%, #c6b487 0 100%)`
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
              const amount = active
                .filter((x) => x.type === f.type)
                .reduce((s, x) => s + x.tvl, 0);
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
              <th>Farm / Strategy</th>
              <th>Status</th>
              <th>TVL</th>
              <th>APY</th>
              <th>30D performance</th>
              <th>Network</th>
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
                        {f.type} <span>·</span>{" "}
                        {f.source === "demo" ? "Demo farm" : "Local strategy"}
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
                    <NetworkIcon network={f.network} size={19} />
                    {f.network}
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
                <strong>{t.assets.join(", ")}</strong>
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
              <span>{t.assets.join(" · ")}</span>
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
function FarmDetail({ id, tab }: { id: string; tab?: string }) {
  const app = useApp();
  const farm = app.farms.find((f) => f.id === id);
  const [activeTab, setActiveTab] = useState(
    tab === "analytics" ? "Performance" : "Overview",
  );
  const [action, setAction] = useState("");
  const [period, setPeriod] = useState(30);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [withdrawAmount, setWithdrawAmount] = useState("");
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
  const currentFarm = farm;
  const t = templateById(currentFarm.templateId)!;
  const data = simulate(
    { ...farm.values, assumedApr: farm.apy || 12 },
    farm.type,
    "Base",
    period,
  );
  const local = farm.source === "local";
  const pauseAvailable = canPauseFarm(farm);
  const demoPosition = Number(farm.values.demoPosition || 0);
  function closeAction() {
    setAction("");
    setActionError("");
  }
  function completeDeposit() {
    try {
      const updated = depositToDemoFarm(currentFarm, Number(depositAmount));
      app.saveFarm(updated);
      closeAction();
      app.toast(
        `${Number(depositAmount).toLocaleString()} ${String(currentFarm.values.asset)} deposited in demo mode.`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to complete deposit.",
      );
    }
  }
  function completeWithdrawal() {
    try {
      const updated = withdrawFromDemoFarm(currentFarm, Number(withdrawAmount));
      app.saveFarm(updated);
      closeAction();
      app.toast(
        `${Number(withdrawAmount).toLocaleString()} ${String(currentFarm.values.asset)} withdrawn in demo mode.`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to complete withdrawal.",
      );
    }
  }
  function confirmAction() {
    if (!farm) return;
    try {
      const updated =
        action === "Pause farm" || action === "Resume farm"
          ? setFarmPaused(farm, action === "Pause farm")
          : {
              ...farm,
              updatedAt: new Date().toISOString(),
              events: [...farm.events, `${action} · local demo action`],
            };
      app.saveFarm(updated);
      closeAction();
      app.toast(
        action === "Pause farm"
          ? "Farm paused in demo mode. Deposits are now disabled."
          : action === "Resume farm"
            ? "Farm resumed in demo mode."
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
      <Link className="back-link" href="/app/farms">
        <ArrowRight className="rotate-180" size={14} />
        All farms
      </Link>
      <PageHeading
        eyebrow={`${farm.type} / ${farm.network}`}
        title={farm.name || "Untitled farm"}
        description={
          local
            ? "Your strategy configuration and deployment plan."
            : "Performance, positions, and the decisions behind your strategy."
        }
        action={
          <div className="heading-actions">
            <Badge tone={farm.status === "ACTIVE" ? "mint" : "amber"}>
              {farm.status}
            </Badge>
            <Link className="button" href={farmEditHref(id)}>
              {local ? "Edit strategy" : "Create editable copy"}
            </Link>
            {local ? (
              <Link
                className="button primary"
                href={`/app/farms/new?draft=${id}`}
              >
                Continue setup <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <button
                  className="button primary"
                  disabled={farm.status !== "ACTIVE"}
                  onClick={() => {
                    setActionError("");
                    setAction("Deposit to Farm");
                  }}
                >
                  <Droplets size={15} /> Deposit
                </button>
                <button
                  className="button"
                  onClick={() => {
                    setActionError("");
                    setWithdrawAmount(demoPosition ? String(demoPosition) : "");
                    setAction("Withdraw assets");
                  }}
                >
                  Withdraw
                </button>
                <button
                  className="button"
                  disabled={!pauseAvailable}
                  title={
                    pauseAvailable
                      ? undefined
                      : "Pause is available only for manager-controlled demo Farms."
                  }
                  onClick={() => {
                    setActionError("");
                    setAction(
                      farm.status === "PAUSED" ? "Resume farm" : "Pause farm",
                    );
                  }}
                >
                  {farm.status === "PAUSED" ? "Resume" : "Pause"}
                </button>
              </>
            )}
          </div>
        }
      />
      <div className="tabs detail-tabs">
        {[
          "Overview",
          "Performance",
          "Positions",
          "Strategy",
          "Liquidity",
          "Documents",
          "Transactions",
          "Risk",
          "Settings",
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
      {local && (
        <Notice>
          This is a local strategy. No contract is deployed, no assets are held,
          and performance is unavailable.
        </Notice>
      )}
      {["Overview", "Performance"].includes(activeTab) && (
        <>
          <div className="overview-metrics">
            <Metric
              label="Total value locked"
              value={local ? "—" : money(farm.tvl)}
              caption={local ? "Not deployed" : "Sample data"}
            />
            <Metric
              label="APY"
              value={local ? "—" : `${farm.apy}%`}
              caption="Demo annualized yield"
            />
            <Metric
              label="30D performance"
              value={local ? "—" : `+${farm.performance}%`}
              caption="Sample net performance"
            />
            <Metric
              label="Strategy risk"
              value={farm.risk.charAt(0) + farm.risk.slice(1).toLowerCase()}
              caption="Illustrative risk category"
            />
          </div>
          {!local ? (
            <section className="panel">
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
              <PerformanceChart points={data.points} />
              <div className="chart-axis">
                <span>Period start</span>
                <span>Period end</span>
              </div>
            </section>
          ) : (
            <EmptyState
              title="Performance begins after deployment"
              description="Review hypothetical outcomes in the creation flow while your strategy is being prepared."
            />
          )}
          {activeTab === "Overview" && (
            <div className="detail-grid">
              <StrategyFlow
                type={farm.type}
                values={farm.values}
                allocations={farm.allocations}
              />
              <section className="panel">
                <div className="panel-heading">
                  <h3>Strategy health</h3>
                  <Risk level={riskFor(t, farm.values)} />
                </div>
                <div className="health-row">
                  <Check size={16} />
                  Configuration saved
                </div>
                <div className="health-row warning-text">
                  <Shield size={16} />
                  Contract verification unavailable
                </div>
                <div className="health-row muted">
                  <Clock3 size={16} />
                  Last rebalance:{" "}
                  {local ? "Not deployed" : "2 hours ago · demo"}
                </div>
                <Notice>
                  No smart contract audit has been verified for this
                  configuration.
                </Notice>
                <button
                  className="button full"
                  disabled={local}
                  onClick={() => setAction("Rebalance farm")}
                >
                  Preview rebalance
                </button>
              </section>
            </div>
          )}
        </>
      )}
      {activeTab === "Strategy" && (
        <div className="detail-grid">
          <section className="panel">
            <div className="panel-heading">
              <h3>Strategy parameters</h3>
              <Badge>{farm.type}</Badge>
            </div>
            <div className="review-values">
              {t.fields.map((f) => (
                <div key={f.key}>
                  <span>{f.label}</span>
                  <strong>
                    {farm.values[f.key]} {f.unit}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <StrategyFlow
            type={farm.type}
            values={farm.values}
            allocations={farm.allocations}
          />
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
              <button
                className="button small"
                onClick={() => {
                  setActionError("");
                  setWithdrawAmount(demoPosition ? String(demoPosition) : "");
                  setAction("Withdraw assets");
                }}
              >
                Withdraw
              </button>
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
      {activeTab === "Liquidity" && (
        <div className="detail-grid">
          <section className="panel">
            <div className="panel-heading"><div><h3>Liquidity overview</h3><p>How capital enters and exits this Farm.</p></div><Droplets size={18} /></div>
            <div className="review-values">
              <div><span>Deposit asset</span><strong className="token-line"><AssetIcon symbol={String(farm.values.asset)} size={20} />{String(farm.values.asset)}</strong></div>
              <div><span>Minimum deposit</span><strong>$100</strong></div>
              <div><span>Available capacity</span><strong>{money(Math.max(0, Number(farm.values.capacity) - farm.tvl), true)}</strong></div>
              <div><span>Withdrawal window</span><strong>24 hours · demo</strong></div>
            </div>
            {!local && <button className="button primary full" disabled={farm.status !== "ACTIVE"} onClick={() => { setActionError(""); setAction("Deposit to Farm"); }}>Deposit to this Farm <ArrowRight size={15} /></button>}
          </section>
          <section className="panel">
            <div className="panel-heading"><div><h3>Liquidity provider snapshot</h3><p>Illustrative participation data.</p></div><Users size={18} /></div>
            <div className="review-values"><div><span>Liquidity providers</span><strong>{local ? "—" : "184"}</strong></div><div><span>Largest position</span><strong>{local ? "—" : "8.4% of TVL"}</strong></div><div><span>Fees</span><strong>{farm.values.managementFee}% + {farm.values.performanceFee}%</strong></div></div>
            <Notice>Liquidity and LP counts are sample data until a live contract indexer is connected.</Notice>
          </section>
        </div>
      )}
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
        <section className="panel">
          <div className="panel-heading">
            <h3>Workspace activity</h3>
            <Badge>LOCAL LOG</Badge>
          </div>
          {farm.events.map((e, i) => (
            <div className="health-row" key={i}>
              <Clock3 size={15} />
              {e}
            </div>
          ))}
          <Notice>
            No onchain transactions have been submitted. Transaction hashes will
            appear only after real execution.
          </Notice>
        </section>
      )}
      {activeTab === "Risk" && (
        <section className="panel">
          <div className="panel-heading">
            <h3>Risk considerations</h3>
            <Risk level={farm.risk} />
          </div>
          {[
            "Smart contract risk · no audit verified",
            "Market risk · asset prices can fall",
            "Liquidity risk · exits may be delayed",
            "Protocol exposure · " + farm.values.protocol,
            ...(farm.type === "PERPETUAL"
              ? [
                  "Leverage risk · liquidation can consume all margin",
                  "Liquidation price · requires a live exchange quote",
                ]
              : []),
          ].map((s) => (
            <div className="health-row warning-text" key={s}>
              <Shield size={16} />
              {s}
            </div>
          ))}
          <Notice>
            Illustrative categories are not a safety rating. The simulation
            cannot capture all sources of loss.
          </Notice>
        </section>
      )}
      {activeTab === "Settings" && (
        <section className="panel">
          <h3>Farm controls</h3>
          <p className="muted">
            {local
              ? "Update your local strategy or continue the creation flow."
              : "Demo controls update this browser only."}
          </p>
          {!local && !pauseAvailable && (
            <Notice>
              Pause is unavailable for this Farm because its demo deployment
              does not include manager pause permissions. Withdrawals remain
              available for any demo balance you own.
            </Notice>
          )}
          <div className="heading-actions">
            <Link className="button" href={farmEditHref(id)}>
              {local ? "Edit configuration" : "Create editable copy"}
            </Link>
            <button
              className="button"
              onClick={() => {
                setActionError("");
                setWithdrawAmount(demoPosition ? String(demoPosition) : "");
                setAction("Withdraw assets");
              }}
            >
              Withdraw
            </button>
            <button
              className="button"
              onClick={() => setAction("View contract")}
            >
              View contract <ExternalLink size={14} />
            </button>
          </div>
        </section>
      )}
      {action && (
        <Modal
          title={
            action === "Pause farm"
              ? "Pause this Farm?"
              : action === "Resume farm"
                ? "Resume this Farm?"
                : action
          }
          onClose={closeAction}
        >
          {action === "Deposit to Farm" ? (
            <>
              <p className="muted">
                Add {String(farm.values.asset)} to your demo position in {farm.name}.
              </p>
              <label className="field">
                <span>Deposit amount</span>
                <div className="input-wrap">
                  <input
                    aria-label="Deposit amount"
                    type="number"
                    min="100"
                    value={depositAmount}
                    onChange={(event) => {
                      setDepositAmount(event.target.value);
                      setActionError("");
                    }}
                  />
                  <small>{String(farm.values.asset)}</small>
                </div>
              </label>
              <div className="deposit-summary">
                <span>You deposit</span>
                <strong>{Number(depositAmount || 0).toLocaleString()} {String(farm.values.asset)}</strong>
                <span>Your position after deposit</span>
                <strong>{(demoPosition + Number(depositAmount || 0)).toLocaleString()} {String(farm.values.asset)}</strong>
                <span>Illustrative APY</span>
                <strong>{farm.apy}%</strong>
              </div>
              <Notice>
                This updates your local demo balance immediately. No wallet or
                blockchain transaction is used.
              </Notice>
              {actionError && <p className="field-error" role="alert">{actionError}</p>}
              <button
                className="button primary full"
                disabled={Number(depositAmount) < 100}
                onClick={completeDeposit}
              >
                Confirm demo deposit <ArrowRight size={15} />
              </button>
            </>
          ) : action === "Withdraw assets" ? (
            <>
              <p className="muted">
                Withdraw from your {demoPosition.toLocaleString()} {String(farm.values.asset)} demo position.
              </p>
              <label className="field">
                <span>Withdrawal amount</span>
                <div className="input-wrap">
                  <input
                    aria-label="Withdrawal amount"
                    type="number"
                    min="0"
                    max={demoPosition}
                    value={withdrawAmount}
                    onChange={(event) => {
                      setWithdrawAmount(event.target.value);
                      setActionError("");
                    }}
                  />
                  <small>{String(farm.values.asset)}</small>
                </div>
              </label>
              <div className="withdraw-presets" aria-label="Withdrawal amount shortcuts">
                {[25, 50, 100].map((percent) => (
                  <button
                    type="button"
                    key={percent}
                    disabled={!demoPosition}
                    onClick={() => setWithdrawAmount(String((demoPosition * percent) / 100))}
                  >
                    {percent === 100 ? "Max" : `${percent}%`}
                  </button>
                ))}
              </div>
              <div className="deposit-summary">
                <span>You withdraw</span>
                <strong>{Number(withdrawAmount || 0).toLocaleString()} {String(farm.values.asset)}</strong>
                <span>Remaining position</span>
                <strong>{Math.max(0, demoPosition - Number(withdrawAmount || 0)).toLocaleString()} {String(farm.values.asset)}</strong>
              </div>
              <Notice>
                Demo withdrawals complete immediately, including while an
                eligible Farm is paused.
              </Notice>
              {actionError && <p className="field-error" role="alert">{actionError}</p>}
              <button
                className="button primary full"
                disabled={!demoPosition || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > demoPosition}
                onClick={completeWithdrawal}
              >
                Confirm demo withdrawal
              </button>
            </>
          ) : action === "View contract" ? (
            <>
              <p>No live contract is connected to this demo Farm.</p>
              <button className="button full" onClick={closeAction}>Understood</button>
            </>
          ) : action === "Pause farm" || action === "Resume farm" ? (
            <>
              <p>
                {action === "Pause farm"
                  ? `Are you sure you want to pause “${farm.name}”? New deposits will stop until you resume it.`
                  : `Resume “${farm.name}” and allow new demo deposits again?`}
              </p>
              <Notice tone={action === "Pause farm" ? "warning" : "info"}>
                Existing demo positions remain withdrawable. This control is
                available only because this Farm was deployed with manager pause
                permissions.
              </Notice>
              {actionError && <p className="field-error" role="alert">{actionError}</p>}
              <div className="modal-actions">
                <button className="button" onClick={closeAction}>Cancel</button>
                <button
                  className={action === "Pause farm" ? "button danger" : "button primary"}
                  onClick={confirmAction}
                >
                  {action === "Pause farm" ? "Yes, pause Farm" : "Resume Farm"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                {action} for “{farm.name}” in this demo workspace?
              </p>
              <Notice>
                This changes local demo state only. No protocol transaction will
                be sent.
              </Notice>
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
