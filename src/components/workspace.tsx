"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ChartLineUp as Activity,
  ArrowDown,
  DownloadSimple as ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  ArrowsClockwise,
  ArrowsDownUp,
  Bell,
  BookOpen,
  Briefcase,
  Buildings,
  CalendarBlank,
  Check,
  CaretDown as ChevronDown,
  CaretRight,
  DotsThree,
  PauseCircle,
  PencilSimple,
  PlayCircle,
  Archive,
  Question as CircleHelp,
  Clock as Clock3,
  Compass,
  Pulse,
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
  Monitor,
  Moon,
  Graph as Network,
  Plus,
  MagnifyingGlass as Search,
  GearSix as Settings,
  Shield,
  ShieldCheck,
  SignOut,
  Sun,
  TelegramLogo,
  TrendUp,
  UserCircle,
  UserPlus,
  Wallet,
  X,
  XLogo,
  RedditLogo,
} from "@phosphor-icons/react";
import { PerpTradingChart } from "@/components/perp-trading-chart";
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
  searchPerpetualMarkets,
  sizeToPercentage,
  type PerpetualMarket,
} from "@/domain/trading";
import {
  farmFinancialMetrics,
  indexWeights,
  perpetualHealth,
  spotComposition,
} from "@/domain/metrics";
import {
  Brand,
  AnimatedValue,
  AssetIcon,
  AssetList,
  Badge,
  EmptyState,
  LabelTip,
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
import { SupportCenter, type SupportTarget } from "./support-center";
import { NotificationsPanel, useNotifications } from "./notifications-panel";
import { SignInGate, signInHref } from "./sign-in-gate";
import { articleById, articlesIn, helpCategories, popularIssues, supportMailto } from "@/domain/help";
import { DtfStrategies } from "./dtf-strategies";
import { Positions } from "./positions";
import { DtfDetail } from "./dtf-detail";
import { DtfAccess } from "./dtf-access";
import { PriceTicker } from "./price-ticker";
import { DtfMarket } from "./dtf-market";
import { TradingViewPerformanceChart } from "./tradingview-performance-chart";
import {
  formatCount,
  formatDate,
  formatPct,
  formatSignedPct,
  formatSignedUsd,
  formatUsdCompact,
  MISSING,
  toneOf,
} from "@/domain/format";
import { dtfFromFarm, dtfHistory, dtfStats } from "@/domain/dtf";
import { managerRows, type ManagerRow } from "@/domain/positions";
import { managerSummary } from "@/domain/position-metrics";
import { canPauseFarm, recordFarmEvent, setFarmPaused } from "@/domain/farm-actions";
import { farmEditHref } from "@/domain/routes";
import { useDtfPortfolio } from "./use-dtf-portfolio";

const legacyNav = [
  { label: "Capital", section: "dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Explore DTFs", section: "explore", href: "/app/explore", icon: Compass },
  { label: "Managed DTFs", section: "farms", href: "/app/farms", icon: Leaf },
  { label: "Strategies", section: "strategies", href: "/app/strategies", icon: Network },
  { label: "Templates", section: "templates", href: "/app/templates", icon: Grid2X2 },
  { label: "Metrics", section: "analytics", href: "/app/analytics", icon: Activity },
];
type NavItem = { label: string; section: string; href: string; icon: typeof Compass };
const investNav: NavItem[] = [
  { label: "Explore DTFs", section: "strategies", href: "/app/strategies", icon: Compass },
  { label: "Positions", section: "positions", href: "/app/positions", icon: Briefcase },
  { label: "Market", section: "market", href: "/app/market", icon: Pulse },
];
const manageNav: NavItem[] = [
  { label: "Overview", section: "dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Managed DTFs", section: "farms", href: "/app/farms", icon: Leaf },
  { label: "Templates", section: "templates", href: "/app/templates", icon: Grid2X2 },
  { label: "Analytics", section: "analytics", href: "/app/analytics", icon: Activity },
];
const accessNav: NavItem = { label: "DTF Access", section: "access", href: "/app/access", icon: ShieldCheck };
const nav: NavItem[] = [...investNav, ...manageNav, accessNav];
/** The four destinations on the mobile bottom bar. */
const mobileNav: NavItem[] = [manageNav[0], investNav[0], investNav[1], manageNav[1]];
const pageTitles: Record<string, string> = { settings: "Settings", resources: "Help", trade: "Trade" };

export function Workspace({ previewVersion, routeSegments }: { previewVersion?: string; routeSegments?: string[] } = {}) {
  const path = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const app = useApp();
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useNotifications();
  const [supportTarget, setSupportTarget] = useState<SupportTarget | null>(null);
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
  const tradeFarmName = app.farms.find((farm) => farm.id === queryFarmId)?.name || "Perpetual DTF";
  const isFarmDetail = section === "farms" && !isWizard && segments.length > 2 && segments[2] !== "drafts";
  const isStrategyView = section === "strategies" && segments[2] === "view";
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
  else if (section === "strategies" && isV2 && segments[2] === "view")
    content = <DtfDetail id={searchParams.get("dtf") || ""} />;
  else if (section === "strategies" && isV2) content = <DtfStrategies network={network} />;
  else if (section === "access") content = <DtfAccess />;
  else if (section === "market" && isV2) content = <DtfMarket network={network} />;
  else if (section === "templates" || section === "strategies")
    content = (
      <TemplateLibrary strategies={section === "strategies"} id={segments[2]} />
    );
  else if (section === "analytics") content = <Analytics network={network} />;
  else if (section === "positions") content = <Positions network={network} />;
  else if (section === "settings")
    content = <WorkspaceSettings tab={segments[2]} />;
  else if (section === "resources")
    content = (
      <Resources
        onOpenSupport={(target) => {
          setSupportTarget(target ? { ...target, nonce: Date.now() } : null);
          setSupportOpen(true);
        }}
      />
    );
  else
    content = (
      <EmptyState
        title="Page not found"
        description="Return to your overview to continue."
        href="/app/dashboard"
        label="Open overview"
      />
    );
  // Visitors can explore everything, but manager workspaces need an account.
  // Starting a new DTF stays open: the builder asks for sign-in when a template is picked.
  if (app.ready && !app.session) {
    const editing = isWizard && (segments[2] === "edit" || segments[3] === "edit");
    if (section === "dashboard") content = <VisitorOverview />;
    else if (section === "farms" && !isWizard && !isFarmDetail)
      content = (
        <>
          <PageHeading title="Managed DTFs" />
          <SignInGate
            title="Sign in to manage your DTFs"
            body="Build, deploy and run onchain funds from one workspace."
            secondary={{ label: "Explore templates", href: "/app/templates/" }}
          />
        </>
      );
    else if (section === "farms" && (isFarmDetail || editing))
      content = (
        <SignInGate
          title="Sign in to manage this DTF"
          body="Only a DTF's manager can open its workspace. You can still view its public profile."
          secondary={{ label: "Explore DTFs", href: "/app/strategies/" }}
        />
      );
    else if (section === "analytics")
      content = (
        <>
          <PageHeading title="Analytics" />
          <SignInGate
            title="Sign in to see analytics"
            body="Yield, flows and fees for the DTFs you manage."
            secondary={{ label: "Explore templates", href: "/app/templates/" }}
          />
        </>
      );
    else if (section === "trade")
      content = (
        <SignInGate
          title="Sign in to trade"
          body="Trading runs from a Perpetual DTF you manage."
          secondary={{ label: "Explore DTFs", href: "/app/strategies/" }}
        />
      );
  }
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
        {isV2 ? (
          <nav aria-label="Main">
            {([
              ["Invest", investNav],
              ["Manage", manageNav],
            ] as const).map(([group, items]) => (
              <div className="nav-group" key={group} role="group" aria-labelledby={`nav-group-${group}`}>
                <span className="nav-group-label" id={`nav-group-${group}`}>{group}</span>
                {items.map((item) => (
                  <Link
                    className={section === item.section ? "active" : ""}
                    key={item.href}
                    href={item.href}
                    aria-current={section === item.section ? "page" : undefined}
                    title={isTrade ? item.label : undefined}
                    onClick={() => setMenu(false)}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        ) : (
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
              {item.section === "farms" && app.session && (
                <span className="nav-count">{app.farms.length}</span>
              )}
            </Link>
          ))}
        </nav>
        )}
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
          <button onClick={() => setSupportOpen(true)}>
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
                    <UserCircle size={17} /> Settings
                  </Link>
                  <Link href="/app/access" role="menuitem" onClick={() => setProfileMenu(false)}>
                    <ShieldCheck size={17} /> DTF Access
                  </Link>
                  <Link href="/app/resources" role="menuitem" onClick={() => setProfileMenu(false)}>
                    <Lifebuoy size={17} /> Help
                  </Link>
                  <button role="menuitem" onClick={() => { setProfileMenu(false); setModal("wallet"); }}>
                    <Wallet size={17} />
                    {app.wallet ? "Connected wallet" : "Connect wallet"}
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setProfileMenu(false);
                      app.signOut();
                      app.toast("You have been logged out");
                      router.push("/login/");
                    }}
                  >
                    <SignOut size={17} /> Log out
                  </button>
                </div>
              )}
              {app.ready && !app.session ? (
                <Link className="profile-row sidebar-signin" href={signInHref()}>
                  <span className="profile-copy">
                    <strong>Sign in</strong>
                    <small>Investors and managers</small>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
              <button
                className="profile-row profile-trigger"
                aria-expanded={profileMenu}
                aria-haspopup="menu"
                onClick={() => setProfileMenu((open) => !open)}
              >
                <span className="avatar">
                  {(app.session?.name || app.profile.name).split(" ").map((name) => name[0]).slice(0, 2).join("")}
                </span>
                <span className="profile-copy">
                  <strong>{app.session?.name || app.profile.name}</strong>
                  <small>Manager</small>
                </span>
                <ChevronDown className={profileMenu ? "workspace-chevron open" : "workspace-chevron"} size={15} />
              </button>
              )}
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
              <small>Manager</small>
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
                <Link className="trade-top-back" href={farmDetailHref(queryFarmId)} aria-label="Back to DTF">
                  <ArrowRight className="rotate-180" size={17} />
                </Link>
                <strong>{tradeFarmName}</strong>
              </>
            ) : isFarmDetail ? (
              <Link className="farm-top-back" href="/app/farms"><ArrowRight className="rotate-180" size={14} /> All DTFs</Link>
            ) : isStrategyView ? (
              <StrategyBackLink />
            ) : (
              <strong>{isWizard ? "Create DTF" : activeNav.find((item) => item.section === section)?.label || pageTitles[section] || section.charAt(0).toUpperCase() + section.slice(1)}</strong>
            )}
          </div>
          <div className="topbar-actions">
            {isV2 && (
              <span className="preview-badge">
                <LabelTip label="Preview">Preview environment. Figures are illustrative and no funds move.</LabelTip>
              </span>
            )}
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
                  <span>{network === "All Chains" ? "All" : network}</span>
                  <ChevronDown className={chainMenu ? "workspace-chevron open" : "workspace-chevron"} size={14} />
                </button>
                {chainMenu && (
                  <div className="chain-menu" role="listbox" aria-label="Available chains">
                    {["All Chains", "Base", "Solana"].map((chain) => (
                      <button
                        key={chain}
                        className={network === chain ? "selected" : ""}
                        role="option"
                        aria-selected={network === chain}
                        onClick={() => { setNetwork(chain); setChainMenu(false); }}
                      >
                        <NetworkIcon network={chain === "All Chains" ? "All" : chain} size={22} />
                        <span>{chain === "All Chains" ? "All" : chain}</span>
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
                  {["All Chains", "Base", "Solana"].map((chain) => (
                    <option key={chain}>{chain}</option>
                  ))}
                </select>
              </label>
            )}
            <button className="button wallet-button" onClick={() => setModal("wallet")} aria-label={app.wallet ? `Wallet ${shortAddress(app.wallet)} on ${walletNetwork(app.walletChain)}` : "Connect wallet"}>
              <Wallet size={16} />
              {app.wallet ? (
                <>
                  <span className="mono">{shortAddress(app.wallet)}</span>
                  <span className="wallet-network-chip"><NetworkIcon network={walletNetwork(app.walletChain)} size={14} />{walletNetwork(app.walletChain)}</span>
                </>
              ) : "Connect wallet"}
            </button>
            <button
              className="icon-button notification-button"
              aria-label={notifications.unread ? `Notifications, ${notifications.unread} unread` : "Notifications"}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell size={19} />
              {notifications.unread > 0 && <span aria-hidden="true" />}
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
                    <a href="https://dexponent.com/aboutus" target="_blank" rel="noreferrer" role="menuitem"><Buildings size={17} /> Company</a>
                    <a href="https://docs.dexponent.com/" target="_blank" rel="noreferrer" role="menuitem"><BookOpen size={17} /> Resources</a>
                    <a href="https://docs.dexponent.com/" target="_blank" rel="noreferrer" role="menuitem"><FileText size={17} /> Documentation</a>
                    <button className="utility-support" role="menuitem" onClick={() => { setUtilityMenu(false); setSupportOpen(true); }}><Lifebuoy size={17} /> Help &amp; support</button>
                    <hr className="utility-divider" />
                    <span>Join Dexponent</span>
                    <div className="utility-socials">
                      <a href="https://discord.com/invite/yermEKz6rc" target="_blank" rel="noreferrer" aria-label="Dexponent on Discord"><DiscordLogo size={20} /></a>
                      <a href="https://t.me/+5NZOk4DLnWE4ZjY1" target="_blank" rel="noreferrer" aria-label="Dexponent on Telegram"><TelegramLogo size={20} /></a>
                      <a href="https://x.com/Dexponentx" target="_blank" rel="noreferrer" aria-label="Dexponent on X"><XLogo size={20} /></a>
                      <a href="https://www.linkedin.com/company/dexponent/" target="_blank" rel="noreferrer" aria-label="Dexponent on LinkedIn"><LinkedinLogo size={20} /></a>
                      <a href="https://www.reddit.com/r/Dexponent_Official/" target="_blank" rel="noreferrer" aria-label="Dexponent on Reddit"><RedditLogo size={20} /></a>
                    </div>
                    <hr className="utility-divider" />
                    <span id="utility-theme-label">Theme</span>
                    <div className="utility-theme" role="radiogroup" aria-labelledby="utility-theme-label">
                      {([
                        ["light", "Light", Sun],
                        ["dark", "Dark", Moon],
                        ["system", "System", Monitor],
                      ] as const).map(([value, label, Icon]) => (
                        <button
                          key={value}
                          role="radio"
                          aria-checked={app.themePreference === value}
                          className={app.themePreference === value ? "active" : ""}
                          onClick={() => app.setThemePreference(value)}
                        >
                          <Icon size={14} weight={app.themePreference === value ? "fill" : "regular"} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        {isV2 && (section === "dashboard" || section === "market" || (section === "strategies" && !isStrategyView)) && <PriceTicker />}
        <main
          id="main"
          className={isWizard ? "main-content wizard-content" : isTrade ? "main-content trade-content" : "main-content"}
        >
          {app.storageError && (
            <Notice tone="warning">
              {app.storageError}{" "}
              <Link href="/app/settings/security">Open settings</Link>
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
            <span className="environment-dot" /> Preview environment · figures are illustrative
          </span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {(isV2 ? mobileNav : activeNav.slice(0, 4)).map((item) => (
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
              ? app.wallet ? "Wallet" : "Connect wallet"
              : "Add a workspace user"
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
                app.toast(`${user.name} added`);
              }}
            >
              <p className="muted">Add a profile and switch to it.</p>
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
            <div className="wallet-modal">
              {app.wallet ? (
                <>
                  <div className="wallet-connected">
                    <span className="mono wallet-address">{app.wallet}</span>
                    <span className="wallet-network-chip"><NetworkIcon network={walletNetwork(app.walletChain)} size={14} />{walletNetwork(app.walletChain)}</span>
                  </div>
                  <button className="button full" onClick={() => { app.disconnect(); setModal(""); }}>
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <p className="muted">Connect an EVM wallet installed in your browser.</p>
                  <button
                    className="button primary full"
                    disabled={app.connecting}
                    onClick={app.connect}
                  >
                    <Wallet size={16} />
                    {app.connecting ? "Waiting for wallet…" : "Browser wallet"}
                  </button>
                </>
              )}
              {app.walletError && (
                <p role="alert" className="field-error">
                  {app.walletError}
                </p>
              )}
              {!app.wallet && (
                <button className="text-link wallet-preview-link" onClick={() => { app.connectDemo(); setModal(""); }}>
                  Continue with preview wallet
                </button>
              )}
            </div>
          ) : null}
        </Modal>
      )}
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} data={notifications} />
      <SupportCenter open={supportOpen} onOpenChange={setSupportOpen} target={supportTarget} />
    </div>
  );
}
/** Display name for the connected wallet's chain. */
function walletNetwork(chain: string) {
  const value = chain.toLowerCase();
  if (!value || value === "demo" || value === "base" || value === "0x2105" || value === "8453") return "Base";
  if (value.includes("solana")) return "Solana";
  return "Unsupported network";
}
/** Back from a DTF profile: to the Positions tab it was opened from, otherwise to all DTFs. */
function StrategyBackLink() {
  const [from, setFrom] = useState<"lp" | "manager" | null>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("from");
    setFrom(value === "lp" || value === "manager" ? value : null);
  }, []);
  return from ? (
    <Link className="farm-top-back" href={`/app/positions/?view=${from}`}><ArrowRight className="rotate-180" size={14} /> Positions</Link>
  ) : (
    <Link className="farm-top-back" href="/app/strategies/"><ArrowRight className="rotate-180" size={14} /> All DTFs</Link>
  );
}
function CreateButton() {
  return (
    <Link className="button primary" href="/app/farms/new">
      <Plus size={16} />
      Create DTF
    </Link>
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
        title="Explore DTFs"
        action={<Link className="button" href="/app/farms">Manager workspace <ArrowRight size={15} /></Link>}
      />
      <section className="explore-intro panel">
        <div>
          <strong>Compare before you deposit</strong>
          <p>Review strategy, fees and risk on each DTF profile.</p>
        </div>
        <div className="explore-stats">
          <span><strong>{farms.length}</strong> active DTFs</span>
          <span><strong>{formatUsdCompact(farms.reduce((sum, farm) => sum + farm.tvl, 0))}</strong> TVL</span>
        </div>
      </section>
      <div className="list-toolbar explore-toolbar">
        <label className="search-input"><Search size={16} /><input aria-label="Search public DTFs" placeholder="Search by DTF name…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
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
              <p>{String(farm.values.description || "A transparent onchain DTF with clearly defined strategy controls.")}</p>
            </div>
            <div className="explore-card-metrics">
              <div><span>APY</span><strong>{farm.apy}%</strong></div>
              <div><span>TVL</span><strong>{money(farm.tvl, true)}</strong></div>
              <div><span>30D</span><strong className="positive">+{farm.performance}%</strong></div>
            </div>
            <div className="farm-manager-line"><span className="avatar small-avatar">{app.profile.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span>Managed by <strong>{app.profile.name}</strong></span></div>
            <Link className="button primary full" href={farmDetailHref(farm.id)}>Review DTF <ArrowRight size={15} /></Link>
          </article>
        ))}
      </div>
      {!farms.length && <EmptyState title="No matching DTFs" description="Try another DTF name, network, or risk level." />}
    </>
  );
}
/** Manager rows for the signed-in user's DTFs, with one shared clock so every figure agrees. */
function useManagerData(network: string) {
  const app = useApp();
  const { portfolio } = useDtfPortfolio();
  const [now] = useState(() => Date.now());
  const rows = useMemo(
    () => managerRows(app.farms, app.profile.name, portfolio, now, network),
    [app.farms, app.profile.name, portfolio, now, network],
  );
  const summary = useMemo(() => managerSummary(rows), [rows]);
  const byFarm = useMemo(() => new Map(rows.map((row) => [row.farm.id, row])), [rows]);
  return { rows, summary, byFarm, now };
}

const OVERVIEW_RANGES = [7, 30, 90] as const;
type OverviewRange = (typeof OVERVIEW_RANGES)[number];

/** Sum of live TVL across DTFs, sampled daily over the range, ending now. */
function aumSeries(rows: ManagerRow[], now: number, days: number) {
  const live = rows.filter((row) => row.live);
  if (!live.length) return [];
  const histories = live.map((row) => dtfHistory(row.dtf, now));
  const length = histories[0].length;
  const points: { time: number; value: number }[] = [];
  for (let back = days * 24; back >= 0; back -= 24) {
    const index = length - 1 - back;
    if (index < 0) continue;
    const value = histories.reduce((sum, history) => sum + (history[index]?.live ? history[index].tvl : 0), 0);
    points.push({ time: histories[0][index].time, value });
  }
  return points;
}

/** "24 Sep" for short ranges; the year is added only when the range crosses into another year. */
function axisLabel(time: number, withYear: boolean) {
  const [day, month, year] = formatDate(time).split(" ");
  return withYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}

/** Overview for visitors: what managers can do here, with a way in and a way to keep exploring. */
function VisitorOverview() {
  const starters = (["INDEX", "SPOT", "PERPETUAL"] as StrategyType[])
    .map((type) => templates.find((t) => t.type === type))
    .filter((t): t is (typeof templates)[number] => Boolean(t));
  return (
    <div className="overview-page">
      <PageHeading title="Overview" />
      <section className="visitor-hero">
        <div>
          <h2>Launch, raise and run onchain funds</h2>
          <p>Sign in to create DTFs, track the capital you manage and see how your strategies perform.</p>
        </div>
        <div className="signin-gate-actions">
          <Link className="button primary" href={signInHref("/app/dashboard/")}>
            Sign in <ArrowRight size={15} />
          </Link>
          <Link className="button" href="/app/strategies/">
            Explore DTFs
          </Link>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <h2>Start from a template</h2>
        </div>
        <Link className="text-link" href="/app/templates/">
          All templates <ArrowRight size={15} />
        </Link>
      </div>
      <div className="visitor-templates">
        {starters.map((t) => (
          <Link key={t.id} className="visitor-template" href={`/app/templates/${t.id}/`}>
            <span className={`strategy-tag ${t.type.toLowerCase()}`}>{t.type}</span>
            <strong>{t.name}</strong>
            <p>{t.description}</p>
            <span className="text-link">
              View template <ArrowRight size={13} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ network }: { network: string; enhanced?: boolean }) {
  const app = useApp();
  const { rows, summary, now } = useManagerData(network);
  const [range, setRange] = useState<OverviewRange>(30);
  const drafts = app.farms.filter(
    (farm) => (farm.status === "DRAFT" || farm.status === "SIMULATION") && (network === "All Chains" || farm.network === network),
  );
  const live = rows.filter((row) => row.live);
  const aum = summary.aum;
  const aum30dAgo = live.reduce((sum, row) => sum + dtfStats(row.dtf, now).tvl30dAgo, 0);
  const aumChange = live.length ? aum - aum30dAgo : null;
  const aumChangePct = aumChange !== null && aum30dAgo > 0 ? (aumChange / aum30dAgo) * 100 : null;
  const series = useMemo(() => aumSeries(rows, now, range), [rows, now, range]);
  const values = series.map((point) => point.value);
  const first = values[0] ?? 0;
  const last = values.at(-1) ?? 0;
  const rangeChange = first > 0 ? (last / first - 1) * 100 : null;
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const ticks = series.length
    ? [0, 1, 2, 3].map((i) => series[Math.round((i / 3) * (series.length - 1))].time)
    : [];
  const crossesYear = ticks.length > 1 && new Date(ticks[0]).getUTCFullYear() !== new Date(ticks.at(-1)!).getUTCFullYear();
  const byType = (type: StrategyType) => live.filter((row) => row.farm.type === type).reduce((sum, row) => sum + (row.tvl ?? 0), 0);
  const indexShare = aum ? (byType("INDEX") / aum) * 100 : 0;
  const spotShare = aum ? (byType("SPOT") / aum) * 100 : 0;
  const managed = app.farms.filter((farm) => rows.some((row) => row.farm.id === farm.id));
  return (
    <div className="overview-page">
      <PageHeading title="Overview" action={<CreateButton />} />
      <div className="overview-metrics capital-metrics positions-metrics">
        <Metric
          label={<LabelTip label="AUM">Total TVL across your live DTFs.</LabelTip>}
          value={formatUsdCompact(aum)}
          caption={`${formatCount(live.length)} active DTF${live.length === 1 ? "" : "s"}`}
        />
        <Metric
          label={<LabelTip label="AUM change · 30D">Change in TVL over the last 30 days, from LP flows and performance together.</LabelTip>}
          value={formatSignedUsd(aumChange, true)}
          tone={toneOf(aumChange)}
          caption={<><span className={toneOf(aumChangePct) ?? ""}>{formatSignedPct(aumChangePct)}</span> 30D</>}
        />
        <Metric
          label={<LabelTip label="Net flows · 30D">LP deposits minus withdrawals over the last 30 days.</LabelTip>}
          value={formatSignedUsd(live.length ? summary.netFlows30d : null, true)}
          tone={toneOf(live.length ? summary.netFlows30d : null)}
          caption="Deposits minus withdrawals"
        />
        <Metric
          label={<LabelTip label="Fees earned">Estimated performance fees on LP yield since launch, at each DTF&apos;s configured fee rate. Not yet claimed.</LabelTip>}
          value={formatUsdCompact(live.length ? summary.feesEarned : null)}
          caption="Estimated · since launch"
        />
      </div>
      <div className="dashboard-middle">
        <section className="panel portfolio-panel">
          <div className="panel-heading">
            <div>
              <h3>AUM</h3>
              <p>TVL across your live DTFs</p>
            </div>
            <div className="segmented" role="group" aria-label="Chart range">
              {OVERVIEW_RANGES.map((d) => (
                <button
                  key={d}
                  className={range === d ? "active" : ""}
                  aria-pressed={range === d}
                  onClick={() => setRange(d)}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          <div className="chart-summary">
            <AnimatedValue value={formatUsdCompact(aum)} />
            <span className={toneOf(rangeChange) ?? "muted"}>
              {formatSignedPct(rangeChange)} <span className="muted">{range}D</span>
            </span>
          </div>
          {series.length > 1 ? (
            <>
              <div className="chart-with-axis">
                <PerformanceChart points={values} label="AUM over time" />
                <div className="chart-y">
                  <span>{formatUsdCompact(max)}</span>
                  <span>{formatUsdCompact((max + min) / 2)}</span>
                  <span>{formatUsdCompact(min)}</span>
                </div>
              </div>
              <div className="chart-axis">
                {ticks.map((time, i) => (
                  <span key={i}>{axisLabel(time, crossesYear)}</span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No live DTFs"
              description={network === "All Chains" ? "AUM appears once a DTF is live." : `You have no live DTFs on ${network}.`}
            />
          )}
        </section>
        <section className="panel allocation-panel">
          <div className="panel-heading">
            <div>
              <h3>Capital allocation</h3>
              <p>By strategy type</p>
            </div>
          </div>
          <div
            className="allocation-donut"
            role="img"
            aria-label={families.map((f) => `${f.title} ${aum ? Math.round((byType(f.type) / aum) * 100) : 0}%`).join(", ")}
            style={{
              background: aum
                ? `conic-gradient(#818cf8 0 ${indexShare}%, #f472b6 ${indexShare}% ${indexShare + spotShare}%, #3dc486 ${indexShare + spotShare}% 100%)`
                : "var(--border)",
            }}
          >
            <div>
              <span>TYPES</span>
              <AnimatedValue value={String(new Set(live.map((row) => row.farm.type)).size)} />
              <small>in use</small>
            </div>
          </div>
          <div className="allocation-legend">
            {families.map((f) => {
              const amount = byType(f.type);
              return (
                <div key={f.type}>
                  <span className={`legend-dot ${f.type.toLowerCase()}`} />
                  <span>{f.title}</span>
                  <strong>{aum ? Math.round((amount / aum) * 100) : 0}%</strong>
                  <small>{formatUsdCompact(amount)}</small>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div className="section-heading">
        <div>
          <h2>
            Managed DTFs <span className="count-pill">{formatCount(managed.length)}</span>
          </h2>
        </div>
        <div className="section-actions">
          {drafts.length > 0 && (
            <Link className="button small" href="/app/farms/drafts">
              <FileText size={14} /> Continue draft <span className="count-pill">{formatCount(drafts.length)}</span>
            </Link>
          )}
          <Link className="text-link" href="/app/farms">
            View all <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <FarmTable farms={managed.slice(0, 4)} rows={rows} />
    </div>
  );
}

const statusTone: Partial<Record<Farm["status"], string>> = { ACTIVE: "mint", READY: "blue", DEPLOYING: "blue", DRAFT: "neutral", SIMULATION: "neutral" };
function statusLabel(status: Farm["status"]) {
  if (status === "SIMULATION") return "Draft";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function ReturnCell({ row }: { row: ManagerRow | undefined }) {
  if (!row || !row.live || row.ret.value === null) return <>{MISSING}</>;
  const value = row.ret.kind === "apy" ? formatPct(row.ret.value) : formatSignedPct(row.ret.value);
  return (
    <span className="return-cell">
      <strong className={row.ret.kind === "sinceLaunch" ? toneOf(row.ret.value) : undefined}>{value}</strong>
      <small>{row.ret.kind === "apy" ? "APY" : "Since launch"}</small>
    </span>
  );
}

function FarmTable({ farms, rows }: { farms: Farm[]; rows: ManagerRow[] }) {
  const byFarm = new Map(rows.map((row) => [row.farm.id, row]));
  return (
    <div className="farm-table-wrap">
      {!farms.length ? (
        <EmptyState
          title="No DTFs yet"
          description="Create a DTF from a template to get started."
          href="/app/farms/new"
        />
      ) : (
        <table className="farm-table managed-table">
          <thead>
            <tr>
              <th scope="col">DTF</th>
              <th scope="col">Status</th>
              <th scope="col" className="numeric">TVL</th>
              <th scope="col" className="numeric">Return</th>
              <th scope="col" className="numeric">24h</th>
              <th scope="col" className="numeric">Net flows · 30D</th>
              <th scope="col" className="numeric">LPs</th>
              <th scope="col"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {farms.map((f) => {
              const row = byFarm.get(f.id);
              const live = Boolean(row?.live);
              return (
                <tr key={f.id}>
                  <td>
                    <Link className="farm-name" href={f.status === "DRAFT" || f.status === "SIMULATION" ? `/app/farms/new?draft=${f.id}` : farmDetailHref(f.id)}>
                      <span className={`icon-tile ${f.type.toLowerCase()}`}>
                        {f.icon ? <img src={f.icon} alt="" /> : <StrategyIcon type={f.type} size={18} />}
                      </span>
                      <span>
                        <strong>{f.name || "Untitled DTF"}</strong>
                        <small>
                          <span className={`strategy-tag ${f.type.toLowerCase()}`}>{f.type.charAt(0) + f.type.slice(1).toLowerCase()}</span>
                          <span className="network-name"><NetworkIcon network={f.network} size={14} />{f.network}</span>
                        </small>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <Badge tone={statusTone[f.status] ?? "amber"}>{statusLabel(f.status)}</Badge>
                  </td>
                  <td className="numeric">{live ? formatUsdCompact(row!.tvl) : MISSING}</td>
                  <td className="numeric"><ReturnCell row={row} /></td>
                  <td className={`numeric ${toneOf(live ? row!.change24hPct : null) ?? ""}`}>
                    {live ? formatSignedPct(row!.change24hPct) : MISSING}
                  </td>
                  <td className={`numeric ${toneOf(live ? row!.netFlows30d : null) ?? ""}`}>
                    {live ? formatSignedUsd(row!.netFlows30d, true) : MISSING}
                  </td>
                  <td className="numeric">{live ? formatCount(row!.depositors) : MISSING}</td>
                  <td>
                    <Link
                      className="icon-button"
                      aria-label={`Open ${f.name || "DTF"}`}
                      href={f.status === "DRAFT" || f.status === "SIMULATION" ? `/app/farms/new?draft=${f.id}` : farmDetailHref(f.id)}
                    >
                      <CaretRight size={16} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const typeFilters = ["ALL", "INDEX", "SPOT", "PERPETUAL"] as const;

function FarmList({ drafts, network }: { drafts: boolean; network: string }) {
  const app = useApp();
  const { rows } = useManagerData("All Chains");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof typeFilters)[number]>("ALL");
  const [deleting, setDeleting] = useState<Farm | null>(null);
  const isDraft = (f: Farm) => f.status === "DRAFT" || f.status === "SIMULATION";
  const draftCount = app.farms.filter(isDraft).length;
  const visible = app.farms
    .filter(
      (f) =>
        (network === "All Chains" || f.network === network) &&
        (!drafts || isDraft(f)) &&
        (filter === "ALL" || f.type === filter) &&
        f.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => Number(isDraft(a)) - Number(isDraft(b)) || b.tvl - a.tvl);
  return (
    <>
      <PageHeading title={drafts ? "Drafts" : "Managed DTFs"} action={<CreateButton />} />
      <div className="tabs">
        <Link className={!drafts ? "active" : ""} href="/app/farms">
          All DTFs <span>{formatCount(app.farms.length)}</span>
        </Link>
        <Link className={drafts ? "active" : ""} href="/app/farms/drafts">
          Drafts <span>{formatCount(draftCount)}</span>
        </Link>
      </div>
      <div className="list-toolbar">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Search DTFs"
            placeholder="Search DTFs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="dtf-segment" role="group" aria-label="Filter by strategy type">
          {typeFilters.map((type) => (
            <button key={type} aria-pressed={filter === type} onClick={() => setFilter(type)}>
              {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <span className="muted small">{formatCount(visible.length)} DTF{visible.length === 1 ? "" : "s"}</span>
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
              <h3>{f.name || "Untitled DTF"}</h3>
              <p>
                {f.type.charAt(0) + f.type.slice(1).toLowerCase()} · {f.network}
              </p>
              <div className="draft-progress">
                <div style={{ width: `${((f.step + 1) / 6) * 100}%` }} />
              </div>
              <small className="muted">
                Step {f.step + 1} of 6 · Updated {formatDate(f.updatedAt)}
              </small>
              <div className="card-actions">
                <Link className="button primary" href={`/app/farms/new?draft=${f.id}`}>
                  Continue <ArrowRight size={14} />
                </Link>
                <button
                  className="icon-button"
                  aria-label={`Delete ${f.name || "draft"}`}
                  onClick={() => setDeleting(f)}
                >
                  <X size={17} />
                </button>
              </div>
            </section>
          ))}
          {visible.length === 0 && (
            <EmptyState
              title={query ? "No matching drafts" : "No drafts"}
              description="Drafts are saved as you build a DTF."
              href="/app/farms/new"
            />
          )}
        </div>
      ) : visible.length || !query ? (
        <FarmTable farms={visible} rows={rows} />
      ) : (
        <EmptyState title="No matching DTFs" description="Try another name or strategy type." />
      )}
      {deleting && (
        <Modal title="Delete this draft?" onClose={() => setDeleting(null)}>
          <p>Delete “{deleting.name || "Untitled DTF"}”? This cannot be undone.</p>
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
              Templates are starting points you can change. A risk level is a guide, not an audit.
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
        title={strategies ? "Strategies" : "Templates"}
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
  // Newest entry lands just before the current hour, so the ledger always reads as recent.
  const base = Math.floor(Date.now() / 3_600_000) * 3_600_000 - 30 * 60_000;
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
        <div><span className="eyebrow">LP CAPITAL ACTIVITY</span><h3>DTF transactions</h3><p>Deposits and withdrawals for this DTF.</p></div>
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
        </>
      ) : <EmptyState title="No LP transactions yet" description="Deposits and withdrawals will appear here after this DTF receives capital." />}
      {failedTransaction && (
        <Modal title="Transaction reverted" onClose={() => setFailedTransaction(null)}>
          <div className="stack">
            <Notice tone="warning">
              <strong>{failedTransaction.failureReason}</strong>
              <p>The LP deposit or withdrawal was not completed and no DTF balance changed.</p>
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

const DETAIL_PERIODS = [7, 30, 90] as const;
type DetailAction = "" | "Rebalance index" | "Pause deposits" | "Resume deposits" | "Archive" | "View contract";

function FarmDetail({ id, tab, enhanced }: { id: string; tab?: string; enhanced: boolean }) {
  const app = useApp();
  const farm = app.farms.find((f) => f.id === id);
  const [activeTab, setActiveTab] = useState(
    tab === "analytics" ? "Performance" : "Overview",
  );
  const [action, setAction] = useState<DetailAction>("");
  const [period, setPeriod] = useState<(typeof DETAIL_PERIODS)[number]>(30);
  const [actionError, setActionError] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const tvlHistory = useMemo(
    () => (farm && farm.source !== "local" ? dtfHistory(dtfFromFarm(farm, app.profile.name), now) : []),
    [farm, app.profile.name, now],
  );
  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !(event.target as Element).closest?.(".farm-more")) setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [moreOpen]);
  if (!farm)
    return (
      <EmptyState
        title="DTF not found"
        description="Check the link, or open the DTF from Managed DTFs."
        href="/app/farms"
        label="View Managed DTFs"
      />
    );
  const t = templateById(farm.templateId)!;
  const local = farm.source === "local";
  const live = farm.status === "ACTIVE" || farm.status === "PAUSED";
  const description = String(farm.values.shortDescription || farm.values.description || "");
  const tvlPoints: number[] = [];
  for (let back = period * 24; back >= 0; back -= 24) {
    const point = tvlHistory[tvlHistory.length - 1 - back];
    if (point?.live) tvlPoints.push(point.tvl);
  }
  const demoPosition = Number(farm.values.demoPosition || 0);
  const configuredPair = perpetualPair(farm);
  const financial = farmFinancialMetrics(farm);
  const perpHealth = farm.type === "PERPETUAL" ? perpetualHealth(farm) : null;
  const currentIndexWeights = farm.type === "INDEX" ? indexWeights(farm) : [];
  const spotHealth = farm.type === "SPOT" ? spotComposition(farm) : null;
  const transactions = farmTransactions(farm);
  const pausable = canPauseFarm(farm);
  const farmAgeDays = Math.max(0, Math.floor((now - Date.parse(farm.createdAt)) / 86_400_000));
  const farmAgeMonths = Math.floor(farmAgeDays / 30.4375);
  const farmAge = farmAgeDays < 1
    ? "New"
    : farmAgeDays < 30
      ? `${farmAgeDays} day${farmAgeDays === 1 ? "" : "s"}`
      : farmAgeMonths < 12
        ? `${farmAgeMonths} month${farmAgeMonths === 1 ? "" : "s"}`
        : `${Math.floor(farmAgeMonths / 12)}y ${farmAgeMonths % 12}m`;
  const driftedAssets = currentIndexWeights.filter((weight) => weight.flagged);
  const tabs = ["Overview", "Positions", ...(farm.type === "PERPETUAL" ? ["Markets"] : []), "Strategy", "Documents", "Transactions"];
  function closeAction() {
    setAction("");
    setActionError("");
  }
  function confirmAction() {
    if (!farm) return;
    try {
      if (action === "Rebalance index") {
        app.saveFarm(
          recordFarmEvent(
            {
              ...farm,
              values: currentIndexWeights.reduce(
                (values, weight) => ({ ...values, [`currentWeight_${weight.asset}`]: weight.weight }),
                { ...farm.values },
              ),
            },
            "Index rebalanced to target weights",
          ),
        );
        app.toast("Rebalance recorded. Weights now match targets.");
      } else if (action === "Pause deposits" || action === "Resume deposits") {
        app.saveFarm(setFarmPaused(farm, action === "Pause deposits"));
        app.toast(action === "Pause deposits" ? "Deposits paused" : "Deposits resumed");
      } else return;
      closeAction();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update this DTF. Try again.",
      );
    }
  }
  function openAction(next: DetailAction) {
    setMoreOpen(false);
    setActionError("");
    setAction(next);
  }
  return (
    <>
      <section className="farm-detail-hero">
        <div className={`farm-detail-mark ${farm.type.toLowerCase()}`}>
          {farm.icon ? <img src={farm.icon} alt="" /> : <StrategyIcon type={farm.type} />}
        </div>
        <div className="farm-detail-identity">
          <div className="farm-detail-tags">
            <span className={`strategy-tag ${farm.type.toLowerCase()}`}>{farm.type.charAt(0) + farm.type.slice(1).toLowerCase()}</span>
            <span className="farm-network-tag"><NetworkIcon network={farm.network} size={16} />{farm.network}</span>
            <Badge tone={statusTone[farm.status] ?? "amber"}>{statusLabel(farm.status)}</Badge>
          </div>
          <h1>{farm.name || "Untitled DTF"}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="heading-actions farm-detail-actions">
          {local ? (
            <Link className="button primary" href={`/app/farms/new?draft=${id}`}>Continue setup <ArrowRight size={15} /></Link>
          ) : (
            <>
              {farm.type === "INDEX" && live && (
                <button className="button" onClick={() => openAction("Rebalance index")}><ArrowsClockwise size={16} /> Rebalance</button>
              )}
              {live && (
                <button
                  className="button"
                  disabled={!pausable}
                  title={pausable ? undefined : "Pause control was not enabled when this DTF was deployed."}
                  onClick={() => openAction(farm.status === "PAUSED" ? "Resume deposits" : "Pause deposits")}
                >
                  {farm.status === "PAUSED" ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                  {farm.status === "PAUSED" ? "Resume deposits" : "Pause deposits"}
                </button>
              )}
              <Link className="button" href={farmEditHref(id)}><PencilSimple size={16} /> Edit</Link>
              <div className="farm-more">
                <button
                  className="icon-button farm-more-trigger"
                  aria-label="More actions"
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  <DotsThree size={20} weight="bold" />
                </button>
                {moreOpen && (
                  <div className="farm-more-menu" role="menu">
                    <button role="menuitem" onClick={() => openAction("View contract")}><ExternalLink size={16} /> View contract</button>
                    <button role="menuitem" onClick={() => openAction("Archive")}><Archive size={16} /> Archive</button>
                  </div>
                )}
              </div>
              {farm.type === "PERPETUAL" && (
                <Link className="button primary" href={farmTradeHref(id)}><TrendUp size={16} /> Trade</Link>
              )}
            </>
          )}
        </div>
        <div className="farm-detail-facts">
          <span><AssetIcon symbol={String(farm.values.asset || "USDC")} size={26} /><small>Base token</small><strong>{String(farm.values.asset || "USDC")}</strong></span>
          <span><small>Strategy</small><strong>{farm.type === "INDEX" ? String(farm.values.allocationMethod || t.name) : farm.type === "SPOT" ? String(farm.values.strategy || t.name) : String(farm.values.direction || t.name)}</strong></span>
          <span><small>DTF age</small><strong>{farmAge}</strong></span>
          <span><small>TVL</small><strong>{local ? MISSING : formatUsdCompact(farm.tvl)}</strong></span>
          <span><small>APY</small><strong className="positive">{local ? MISSING : formatPct(financial.currentApy)}</strong></span>
        </div>
        {farm.type === "INDEX" && driftedAssets.length > 0 && (
          <div className="farm-rebalance-alert"><Shield size={17} />Rebalance due · {driftedAssets.map((weight) => `${weight.asset} drifted ${weight.drift >= 0 ? "+" : ""}${weight.drift.toFixed(1)}pp`).join(", ")}</div>
        )}
      </section>
      <div className="tabs detail-tabs" role="tablist" aria-label="DTF sections">
        {tabs.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={activeTab === s}
            className={activeTab === s ? "active" : ""}
            onClick={() => setActiveTab(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {farm.type === "PERPETUAL" && activeTab === "Markets" && <FarmPerpMarkets farm={farm} />}
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
              <small>Execution venue · {String(farm.values.venue || "Hyperliquid")}</small>
            </div>
          </div>
          <div className="perp-market-facts">
            <div><span>Direction</span><strong>{String(farm.values.direction)}</strong></div>
            <div><span>Leverage</span><strong>{farm.values.leverage}×</strong></div>
            <div><span>Margin</span><strong>{Number(farm.values.margin).toLocaleString()} {String(farm.values.asset)}</strong></div>
            <div><span>Funding trigger</span><strong>{farm.values.fundingThreshold}% / 8h</strong></div>
          </div>
        </section>
      )}
      {local && (
        <Notice>
          This DTF is not deployed yet. It holds no assets and has no performance.
        </Notice>
      )}
      {activeTab === "Overview" && (
        <>
          <div className="overview-metrics farm-health-metrics">
            <Metric label="TVL" value={local ? MISSING : formatUsdCompact(farm.tvl)} />
            <Metric
              label={<LabelTip label="APY">Trailing 30-day yield, annualised, after fees.</LabelTip>}
              value={local ? MISSING : formatPct(financial.currentApy)}
            />
            {farm.type === "PERPETUAL" && perpHealth ? <>
              <Metric
                label={<LabelTip label="Margin health">Share of margin left before liquidation. Higher is safer.</LabelTip>}
                value={formatPct(perpHealth.marginHealth, 0)}
                tone={perpHealth.marginHealth >= 70 ? "positive" : perpHealth.marginHealth >= 40 ? undefined : "negative"}
              />
              <Metric
                label="Funding rate · 8h"
                value={formatSignedPct(perpHealth.fundingRate, 4)}
                caption={perpHealth.fundingRate >= 0 ? "Received" : "Paid"}
              />
            </> : <>
              <Metric
                label="Return · 30D"
                value={local ? MISSING : formatSignedPct(farm.performance)}
                tone={local ? undefined : toneOf(farm.performance)}
              />
              {farm.type === "SPOT" && spotHealth ? (
                <Metric
                  label={<LabelTip label="Impermanent loss">Value lost versus simply holding the pool tokens.</LabelTip>}
                  value={formatSignedPct(spotHealth.impermanentLoss)}
                />
              ) : (
                <Metric
                  label="LPs"
                  value={local ? MISSING : formatCount(financial.activeLps)}
                  caption={local ? undefined : `Largest ${formatPct(financial.topHolderPct, 1)} of TVL`}
                />
              )}
            </>}
          </div>
          {enhanced && farm.type === "SPOT" && spotHealth && <section className="panel spot-composition-panel"><div className="panel-heading"><div><h3>Asset composition</h3><p>Current token weights in the pool position.</p></div></div><div className="composition-track">{spotHealth.assets.map((asset) => <i key={asset.asset} style={{ width: `${asset.weight}%` }} title={`${asset.asset} ${asset.weight}%`} />)}</div><div className="composition-assets">{spotHealth.assets.map((asset) => <span key={asset.asset}><AssetIcon symbol={asset.asset} size={22} /><strong>{asset.asset}</strong><small>{asset.weight}%</small></span>)}</div></section>}
          {!local ? (
            <div className="farm-overview-story">
              <section className="panel farm-performance-panel">
                <div className="panel-heading">
                  <h3>TVL</h3>
                  <div className="segmented" role="group" aria-label="Chart range">
                    {DETAIL_PERIODS.map((d) => (
                      <button
                        className={period === d ? "active" : ""}
                        aria-pressed={period === d}
                        key={d}
                        onClick={() => setPeriod(d)}
                      >
                        {d}D
                      </button>
                    ))}
                  </div>
                </div>
                {tvlPoints.length > 1 ? (
                  <TradingViewPerformanceChart points={tvlPoints} days={period} label="TVL" endTime={tvlHistory.at(-1)?.time} />
                ) : (
                  <EmptyState title="Not enough history" description="The chart fills in after the first full day live." />
                )}
              </section>
              <FarmActivityCard farm={farm} transactions={transactions} onViewAll={() => setActiveTab("Transactions")} />
            </div>
          ) : (
            <EmptyState
              title="Performance begins after deployment"
              description="Scenario results are available in the creation flow."
            />
          )}
          {activeTab === "Overview" && farm.type === "INDEX" && (
            <IndexAllocationPanel weights={currentIndexWeights} tvl={farm.tvl} />
          )}
        </>
      )}
      {activeTab === "Strategy" && (
        <div className="strategy-workspace-grid">
          <section className="panel strategy-configuration-card">
            <div className="panel-heading">
              <div><span className="eyebrow">CONFIGURATION</span><h3>Strategy controls</h3></div>
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
            <Notice>A risk level is a guide. It does not mean capital is safe.</Notice>
          </section>
          <section className="panel strategy-capital-card">
            <div className="panel-heading"><div><span className="eyebrow">CAPITAL RULES</span><h3>Liquidity &amp; fees</h3></div><Droplets size={18} /></div>
            <div className="review-values">
              <div><span>Base token</span><strong className="token-line"><AssetIcon symbol={String(farm.values.asset)} size={20} />{String(farm.values.asset)}</strong></div>
              <div><span>Available capacity</span><strong>{formatUsdCompact(Math.max(0, Number(farm.values.capacity) - farm.tvl))}</strong></div>
              <div><span>Withdrawal window</span><strong>24 hours</strong></div>
              <div><span>Management fee</span><strong>{farm.values.managementFee}% / year</strong></div>
              <div><span>Performance fee</span><strong>{farm.values.performanceFee}% of gains</strong></div>
              <div><span>LP concentration</span><strong>Largest {formatPct(financial.topHolderPct, 1)}</strong></div>
            </div>
          </section>
          <section className="panel strategy-operations-card">
            <div className="panel-heading"><div><span className="eyebrow">ONCHAIN OPERATIONS</span><h3>Contract &amp; execution</h3></div><Network size={18} /></div>
            <div className="health-row"><Check size={16} />Configuration saved</div>
            <div className="health-row muted"><Clock3 size={16} />Last rebalance: {local ? "Not deployed" : farm.events.some((event) => /rebalanc/i.test(event)) ? formatDate(farm.updatedAt) : "None recorded"}</div>
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
            </div>
            <div className="demo-position-summary">
              <div>
                <span>Your position</span>
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
                <span>{formatUsdCompact((farm.tvl * a.weight) / 100)}</span>
              </div>
            ))}
          </section>
        ))}
      {activeTab === "Documents" && (
        <section className="panel">
          <div className="panel-heading"><div><h3>DTF documents</h3><p>Methodology and disclosures from the Manager.</p></div><FileText size={18} /></div>
          {(farm.documents || []).length ? farm.documents?.map((document) => (
            <div className="document-row" key={document.name}><FileText size={17} /><div><strong>{document.name}</strong><small>{formatCount(Math.max(1, Math.round(document.size / 1024)))} KB</small></div><Badge>PDF</Badge></div>
          )) : (
            <EmptyState title="No documents published" description="The Manager has not attached a factsheet or methodology document yet." />
          )}
        </section>
      )}
      {activeTab === "Transactions" && (
        <FarmTransactionLedger farm={farm} transactions={transactions} />
      )}
      {action && (
        <Modal title={action === "Rebalance index" ? "Rebalance" : action} onClose={closeAction}>
          {action === "View contract" ? (
            <>
              <p>A contract address is not available for this DTF yet.</p>
              <div className="modal-actions"><button className="button primary" onClick={closeAction}>Close</button></div>
            </>
          ) : action === "Archive" ? (
            <>
              <p>Archiving closes {farm.name} to new deposits and removes it from Explore DTFs. All LP capital must be withdrawn first.</p>
              {farm.tvl > 0 ? (
                <Notice tone="warning">
                  {formatUsdCompact(farm.tvl)} from {formatCount(financial.activeLps)} LPs is still in this DTF. Pause deposits and wait for withdrawals before archiving.
                </Notice>
              ) : (
                <Notice>Archiving is not enabled for this DTF yet.</Notice>
              )}
              <div className="modal-actions">
                <button className="button" onClick={closeAction}>Close</button>
                <button className="button danger" disabled>Archive DTF</button>
              </div>
            </>
          ) : action === "Pause deposits" || action === "Resume deposits" ? (
            <>
              <p>
                {action === "Pause deposits"
                  ? `New deposits into ${farm.name} will be blocked. LPs can still withdraw, and positions stay open.`
                  : `${farm.name} will accept new deposits again.`}
              </p>
              {actionError && <p className="field-error" role="alert">{actionError}</p>}
              <div className="modal-actions">
                <button className="button" onClick={closeAction}>Cancel</button>
                <button className="button primary" onClick={confirmAction}>{action}</button>
              </div>
            </>
          ) : (
            <div className="rebalance-preview">
              <div className="rebalance-preview-summary">
                <h3>{driftedAssets.length ? `${driftedAssets.length} asset${driftedAssets.length === 1 ? "" : "s"} outside target` : "Portfolio matches target"}</h3>
                <p>Overweight assets are sold and the proceeds bought into underweight assets in one batch.</p>
              </div>
              <div className="rebalance-route">
                {currentIndexWeights.filter((weight) => Math.abs(weight.drift) >= 0.1).map((weight) => (
                  <div key={weight.asset}>
                    <AssetIcon symbol={weight.asset} size={24} />
                    <span><strong>{weight.drift > 0 ? "Sell" : "Buy"} {weight.asset}</strong><small>{Math.abs(weight.drift).toFixed(1)}pp · {formatUsdCompact((Math.abs(weight.drift) / 100) * farm.tvl)}</small></span>
                    <b className={weight.drift > 0 ? "negative" : "positive"}>{weight.current.toFixed(1)}% → {weight.weight.toFixed(1)}%</b>
                  </div>
                ))}
              </div>
              <div className="rebalance-estimates"><span>Est. price impact <strong>0.04%</strong></span><span>Est. network fee <strong>$1.82</strong></span><span>Drift after rebalance <strong>0.0pp</strong></span></div>
              {actionError && <p className="field-error" role="alert">{actionError}</p>}
              <div className="modal-actions"><button className="button" onClick={closeAction}>Cancel</button><button className="button primary" onClick={confirmAction}><ArrowsClockwise size={16} /> Confirm rebalance</button></div>
            </div>
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
          <p>Perpetual markets on {String(farm.values.venue || "the configured venue")}.</p>
        </div>
        <div className="farm-perp-market-actions">
          <div className="farm-margin-chip"><span>DTF margin</span><strong>{Number(farm.values.margin).toLocaleString()} {String(farm.values.asset)}</strong></div>
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
      role: "Manager",
      title: /rebalance/i.test(event) ? "Portfolio rebalanced" : /deploy/i.test(event) ? "DTF deployed" : "DTF configuration updated",
      detail: /rebalance/i.test(event) ? "Target weights restored" : event.split(" · ")[0],
      time: index === 0 ? "Just now" : "2h ago",
      kind: "manager" as const,
    }));
  const fallbackManager = {
    id: "manager-review",
    role: "Manager",
    title: farm.type === "INDEX" ? "Allocation reviewed" : farm.type === "SPOT" ? "Yield route reviewed" : "Margin health reviewed",
    detail: farm.type === "INDEX" ? "No execution submitted" : "Strategy remains within guardrails",
    time: "2h ago",
    kind: "manager" as const,
  };
  const lpActions = transactions.slice(0, 4).map((transaction) => ({
    id: transaction.hash,
    role: "LP",
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
        <div><h3>Activity</h3><p>Manager and LP actions in this DTF.</p></div>
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
        <div><span className="eyebrow">PORTFOLIO CONTROL</span><h3>Asset weights vs. target</h3><p>Current allocation against the Manager&apos;s targets.</p></div>
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

const perpetualTokenNames: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  ARB: "Arbitrum",
  OP: "Optimism",
  AVAX: "Avalanche",
  LINK: "Chainlink",
  DOGE: "Dogecoin",
};

function TradingDashboard({ farmId, initialPair = "" }: { farmId: string; initialPair?: string }) {
  const app = useApp();
  const farm = app.farms.find((item) => item.id === farmId);
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [orderType, setOrderType] = useState<"Market" | "Limit">("Market");
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState<"base" | "quote">("base");
  const [reduceOnly, setReduceOnly] = useState(false);
  const [leverage, setLeverage] = useState(2);
  const [timeframe, setTimeframe] = useState("1H");
  const [limitPrice, setLimitPrice] = useState("");
  const [orderError, setOrderError] = useState("");
  const [marketQuery, setMarketQuery] = useState("");
  const [marketGroup, setMarketGroup] = useState<"All" | "Major" | "Alt">("All");
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [positionDisplay, setPositionDisplay] = useState<"base" | "quote">("base");
  const [tradeSettingsPanel, setTradeSettingsPanel] = useState<"margin" | "leverage" | "account" | null>(null);
  const [marginMode, setMarginMode] = useState<"Cross" | "Isolated">("Cross");
  const [pendingMarginMode, setPendingMarginMode] = useState<"Cross" | "Isolated">("Cross");
  const [accountType, setAccountType] = useState<"Unified" | "Portfolio Margin" | "Manual">("Unified");
  const [pendingAccountType, setPendingAccountType] = useState<"Unified" | "Portfolio Margin" | "Manual">("Unified");
  const [orderBookTab, setOrderBookTab] = useState<"book" | "trades">("book");
  const [orderBookView, setOrderBookView] = useState<"both" | "bids" | "asks">("both");
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<"positions" | "open" | "trades" | "orders">("positions");
  const [fundingCountdown, setFundingCountdown] = useState("08:00:00");

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

  useEffect(() => {
    if (!marketPickerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMarketPickerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [marketPickerOpen]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 28_800 - (now % 28_800);
      const hours = Math.floor(remaining / 3_600);
      const minutes = Math.floor((remaining % 3_600) / 60);
      const seconds = remaining % 60;
      setFundingCountdown([hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":"));
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!app.ready)
    return <div className="loading-shell"><div className="skeleton" /></div>;
  if (!farm || farm.type !== "PERPETUAL")
    return (
      <EmptyState
        title="Perpetual DTF not found"
        description="Open trading from an active Perpetual DTF in your workspace."
        href="/app/farms"
        label="View Managed DTFs"
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
  const asks = Array.from({ length: 8 }, (_, index) => ({
    price: market.price * (1 + (8 - index) * 0.00042),
    size: 18.4 + index * 7.9,
    total: 16 + index * 12,
  }));
  const bids = Array.from({ length: 8 }, (_, index) => ({
    price: market.price * (1 - (index + 1) * 0.00038),
    size: 23.8 + index * 6.1,
    total: 21 + index * 11,
  }));
  const clock = Math.floor(Date.now() / 60_000) * 60_000;
  const recentTrades = Array.from({ length: 8 }, (_, index) => ({
    time: new Date(clock - index * 3_000).toLocaleTimeString("en", { hour12: false }),
    price: market.price * (1 + (index % 2 ? -1 : 1) * (index + 1) * 0.00008),
    size: 2.4 + ((index * 17) % 31) / 10,
    side: (index % 3 === 0 ? "sell" : "buy") as "buy" | "sell",
  }));
  const positionSize = Number(farm.values.demoTradeSize || 0);
  const orderHistory = filledOrders(farm).toReversed();
  const activityOrders = orderHistory.length ? orderHistory : recentTrades.slice(0, 5).map((trade, index) => ({
    id: `sample-${index}`,
    pair,
    side: (index % 2 ? "Short" : "Long") as "Long" | "Short",
    type: (index === 1 ? "Limit" : "Market") as "Market" | "Limit",
    size: trade.size * trade.price,
    leverage,
    price: trade.price,
    quote,
    fee: trade.size * trade.price * 0.00035,
    filledAt: new Date(clock - (index * 2 + 1) * 60_000 - index * 7_000).toISOString(),
    base,
    quantity: trade.size,
  }));
  const openOrders = [
    { id: "open-buy", pair, side: "Buy", price: market.price * 0.992, size: Math.max(market.minQuantity, 2 * 10 ** -market.quantityPrecision), status: "Open", updated: new Date(clock - 4 * 60_000).toLocaleString() },
    { id: "open-sell", pair, side: "Sell", price: market.price * 1.008, size: Math.max(market.minQuantity, 4 * 10 ** -market.quantityPrecision), status: "Open", updated: new Date(clock - 5 * 60_000).toLocaleString() },
  ];
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
  const sizePercentage = sizeToPercentage({ size: numericSize, maxSize });
  const orderNotional = Number.isFinite(executionPrice) && executionPrice > 0 ? numericSize * executionPrice : 0;
  const estimatedMargin = orderNotional / leverage;
  const estimatedFee = orderNotional * 0.00035;
  const estimatedSlippage = orderType === "Market" ? 0.08 : 0;
  const maximumSlippage = 0.5;
  const liquidationMove = Math.max(2.5, 92 / leverage);
  const liquidationReference = Number.isFinite(executionPrice) && executionPrice > 0 ? executionPrice : market.price;
  const liquidationPrice = liquidationReference * (side === "Long" ? 1 - liquidationMove / 100 : 1 + liquidationMove / 100);
  const displayedSize = sizeUnit === "base"
    ? size
    : size && Number.isFinite(executionPrice) && executionPrice > 0
      ? (numericSize * executionPrice).toFixed(2)
      : "";

  function formatQuantity(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "";
    return value.toFixed(market.quantityPrecision).replace(/\.?0+$/, "");
  }

  function setOrderSizeInput(next: string) {
    if (!next) {
      setSize("");
      setOrderError("");
      return;
    }
    if (sizeUnit === "base") setSize(next);
    else if (Number.isFinite(executionPrice) && executionPrice > 0) setSize(formatQuantity(Number(next) / executionPrice));
    setOrderError("");
  }

  function setSizeFromPercentage(nextPercentage: number) {
    const nextSize = percentageToSize({
      percentage: Math.min(100, Math.max(0, nextPercentage)),
      maxSize,
      precision: market.quantityPrecision,
    });
    setSize(formatQuantity(nextSize));
    setOrderError("");
  }

  function updateLeverage(nextLeverage: number) {
    const next = Math.min(market.maxLeverage, Math.max(1, nextLeverage));
    setLeverage(next);
  }

  function selectMarket(nextMarket: PerpetualMarket) {
    setSelectedPair(marketPair(nextMarket));
    setLimitPrice("");
    setOrderError("");
    setSize("");
    setSizeUnit("base");
    setReduceOnly(false);
    setMarketPickerOpen(false);
  }

  function placeOrder(requestedSide: "Long" | "Short" = side) {
    if (isSubmittingOrder) return;
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
    setIsSubmittingOrder(true);
    const order = {
      orderType,
      side: requestedSide,
      asset: base,
      quote,
      size: numericSize,
      price: executionPrice,
      reduceOnly,
      farmId: farm!.id,
    } as const;
    const toastId = app.orderToast.start(order, "sending");
    window.setTimeout(() => {
      try {
        const updated = placeDemoOrder(farm!, {
        side: requestedSide,
        type: orderType,
        size: orderNotional,
        leverage,
        price: executionPrice,
        market,
        quantity: numericSize,
        reduceOnly,
      });
        app.saveFarm(updated);
        app.orderToast.update(toastId, {
          status: "filled",
          avgPrice: executionPrice,
          remaining: Number(updated.values.demoTradeQuantity || 0),
        });
        setSize("");
        setOrderError("");
      } catch (error) {
        app.orderToast.update(toastId, { status: "rejected", rawError: error });
      } finally {
        setIsSubmittingOrder(false);
      }
    }, 900);
  }

  return (
    <div className="trading-workspace">
      <section className="trade-market-header">
        <div className="trade-pair-title">
          <button className="market-picker-trigger" aria-label="Open markets" aria-expanded={marketPickerOpen} onClick={() => setMarketPickerOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="pair-icons">
            <AssetIcon symbol={base} size={38} />
          </span>
          <div>
            <h1>{pair}</h1>
            <span>{perpetualTokenNames[base] || base}</span>
          </div>
        </div>
        <div className="trade-market-stat trade-price-stat">
          <span>Market price</span>
          <strong className={market.change > 0 ? "positive" : market.change < 0 ? "warning-text" : ""}>{formattedPrice}</strong>
        </div>
        <div className="trade-market-stat"><span>24h change</span><strong className={market.change >= 0 ? "positive" : "warning-text"}>{market.change >= 0 ? "+" : ""}{market.change}%</strong></div>
        <div className="trade-market-stat"><span>24h volume</span><strong>{market.volume}</strong></div>
        <div className="trade-market-stat"><span>Open interest</span><strong>{market.openInterest}</strong></div>
        <div className="trade-market-stat funding-countdown"><span>Funding / countdown</span><strong>{market.funding}% <em>/ {fundingCountdown}</em></strong></div>
      </section>

      {marketPickerOpen && (
        <div className="market-picker-backdrop" role="presentation" onMouseDown={() => setMarketPickerOpen(false)}>
          <section className="market-picker-drawer" role="dialog" aria-modal="true" aria-label="Perpetual markets" onMouseDown={(event) => event.stopPropagation()}>
            <div className="market-picker-header">
              <div><strong>Perpetual markets</strong><span>{formatCount(perpetualMarkets.length)} pairs</span></div>
              <button className="icon-button" aria-label="Close markets" onClick={() => setMarketPickerOpen(false)}><X size={18} /></button>
            </div>
            <div className="market-picker-tools">
              <label className="market-search">
                <Search size={15} />
                <input aria-label="Search market pairs" placeholder="Search token or pair" value={marketQuery} onChange={(event) => setMarketQuery(event.target.value)} autoFocus />
                {marketQuery && <button aria-label="Clear market search" onClick={() => setMarketQuery("")}><X size={13} /></button>}
              </label>
              <div className="market-group-tabs">
                {(["All", "Major", "Alt"] as const).map((group) => <button key={group} className={marketGroup === group ? "active" : ""} onClick={() => setMarketGroup(group)}>{group}</button>)}
              </div>
            </div>
            <div className="market-picker-table-wrap">
              <table className="market-picker-table">
                <thead><tr><th>Token</th><th>Price</th><th>24h change</th><th>24h volume</th></tr></thead>
                <tbody>
                  {filteredMarkets.map((item) => {
                    const itemPair = marketPair(item);
                    const itemPrecision = item.price > 10_000 ? 0 : item.price < 1 ? 3 : 2;
                    return <tr key={itemPair} className={itemPair === pair ? "active" : ""} onClick={() => selectMarket(item)}>
                      <td><AssetIcon symbol={item.base} size={28} /><span><strong>{itemPair}</strong><small>{perpetualTokenNames[item.base] || item.base}</small></span></td>
                      <td>{item.price.toLocaleString(undefined, { maximumFractionDigits: itemPrecision })}</td>
                      <td className={item.change >= 0 ? "positive" : "warning-text"}>{item.change >= 0 ? "+" : ""}{item.change}%</td>
                      <td>{item.volume}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
              {!filteredMarkets.length && <div className="market-empty"><Search size={20} /><strong>No matching pair</strong><span>Try BTC, ETH, USDC, or USDT.</span></div>}
            </div>
          </section>
        </div>
      )}

      <div className="trade-grid">
        <main className="trade-center-column">
          <section className="trade-panel trade-chart-panel">
            <PerpTradingChart points={chartPoints} pair={pair} timeframe={timeframe} precision={precision} onTimeframeChange={setTimeframe} />
          </section>

          <section className="trade-panel orderbook-panel">
            <div className="orderbook-tabs">
              <div>
                <button className={orderBookTab === "book" ? "active" : ""} onClick={() => setOrderBookTab("book")}>Order book</button>
                <button className={orderBookTab === "trades" ? "active" : ""} onClick={() => setOrderBookTab("trades")}>Recent trades</button>
              </div>
            </div>
            {orderBookTab === "book" ? (
              <>
                <div className="orderbook-view-caption">
                  <div className="orderbook-view-controls" aria-label="Order book side filter">
                    <button className={orderBookView === "both" ? "active" : ""} aria-label="Show buy and sell orders" onClick={() => setOrderBookView("both")}><i className="depth-icon both"><b /><b /><b /></i></button>
                    <button className={orderBookView === "bids" ? "active" : ""} aria-label="Show buy orders only" onClick={() => setOrderBookView("bids")}><i className="depth-icon bids"><b /><b /><b /></i></button>
                    <button className={orderBookView === "asks" ? "active" : ""} aria-label="Show sell orders only" onClick={() => setOrderBookView("asks")}><i className="depth-icon asks"><b /><b /><b /></i></button>
                  </div>
                  <label className="orderbook-tick-select"><select aria-label="Order book price increment" defaultValue="0.01"><option>0.01</option><option>0.1</option><option>1</option></select><ChevronDown size={12} /></label>
                </div>
                <div className="orderbook-columns"><span>Price ({quote})</span><span>Qty ({base})</span><span>Total ({base})</span></div>
                {orderBookView !== "bids" && asks.slice(0, 8).map((row) => <OrderBookRow key={`ask-${row.price}`} row={row} side="ask" precision={precision} />)}
                {orderBookView === "both" && <div className="orderbook-mid"><strong>{formattedPrice}</strong><span><TrendUp size={13} /> mark</span></div>}
                {orderBookView !== "asks" && bids.slice(0, 8).map((row) => <OrderBookRow key={`bid-${row.price}`} row={row} side="bid" precision={precision} />)}
                <div className="orderbook-ratio"><span><b>B</b> 56%</span><i /><span>44% <b>S</b></span></div>
              </>
            ) : (
              <div className="recent-trades-list">
                <div className="recent-trades-head"><span>Price ({quote})</span><span>Size ({base})</span><span>Time</span></div>
                {recentTrades.map((trade, index) => <div className={`recent-trade ${trade.side}`} key={`${trade.time}-${index}`}><strong>{trade.price.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}</strong><span>{trade.size.toFixed(2)}</span><time>{trade.time}</time></div>)}
              </div>
            )}
          </section>
        </main>

        <aside className="trade-panel order-ticket">
          <div className="order-context-bar">
            <div className="order-context-actions" aria-label="Order account settings">
              <button type="button" aria-label={`Margin mode, ${marginMode}`} onClick={() => { setPendingMarginMode(marginMode); setTradeSettingsPanel("margin"); }}>{marginMode} <ChevronDown size={11} weight="bold" /></button>
              <button type="button" aria-label={`Adjust leverage, currently ${leverage}×`} onClick={() => setTradeSettingsPanel("leverage")}>{leverage}× <ChevronDown size={11} weight="bold" /></button>
              <button type="button" aria-label={`Account type, ${accountType}`} onClick={() => { setPendingAccountType(accountType); setTradeSettingsPanel("account"); }}>{accountType === "Portfolio Margin" ? "Portfolio" : accountType} <ChevronDown size={11} weight="bold" /></button>
            </div>
          </div>

          <div className="order-step-body">
              <div className="tabs order-type-tabs">
                {(["Market", "Limit"] as const).map((item) => <button key={item} className={orderType === item ? "active" : ""} onClick={() => {
                  setOrderType(item);
                }}>{item}</button>)}
              </div>
              <div className="trade-balance-summary" aria-label="Trading capacity">
                <div><span>Available to trade</span><strong>${availableNotional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                <div><span>Current position</span><button type="button" className="position-value-toggle" aria-label={`Show current position in ${positionDisplay === "base" ? quote : base}`} onClick={() => setPositionDisplay((value) => value === "base" ? "quote" : "base")}><strong>{positionDisplay === "base" ? `${(positionMatchesMarket ? positionQuantity : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, market.quantityPrecision) })} ${base}` : `${(positionMatchesMarket ? positionSize : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote}`}</strong><ArrowsDownUp size={12} /></button></div>
              </div>
              {orderType === "Limit" && (
                <label className="field"><span>Limit price</span><div className="input-wrap"><input aria-label="Limit price" type="number" min="0" placeholder={formattedPrice} value={limitPrice} onChange={(event) => {
                  const next = event.target.value;
                  setLimitPrice(next);
                }} /><small>{quote}</small></div></label>
              )}
              <label className="field size-field"><div className="input-wrap size-input-wrap"><span className="size-input-label">Size</span><input aria-label="Size" type="number" min="0" step={sizeUnit === "base" ? 10 ** -market.quantityPrecision : .01} placeholder="0" value={displayedSize} onChange={(event) => setOrderSizeInput(event.target.value)} /><span className="size-unit-control"><span>{sizeUnit === "base" ? base : quote}</span><button type="button" className="size-unit-toggle" aria-label={`Enter size in ${sizeUnit === "base" ? quote : base}`} onClick={() => setSizeUnit((value) => value === "base" ? "quote" : "base")}><ArrowsDownUp size={12} /></button></span></div></label>
              <PositionSizeSlider value={sizePercentage} onChange={setSizeFromPercentage} disabled={maxSize <= 0 || (orderType === "Limit" && (!Number.isFinite(executionPrice) || executionPrice <= 0))} />
              <label className={`reduce-only-checkbox ${!positionMatchesMarket ? "disabled" : ""}`} title={positionMatchesMarket ? `Close up to ${formatQuantity(positionQuantity)} ${base}` : `No open ${pair} position`}>
                <input type="checkbox" checked={reduceOnly} disabled={!positionMatchesMarket} onChange={(event) => {
                  const next = event.target.checked;
                  setReduceOnly(next);
                  if (next) setSide(positionSide === "Long" ? "Short" : "Long");
                  if (next && numericSize > positionQuantity) setSize(formatQuantity(positionQuantity));
                }} />
                <span>Reduce only</span>
              </label>
              <div className="trade-order-summary compact pre-submit-metrics">
                <TradeMetricRow label="Liquidation price" value={numericSize > 0 ? `${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: precision })} ${quote}` : "—"} help="Estimated price where the position could be liquidated based on the selected side and leverage." />
                <TradeMetricRow label="Order value" value={`${orderNotional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote}`} help="Total notional value of this order at its expected execution price." />
                <TradeMetricRow label="Margin required" value={`${estimatedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote}`} help="Collateral reserved for this order after applying the selected leverage." />
                <TradeMetricRow label="Slippage" value={`Est ${estimatedSlippage.toFixed(2)}% / Max ${maximumSlippage.toFixed(2)}%`} help="Expected price movement on execution, and the most this order allows." />
                <TradeMetricRow label="Fees (maker/taker)" value="0.0150% / 0.0350%" help="Maker fees apply when an order adds liquidity. Taker fees apply when it executes against resting liquidity." />
                <TradeMetricRow label="Network fee" value={MISSING} help="Orders are placed on the execution venue and do not need a wallet transaction, so there is no network fee." />
              </div>
              {orderError && <p className="field-error" role="alert">{orderError}</p>}
              <div className="trade-submit-grid">
                <button className="button trade-submit long" disabled={isSubmittingOrder || (reduceOnly && positionSide !== "Short")} onClick={() => { setSide("Long"); placeOrder("Long"); }}>
                  {isSubmittingOrder && side === "Long" ? "Placing…" : `Long ${base}`}
                </button>
                <button className="button trade-submit short" disabled={isSubmittingOrder || (reduceOnly && positionSide !== "Long")} onClick={() => { setSide("Short"); placeOrder("Short"); }}>
                  {isSubmittingOrder && side === "Short" ? "Placing…" : `Short ${base}`}
                </button>
              </div>
          </div>
        </aside>
      </div>

      <section className="trade-panel trading-activity-panel" id="trading-activity">
        <div className="trading-activity-tabs" role="tablist" aria-label="Trading activity">
          {([
            ["positions", `Positions (${positionSize ? 1 : 0})`],
            ["open", `Open orders (${openOrders.length})`],
            ["trades", `Trade history (${activityOrders.length})`],
            ["orders", `Order history (${activityOrders.length})`],
          ] as const).map(([value, label]) => <button key={value} role="tab" aria-selected={activityTab === value} className={activityTab === value ? "active" : ""} onClick={() => setActivityTab(value)}>{label}</button>)}
          <Link className="text-link" href={farmDetailHref(farm.id)}>View DTF details</Link>
        </div>
        <div className="trading-activity-table-wrap">
          {activityTab === "positions" && (
            <table className="trading-activity-table positions-activity-table">
              <thead><tr><th>Market</th><th>Side</th><th>Size</th><th>Entry price</th><th>Mark price</th><th>Leverage</th><th>Unrealized PnL</th></tr></thead>
              <tbody>{positionSize ? <tr><td><strong>{positionPair}</strong></td><td className={positionSide === "Long" ? "positive" : "warning-text"}>{positionSide}</td><td>{positionQuantity.toLocaleString(undefined, { maximumFractionDigits: positionMarket.quantityPrecision })} {positionMarket.base}<small>{positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })} {positionQuote}</small></td><td>{entryPrice.toLocaleString()}</td><td>{positionMarket.price.toLocaleString()}</td><td>{positionLeverage}×</td><td className={pnl >= 0 ? "positive" : "warning-text"}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} {positionQuote}</td></tr> : <tr className="activity-empty-row"><td colSpan={7}>No open position.</td></tr>}</tbody>
            </table>
          )}
          {activityTab === "open" && (
            <table className="trading-activity-table">
              <thead><tr><th>Market</th><th>Side</th><th>Price</th><th>Original size</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>{openOrders.map((order) => <tr key={order.id}><td><strong>{order.pair}</strong></td><td>{order.side}</td><td>{order.price.toLocaleString(undefined, { maximumFractionDigits: precision })}</td><td>{order.size.toLocaleString()} {base}</td><td><span className="order-status open">Open</span></td><td>{order.updated}</td></tr>)}</tbody>
            </table>
          )}
          {activityTab === "trades" && (
            <table className="trading-activity-table">
              <thead><tr><th>Market</th><th>Direction</th><th>Fill price</th><th>Size</th><th>Fee</th><th>Closed PnL</th><th>Time</th></tr></thead>
              <tbody>{activityOrders.map((order, index) => <tr key={order.id}><td><strong>{order.pair}</strong></td><td>{order.side === "Long" ? "Open Long" : "Open Short"}</td><td>{order.price.toLocaleString(undefined, { maximumFractionDigits: precision })}</td><td>{Number(order.quantity || 0).toLocaleString()} {order.base}</td><td>{order.fee.toFixed(4)} {order.quote}</td><td className={index === 0 ? "warning-text" : "positive"}>{index === 0 ? "-0.0076" : "0.00"} {order.quote}</td><td>{new Date(order.filledAt).toLocaleString()}</td></tr>)}</tbody>
            </table>
          )}
          {activityTab === "orders" && (
            <table className="trading-activity-table">
              <thead><tr><th>Market</th><th>Side</th><th>Price</th><th>Original size</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>{activityOrders.map((order) => <tr key={order.id}><td><strong>{order.pair}</strong></td><td>{order.side === "Long" ? "Buy" : "Sell"}</td><td>{order.price.toLocaleString(undefined, { maximumFractionDigits: precision })}</td><td>{Number(order.quantity || 0).toLocaleString()} {order.base}</td><td><span className="order-status filled">Filled</span></td><td>{new Date(order.filledAt).toLocaleString()}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </section>

      {tradeSettingsPanel && (
        <div className="trade-settings-layer">
          <button className="trade-settings-backdrop" aria-label="Close order settings" onClick={() => setTradeSettingsPanel(null)} />
          <aside className="trade-settings-drawer" role="dialog" aria-modal="true" aria-labelledby="trade-settings-title">
            <div className="trade-settings-header">
              <div>
                <span className="eyebrow">ORDER SETTINGS</span>
                <h2 id="trade-settings-title">
                  {tradeSettingsPanel === "margin" ? `${pair} margin mode` : tradeSettingsPanel === "leverage" ? "Adjust leverage" : "Account type"}
                </h2>
              </div>
              <button type="button" aria-label="Close order settings" onClick={() => setTradeSettingsPanel(null)}><X size={18} /></button>
            </div>

            {tradeSettingsPanel === "margin" && (
              <div className="trade-settings-content">
                <p>Choose how collateral supports this {pair} position. This setting applies to the order you are building.</p>
                <div className="account-type-options margin-mode-options" role="radiogroup" aria-label="Margin mode">
                  <button type="button" role="radio" aria-checked={pendingMarginMode === "Cross"} className={pendingMarginMode === "Cross" ? "active" : ""} onClick={() => setPendingMarginMode("Cross")}>
                    <span><strong>Cross</strong><small>Share available margin across open positions. Losses can use more of the DTF account balance before liquidation.</small></span><i>{pendingMarginMode === "Cross" && <Check size={13} weight="bold" />}</i>
                  </button>
                  <button type="button" role="radio" aria-checked={pendingMarginMode === "Isolated"} className={pendingMarginMode === "Isolated" ? "active" : ""} onClick={() => setPendingMarginMode("Isolated")}>
                    <span><strong>Isolated</strong><small>Limit risk to margin assigned to this position. Additional margin can be added or removed independently.</small></span><i>{pendingMarginMode === "Isolated" && <Check size={13} weight="bold" />}</i>
                  </button>
                </div>
                <div className="trade-settings-facts">
                  <div><span>Available margin</span><strong>{availableMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                  <div><span>Margin in use</span><strong>{marginInUse.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}</strong></div>
                </div>
                <button className="button full" type="button" onClick={() => { setMarginMode(pendingMarginMode); setTradeSettingsPanel(null); }}>Apply margin mode</button>
              </div>
            )}

            {tradeSettingsPanel === "leverage" && (
              <div className="trade-settings-content">
                <p>Control the leverage used for {pair}. The maximum available leverage for this market is {market.maxLeverage}×.</p>
                <div className="leverage-display"><span>Selected leverage</span><strong>{leverage}×</strong><small>Available to trade ${availableNotional.toLocaleString(undefined, { maximumFractionDigits: 2 })}</small></div>
                <div className="leverage-quick-actions">
                  {Array.from(new Set([1, 2, 5, 10, market.maxLeverage])).filter((value) => value <= market.maxLeverage).map((value) => (
                    <button type="button" key={value} className={leverage === value ? "active" : ""} onClick={() => updateLeverage(value)}>{value}×</button>
                  ))}
                </div>
                <label className="drawer-leverage-slider">
                  <span>Leverage</span>
                  <div className="drawer-leverage-control"><input aria-label="Trade leverage" type="range" min="1" max={market.maxLeverage} step="0.5" value={leverage} onChange={(event) => updateLeverage(Number(event.target.value))} /><label><input aria-label="Leverage value" type="number" min="1" max={market.maxLeverage} step="0.5" value={leverage} onChange={(event) => updateLeverage(Number(event.target.value))} /><span>×</span></label></div>
                  <div><small>1×</small><small>{market.maxLeverage}×</small></div>
                </label>
                <Notice tone="danger">Higher leverage increases buying power and liquidation risk. Your liquidation buffer becomes smaller as leverage increases.</Notice>
                <button className="button full" type="button" onClick={() => setTradeSettingsPanel(null)}>Apply leverage</button>
              </div>
            )}

            {tradeSettingsPanel === "account" && (
              <div className="trade-settings-content">
                <p>Choose how this trading account groups collateral and risk.</p>
                <div className="account-type-options" role="radiogroup" aria-label="Trading account type">
                  <button type="button" role="radio" aria-checked={pendingAccountType === "Unified"} className={pendingAccountType === "Unified" ? "active" : ""} onClick={() => setPendingAccountType("Unified")}>
                    <span><strong>Unified Account <em>Recommended</em></strong><small>Keep each collateral asset in a separate balance. Perpetual positions use their settlement asset as collateral, shared across positions with the same collateral.</small></span><i>{pendingAccountType === "Unified" && <Check size={13} weight="bold" />}</i>
                  </button>
                  <button type="button" role="radio" aria-checked={pendingAccountType === "Portfolio Margin"} className={pendingAccountType === "Portfolio Margin" ? "active" : ""} onClick={() => setPendingAccountType("Portfolio Margin")}>
                    <span><strong>Portfolio Margin</strong><small>Evaluate eligible spot and perpetual positions together for capital-efficient margin and portfolio-level risk offsets.</small></span><i>{pendingAccountType === "Portfolio Margin" && <Check size={13} weight="bold" />}</i>
                  </button>
                  <button type="button" role="radio" aria-checked={pendingAccountType === "Manual"} className={pendingAccountType === "Manual" ? "active" : ""} onClick={() => setPendingAccountType("Manual")}>
                    <span><strong>Manual</strong><small>Keep venue balances and margin settings separate. Best suited to automated traders managing collateral directly.</small></span><i>{pendingAccountType === "Manual" && <Check size={13} weight="bold" />}</i>
                  </button>
                </div>
                {pendingAccountType === "Portfolio Margin" && <Notice tone="danger">Portfolio Margin is an advanced mode. Eligibility and collateral requirements depend on the connected execution venue.</Notice>}
                <button className="button full" type="button" onClick={() => { setAccountType(pendingAccountType); setTradeSettingsPanel(null); }}>Save account type</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function TradeMetricRow({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div>
      <span className="trade-metric-help" tabIndex={0} aria-label={`${label}. ${help}`}>
        {label}
        <span role="tooltip">{help}</span>
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function PositionSizeSlider({ value, onChange, disabled }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  const safeValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const marks = [0, 25, 50, 100];
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
        />
        <span className="position-slider-value">{Math.round(safeValue)}%</span>
        {marks.map((mark) => <i key={mark} style={{ left: `${mark}%` }} />)}
      </div>
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

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Analytics({ network }: { network: string }) {
  const app = useApp();
  const { rows, summary } = useManagerData(network);
  const [scenario, setScenario] = useState<Scenario>("Base");
  const [days, setDays] = useState(90);
  const live = rows.filter((row) => row.live);
  const tvlOf = (row: ManagerRow) => row.tvl ?? 0;
  const apy = summary.aum
    ? live.reduce((sum, row) => sum + (row.dtf.apy7d ?? 0) * tvlOf(row), 0) / summary.aum
    : 0;
  const grossYield = live.reduce((sum, row) => sum + tvlOf(row) * ((row.dtf.apy7d ?? 0) / 100), 0);
  const managementFees = live.reduce((sum, row) => sum + tvlOf(row) * (row.dtf.managementFee / 100), 0);
  const performanceFees = live.reduce(
    (sum, row) => sum + Math.max(0, tvlOf(row) * ((row.dtf.apy7d ?? 0) / 100)) * (row.dtf.performanceFee / 100),
    0,
  );
  const netYield = Math.max(0, grossYield - managementFees - performanceFees);
  const barWidth = (value: number) => `${grossYield > 0 ? Math.max(2, Math.min(100, (value / grossYield) * 100)) : 0}%`;
  const result = simulate(
    { ...templates[0].defaults, assumedApr: apy },
    "INDEX",
    scenario,
    days,
  );
  function exportCsv() {
    downloadCsv("dexponent-analytics.csv", [
      ["DTF", "Strategy", "Network", "Status", "TVL (USD)", "Return (%)", "Return basis", "Net flows 30D (USD)", "Fees earned est. (USD)", "Largest LP (% of TVL)"],
      ...rows.map((row) => [
        row.farm.name,
        row.farm.type,
        row.farm.network,
        statusLabel(row.farm.status),
        row.tvl === null ? "" : row.tvl.toFixed(2),
        row.ret.value === null ? "" : row.ret.value.toFixed(2),
        row.ret.label,
        row.netFlows30d === null ? "" : row.netFlows30d.toFixed(2),
        row.feesEarned.toFixed(2),
        row.topDepositorPct === null ? "" : row.topDepositorPct.toFixed(2),
      ]),
    ]);
    app.toast("Analytics exported");
  }
  return (
    <>
      <PageHeading
        title="Analytics"
        action={
          <button className="button" onClick={exportCsv} disabled={!rows.length}>
            <ArrowDownToLine size={16} />
            Export CSV
          </button>
        }
      />
      <div className="overview-metrics">
        <Metric
          label={<LabelTip label="TVL">Total value locked across your live DTFs.</LabelTip>}
          value={formatUsdCompact(live.length ? summary.aum : null)}
        />
        <Metric
          label={<LabelTip label="Weighted return">TVL-weighted return after fees. Uses return since launch for DTFs under 90 days old and APY after that.</LabelTip>}
          value={formatSignedPct(summary.weightedReturn)}
          tone={toneOf(summary.weightedReturn)}
        />
        <Metric
          label={<LabelTip label="Net flows · 30D">LP deposits minus withdrawals over the last 30 days.</LabelTip>}
          value={formatSignedUsd(live.length ? summary.netFlows30d : null, true)}
          tone={toneOf(live.length ? summary.netFlows30d : null)}
        />
        <Metric
          label={<LabelTip label="Fees earned">Estimated performance fees on LP yield since launch. Not yet claimed.</LabelTip>}
          value={formatUsdCompact(live.length ? summary.feesEarned : null)}
          caption="est."
        />
      </div>
      <section className="panel cost-panel">
        <div className="cost-panel-copy">
          <h3>Fee breakdown</h3>
          <p>Estimated annual fees at current TVL</p>
        </div>
        <div className="cost-rows">
          <div>
            <span>Management fees</span>
            <AnimatedValue value={formatUsdCompact(managementFees)} />
            <i style={{ width: barWidth(managementFees) }} />
          </div>
          <div>
            <span>Performance fees</span>
            <AnimatedValue value={formatUsdCompact(performanceFees)} />
            <i style={{ width: barWidth(performanceFees) }} />
          </div>
          <div>
            <span>Net yield to LPs</span>
            <AnimatedValue className="positive" value={formatUsdCompact(netYield)} />
            <i className="positive-bar" style={{ width: barWidth(netYield) }} />
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Scenario analysis</h3>
            <p>$10,000 at your weighted APY of {formatPct(apy)}</p>
          </div>
        </div>
        <div className="simulation-controls">
          <div className="segmented" role="group" aria-label="Scenario">
            {(["Bull", "Base", "Bear", "Stress"] as Scenario[]).map((s) => (
              <button
                className={scenario === s ? "active" : ""}
                aria-pressed={scenario === s}
                key={s}
                onClick={() => setScenario(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Scenario horizon">
            {[30, 90, 365].map((d) => (
              <button
                key={d}
                className={days === d ? "active" : ""}
                aria-pressed={days === d}
                onClick={() => setDays(d)}
              >
                {d === 365 ? "1Y" : `${d}D`}
              </button>
            ))}
          </div>
        </div>
        <PerformanceChart points={result.points} label="Scenario value" />
        <div className="simulation-metrics">
          <Metric label="Scenario return" value={formatSignedPct(result.returnPct)} tone={toneOf(result.returnPct)} />
          <Metric label="Volatility" value={formatPct(result.volatility)} />
          <Metric label="Max drawdown" value={formatPct(result.drawdown)} />
        </div>
        <p className="table-footnote">Model output, not a forecast. Assumes 1% management and 10% performance fees; excludes gas and slippage.</p>
      </section>
      <div className="section-heading">
        <h2>By DTF</h2>
      </div>
      <div className="farm-table-wrap">
        {rows.length ? (
          <table className="farm-table analytics-table">
            <thead>
              <tr>
                <th scope="col">DTF</th>
                <th scope="col" className="numeric">TVL</th>
                <th scope="col" className="numeric">
                  <LabelTip label="Return">After fees. Return since launch for DTFs under 90 days old, APY after that.</LabelTip>
                </th>
                <th scope="col" className="numeric">Net flows · 30D</th>
                <th scope="col" className="numeric">
                  <LabelTip label="Fees earned">Estimated performance fees since launch.</LabelTip>
                </th>
                <th scope="col" className="numeric">
                  <LabelTip label="LP concentration">Largest LP&apos;s share of TVL.</LabelTip>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link className="farm-name" href={farmDetailHref(row.farm.id)}>
                      <span className={`icon-tile ${row.farm.type.toLowerCase()}`}>
                        {row.farm.icon ? <img src={row.farm.icon} alt="" /> : <StrategyIcon type={row.farm.type} size={18} />}
                      </span>
                      <span>
                        <strong>{row.farm.name}</strong>
                        <small>
                          <span className={`strategy-tag ${row.farm.type.toLowerCase()}`}>{row.farm.type.charAt(0) + row.farm.type.slice(1).toLowerCase()}</span>
                          <span className="network-name"><NetworkIcon network={row.farm.network} size={14} />{row.farm.network}</span>
                        </small>
                      </span>
                    </Link>
                  </td>
                  <td className="numeric">{row.live ? formatUsdCompact(row.tvl) : MISSING}</td>
                  <td className="numeric"><ReturnCell row={row} /></td>
                  <td className={`numeric ${toneOf(row.live ? row.netFlows30d : null) ?? ""}`}>{row.live ? formatSignedUsd(row.netFlows30d, true) : MISSING}</td>
                  <td className="numeric">{row.live ? formatUsdCompact(row.feesEarned) : MISSING}</td>
                  <td className="numeric">{row.live && row.topDepositorPct !== null ? formatPct(row.topDepositorPct, 1) : MISSING}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No managed DTFs" description="Analytics appear once a DTF is live." href="/app/farms/new" />
        )}
      </div>
    </>
  );
}
function WorkspaceSettings({ tab }: { tab?: string }) {
  const app = useApp();
  const [name, setName] = useState(app.profile.name);
  const [workspace, setWorkspace] = useState(app.profile.workspace);
  const [saved, setSaved] = useState(false);
  const selected = tab || "general";
  return (
    <>
      <PageHeading title="Settings" />
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
                <h3>Profile</h3>
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
                <h3 id="settings-theme-label">Theme</h3>
              </div>
              <div className="dtf-segment" role="radiogroup" aria-labelledby="settings-theme-label">
                {([
                  ["dark", "Dark", Moon],
                  ["light", "Light", Sun],
                  ["system", "System", Monitor],
                ] as const).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={app.themePreference === value}
                    aria-pressed={app.themePreference === value}
                    onClick={() => app.setThemePreference(value)}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="button primary"
              disabled={!name.trim() || !workspace.trim()}
              type="submit"
            >
              {saved ? "Saved" : "Save changes"}
              {saved && <Check size={15} />}
            </button>
          </form>
        )}
        {selected === "wallet" && (
          <section className="panel">
            <h3>Wallet</h3>
            {app.wallet ? (
              <>
                <div className="wallet-connected">
                  <span className="mono wallet-address">{app.wallet}</span>
                  <span className="wallet-network-chip"><NetworkIcon network={walletNetwork(app.walletChain)} size={14} />{walletNetwork(app.walletChain)}</span>
                </div>
                <button className="button" onClick={app.disconnect}>
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <p className="muted">No wallet connected.</p>
                <button
                  className="button primary"
                  disabled={app.connecting}
                  onClick={app.connect}
                >
                  <Wallet size={16} />
                  {app.connecting ? "Waiting for wallet…" : "Connect wallet"}
                </button>
              </>
            )}
            {app.walletError && (
              <p className="field-error" role="alert">
                {app.walletError}
              </p>
            )}
            <p className="muted small">
              The network filter in the top bar does not switch your wallet&apos;s network. You are asked to switch before signing.
            </p>
          </section>
        )}
        {selected === "team" && (
          <section className="panel">
            <h3>Team</h3>
            <div className="settings-row">
              <div className="profile-row">
                <span className="avatar">{app.profile.name[0]}</span>
                <div>
                  <strong>{app.profile.name}</strong>
                  <small>Manager</small>
                </div>
              </div>
              <Badge>Owner</Badge>
            </div>
            <p className="muted small">Team invitations and roles are not available yet.</p>
          </section>
        )}
        {selected === "security" && (
          <section className="panel">
            <h3>Data &amp; security</h3>
            <p className="muted">
              Private keys and seed phrases are never requested or stored.
            </p>
            <div className="settings-row">
              <div>
                <h3>Export DTF configurations</h3>
                <p>Download every DTF configuration as JSON.</p>
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
                  a.download = "dexponent-dtfs.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export JSON
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
function Resources({ onOpenSupport }: { onOpenSupport: (target?: Omit<SupportTarget, "nonce">) => void }) {
  const popular = popularIssues.map((issue) => articleById(issue.articleId)).filter((article): article is NonNullable<typeof article> => Boolean(article)).slice(0, 6);
  return (
    <>
      <PageHeading
        title="Help"
        action={
          <button className="button primary" onClick={() => onOpenSupport()}>
            <Lifebuoy size={16} /> Open help center
          </button>
        }
      />
      <section className="panel help-page">
        <div className="panel-heading">
          <h3>Common questions</h3>
        </div>
        <ul className="help-list">
          {popular.map((article) => (
            <li key={article.id}>
              <button className="help-question" onClick={() => onOpenSupport({ article: article.id })}>
                <span>
                  <strong>{article.question}</strong>
                  <small>{article.summary}</small>
                </span>
                <CaretRight size={15} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel help-page">
        <div className="panel-heading">
          <h3>Topics</h3>
        </div>
        <div className="help-topics">
          {helpCategories.map((category) => (
            <button key={category.id} className="help-topic" onClick={() => onOpenSupport({ category: category.id })}>
              <strong>{category.label}</strong>
              <small>{formatCount(articlesIn(category.id).length)} article{articlesIn(category.id).length === 1 ? "" : "s"}</small>
            </button>
          ))}
        </div>
      </section>
      <p className="muted small">
        Still stuck? <a className="text-link" href={supportMailto("Help request")}>Email support</a>
      </p>
    </>
  );
}
