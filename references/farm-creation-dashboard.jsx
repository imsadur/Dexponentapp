import { useState } from "react";
import {
  Check,
  ChevronDown,
  RefreshCw,
  Info,
  Upload,
  Share2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const TEMPLATES = [
  {
    id: "index",
    name: "Advanced Index",
    tag: "Index",
    blurb: "Multi-asset DeFi index with automated rebalancing.",
    setup: "~2 min setup",
    profile: "Balanced defaults",
    defaults: { apr: 18, cooldown: 7, buffer: 12, minSub: 100, rebase: 7 },
  },
  {
    id: "spot",
    name: "Spot Trading",
    tag: "Trading",
    blurb: "Algorithmic spot trading with momentum signals.",
    setup: "~2 min setup",
    profile: "Active management",
    defaults: { apr: 24, cooldown: 5, buffer: 15, minSub: 250, rebase: 3 },
  },
  {
    id: "perp",
    name: "Perpetual Trading",
    tag: "Derivatives",
    blurb: "Leveraged perpetual trading with funding optimization.",
    setup: "~3 min setup",
    profile: "Higher risk band",
    defaults: { apr: 32, cooldown: 10, buffer: 20, minSub: 500, rebase: 1 },
  },
  {
    id: "staking",
    name: "Staking",
    tag: "Staking",
    blurb: "ETH staking across venue-selected validators.",
    setup: "~1 min setup",
    profile: "Conservative defaults",
    defaults: { apr: 6, cooldown: 3, buffer: 8, minSub: 50, rebase: 14 },
  },
];

const STEP_LABELS = ["Template", "Configure", "Simulate & review", "Deploy"];

export default function FarmCreationDashboard() {
  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState(null);
  const [expanded, setExpanded] = useState({ risk: false, yield: false });
  const [tokenState, setTokenState] = useState("idle"); // idle | loading | error | loaded
  const [deployState, setDeployState] = useState("idle"); // idle | signing | done
  const [form, setForm] = useState({
    ticker: "",
    tokenName: "",
    decimals: 18,
    accessType: "open",
    apr: 18,
    cooldown: 7,
    buffer: 12,
    minSub: 100,
    maturity: false,
    withdrawalMode: "accumulate",
    rebase: 7,
  });

  const template = TEMPLATES.find((t) => t.id === templateId);
  const maxReachable = templateId ? 4 : 1;

  function chooseTemplate(t) {
    setTemplateId(t.id);
    setForm((f) => ({ ...f, ...t.defaults }));
    setStep(2);
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function loadTokens(fail) {
    setTokenState("loading");
    window.setTimeout(() => setTokenState(fail ? "error" : "loaded"), 650);
  }

  function goStep(n) {
    if (n <= maxReachable) setStep(n);
  }

  const projLow = Math.max(0, form.apr - 4);
  const projHigh = form.apr + 6;

  return (
    <div className="dex-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .dex-root {
          --bg: #101613;
          --surface: #161e1a;
          --surface-2: #1c2620;
          --border: #283530;
          --border-soft: #202a25;
          --text: #eaf2ec;
          --text-muted: #8ea69a;
          --text-faint: #5d6f66;
          --accent: #7fe8c0;
          --accent-dim: rgba(127,232,192,0.13);
          --accent-strong: #5fd1a6;
          --risk: #d9a441;
          --risk-dim: rgba(217,164,65,0.13);
          --danger: #e2836a;
          --danger-dim: rgba(226,131,106,0.13);
          --font-serif: 'Source Serif 4', Georgia, serif;
          --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.5;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .dex-root * { box-sizing: border-box; }
        .dex-root button { font-family: inherit; }
        @media (prefers-reduced-motion: reduce) {
          .dex-root * { transition: none !important; }
        }
        .dex-shell {
          display: grid;
          grid-template-columns: 200px minmax(0,1fr) 300px;
          min-height: 640px;
        }
        @media (max-width: 900px) {
          .dex-shell { grid-template-columns: 1fr; }
          .dex-rail { display: none; }
          .dex-preview { border-left: none; border-top: 1px solid var(--border); }
        }

        /* Rail */
        .dex-rail {
          border-right: 1px solid var(--border);
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dex-wordmark {
          font-family: var(--font-serif);
          font-size: 20px;
          margin-bottom: 28px;
          color: var(--text);
        }
        .dex-wordmark span { color: var(--accent); }
        .dex-step-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 8px;
          border-radius: 7px;
          cursor: pointer;
          color: var(--text-muted);
          background: transparent;
          border: none;
          text-align: left;
          width: 100%;
        }
        .dex-step-item:hover:not(:disabled) { background: var(--surface-2); }
        .dex-step-item:disabled { cursor: not-allowed; opacity: 0.45; }
        .dex-step-item.active { color: var(--text); background: var(--accent-dim); }
        .dex-step-num {
          width: 20px; height: 20px; border-radius: 50%;
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0;
          color: var(--text-faint);
        }
        .dex-step-item.active .dex-step-num { border-color: var(--accent); color: var(--accent); }
        .dex-step-num.done { background: var(--accent); border-color: var(--accent); color: #0c1512; }
        .dex-rail-foot {
          margin-top: auto;
          font-size: 11px;
          color: var(--text-faint);
          padding-top: 16px;
          border-top: 1px solid var(--border-soft);
        }

        /* Main */
        .dex-main {
          padding: 32px 36px;
          overflow-y: auto;
          max-height: 800px;
        }
        .dex-eyebrow { font-size: 11px; color: var(--text-faint); margin-bottom: 6px; }
        .dex-h1 {
          font-family: var(--font-serif);
          font-size: 26px;
          font-weight: 600;
          margin: 0 0 6px 0;
          color: var(--text);
        }
        .dex-sub { color: var(--text-muted); margin: 0 0 28px 0; font-size: 13px; }

        /* Template cards */
        .dex-tmpl-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 600px) { .dex-tmpl-grid { grid-template-columns: 1fr; } }
        .dex-tmpl-card {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px;
          background: var(--surface);
          cursor: pointer;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color .15s ease, background .15s ease;
        }
        .dex-tmpl-card:hover { border-color: var(--accent); background: var(--surface-2); }
        .dex-tmpl-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .dex-tag {
          font-size: 10.5px;
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .dex-tmpl-name { font-family: var(--font-serif); font-size: 17px; color: var(--text); }
        .dex-tmpl-blurb { color: var(--text-muted); font-size: 12px; line-height: 1.5; }
        .dex-tmpl-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-faint); margin-top: 2px; }
        .dex-tmpl-meta b { color: var(--accent); font-weight: 500; }

        /* Section cards */
        .dex-section { border: 1px solid var(--border); border-radius: 10px; margin-bottom: 14px; background: var(--surface); }
        .dex-section-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 15px 18px;
          cursor: pointer;
          border: none; background: none; width: 100%; color: inherit; text-align: left;
        }
        .dex-section-head.static { cursor: default; }
        .dex-section-title-wrap { display: flex; flex-direction: column; gap: 3px; }
        .dex-section-title { font-family: var(--font-serif); font-size: 15px; color: var(--text); }
        .dex-section-summary { font-size: 11.5px; color: var(--text-faint); }
        .dex-section-body { padding: 4px 18px 18px 18px; display: flex; flex-direction: column; gap: 16px; }
        .dex-chevron { color: var(--text-faint); transition: transform .15s ease; flex-shrink: 0; }
        .dex-chevron.open { transform: rotate(180deg); }

        .dex-field { display: flex; flex-direction: column; gap: 6px; }
        .dex-field-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; color: var(--text-muted);
        }
        .dex-field-label .info { color: var(--text-faint); }
        .dex-input, .dex-select {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 9px 12px;
          color: var(--text);
          font-family: var(--font-mono);
          font-size: 13px;
          width: 100%;
        }
        .dex-input:focus-visible, .dex-select:focus-visible, .dex-tmpl-card:focus-visible, button:focus-visible {
          outline: 2px solid var(--accent); outline-offset: 1px;
        }
        .dex-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 560px) { .dex-row2 { grid-template-columns: 1fr; } }

        .dex-upload {
          border: 1px dashed var(--border);
          border-radius: 8px;
          padding: 18px;
          display: flex; align-items: center; gap: 10px;
          color: var(--text-faint);
          font-size: 12px;
        }

        .dex-toggle-group { display: flex; gap: 10px; }
        .dex-toggle-opt {
          flex: 1;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 14px;
          cursor: pointer;
          background: var(--surface-2);
        }
        .dex-toggle-opt.selected { border-color: var(--accent); background: var(--accent-dim); }
        .dex-toggle-title { color: var(--text); font-size: 13px; margin-bottom: 2px; }
        .dex-toggle-caption { color: var(--text-faint); font-size: 11px; }

        .dex-slider-row { display: flex; justify-content: space-between; align-items: baseline; }
        .dex-slider-val { font-family: var(--font-mono); color: var(--accent); font-size: 13px; }
        .dex-slider {
          width: 100%; accent-color: var(--accent);
          height: 4px;
        }
        .dex-slider-caption { color: var(--text-faint); font-size: 11px; }
        .dex-slider.risk { accent-color: var(--risk); }
        .dex-slider-val.risk { color: var(--risk); }

        .dex-error-box {
          border: 1px solid var(--danger);
          background: var(--danger-dim);
          border-radius: 8px;
          padding: 12px 14px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px; color: var(--danger);
        }
        .dex-retry-btn {
          border: 1px solid var(--danger);
          background: transparent;
          color: var(--danger);
          border-radius: 6px;
          padding: 5px 11px;
          font-size: 11.5px;
          display: flex; align-items: center; gap: 5px;
          cursor: pointer;
        }
        .dex-retry-btn:hover { background: var(--danger-dim); }

        .dex-load-btn {
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 9px 12px;
          font-size: 12.5px;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .dex-load-btn:hover { border-color: var(--accent); color: var(--text); }

        .dex-nav-row { display: flex; justify-content: space-between; margin-top: 24px; }
        .dex-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
        }
        .dex-btn:hover { border-color: var(--text-muted); }
        .dex-btn.primary {
          background: var(--accent);
          border-color: var(--accent);
          color: #0c1512;
          font-weight: 600;
        }
        .dex-btn.primary:hover { background: var(--accent-strong); }
        .dex-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Review summary */
        .dex-review-group { border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; margin-bottom: 12px; background: var(--surface); }
        .dex-review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .dex-review-head-title { font-family: var(--font-serif); font-size: 14px; }
        .dex-edit-link { font-size: 11.5px; color: var(--accent); background: none; border: none; cursor: pointer; }
        .dex-review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
        .dex-review-item { display: flex; flex-direction: column; gap: 2px; }
        .dex-review-item-label { font-size: 10.5px; color: var(--text-faint); }
        .dex-review-item-val { font-size: 13px; color: var(--text); }

        .dex-proj-panel {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          background: var(--surface);
          margin-bottom: 14px;
        }
        .dex-proj-bar-track { height: 6px; border-radius: 4px; background: var(--surface-2); position: relative; margin: 14px 0 8px 0; }
        .dex-proj-bar-fill { position: absolute; top:0; bottom:0; border-radius: 4px; background: linear-gradient(90deg, var(--risk), var(--accent)); }
        .dex-proj-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-faint); }

        .dex-notice {
          display: flex; gap: 10px; align-items: flex-start;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 12px;
          color: var(--text-muted);
          background: var(--surface-2);
        }

        .dex-cost-strip {
          display: flex; gap: 18px; font-size: 11.5px; color: var(--text-faint);
          padding-top: 4px;
        }
        .dex-cost-strip b { color: var(--text-muted); font-weight: 500; }

        /* Preview */
        .dex-preview {
          border-left: 1px solid var(--border);
          padding: 28px 22px;
          display: flex;
          flex-direction: column;
        }
        .dex-preview-eyebrow { font-size: 11px; color: var(--text-faint); margin-bottom: 16px; }
        .dex-farm-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .dex-farm-glow {
          position: absolute; top: -60px; right: -60px; width: 160px; height: 160px;
          background: radial-gradient(circle, var(--accent-dim) 0%, transparent 70%);
          pointer-events: none;
        }
        .dex-farm-logo {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-size: 16px; color: var(--text-faint);
          margin-bottom: 12px;
        }
        .dex-farm-ticker { font-family: var(--font-serif); font-size: 19px; color: var(--text); }
        .dex-farm-name { font-size: 11.5px; color: var(--text-faint); margin-top: 2px; }
        .dex-farm-apr-row { display: flex; align-items: baseline; gap: 6px; margin: 18px 0 4px 0; }
        .dex-farm-apr { font-family: var(--font-mono); font-size: 34px; color: var(--accent); font-weight: 600; }
        .dex-farm-apr-label { font-size: 11px; color: var(--text-faint); }
        .dex-farm-badges { display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
        .dex-farm-badge {
          font-size: 10.5px; padding: 3px 9px; border-radius: 20px;
          border: 1px solid var(--border); color: var(--text-muted);
        }
        .dex-preview-footer { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-soft); font-size: 11px; color: var(--text-faint); display: flex; flex-direction: column; gap: 5px; }
        .dex-share-row { display: flex; gap: 8px; margin-top: 16px; }
        .dex-share-icon {
          width: 30px; height: 30px; border-radius: 7px;
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-faint);
        }
        .dex-success-badge {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--accent); font-size: 12px; margin-top: 14px;
        }
      `}</style>

      <div className="dex-shell">
        {/* RAIL */}
        <div className="dex-rail">
          <div className="dex-wordmark">
            ∂ex<span>.</span>
          </div>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step || (n === 4 && deployState === "done");
            return (
              <button
                key={label}
                className={`dex-step-item ${step === n ? "active" : ""}`}
                onClick={() => goStep(n)}
                disabled={n > maxReachable}
              >
                <span className={`dex-step-num ${done ? "done" : ""}`}>
                  {done ? <Check size={12} /> : n}
                </span>
                {label}
              </button>
            );
          })}
          <div className="dex-rail-foot">
            {template ? `Template: ${template.name}` : "No template selected"}
          </div>
        </div>

        {/* MAIN */}
        <div className="dex-main">
          {step === 1 && (
            <>
              <div className="dex-eyebrow">Step 1 of 4</div>
              <h1 className="dex-h1">Choose a template</h1>
              <p className="dex-sub">
                Start from a strategy type — defaults are pre-filled, edit anything after.
              </p>
              <div className="dex-tmpl-grid">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    className="dex-tmpl-card"
                    onClick={() => chooseTemplate(t)}
                  >
                    <div className="dex-tmpl-top">
                      <span className="dex-tmpl-name">{t.name}</span>
                      <span className="dex-tag">{t.tag}</span>
                    </div>
                    <div className="dex-tmpl-blurb">{t.blurb}</div>
                    <div className="dex-tmpl-meta">
                      <span><b>{t.setup}</b></span>
                      <span>{t.profile}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && template && (
            <>
              <div className="dex-eyebrow">Step 2 of 4</div>
              <h1 className="dex-h1">Configure farm</h1>
              <p className="dex-sub">
                Required fields are open below. Risk and yield mechanics are pre-filled from{" "}
                {template.name} — open them only if you want to change something.
              </p>

              {/* Identity */}
              <div className="dex-section">
                <div className="dex-section-head static">
                  <div className="dex-section-title-wrap">
                    <span className="dex-section-title">Identity</span>
                    <span className="dex-section-summary">Required</span>
                  </div>
                </div>
                <div className="dex-section-body">
                  <div className="dex-upload">
                    <Upload size={16} />
                    Upload token logo — PNG or JPG, up to 2MB
                  </div>
                  <div className="dex-row2">
                    <div className="dex-field">
                      <label className="dex-field-label">Ticker</label>
                      <input
                        className="dex-input"
                        placeholder="e.g. BIT"
                        value={form.ticker}
                        onChange={(e) => set("ticker", e.target.value)}
                      />
                    </div>
                    <div className="dex-field">
                      <label className="dex-field-label">Token name</label>
                      <input
                        className="dex-input"
                        placeholder="e.g. Balance Index Token"
                        value={form.tokenName}
                        onChange={(e) => set("tokenName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="dex-field">
                    <label className="dex-field-label">
                      Base token
                      <Info size={12} className="info" />
                    </label>
                    {tokenState === "idle" && (
                      <button className="dex-load-btn" onClick={() => loadTokens(true)}>
                        Select base asset...
                      </button>
                    )}
                    {tokenState === "loading" && (
                      <button className="dex-load-btn" disabled>
                        <Loader2 size={13} className="spin" style={{ marginRight: 6 }} />
                        Loading tokens...
                      </button>
                    )}
                    {tokenState === "error" && (
                      <div className="dex-error-box">
                        Couldn't load token list — check your connection
                        <button className="dex-retry-btn" onClick={() => loadTokens(false)}>
                          <RefreshCw size={11} /> Retry
                        </button>
                      </div>
                    )}
                    {tokenState === "loaded" && (
                      <select className="dex-select" defaultValue="usdc">
                        <option value="usdc">USDC</option>
                        <option value="eth">ETH</option>
                        <option value="usdt">USDT</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Strategy basics */}
              <div className="dex-section">
                <div className="dex-section-head static">
                  <div className="dex-section-title-wrap">
                    <span className="dex-section-title">Strategy basics</span>
                    <span className="dex-section-summary">Required</span>
                  </div>
                </div>
                <div className="dex-section-body">
                  <div className="dex-field">
                    <div className="dex-slider-row">
                      <label className="dex-field-label">Target APR</label>
                      <span className="dex-slider-val">{form.apr}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      className="dex-slider"
                      value={form.apr}
                      onChange={(e) => set("apr", Number(e.target.value))}
                    />
                  </div>

                  <div className="dex-field">
                    <label className="dex-field-label">Strategy access</label>
                    <div className="dex-toggle-group">
                      <div
                        className={`dex-toggle-opt ${form.accessType === "open" ? "selected" : ""}`}
                        onClick={() => set("accessType", "open")}
                      >
                        <div className="dex-toggle-title">Open</div>
                        <div className="dex-toggle-caption">LPs can deposit anytime</div>
                      </div>
                      <div
                        className={`dex-toggle-opt ${form.accessType === "closed" ? "selected" : ""}`}
                        onClick={() => set("accessType", "closed")}
                      >
                        <div className="dex-toggle-title">Closed</div>
                        <div className="dex-toggle-caption">Time-limited deposit window</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk & subscription — collapsible */}
              <div className="dex-section">
                <button
                  className="dex-section-head"
                  onClick={() => setExpanded((e) => ({ ...e, risk: !e.risk }))}
                >
                  <div className="dex-section-title-wrap">
                    <span className="dex-section-title">Risk & subscription</span>
                    <span className="dex-section-summary">
                      Cooldown {form.cooldown}d · Buffer {form.buffer}% · Min ${form.minSub}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`dex-chevron ${expanded.risk ? "open" : ""}`} />
                </button>
                {expanded.risk && (
                  <div className="dex-section-body">
                    <div className="dex-field">
                      <div className="dex-slider-row">
                        <label className="dex-field-label">Cooldown period</label>
                        <span className="dex-slider-val">{form.cooldown} days</span>
                      </div>
                      <input
                        type="range" min="3" max="15" className="dex-slider"
                        value={form.cooldown}
                        onChange={(e) => set("cooldown", Number(e.target.value))}
                      />
                      <span className="dex-slider-caption">Time LPs wait before a withdrawal clears</span>
                    </div>
                    <div className="dex-field">
                      <div className="dex-slider-row">
                        <label className="dex-field-label">Buffer limit</label>
                        <span className="dex-slider-val risk">{form.buffer}%</span>
                      </div>
                      <input
                        type="range" min="5" max="30" className="dex-slider risk"
                        value={form.buffer}
                        onChange={(e) => set("buffer", Number(e.target.value))}
                      />
                      <span className="dex-slider-caption">Liquidity reserve kept idle for withdrawals</span>
                    </div>
                    <div className="dex-row2">
                      <div className="dex-field">
                        <label className="dex-field-label">Minimum subscription</label>
                        <input
                          className="dex-input"
                          value={form.minSub}
                          onChange={(e) => set("minSub", e.target.value)}
                        />
                      </div>
                      <div className="dex-field">
                        <label className="dex-field-label">Maturity period</label>
                        <div
                          className={`dex-toggle-opt ${form.maturity ? "selected" : ""}`}
                          onClick={() => set("maturity", !form.maturity)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="dex-toggle-title">
                            {form.maturity ? "Enabled" : "Off — no lock period"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Yield mechanics — collapsible */}
              <div className="dex-section">
                <button
                  className="dex-section-head"
                  onClick={() => setExpanded((e) => ({ ...e, yield: !e.yield }))}
                >
                  <div className="dex-section-title-wrap">
                    <span className="dex-section-title">Yield mechanics</span>
                    <span className="dex-section-summary">
                      {form.withdrawalMode === "accumulate" ? "Accumulate" : "Periodic"} · Rebase every {form.rebase}d
                    </span>
                  </div>
                  <ChevronDown size={16} className={`dex-chevron ${expanded.yield ? "open" : ""}`} />
                </button>
                {expanded.yield && (
                  <div className="dex-section-body">
                    <div className="dex-field">
                      <label className="dex-field-label">Withdrawal mode</label>
                      <div className="dex-toggle-group">
                        <div
                          className={`dex-toggle-opt ${form.withdrawalMode === "accumulate" ? "selected" : ""}`}
                          onClick={() => set("withdrawalMode", "accumulate")}
                        >
                          <div className="dex-toggle-title">Accumulate</div>
                          <div className="dex-toggle-caption">Yield compounds automatically</div>
                        </div>
                        <div
                          className={`dex-toggle-opt ${form.withdrawalMode === "periodic" ? "selected" : ""}`}
                          onClick={() => set("withdrawalMode", "periodic")}
                        >
                          <div className="dex-toggle-title">Periodic</div>
                          <div className="dex-toggle-caption">Manual claim intervals</div>
                        </div>
                      </div>
                    </div>
                    <div className="dex-field">
                      <label className="dex-field-label">Rebase interval (days)</label>
                      <input
                        className="dex-input"
                        style={{ maxWidth: 140 }}
                        value={form.rebase}
                        onChange={(e) => set("rebase", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="dex-nav-row">
                <button className="dex-btn" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button className="dex-btn primary" onClick={() => setStep(3)}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {step === 3 && template && (
            <>
              <div className="dex-eyebrow">Step 3 of 4</div>
              <h1 className="dex-h1">Simulate & review</h1>
              <p className="dex-sub">Check the numbers, then deploy. Nothing here is final until you sign.</p>

              <div className="dex-proj-panel">
                <div className="dex-section-title" style={{ marginBottom: 4 }}>Projected outcome</div>
                <span className="dex-slider-caption">Estimated range based on current settings</span>
                <div className="dex-proj-bar-track">
                  <div
                    className="dex-proj-bar-fill"
                    style={{ left: "10%", width: "70%" }}
                  />
                </div>
                <div className="dex-proj-labels">
                  <span>{projLow}% APR (downside)</span>
                  <span style={{ color: "var(--accent)" }}>{form.apr}% target</span>
                  <span>{projHigh}% APR (upside)</span>
                </div>
              </div>

              <div className="dex-review-group">
                <div className="dex-review-head">
                  <span className="dex-review-head-title">Identity</span>
                  <button className="dex-edit-link" onClick={() => setStep(2)}>Edit</button>
                </div>
                <div className="dex-review-grid">
                  <div className="dex-review-item">
                    <span className="dex-review-item-label">Ticker</span>
                    <span className="dex-review-item-val">{form.ticker || "—"}</span>
                  </div>
                  <div className="dex-review-item">
                    <span className="dex-review-item-label">Token name</span>
                    <span className="dex-review-item-val">{form.tokenName || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="dex-review-group">
                <div className="dex-review-head">
                  <span className="dex-review-head-title">Strategy & risk</span>
                  <button className="dex-edit-link" onClick={() => setStep(2)}>Edit</button>
                </div>
                <div className="dex-review-grid">
                  <div className="dex-review-item">
                    <span className="dex-review-item-label">Target APR</span>
                    <span className="dex-review-item-val">{form.apr}%</span>
                  </div>
                  <div className="dex-review-item">
                    <span className="dex-review-item-label">Access</span>
                    <span className="dex-review-item-val">{form.accessType === "open" ? "Open" : "Closed"}</span>
                  </div>
                  <div className="dex-review-item">
                    <span className="dex-review-item-label">Cooldown</span>
                    <span className="dex-review-item-val">{form.cooldown} days</span>
                  </div>
                  <div className="dex-review-item">
                    <span className="dex-review-item-label">Buffer limit</span>
                    <span className="dex-review-item-val">{form.buffer}%</span>
                  </div>
                </div>
              </div>

              <div className="dex-notice">
                <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                This farm will be reviewed by the Dexponent team before it goes live —
                typically within 2 hours. You'll be notified either way.
              </div>

              <div className="dex-cost-strip">
                <span><b>~45 sec</b> to sign</span>
                <span><b>~$1.80</b> est. gas</span>
                <span><b>Base Sepolia</b></span>
              </div>

              <div className="dex-nav-row">
                <button className="dex-btn" onClick={() => setStep(2)}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button className="dex-btn primary" onClick={() => setStep(4)}>
                  Continue to deploy <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {step === 4 && template && (
            <>
              <div className="dex-eyebrow">Step 4 of 4</div>
              <h1 className="dex-h1">Deploy</h1>
              <p className="dex-sub">One signature deploys your farm and mints the token.</p>

              {deployState !== "done" ? (
                <div className="dex-section">
                  <div className="dex-section-body" style={{ paddingTop: 18 }}>
                    <div className="dex-notice">
                      <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                      Signing deploys the farm contract and mints ${form.ticker || "TICKER"} in a single transaction.
                    </div>
                    <button
                      className="dex-btn primary"
                      style={{ justifyContent: "center" }}
                      disabled={deployState === "signing"}
                      onClick={() => {
                        setDeployState("signing");
                        window.setTimeout(() => setDeployState("done"), 1000);
                      }}
                    >
                      {deployState === "signing" ? (
                        <>
                          <Loader2 size={14} className="spin" /> Signing (1 of 1)...
                        </>
                      ) : (
                        "Sign & deploy farm"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="dex-section">
                  <div className="dex-section-body" style={{ paddingTop: 18 }}>
                    <div className="dex-success-badge">
                      <Check size={15} /> Farm deployed — pending protocol review
                    </div>
                    <span className="dex-slider-caption">
                      Share your farm now to start building an LP queue while review completes.
                    </span>
                    <div className="dex-share-row">
                      <div className="dex-share-icon"><Share2 size={14} /></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="dex-nav-row">
                <button className="dex-btn" onClick={() => setStep(3)} disabled={deployState !== "idle"}>
                  <ArrowLeft size={14} /> Back
                </button>
                <span />
              </div>
            </>
          )}
        </div>

        {/* PREVIEW */}
        <div className="dex-preview">
          <div className="dex-preview-eyebrow">Live preview — what LPs will see</div>
          <div className="dex-farm-card">
            <div className="dex-farm-glow" />
            <div className="dex-farm-logo">{form.ticker ? form.ticker[0] : "∂"}</div>
            <div className="dex-farm-ticker">${form.ticker || "TICKER"}</div>
            <div className="dex-farm-name">{form.tokenName || (template ? `${template.name} Farm` : "Untitled farm")}</div>
            <div className="dex-farm-apr-row">
              <span className="dex-farm-apr">{form.apr}%</span>
              <span className="dex-farm-apr-label">target APR</span>
            </div>
            <div className="dex-farm-badges">
              <span className="dex-farm-badge">{template ? template.tag : "—"}</span>
              <span className="dex-farm-badge">{form.accessType === "open" ? "Open" : "Closed"}</span>
              <span className="dex-farm-badge">{form.cooldown}d cooldown</span>
            </div>
            <div className="dex-preview-footer">
              <span>Min. subscription ${form.minSub}</span>
              <span>Buffer {form.buffer}% · Rebase every {form.rebase}d</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: dexspin 0.8s linear infinite; }
        @keyframes dexspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
