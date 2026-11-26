"use client";
import {
  ArrowCircleDown,
  ArrowCircleUp,
  ArrowLeft,
  ArrowSquareOut,
  BookOpen,
  CaretRight,
  ChartLineUp,
  ChartPieSlice,
  ChatCircleDots,
  CurrencyCircleDollar,
  EnvelopeSimple,
  FileText,
  Headset,
  IdentificationCard,
  Lightbulb,
  ListChecks,
  MagnifyingGlass,
  Minus,
  PaperPlaneRight,
  Plant,
  Pulse,
  Receipt,
  Robot,
  ShieldCheck,
  Sparkle,
  Stack,
  ThumbsDown,
  ThumbsUp,
  UserCircle,
  Wallet,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  SUPPORT_EMAIL,
  articleById,
  articlesIn,
  assistantReply,
  categoryById,
  helpCategories,
  popularIssues,
  searchArticles,
  supportMailto,
  type HelpArticle,
  type HelpCategoryId,
} from "@/domain/help";

const categoryIcons: Record<HelpCategoryId, Icon> = {
  account: UserCircle,
  deposit: ArrowCircleDown,
  withdraw: ArrowCircleUp,
  trading: ChartLineUp,
  orders: ListChecks,
  index: ChartPieSlice,
  perp: Pulse,
  farms: Plant,
  profile: IdentificationCard,
  wallet: Wallet,
  stablecoin: CurrencyCircleDollar,
  dtf: Stack,
  fees: Receipt,
  security: ShieldCheck,
  docs: FileText,
};

type Tab = "support" | "help";
type HelpView =
  | { level: "home" }
  | { level: "category"; id: HelpCategoryId }
  | { level: "article"; id: string };

/** Where to open the panel; a new `nonce` re-applies the same target. */
export type SupportTarget = { article?: string; category?: HelpCategoryId; nonce: number };

/** Help & support: right-side panel plus a floating assistant chat. */
export function SupportCenter({ open, onOpenChange, target }: { open: boolean; onOpenChange: (open: boolean) => void; target?: SupportTarget | null }) {
  const [tab, setTab] = useState<Tab>("support");
  const [view, setView] = useState<HelpView>({ level: "home" });
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!target) return;
    if (target.article) {
      setTab("help");
      setView({ level: "article", id: target.article });
    } else if (target.category) {
      setTab("help");
      setView({ level: "category", id: target.category });
    }
  }, [target]);

  const openArticle = (id: string) => {
    setTab("help");
    setView({ level: "article", id });
  };

  return (
    <>
      {open && (
        <SupportPanel
          tab={tab}
          setTab={setTab}
          view={view}
          setView={setView}
          onClose={() => onOpenChange(false)}
          onOpenChat={() => {
            onOpenChange(false);
            setChatOpen(true);
          }}
        />
      )}
      {chatOpen && (
        <AssistantChat
          onClose={() => setChatOpen(false)}
          onOpenArticle={(id) => {
            openArticle(id);
            onOpenChange(true);
          }}
        />
      )}
    </>
  );
}

function SupportPanel({
  tab,
  setTab,
  view,
  setView,
  onClose,
  onOpenChat,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  view: HelpView;
  setView: (view: HelpView) => void;
  onClose: () => void;
  onOpenChat: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [tab, view]);

  return (
    <div className="side-layer">
      <button className="side-backdrop" aria-label="Close help and support" tabIndex={-1} onClick={onClose} />
      <aside className="side-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="side-panel-head">
          <div>
            <h2 id={titleId}>Help &amp; support</h2>
            <p>Get answers or reach the Dexponent team.</p>
          </div>
          <button ref={closeRef} className="icon-button" aria-label="Close help and support" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="support-tabs" role="tablist" aria-label="Help and support sections">
          <button role="tab" aria-selected={tab === "support"} onClick={() => setTab("support")}>
            <Headset size={20} weight={tab === "support" ? "fill" : "regular"} />
            <span><strong>Support</strong><small>Chat or email us</small></span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "help"}
            onClick={() => {
              setTab("help");
              if (tab === "help") setView({ level: "home" });
            }}
          >
            <BookOpen size={20} weight={tab === "help" ? "fill" : "regular"} />
            <span><strong>Help center</strong><small>Browse answers</small></span>
          </button>
        </div>
        <div className="side-panel-body" ref={bodyRef} role="tabpanel">
          {tab === "support" ? (
            <SupportTab onOpenChat={onOpenChat} />
          ) : (
            <HelpTab view={view} setView={setView} onOpenChat={onOpenChat} />
          )}
        </div>
      </aside>
    </div>
  );
}

function SupportTab({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <>
      <p className="support-eyebrow">Contact us</p>
      <div className="support-channels">
        <button className="support-channel" onClick={onOpenChat}>
          <span className="support-channel-icon"><Robot size={22} /></span>
          <span>
            <strong>Chat with AI assistant</strong>
            <small>Instant answers to common questions, any time.</small>
          </span>
          <CaretRight size={16} />
        </button>
        <a className="support-channel" href={supportMailto()}>
          <span className="support-channel-icon"><EnvelopeSimple size={22} /></span>
          <span>
            <strong>Email support</strong>
            <small>{SUPPORT_EMAIL} · opens your email app</small>
          </span>
          <ArrowSquareOut size={16} />
        </a>
      </div>
      <div className="support-safety">
        <ShieldCheck size={18} />
        <p>Dexponent will never ask for your seed phrase or private key, in chat, email, or anywhere else.</p>
      </div>
    </>
  );
}

function HelpTab({
  view,
  setView,
  onOpenChat,
}: {
  view: HelpView;
  setView: (view: HelpView) => void;
  onOpenChat: () => void;
}) {
  const [query, setQuery] = useState("");

  if (view.level === "article") {
    const article = articleById(view.id);
    if (!article) return <p className="support-empty">This article is no longer available.</p>;
    return <ArticleView article={article} setView={setView} onOpenChat={onOpenChat} />;
  }

  if (view.level === "category") {
    const category = categoryById(view.id);
    const CategoryIcon = categoryIcons[view.id];
    return (
      <>
        <button className="support-back" onClick={() => setView({ level: "home" })}>
          <ArrowLeft size={15} /> All topics
        </button>
        <div className="support-category-head">
          <span className="support-category-icon"><CategoryIcon size={22} /></span>
          <div>
            <h3>{category?.label}</h3>
            <p>{category?.description}</p>
          </div>
        </div>
        <p className="support-eyebrow">Suggested questions</p>
        <QuestionList articles={articlesIn(view.id)} onSelect={(id) => setView({ level: "article", id })} />
      </>
    );
  }

  const results = searchArticles(query, 8);
  return (
    <>
      <label className="support-search">
        <MagnifyingGlass size={16} />
        <span className="sr-only">Search help articles</span>
        <input
          type="search"
          placeholder="Search for answers, e.g. liquidation"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {query.trim() ? (
        <>
          <p className="support-eyebrow">{results.length ? `${results.length} results` : "No results"}</p>
          {results.length ? (
            <QuestionList articles={results} showCategory onSelect={(id) => setView({ level: "article", id })} />
          ) : (
            <div className="support-empty">
              <p>We couldn&apos;t find an answer for &ldquo;{query}&rdquo;.</p>
              <button className="button" onClick={onOpenChat}><ChatCircleDots size={16} /> Ask the assistant</button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="support-eyebrow">Browse by topic</p>
          <div className="support-category-grid">
            {helpCategories.map((category) => {
              const CategoryIcon = categoryIcons[category.id];
              return (
                <button key={category.id} className="support-category" onClick={() => setView({ level: "category", id: category.id })}>
                  <CategoryIcon size={20} />
                  <strong>{category.label}</strong>
                  <small>{articlesIn(category.id).length} {articlesIn(category.id).length === 1 ? "article" : "articles"}</small>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function QuestionList({
  articles,
  onSelect,
  showCategory = false,
}: {
  articles: HelpArticle[];
  onSelect: (id: string) => void;
  showCategory?: boolean;
}) {
  return (
    <ul className="support-questions">
      {articles.map((article) => (
        <li key={article.id}>
          <button onClick={() => onSelect(article.id)}>
            <span>
              {article.question}
              {showCategory && <small>{categoryById(article.category)?.label}</small>}
            </span>
            <CaretRight size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ArticleView({
  article,
  setView,
  onOpenChat,
}: {
  article: HelpArticle;
  setView: (view: HelpView) => void;
  onOpenChat: () => void;
}) {
  const [feedback, setFeedback] = useState<"" | "yes" | "no">("");
  const category = categoryById(article.category);
  const related = articlesIn(article.category).filter((a) => a.id !== article.id);

  useEffect(() => setFeedback(""), [article.id]);

  return (
    <article className="support-article">
      <nav className="support-crumbs" aria-label="Breadcrumb">
        <button onClick={() => setView({ level: "home" })}>Help center</button>
        <CaretRight size={11} />
        <button onClick={() => setView({ level: "category", id: article.category })}>{category?.label}</button>
      </nav>
      <h3>{article.question}</h3>
      <section className="support-ai-summary" aria-label="AI summary">
        <p className="support-ai-label"><Sparkle size={14} weight="fill" /> AI summary</p>
        <p>{article.summary}</p>
        <small>Generated from Dexponent help content. Check details before you act.</small>
      </section>
      <section>
        <h4>How it works</h4>
        <ol className="support-steps">
          {article.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>
      <section className="support-example">
        <p className="support-ai-label"><Lightbulb size={14} weight="fill" /> Example</p>
        <p>{article.example}</p>
        <small>Hypothetical numbers, not a performance claim.</small>
      </section>
      <div className="support-feedback" aria-live="polite">
        {feedback ? (
          <p>{feedback === "yes" ? "Thanks for the feedback." : "Sorry this didn't help. Try the assistant or email us."}</p>
        ) : (
          <>
            <p>Was this helpful?</p>
            <button className="support-chip" onClick={() => setFeedback("yes")}><ThumbsUp size={14} /> Yes</button>
            <button className="support-chip" onClick={() => setFeedback("no")}><ThumbsDown size={14} /> No</button>
          </>
        )}
      </div>
      {related.length > 0 && (
        <>
          <p className="support-eyebrow">Related questions</p>
          <QuestionList articles={related} onSelect={(id) => setView({ level: "article", id })} />
        </>
      )}
      <div className="support-still">
        <strong>Still need help?</strong>
        <div>
          <button className="button" onClick={onOpenChat}><ChatCircleDots size={16} /> Chat</button>
          <a className="button" href={supportMailto(`Help: ${article.question}`)}><EnvelopeSimple size={16} /> Email</a>
        </div>
      </div>
    </article>
  );
}

type ChatMessage =
  | { id: number; from: "user"; text: string }
  | { id: number; from: "bot"; text: string; article?: HelpArticle; related?: HelpArticle[]; fallback?: boolean };

function AssistantChat({ onClose, onOpenArticle }: { onClose: () => void; onOpenArticle: (id: string) => void }) {
  const titleId = useId();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, from: "bot", text: "Hi, I'm the Dexponent assistant. Ask a question or pick a popular topic below." },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (!minimised) inputRef.current?.focus(); }, [minimised]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function ask(text: string) {
    const clean = text.trim();
    if (!clean || typing) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text: clean }]);
    setDraft("");
    setTyping(true);
    timer.current = setTimeout(() => {
      const { article, related } = assistantReply(clean);
      setMessages((m) => [
        ...m,
        article
          ? { id: nextId.current++, from: "bot", text: article.summary, article, related }
          : {
              id: nextId.current++,
              from: "bot",
              text: "I couldn't find an answer for that yet. Try one of the popular topics, or email our support team and a person will help.",
              fallback: true,
            },
      ]);
      setTyping(false);
    }, 650);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  if (minimised) {
    return (
      <button className="assistant-launcher" aria-label="Open AI assistant chat" onClick={() => setMinimised(false)}>
        <ChatCircleDots size={24} weight="fill" />
      </button>
    );
  }

  return (
    <section className="assistant-chat" role="dialog" aria-labelledby={titleId}>
      <header className="assistant-head">
        <span className="assistant-avatar"><Robot size={18} weight="fill" /></span>
        <div>
          <h2 id={titleId}>Dexponent Assistant</h2>
          <p><span className="assistant-dot" /> Answers from the help center</p>
        </div>
        <button className="icon-button" aria-label="Minimise chat" onClick={() => setMinimised(true)}><Minus size={16} /></button>
        <button className="icon-button" aria-label="Close chat" onClick={onClose}><X size={16} /></button>
      </header>
      <div className="assistant-messages" ref={listRef} aria-live="polite">
        {messages.map((message) =>
          message.from === "user" ? (
            <p key={message.id} className="assistant-msg user">{message.text}</p>
          ) : (
            <div key={message.id} className="assistant-msg bot">
              {message.article && <strong>{message.article.question}</strong>}
              <p>{message.text}</p>
              {message.article && (
                <>
                  <ol>{message.article.steps.slice(0, 3).map((step) => <li key={step}>{step}</li>)}</ol>
                  <button className="assistant-link" onClick={() => onOpenArticle(message.article!.id)}>
                    Read full answer and example <CaretRight size={12} />
                  </button>
                </>
              )}
              {message.fallback && (
                <a className="assistant-link" href={supportMailto("Question from the assistant chat")}>
                  Email {SUPPORT_EMAIL} <ArrowSquareOut size={12} />
                </a>
              )}
              {message.related && message.related.length > 0 && (
                <div className="assistant-related">
                  {message.related.map((article) => (
                    <button key={article.id} className="support-chip" onClick={() => ask(article.question)}>{article.question}</button>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {typing && (
          <div className="assistant-msg bot assistant-typing" aria-label="Assistant is typing">
            <span /><span /><span />
          </div>
        )}
      </div>
      <div className="assistant-suggestions" aria-label="Popular issues">
        {popularIssues.map((issue) => (
          <button key={issue.label} className="support-chip" disabled={typing} onClick={() => ask(issue.label)}>{issue.label}</button>
        ))}
      </div>
      <form className="assistant-input" onSubmit={submit}>
        <label className="sr-only" htmlFor={`${titleId}-input`}>Message the assistant</label>
        <input
          id={`${titleId}-input`}
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about orders, deposits, perps…"
          maxLength={300}
          autoComplete="off"
        />
        <button className="assistant-send" type="submit" aria-label="Send message" disabled={!draft.trim() || typing}>
          <PaperPlaneRight size={17} weight="fill" />
        </button>
      </form>
      <p className="assistant-note">AI answers can be incomplete. Never share your seed phrase.</p>
    </section>
  );
}
