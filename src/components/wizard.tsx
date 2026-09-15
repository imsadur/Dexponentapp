"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle as CheckCircle2,
  CaretDown as ChevronDown,
  Clock as Clock3,
  FileDoc as FileCheck2,
  FileText,
  Plus,
  FloppyDisk as Save,
  Shield,
  SlidersHorizontal,
  Trash as Trash2,
  UploadSimple as Upload,
} from "@phosphor-icons/react";
import {
  defaultAllocations,
  families,
  makeFarm,
  riskFor,
  simulate,
  templateById,
  templates,
  validateStrategy,
  type Farm,
  type Field,
  type Scenario,
  type StrategyType,
  type Values,
} from "@/domain/strategy";
import { deploymentAdapter } from "@/adapters/deployment";
import { deployDemoFarm } from "@/domain/farm-actions";
import { farmDetailHref } from "@/domain/routes";
import { useApp } from "./provider";
import {
  Badge,
  AssetIcon,
  AssetList,
  EmptyState,
  Metric,
  money,
  NetworkIcon,
  Notice,
  PerformanceChart,
  Risk,
  StrategyIcon,
} from "./ui";

gsap.registerPlugin(useGSAP);

const steps = [
  "Strategy + template",
  "Configure",
  "Risk & fees",
  "Review",
  "Simulate",
  "Deploy",
];
export function Wizard({ farmId }: { farmId?: string }) {
  const app = useApp(),
    router = useRouter();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [type, setType] = useState<StrategyType | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scenario, setScenario] = useState<Scenario>("Base");
  const [days, setDays] = useState(90);
  const [simulated, setSimulated] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Not saved yet");
  const [assetToAdd, setAssetToAdd] = useState("DAI");
  const heading = useRef<HTMLHeadingElement>(null);
  const selectionStage = useRef<HTMLDivElement>(null);
  const saveRef = useRef(app.saveFarm);
  saveRef.current = app.saveFarm;
  useEffect(() => {
    if (!app.ready || initialized) return;
    const params = new URLSearchParams(window.location.search);
    const id = farmId || params.get("draft");
    const existing = id ? app.farms.find((f) => f.id === id) : null;
    if (existing) {
      const copy = structuredClone(existing);
      if (existing.source === "demo") {
        copy.id = crypto.randomUUID();
        copy.source = "local";
        copy.status = "DRAFT";
        copy.tvl = 0;
        copy.apy = 0;
        copy.performance = 0;
        copy.events = [];
      }
      setFarm(copy);
      setType(copy.type);
      setStep(Math.min(copy.step, 5));
    } else {
      const t = templateById(params.get("template") || "");
      if (t) {
        setType(t.type);
        setFarm(makeFarm(t, crypto.randomUUID()));
        setStep(1);
      }
    }
    setInitialized(true);
  }, [app.ready, app.farms, farmId, initialized]);
  useGSAP(
    () => {
      if (!type || step !== 0) return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) return;
      gsap.fromTo(
        ".template-reveal",
        { autoAlpha: 0, y: 46 },
        { autoAlpha: 1, y: 0, duration: 0.72, ease: "power3.out" },
      );
      gsap.fromTo(
        ".template-reveal .template-card",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.48,
          stagger: 0.045,
          ease: "power2.out",
          delay: 0.12,
        },
      );
    },
    {
      dependencies: [type, step],
      scope: selectionStage,
      revertOnUpdate: true,
    },
  );
  useEffect(() => {
    if (!farm || success) return;
    setSaveLabel("Saving…");
    const timer = setTimeout(() => {
      saveRef.current(farm);
      setSaveLabel("All changes saved");
    }, 350);
    return () => clearTimeout(timer);
  }, [farm, success]);
  const currentFarm = useRef(farm);
  currentFarm.current = farm;
  const successRef = useRef(success);
  successRef.current = success;
  useEffect(
    () => () => {
      if (currentFarm.current && !successRef.current)
        saveRef.current(currentFarm.current);
    },
    [],
  );
  const t = farm ? templateById(farm.templateId) : null;
  const values = farm?.values || {};
  const allocations = farm?.allocations || [];
  const risk = t ? riskFor(t, values) : "MEDIUM";
  function change(patch: Partial<Farm>) {
    setFarm((f) =>
      f
        ? {
            ...f,
            ...patch,
            status: "DRAFT",
            updatedAt: new Date().toISOString(),
          }
        : f,
    );
    setSimulated(false);
    setAccepted(false);
    setErrors({});
  }
  function value(key: string, v: string | number) {
    let next = { ...values, [key]: v };
    if (key === "strategy" && v === "Staking")
      next = { ...next, protocol: "Lido", asset: "ETH" };
    if (key === "strategy" && v === "Liquidity Provision")
      next = { ...next, protocol: "Uniswap", pool: "ETH / USDC" };
    if (key === "strategy" && v === "Lending")
      next = { ...next, protocol: "Aave" };
    change({
      values: next,
      name: String(next.name),
      ...(key === "strategy" && v === "Staking" ? { network: "Ethereum" } : {}),
    });
    if (key === "allocationMethod" && v === "Equal Weight" && farm) {
      const n = farm.allocations.length;
      change({
        values: next,
        allocations: farm.allocations.map((a, i) => ({
          ...a,
          weight:
            i === n - 1
              ? 100 - (Math.round((100 / n) * 100) / 100) * (n - 1)
              : Math.round((100 / n) * 100) / 100,
        })),
      });
    }
  }
  function go(n: number) {
    setStep(n);
    setErrors({});
    if (farm)
      setFarm({ ...farm, step: n, updatedAt: new Date().toISOString() });
    requestAnimationFrame(() => heading.current?.focus());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function next() {
    if ((step === 1 || step === 2) && farm && t) {
      const e = validateStrategy(t, values, allocations, farm.network);
      setErrors(e);
      if (Object.keys(e).length) {
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
        return;
      }
    }
    go(step + 1);
  }
  function selectTemplate(id: string) {
    const selected = templateById(id)!;
    const created = makeFarm(selected, farm?.id || crypto.randomUUID());
    setFarm(created);
    setType(selected.type);
    setStep(1);
    setSimulated(false);
    setAccepted(false);
  }
  function finish() {
    if (!farm || !t || !accepted) return;
    try {
      deploymentAdapter.prepare(farm, t);
      const projected = simulate(values, farm.type, "Base", 90);
      const finished = deployDemoFarm(
        { ...farm, name: String(values.name) },
        risk,
        projected.apy,
      );
      app.saveFarm(finished);
      setFarm(finished);
      setSuccess(true);
      app.toast(`${finished.name} deployed and added to Managed Farms.`);
      router.push(farmDetailHref(finished.id));
    } catch (e) {
      setErrors({
        deployment:
          e instanceof Error ? e.message : "Unable to prepare deployment.",
      });
    }
  }
  if (!app.ready || !initialized)
    return (
      <div className="loading-shell">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (farmId && !app.farms.some((f) => f.id === farmId))
    return (
      <EmptyState
        title="Farm not found"
        description="This farm may belong to a different browser workspace."
        href="/app/farms"
        label="View farms"
      />
    );
  if (success && farm)
    return (
      <div className="success-page">
        <span className="success-icon">
          <CheckCircle2 size={38} />
        </span>
        <Badge tone="mint">DEMO FARM ACTIVE</Badge>
        <h1>Your Farm is deployed in demo mode.</h1>
        <p>
          <strong>{farm.name}</strong> is active and now appears in Managed
          Farms with working demo controls.
        </p>
        <Notice>
          This deployment uses local demo state. No wallet approval, assets, or
          blockchain transaction were used.
        </Notice>
        {app.storageError && <Notice tone="warning">{app.storageError}</Notice>}
        <div className="hero-actions">
          <Link className="button primary" href={farmDetailHref(farm.id)}>
            Manage farm <ArrowRight size={16} />
          </Link>
          <button
            className="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(farm, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "farm-strategy.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export configuration
          </button>
        </div>
      </div>
    );
  const titles = [
    "Choose a direction and a starting point.",
    "Make this Farm yours.",
    "Set the guardrails.",
    "Every detail, in perspective.",
    "Explore the possibilities.",
    "Deploy your demo Farm.",
  ];
  const descriptions = [
    "Select a strategy, then choose the template that best matches your intent.",
    "Configure identity, assets, network, and core strategy behavior.",
    "Review risk limits, fees, and advanced execution settings.",
    "Review your configuration before exploring hypothetical performance.",
    "Test assumptions across market conditions before you commit.",
    "Activate a working demo Farm and manage it from your workspace.",
  ];
  const result = farm ? simulate(values, farm.type, scenario, days) : null;
  const plan =
    farm &&
    t &&
    !Object.keys(validateStrategy(t, values, allocations, farm.network)).length
      ? deploymentAdapter.prepare(farm, t)
      : null;
  return (
    <div className="wizard">
      <div className="wizard-top">
        <Link href="/app/farms" className="back-link">
          <ArrowLeft size={15} /> My farms
        </Link>
        <span className="save-status">
          <Save size={13} />
          {app.storageError ? "Save unavailable" : saveLabel}
        </span>
        <button
          className="button small"
          onClick={() => {
            if (farm) app.saveFarm(farm);
            router.push("/app/farms/drafts");
          }}
        >
          Save & exit
        </button>
      </div>
      <nav aria-label="Creation steps" className="stepper">
        {steps.map((s, i) => (
          <button
            key={s}
            aria-current={i === step ? "step" : undefined}
            disabled={i > step}
            onClick={() => go(i)}
            className={`${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
          >
            <span>{i < step ? <Check size={13} /> : i + 1}</span>
            {s}
          </button>
        ))}
      </nav>
      <div className="wizard-heading">
        <div className="eyebrow">
          STEP {String(step + 1).padStart(2, "0")} / 06
        </div>
        <h1 ref={heading} tabIndex={-1}>
          {titles[step]}
        </h1>
        <p>{descriptions[step]}</p>
      </div>
      {step === 0 && (
        <div
          ref={selectionStage}
          className={`strategy-selection-stage ${type ? "has-selection" : ""}`}
        >
          <div className="selection-section-heading">
            <div>
              <span>Strategy</span>
              <strong>
                {type ? "Strategy selected" : "How should this Farm work?"}
              </strong>
            </div>
            {type && <small>Select another strategy to compare templates.</small>}
          </div>
          <div className="family-grid creation-families compactable-families">
            {families.map((f) => (
              <button
                key={f.type}
                aria-pressed={type === f.type}
                className={`family-card ${f.type.toLowerCase()} ${type === f.type ? "selected" : ""}`}
                onClick={() => {
                  if (type !== f.type) {
                    setFarm(null);
                    setSimulated(false);
                    setAccepted(false);
                  }
                  setType(f.type);
                }}
              >
                <div className="card-top">
                  <span className="icon-tile">
                    <StrategyIcon type={f.type} size={27} />
                  </span>
                  <span className="selection-dot">
                    {type === f.type && <Check size={13} />}
                  </span>
                </div>
                <div className="family-illustration strategy-card-detail">
                  <StrategyMini type={f.type} />
                </div>
                <h2>{f.title}</h2>
                <p className="strategy-card-detail">{f.description}</p>
                <div className="family-use strategy-card-detail">{f.use}</div>
                <span className="strategy-card-risk">
                  <Risk level={f.risk} />
                </span>
              </button>
            ))}
          </div>
          {type && (
            <section className="template-reveal" aria-live="polite">
              <div className="selection-section-heading template-heading">
                <div>
                  <span>Template</span>
                  <strong>Choose your starting point</strong>
                </div>
                <small>
                  {templates.filter((item) => item.type === type).length} fully
                  configurable templates
                </small>
              </div>
              <div className="template-grid creation-template-grid">
                {templates
                  .filter((item) => item.type === type)
                  .map((item, index) => (
                    <button
                      key={item.id}
                      className="template-card"
                      onClick={() => selectTemplate(item.id)}
                    >
                      <div className="card-top">
                        <span className={`icon-tile ${item.type.toLowerCase()}`}>
                          <StrategyIcon type={item.type} />
                        </span>
                        {index === 0 && <span className="tag">RECOMMENDED</span>}
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <div className="template-meta">
                        <Risk level={item.risk} />
                        <span>{item.complexity}</span>
                      </div>
                      <div className="template-bottom">
                        <span className="template-assets">
                          <AssetList symbols={item.assets} size={17} />
                          <span>/ {item.protocols[0]}</span>
                        </span>
                        <ArrowRight size={17} />
                      </div>
                    </button>
                  ))}
              </div>
              <button
                className="scratch-button"
                onClick={() => {
                  const selected = templates.find((item) => item.type === type)!;
                  const created = makeFarm(selected, crypto.randomUUID());
                  created.name = "";
                  created.values.name = "";
                  setFarm(created);
                  setStep(1);
                }}
              >
                <Plus size={16} /> Start from scratch
                <span>Use only the required fields for this strategy</span>
                <ArrowRight size={16} />
              </button>
            </section>
          )}
        </div>
      )}
      {step >= 1 && farm && t && (
        <div className={`builder-grid no-builder-visual ${step !== 1 ? "review-layout" : ""}`}>
          <div className="configuration">
            {step === 1 && (
              <>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Strategy essentials</h3>
                      <p>A strong foundation for your farm.</p>
                    </div>
                    <SlidersHorizontal size={17} />
                  </div>
                  <div className="farm-artwork-field">
                    <div className="farm-artwork-preview">
                      {farm.icon ? <img src={farm.icon} alt="Farm artwork preview" /> : <StrategyIcon type={farm.type} size={27} />}
                    </div>
                    <div>
                      <strong>Farm logo or icon</strong>
                      <p>Add a square PNG, JPG, WebP or SVG. It stays in this browser for the prototype.</p>
                      <label className="button small upload-button">
                        <Upload size={14} /> {farm.icon ? "Replace artwork" : "Upload artwork"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1024 * 1024) {
                              setErrors({ artwork: "Choose an image smaller than 1 MB." });
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => change({ icon: String(reader.result) });
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {errors.artwork && <span className="field-error">{errors.artwork}</span>}
                    </div>
                  </div>
                  <div className="document-upload-field">
                    <div>
                      <strong>Supporting documents</strong>
                      <p>Add a factsheet, methodology, or risk disclosure for LP review.</p>
                    </div>
                    <label className="button small upload-button">
                      <FileText size={14} /> Add PDF
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []);
                          const tooLarge = files.find((file) => file.size > 5 * 1024 * 1024);
                          if (tooLarge) {
                            setErrors({ documents: `${tooLarge.name} is larger than 5 MB.` });
                            return;
                          }
                          change({
                            documents: [
                              ...(farm.documents || []),
                              ...files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
                            ].slice(0, 5),
                          });
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {(farm.documents || []).length > 0 && (
                      <div className="uploaded-documents">
                        {farm.documents?.map((document, index) => (
                          <div key={`${document.name}-${index}`}>
                            <FileText size={14} />
                            <span>{document.name}</span>
                            <small>{Math.max(1, Math.round(document.size / 1024))} KB</small>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Remove ${document.name}`}
                              onClick={() => change({ documents: farm.documents?.filter((_, itemIndex) => itemIndex !== index) })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.documents && <span className="field-error">{errors.documents}</span>}
                  </div>
                  <div className="fields-grid">
                    <label className="field">
                      <span>Network</span>
                      <div className="icon-select"><NetworkIcon network={farm.network} size={22} /><select
                        value={farm.network}
                        onChange={(e) => change({ network: e.target.value })}
                        aria-invalid={!!errors.network}
                      >
                        {t.networks.map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select></div>
                      {errors.network && (
                        <span className="field-error">{errors.network}</span>
                      )}
                    </label>
                    {t.fields
                      .filter((f) => !f.advanced && f.key !== "risk")
                      .map((f) => (
                        <ParameterField
                          key={f.key}
                          field={f}
                          value={values[f.key]}
                          error={errors[f.key]}
                          onChange={(v) => value(f.key, v)}
                        />
                      ))}
                  </div>
                </section>
                {farm.type === "INDEX" && (
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Asset allocation</h3>
                        <p>Give each asset a place in your strategy.</p>
                      </div>
                      <span
                        className={
                          Math.abs(
                            allocations.reduce((s, a) => s + a.weight, 0) - 100,
                          ) < 0.01
                            ? "positive"
                            : "warning-text"
                        }
                      >
                        {allocations
                          .reduce((s, a) => s + a.weight, 0)
                          .toFixed(1)}
                        % / 100%
                      </span>
                    </div>
                    <div className="allocation-track">
                      {allocations.map((a, i) => (
                        <div
                          key={a.asset}
                          className={`allocation-color-${i % 4}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, a.weight))}%`,
                          }}
                        />
                      ))}
                    </div>
                    {allocations.map((a, i) => (
                      <div className="allocation-row" key={a.asset}>
                        <AssetIcon symbol={a.asset} size={28} />
                        <strong>{a.asset}</strong>
                        <input
                          aria-label={`${a.asset} weight`}
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={a.weight}
                          onChange={(e) =>
                            change({
                              allocations: allocations.map((item, j) =>
                                j === i
                                  ? {
                                      ...item,
                                      weight:
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value),
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                        <span>%</span>
                        <button
                          className="icon-button"
                          aria-label={`Remove ${a.asset}`}
                          disabled={allocations.length <= 1}
                          onClick={() =>
                            change({
                              allocations: allocations.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="add-asset">
                      <select
                        aria-label="Asset to add"
                        value={assetToAdd}
                        onChange={(e) => setAssetToAdd(e.target.value)}
                      >
                        {["DAI", "WBTC", "ETH", "UNI", "USDC", "AAVE"].map(
                          (a) => (
                            <option
                              key={a}
                              value={a}
                              disabled={allocations.some((x) => x.asset === a)}
                            >
                              {a}
                            </option>
                          ),
                        )}
                      </select>
                      <button
                        className="button small"
                        disabled={
                          allocations.some((a) => a.asset === assetToAdd) ||
                          allocations.length >= 6
                        }
                        onClick={() =>
                          change({
                            allocations: [
                              ...allocations,
                              { asset: assetToAdd, weight: 0 },
                            ],
                          })
                        }
                      >
                        <Plus size={13} />
                        Add asset
                      </button>
                    </div>
                    {errors.allocations && (
                      <p className="field-error" role="alert">
                        {errors.allocations}
                      </p>
                    )}
                    {["Market Cap", "Risk Weighted"].includes(
                      String(values.allocationMethod),
                    ) && (
                      <Notice>
                        These weights are manually specified in this prototype.
                        Live market-cap and risk weighting require a market data
                        adapter.
                      </Notice>
                    )}
                  </section>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <section className="panel risk-settings-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Risk, fees & advanced settings</h3>
                      <p>Set the boundaries before reviewing the full Farm.</p>
                    </div>
                    <Risk level={risk} />
                  </div>
                  <div className="fields-grid">
                    {t.fields
                      .filter((f) => f.advanced || f.key === "risk")
                      .map((f) => (
                        <ParameterField
                          key={f.key}
                          field={f}
                          value={values[f.key]}
                          error={errors[f.key]}
                          onChange={(v) => value(f.key, v)}
                        />
                      ))}
                  </div>
                </section>
                <section className="panel risk-review-strip">
                  <div>
                    <span>Management fee</span>
                    <strong>{values.managementFee}% / year</strong>
                  </div>
                  <div>
                    <span>Performance fee</span>
                    <strong>{values.performanceFee}% of gains</strong>
                  </div>
                  <div>
                    <span>Illustrative risk</span>
                    <Risk level={risk} />
                  </div>
                </section>
                {farm.type === "PERPETUAL" && (
                  <Notice tone="warning">
                    <strong>
                      {Number(values.leverage) >= 5
                        ? "High leverage: capital at substantial risk."
                        : "Liquidation risk requires attention."}
                    </strong>
                    <p>
                      Position size:{" "}
                      {money(Number(values.margin) * Number(values.leverage))}.
                      Your entire margin can be lost. Liquidation price and
                      distance require a live exchange quote and are currently
                      unavailable.
                    </p>
                  </Notice>
                )}
                <Notice>
                  Template defaults are only a starting point. These controls
                  determine fees, exposure limits, and automated behavior for
                  this demo Farm.
                </Notice>
              </>
            )}
            {step === 3 && (
              <>
                <section className="panel">
                  <div className="panel-heading">
                    <h3>Configuration overview</h3>
                    <div className="review-edit-actions">
                      <button className="text-link" onClick={() => go(1)}>
                        Edit configuration
                      </button>
                      <button className="text-link" onClick={() => go(2)}>
                        Edit risk & fees
                      </button>
                    </div>
                  </div>
                  <div className="review-values">
                    {t.fields.map((f) => (
                      <div key={f.key}>
                        <span>{f.label}</span>
                        <strong>
                          {values[f.key]} {f.unit}
                        </strong>
                      </div>
                    ))}
                    {farm.type === "INDEX" && (
                      <div>
                        <span>Allocations</span>
                        <strong>
                          {allocations
                            .map((a) => `${a.asset} ${a.weight}%`)
                            .join(" · ")}
                        </strong>
                      </div>
                    )}
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <h3>Strategy health</h3>
                    <Badge tone="mint">CONFIGURATION VALID</Badge>
                  </div>
                  {[
                    "Required fields complete",
                    "Allocation and risk parameters checked",
                    "Template network selected",
                  ].map((s) => (
                    <div className="health-row" key={s}>
                      <CheckCircle2 size={16} />
                      {s}
                    </div>
                  ))}
                  <div className="health-row warning-text">
                    <Shield size={16} />
                    No audit or live integration verified
                  </div>
                  <div className="health-row muted">
                    <Clock3 size={16} />
                    {app.wallet
                      ? "Wallet connected · public address only"
                      : "Wallet optional for this preview"}
                  </div>
                </section>
                <Notice>
                  Permissions and exact asset approvals will be supplied by the
                  live contract adapter. This review does not authorize any
                  transfer.
                </Notice>
              </>
            )}
            {step === 4 && result && (
              <section className="panel simulation-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Scenario explorer</h3>
                    <p>
                      Hypothetical performance of a $10,000 starting position.
                    </p>
                  </div>
                  <Badge tone="amber">SIMULATED</Badge>
                </div>
                <div className="simulation-controls">
                  <div className="segmented">
                    {(["Bull", "Base", "Bear", "Stress"] as Scenario[]).map(
                      (s) => (
                        <button
                          key={s}
                          aria-pressed={scenario === s}
                          className={scenario === s ? "active" : ""}
                          onClick={() => {
                            setScenario(s);
                            setSimulated(false);
                          }}
                        >
                          {s}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="segmented">
                    {[30, 90, 365].map((d) => (
                      <button
                        key={d}
                        aria-pressed={days === d}
                        className={days === d ? "active" : ""}
                        onClick={() => {
                          setDays(d);
                          setSimulated(false);
                        }}
                      >
                        {d === 365 ? "1Y" : `${d}D`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="simulation-total">
                  <span>Hypothetical ending value</span>
                  <strong>{money(result.points.at(-1)!)}</strong>
                  <span
                    className={
                      result.returnPct >= 0 ? "positive" : "warning-text"
                    }
                  >
                    {result.returnPct >= 0 ? "+" : ""}
                    {result.returnPct.toFixed(2)}% over {days} days
                  </span>
                </div>
                <PerformanceChart
                  points={result.points}
                  label={`${scenario} hypothetical performance`}
                />
                <div className="chart-axis">
                  <span>Day 0</span>
                  <span>Day {Math.round(days / 2)}</span>
                  <span>Day {days}</span>
                </div>
                <div className="simulation-metrics">
                  <Metric
                    label="Annualized APR"
                    value={`${result.apr.toFixed(2)}%`}
                  />
                  <Metric
                    label="Compounded APY"
                    value={`${result.apy.toFixed(2)}%`}
                  />
                  <Metric
                    label="Volatility"
                    value={`${result.volatility.toFixed(2)}%`}
                  />
                  <Metric
                    label="Max drawdown"
                    value={`${result.drawdown.toFixed(2)}%`}
                  />
                  <Metric
                    label="Sharpe ratio"
                    value={result.sharpe.toFixed(2)}
                  />
                  <Metric
                    label="Capacity setting"
                    value={money(Number(values.capacity), true)}
                  />
                </div>
                <Notice tone={scenario === "Stress" ? "warning" : "info"}>
                  <strong>Hypothetical, not a historical backtest.</strong>
                  <p>
                    Assumes {values.assumedApr}% annual gross return,{" "}
                    {values.managementFee}% annual management fee and{" "}
                    {values.performanceFee}% performance fee on gains.{" "}
                    {farm.type === "PERPETUAL"
                      ? `Applies ${values.leverage}× exposure and simplified funding/volatility shocks. Actual liquidation paths are not modeled.`
                      : "Uses a synthetic daily price path."}{" "}
                    Excludes gas, slippage, real funding payments, liquidity
                    constraints and smart contract failures. Returns are not
                    guaranteed.
                  </p>
                </Notice>
                <button
                  className={`button ${simulated ? "" : "primary"} full`}
                  onClick={() => setSimulated(true)}
                >
                  {simulated ? (
                    <>
                      <Check size={16} />
                      Scenario reviewed
                    </>
                  ) : (
                    <>
                      Review this scenario <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </section>
            )}
            {step === 5 && (
              <section className="panel deployment-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Deployment plan</h3>
                    <p>
                      Everything that will happen when live deployment is
                      enabled.
                    </p>
                  </div>
                  <Badge tone="mint">DEMO DEPLOYMENT</Badge>
                </div>
                <div className="review-values">
                  <div>
                    <span>Network</span>
                    <strong className="token-line"><NetworkIcon network={farm.network} size={20} />{farm.network}</strong>
                  </div>
                  <div>
                    <span>Contract type</span>
                    <strong>Strategy vault · adapter pending</strong>
                  </div>
                  <div>
                    <span>Deployment cost</span>
                    <strong>Not available</strong>
                  </div>
                  <div>
                    <span>Wallet</span>
                    <strong>
                      {app.wallet
                        ? `${app.wallet.slice(0, 6)}…${app.wallet.slice(-4)}`
                        : "Not connected"}
                    </strong>
                  </div>
                </div>
                <div className="deployment-steps">
                  {plan?.steps.map((s, i) => (
                    <div key={s.label}>
                      <span className="deploy-number">{i + 1}</span>
                      <div>
                        <strong>{s.label}</strong>
                        <small>
                          {
                            [
                              "Confirm public account and network",
                              "Review exact spender and allowance",
                              "Submit the verified factory transaction",
                              "Set strategy parameters and seed capital",
                              "Check deployed bytecode and address",
                              "Activate only after confirmation",
                            ][i]
                          }
                        </small>
                      </div>
                      <span className="muted small">Ready</span>
                    </div>
                  ))}
                </div>
                <Notice>
                  Deploying creates an active demo Farm in Managed Farms. It can
                  accept demo deposits, withdrawals, and eligible manager pause
                  actions without sending a blockchain transaction.
                </Notice>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  I understand this is a demo deployment and no Farm will be
                  deployed onchain.
                </label>
                {errors.deployment && (
                  <p className="field-error" role="alert">
                    {errors.deployment}
                  </p>
                )}
              </section>
            )}
          </div>
          <aside className="strategy-summary">
            <details open>
              <summary>
                Strategy summary <ChevronDown size={15} />
              </summary>
              <div className="summary-content">
                <span className={`icon-tile ${farm.type.toLowerCase()} farm-summary-icon`}>
                  {farm.icon ? <img src={farm.icon} alt="" /> : <StrategyIcon type={farm.type} />}
                </span>
                <h3>{String(values.name) || "Untitled farm"}</h3>
                <Badge>{farm.type}</Badge>
                <div className="summary-rows">
                  <div>
                    <span>Network</span>
                    <strong className="token-line"><NetworkIcon network={farm.network} size={18} />{farm.network}</strong>
                  </div>
                  <div>
                    <span>{farm.type === "PERPETUAL" ? "Trading pair" : "Protocol"}</span>
                    <strong>
                      {farm.type === "PERPETUAL"
                        ? `${String(values.underlying)}/${String(values.quoteAsset)}`
                        : String(values.protocol)}
                    </strong>
                  </div>
                  {farm.type === "PERPETUAL" && (
                    <div>
                      <span>Venue</span>
                      <strong>{String(values.venue)}</strong>
                    </div>
                  )}
                  <div>
                    <span>Deposit asset</span>
                    <strong className="token-line"><AssetIcon symbol={String(values.asset)} size={18} />{String(values.asset)}</strong>
                  </div>
                  <div>
                    <span>TVL capacity</span>
                    <strong>{money(Number(values.capacity), true)}</strong>
                  </div>
                  <div>
                    <span>Risk profile</span>
                    <Risk level={risk} />
                  </div>
                  {farm.type === "PERPETUAL" && (
                    <div>
                      <span>Leverage</span>
                      <strong>{values.leverage}×</strong>
                    </div>
                  )}
                  <div>
                    <span>Management fee</span>
                    <strong>{values.managementFee}%</strong>
                  </div>
                  <div>
                    <span>Performance fee</span>
                    <strong>{values.performanceFee}%</strong>
                  </div>
                </div>
                <div className="summary-foot">
                  <Shield size={14} />
                  <span>
                    Preview configuration.
                    <br />
                    No live capital at risk.
                  </span>
                </div>
              </div>
            </details>
          </aside>
        </div>
      )}
      <div className="wizard-footer">
        <button
          className="button"
          disabled={step === 0}
          onClick={() => go(step - 1)}
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <span className="muted small">
          {step === 0
            ? type
              ? "Choose a template to continue."
              : "Start by selecting a strategy."
            : step === 1
              ? "Core settings first. Guardrails come next."
              : "Your draft stays in this browser."}
        </span>
        {step !== 0 && (
          <button
            className="button primary"
            disabled={
              (step === 4 && !simulated) ||
              (step === 5 && !accepted)
            }
            onClick={step === 5 ? finish : next}
          >
            {step === 1
              ? "Continue to risk & fees"
              : step === 2
                ? "Review Farm"
                : step === 3
                  ? "Explore simulation"
                  : step === 4
                    ? "Continue to deploy"
                    : "Deploy demo Farm"}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
      {Object.keys(errors).length > 0 && (step === 1 || step === 2) && (
        <p className="field-error" role="alert">
          Please resolve the highlighted fields before continuing.
        </p>
      )}
    </div>
  );
}
function ParameterField({
  field: f,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string | number;
  error?: string;
  onChange: (v: string | number) => void;
}) {
  return (
    <label
      className={`field ${f.key === "name" || f.key === "description" || f.kind === "range" ? "wide" : ""}`}
    >
      <span>
        {f.label}
        {f.kind === "range" && (
          <strong className="positive">
            {value}
            {f.unit}
          </strong>
        )}
      </span>
      {f.kind === "select" ? (
        <div className={f.key === "asset" ? "icon-select" : undefined}>
        {f.key === "asset" && <AssetIcon symbol={String(value)} size={22} />}
        <select
          aria-invalid={!!error}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {f.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select></div>
      ) : f.kind === "textarea" ? (
        <textarea
          aria-invalid={!!error}
          maxLength={220}
          rows={3}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="input-wrap">
          <input
            aria-invalid={!!error}
            type={
              f.kind === "range"
                ? "range"
                : f.kind === "number"
                  ? "number"
                  : "text"
            }
            min={f.min}
            max={f.max}
            step={f.step}
            maxLength={f.kind === "text" ? 60 : undefined}
            value={value ?? ""}
            onChange={(e) =>
              onChange(
                f.kind === "number" || f.kind === "range"
                  ? e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                  : e.target.value,
              )
            }
          />
          {f.unit && f.kind !== "range" && <small>{f.unit}</small>}
        </div>
      )}
      {f.help && <small className="field-help">{f.help}</small>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
function StrategyMini({ type }: { type: StrategyType }) {
  return type === "INDEX" ? (
    <div className="mini-index">
      <AssetIcon symbol="WBTC" size={34} />
      <AssetIcon symbol="ETH" size={34} />
      <AssetIcon symbol="USDC" size={34} />
      <div />
      <span className="mini-base">
        <LayersIcon />
      </span>
    </div>
  ) : type === "SPOT" ? (
    <div className="mini-spot">
      {[25, 42, 37, 65, 59, 85, 100].map((h, i) => (
        <span key={i} style={{ height: h }} />
      ))}
    </div>
  ) : (
    <div className="mini-perp">
      <svg viewBox="0 0 220 110" aria-hidden="true">
        <path d="M0 75L35 65L65 80L100 40L135 52L165 20L210 30" />
        <path d="M0 35L35 45L65 30L100 70L135 58L165 90L210 80" />
      </svg>
      <span>DELTA HEDGE</span>
    </div>
  );
}
function LayersIcon() {
  return <FileCheck2 size={18} />;
}
