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
import { formatUsdCompact } from "@/domain/format";
import { farmDetailHref } from "@/domain/routes";
import { useApp } from "./provider";
import { DOC_ACCEPT, DocIcon, docExt } from "./doc-icons";
import { deleteDocFile, docKey, saveDocFile } from "./doc-store";
import { LaunchGate, readyToLaunch } from "./launch-gate";
import { useAccessStatus } from "./notifications-panel";

const MAX_DOCS = 10;
const MAX_DOC_MB = 10;
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

/**
 * Four visible stages. Internal step indices (persisted on drafts as `farm.step`) keep the
 * original 0–5 numbering so older drafts resume correctly: 2 folds into 1, 4 folds into 3.
 */
const stages = [
  { label: "Strategy & template", step: 0 },
  { label: "Details & configuration", step: 1 },
  { label: "Review", step: 3 },
  { label: "Deploy", step: 5 },
];
const stageOf = (step: number) => (step >= 5 ? 3 : step >= 3 ? 2 : step >= 1 ? 1 : 0);
const normalizeStep = (step: number) => stages[stageOf(step)].step;
/** Fields shown in the "Risk & fees" group; everything else marked advanced is collapsed. */
const riskFeeKeys = new Set(["risk", "managementFee", "performanceFee"]);
export function Wizard({ farmId }: { farmId?: string }) {
  const app = useApp(),
    router = useRouter();
  const editingExisting = Boolean(farmId);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [type, setType] = useState<StrategyType | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scenario, setScenario] = useState<Scenario>("Base");
  const [days, setDays] = useState(90);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Not saved yet");
  const [assetToAdd, setAssetToAdd] = useState("DAI");
  const heading = useRef<HTMLHeadingElement>(null);
  const selectionStage = useRef<HTMLDivElement>(null);
  const saveRef = useRef(app.saveFarm);
  saveRef.current = app.saveFarm;
  // Anyone can build a DTF. Sign-in, a wallet and DTF access are checked only at launch.
  const access = useAccessStatus(app.session?.identifier);
  const readiness = { signedIn: Boolean(app.session), wallet: Boolean(app.wallet), access };
  const [launchGate, setLaunchGate] = useState(false);
  useEffect(() => {
    if (!app.ready || initialized) return;
    const params = new URLSearchParams(window.location.search);
    const id = farmId || params.get("draft");
    const existing = id ? app.farms.find((f) => f.id === id) : null;
    if (existing) {
      const copy = structuredClone(existing);
      if (existing.source === "demo" && !editingExisting) {
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
      setStep(editingExisting ? 1 : normalizeStep(Math.min(copy.step, 5)));
    } else {
      const t = templateById(params.get("template") || "");

      if (t) {
        setType(t.type);
        setFarm(makeFarm(t, crypto.randomUUID()));
        setStep(1);
      }
    }
    setInitialized(true);
  }, [app.ready, app.farms, editingExisting, farmId, initialized]);
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
  const t = farm ? templateById(farm.templateId, farm.type) : null;
  const values = farm?.values || {};
  const allocations = farm?.allocations || [];
  const risk = t ? riskFor(t, values) : "MEDIUM";
  function change(patch: Partial<Farm>) {
    setFarm((f) =>
      f
        ? {
            ...f,
            ...patch,
            status: editingExisting ? f.status : "DRAFT",
            updatedAt: new Date().toISOString(),
          }
        : f,
    );
    setAccepted(false);
    setErrors({});
  }
  function value(key: string, v: string | number) {
    let next = { ...values, [key]: v };
    if (key === "strategy" && v === "Liquidity Provision")
      next = { ...next, protocol: "Aerodrome", pool: "ETH / USDC" };
    if (key === "strategy" && v === "Lending")
      next = { ...next, protocol: "Aave" };
    change({
      values: next,
      name: String(next.name),
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
    if (step === 1 && farm && t) {
      const e = validateStrategy(t, values, allocations, farm.network);
      setErrors(e);
      if (Object.keys(e).length) {
        if (
          t.fields.some(
            (f) => f.advanced && !riskFeeKeys.has(f.key) && e[f.key],
          )
        )
          setShowAdvanced(true);
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
        return;
      }
    }
    go(stages[Math.min(stageOf(step) + 1, stages.length - 1)].step);
  }
  function selectTemplate(id: string) {
    const selected = templateById(id)!;
    const created = makeFarm(selected, farm?.id || crypto.randomUUID());
    setFarm(created);
    setType(selected.type);
    setStep(1);
    setAccepted(false);
  }
  function finish() {
    if (!farm || !t || !accepted) return;
    if (!editingExisting && !readyToLaunch(readiness)) {
      // Keep the work, then explain the one missing onboarding step.
      app.saveFarm(farm);
      setLaunchGate(true);
      return;
    }
    try {
      deploymentAdapter.prepare(farm, t);
      const projected = simulate(values, farm.type, "Base", 90);
      if (editingExisting) {
        const updated = {
          ...farm,
          name: String(values.name),
          risk,
          apy: Math.max(0, Number(projected.apy.toFixed(2))),
          updatedAt: new Date().toISOString(),
          events: [...farm.events, "DTF configuration updated"],
        };
        app.saveFarm(updated);
        setFarm(updated);
        setSuccess(true);
        app.toast(`${updated.name} updated.`);
        router.push(farmDetailHref(updated.id));
        return;
      }
      const finished = deployDemoFarm(
        { ...farm, name: String(values.name) },
        risk,
        projected.apy,
      );
      app.saveFarm(finished);
      setFarm(finished);
      setSuccess(true);
      app.toast(`${finished.name} created.`);
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
        title="DTF not found"
        description="Check the link or open Managed DTFs."
        href="/app/farms"
        label="View DTFs"
      />
    );
  if (success && farm)
    return (
      <div className="success-page">
        <span className="success-icon">
          <CheckCircle2 size={38} />
        </span>
        <Badge tone="mint">ACTIVE</Badge>
        <h1>DTF created</h1>
        <p>
          <strong>{farm.name}</strong> now appears in Managed DTFs.
        </p>
        {app.storageError && <Notice tone="warning">{app.storageError}</Notice>}
        <div className="hero-actions">
          <Link className="button primary" href={farmDetailHref(farm.id)}>
            Manage DTF <ArrowRight size={16} />
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
  const stage = stageOf(step);
  const titles = [
    editingExisting ? "Edit DTF" : "Create DTF",
    "Details & configuration",
    "Review",
    editingExisting ? "Save changes" : "Deploy",
  ];
  const descriptions = [
    "Choose a strategy type and template.",
    "Identity, assets, risk and fees.",
    "Check settings and estimated outcomes.",
    editingExisting ? "Confirm the updated configuration." : "Confirm and create the DTF.",
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
          <ArrowLeft size={15} /> Managed DTFs
        </Link>
        <span className="save-status">
          <Save size={13} />
          {app.storageError ? "Save unavailable" : saveLabel}
        </span>
        <button
          className="button small"
          onClick={() => {
            if (farm) app.saveFarm(farm);
            router.push(editingExisting && farm ? farmDetailHref(farm.id) : "/app/farms/drafts");
          }}
        >
          {editingExisting ? "Save & return" : "Save & exit"}
        </button>
      </div>
      <LaunchGate
        open={launchGate}
        onClose={() => setLaunchGate(false)}
        dtfName={String(values.name || "")}
        draftHref={farm ? `/app/farms/new/?draft=${farm.id}` : "/app/farms/new/"}
        readiness={readiness}
      />
      <nav aria-label="Creation steps" className="stepper">
        {stages.map((s, i) => (
          <button
            key={s.label}
            aria-current={i === stage ? "step" : undefined}
            aria-label={`Step ${i + 1} of ${stages.length}: ${s.label}`}
            disabled={i > stage}
            onClick={() => go(s.step)}
            className={`${i === stage ? "active" : ""} ${i < stage ? "done" : ""}`}
          >
            <span>{i < stage ? <Check size={13} /> : i + 1}</span>
            {s.label}
          </button>
        ))}
      </nav>
      <div className="wizard-heading">
        <h1 ref={heading} tabIndex={-1}>
          {titles[stage]}
        </h1>
        <p>{descriptions[stage]}</p>
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
                {type ? "Strategy selected" : "Choose a strategy"}
              </strong>
            </div>
            {type && <small>Switch strategy to compare templates.</small>}
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
                  <strong>Choose a template</strong>
                </div>
                <small>
                  {templates.filter((item) => item.type === type).length} templates
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
                <span>Required fields only</span>
                <ArrowRight size={16} />
              </button>
            </section>
          )}
        </div>
      )}
      {step >= 1 && farm && t && (
        <div className={`builder-grid no-builder-visual ${stage !== 1 ? "review-layout" : ""}`}>
          <div className="configuration">
            {stage === 1 && (
              <>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Details</h3>
                    </div>
                    <SlidersHorizontal size={17} />
                  </div>
                  <div className="farm-artwork-field">
                    <div className="farm-artwork-preview">
                      {farm.icon ? <img src={farm.icon} alt="DTF artwork preview" /> : <StrategyIcon type={farm.type} size={27} />}
                    </div>
                    <div>
                      <strong>DTF logo or icon</strong>
                      <p>Square PNG, JPG, WebP or SVG, up to 1 MB.</p>
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
                      <p>Factsheet, methodology, deck or risk disclosure for LPs. PDF, Word, PowerPoint, Excel, CSV or images; up to {MAX_DOCS} files, {MAX_DOC_MB} MB each.</p>
                    </div>
                    <label className={`button small upload-button ${(farm.documents || []).length >= MAX_DOCS ? "disabled" : ""}`}>
                      <FileText size={14} /> Add documents
                      <input
                        type="file"
                        accept={DOC_ACCEPT}
                        multiple
                        disabled={(farm.documents || []).length >= MAX_DOCS}
                        onChange={async (event) => {
                          const input = event.target;
                          const files = Array.from(input.files || []);
                          input.value = "";
                          if (!files.length) return;
                          const tooLarge = files.find((file) => file.size > MAX_DOC_MB * 1024 * 1024);
                          if (tooLarge) {
                            setErrors({ documents: `${tooLarge.name} is larger than ${MAX_DOC_MB} MB.` });
                            return;
                          }
                          const existing = farm.documents || [];
                          const room = MAX_DOCS - existing.length;
                          const accepted = files.slice(0, room);
                          const added: NonNullable<Farm["documents"]> = [];
                          for (const file of accepted) {
                            const id = crypto.randomUUID();
                            try {
                              await saveDocFile(docKey(farm.id, id), file);
                              added.push({ id, name: file.name, size: file.size, type: file.type });
                            } catch {
                              setErrors({ documents: `Couldn't save ${file.name} in this browser. Try again or use a smaller file.` });
                              return;
                            }
                          }
                          change({ documents: [...existing, ...added] });
                          setErrors(files.length > room ? { documents: `Only ${MAX_DOCS} documents per DTF. ${files.length - room} not added.` } : {});
                        }}
                      />
                    </label>
                    {(farm.documents || []).length > 0 && (
                      <div className="uploaded-documents">
                        {farm.documents?.map((document, index) => (
                          <div key={`${document.id ?? document.name}-${index}`}>
                            <DocIcon type={docExt(document.name, document.type)} size={16} />
                            <span>{document.name}</span>
                            <small>{Math.max(1, Math.round(document.size / 1024))} KB</small>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Remove ${document.name}`}
                              onClick={() => {
                                if (document.id) deleteDocFile(docKey(farm.id, document.id)).catch(() => undefined);
                                change({ documents: farm.documents?.filter((_, itemIndex) => itemIndex !== index) });
                              }}
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
                      .filter((f) => !f.advanced && !riskFeeKeys.has(f.key))
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
                        <p>Weights must total 100%.</p>
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
                        Weights are set manually for this allocation method.
                      </Notice>
                    )}
                  </section>
                )}
                <section className="panel risk-settings-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Risk & fees</h3>
                    </div>
                    <Risk level={risk} />
                  </div>
                  <div className="fields-grid">
                    {t.fields
                      .filter((f) => riskFeeKeys.has(f.key))
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
                        Your entire margin can be lost. Liquidation price
                        depends on the venue quote at execution.
                      </p>
                    </Notice>
                  )}
                </section>
                <details
                  className="panel wizard-advanced"
                  open={showAdvanced}
                  onToggle={(e) => setShowAdvanced(e.currentTarget.open)}
                >
                  <summary>
                    <span>Advanced settings</span>
                    <ChevronDown size={15} />
                  </summary>
                  <div className="fields-grid">
                    {t.fields
                      .filter((f) => f.advanced && !riskFeeKeys.has(f.key))
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
                </details>
              </>
            )}
            {stage === 2 && (
              <>
                <section className="panel">
                  <div className="panel-heading">
                    <h3>Configuration</h3>
                    <div className="review-edit-actions">
                      <button className="text-link" onClick={() => go(1)}>
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="review-values">
                    {t.fields.map((f) => (
                      <div key={f.key}>
                        <span>{f.label}</span>
                        <strong>
                          {f.key === "capacity"
                            ? formatUsdCompact(Number(values[f.key]))
                            : `${values[f.key]}${f.unit ? ` ${f.unit}` : ""}`}
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
                    "Network supported",
                  ].map((s) => (
                    <div className="health-row" key={s}>
                      <CheckCircle2 size={16} />
                      {s}
                    </div>
                  ))}
                  <div className="health-row warning-text">
                    <Shield size={16} />
                    Audit pending
                  </div>
                  <div className="health-row muted">
                    <Clock3 size={16} />
                    {app.wallet
                      ? "Wallet connected"
                      : "Wallet not connected"}
                  </div>
                </section>
                {result && (
              <section className="panel simulation-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Scenario estimate</h3>
                    <p>Estimated value of a $10,000 position.</p>
                  </div>
                  <Badge tone="amber">ESTIMATED</Badge>
                </div>
                <div className="simulation-controls">
                  <div className="segmented">
                    {(["Bull", "Base", "Bear", "Stress"] as Scenario[]).map(
                      (s) => (
                        <button
                          key={s}
                          aria-pressed={scenario === s}
                          className={scenario === s ? "active" : ""}
                          onClick={() => setScenario(s)}
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
                        onClick={() => setDays(d)}
                      >
                        {d === 365 ? "1Y" : `${d}D`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="simulation-total">
                  <span>Estimated ending value</span>
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
                  label={`${scenario} scenario, estimated performance`}
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
                  <strong>Estimate, not a historical backtest.</strong>
                  <p>
                    Assumes {values.assumedApr}% annual gross return,{" "}
                    {values.managementFee}% annual management fee and{" "}
                    {values.performanceFee}% performance fee on gains.{" "}
                    {farm.type === "PERPETUAL"
                      ? `Applies ${values.leverage}× exposure and simplified funding/volatility shocks. Actual liquidation paths are not modeled.`
                      : "Uses a modelled daily price path."}{" "}
                    Excludes gas, slippage, real funding payments, liquidity
                    constraints and smart contract failures. Returns are not
                    guaranteed.
                  </p>
                </Notice>
              </section>
                )}
                <Notice>
                  This review does not authorize any transfer.
                </Notice>
              </>
            )}
            {stage === 3 && (
              <section className="panel deployment-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Deployment plan</h3>
                  </div>
                </div>
                <div className="review-values">
                  <div>
                    <span>Network</span>
                    <strong className="token-line"><NetworkIcon network={farm.network} size={20} />{farm.network}</strong>
                  </div>
                  <div>
                    <span>Contract type</span>
                    <strong>Strategy vault</strong>
                  </div>
                  <div>
                    <span>Deployment cost</span>
                    <strong>{plan?.cost ?? "—"}</strong>
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
                      <span className="muted small">{s.state}</span>
                    </div>
                  ))}
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  {editingExisting
                    ? "I have reviewed the updated configuration."
                    : "I understand this DTF is created in preview and no transaction is sent."}
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
                <h3>{String(values.name) || "Untitled DTF"}</h3>
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
                    <span>Base token</span>
                    <strong className="token-line"><AssetIcon symbol={String(values.asset)} size={18} />{String(values.asset)}</strong>
                  </div>
                  <div>
                    <span>TVL capacity</span>
                    <strong>{money(Number(values.capacity), true)}</strong>
                  </div>
                  <div>
                    <span>Visibility</span>
                    <strong>{values.visibility === "Private" ? "Private" : "Public"}</strong>
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
              </div>
            </details>
          </aside>
        </div>
      )}
      <div className="wizard-footer">
        <button
          className="button"
          disabled={stage === 0}
          onClick={() => go(stages[Math.max(0, stage - 1)].step)}
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <span className="muted small">
          Step {stage + 1} of {stages.length}
        </span>
        {stage !== 0 && (
          <button
            className="button primary"
            disabled={stage === 3 && !accepted}
            onClick={stage === 3 ? finish : next}
          >
            {stage === 1
              ? "Review DTF"
              : stage === 2
                ? "Continue to deploy"
                : editingExisting ? "Save changes" : "Launch DTF"}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
      {Object.keys(errors).length > 0 && stage === 1 && (
        <p className="field-error" role="alert">
          Resolve the highlighted fields to continue.
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
    </div>
  );
}
function LayersIcon() {
  return <FileCheck2 size={18} />;
}
