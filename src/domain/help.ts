// Help center knowledge base. Content is static and ships with the app; the
// in-app assistant answers only from these articles (no live model connected).

export const SUPPORT_EMAIL = "support@dexponent.com";

export type HelpCategoryId =
  | "account"
  | "deposit"
  | "withdraw"
  | "trading"
  | "orders"
  | "index"
  | "perp"
  | "farms"
  | "profile"
  | "wallet"
  | "stablecoin"
  | "dtf"
  | "fees"
  | "security"
  | "docs";

export type HelpCategory = {
  id: HelpCategoryId;
  label: string;
  description: string;
};

export type HelpArticle = {
  id: string;
  category: HelpCategoryId;
  question: string;
  summary: string;
  steps: string[];
  example: string;
  keywords: string[];
};

export const helpCategories: HelpCategory[] = [
  { id: "account", label: "Account", description: "Sign in, sign up, and verification" },
  { id: "deposit", label: "Deposit", description: "Add capital to a DTF" },
  { id: "withdraw", label: "Withdraw", description: "Move capital out of a DTF" },
  { id: "trading", label: "Trading", description: "Buy, sell, and market basics" },
  { id: "orders", label: "Orders", description: "Market, limit, TP/SL orders" },
  { id: "index", label: "Index", description: "Multi-asset Index DTFs" },
  { id: "perp", label: "Perp trading", description: "Leverage, margin, funding" },
  { id: "farms", label: "DTFs", description: "Create and manage DTFs" },
  { id: "profile", label: "Profile", description: "Workspace and personal details" },
  { id: "wallet", label: "Wallet", description: "Connect, networks, balances" },
  { id: "stablecoin", label: "Stablecoin", description: "USDC, USDT, and stable yield" },
  { id: "dtf", label: "DTF", description: "Tokenised index funds" },
  { id: "fees", label: "Fees", description: "Management, performance, gas" },
  { id: "security", label: "Security", description: "Protecting your account" },
  { id: "docs", label: "Docs", description: "DTF documents and audits" },
];

export const helpArticles: HelpArticle[] = [
  // Account
  {
    id: "create-account", category: "account",
    question: "How do I create a Dexponent account?",
    summary: "Sign up with your email or mobile number, verify the code we send, then choose how you plan to use Dexponent.",
    steps: ["Select Sign up from the login screen.", "Enter your name, email or mobile number, and a password.", "Enter the verification code.", "Pick your role (LP or Manager) to personalise your workspace."],
    example: "Priya signs up with her work email, verifies the 6-digit code, and selects Manager so the dashboard opens on Create DTF.",
    keywords: ["sign up", "signup", "register", "create account", "new account", "join"],
  },
  {
    id: "cant-sign-in", category: "account",
    question: "I can't sign in to my account",
    summary: "Most sign-in issues come from a mistyped identifier, an expired verification code, or a password reset that wasn't completed.",
    steps: ["Check you're using the same email or mobile number you signed up with.", "Request a new verification code if the old one expired.", "Use Forgot password to set a new password.", "Still stuck? Email support with the identifier you used."],
    example: "Alex signed up with a mobile number but tried logging in with email. Switching to the Mobile tab fixed it.",
    keywords: ["login", "log in", "sign in", "password", "locked", "code", "otp", "verification"],
  },
  {
    id: "switch-workspace", category: "account",
    question: "How do I switch between workspaces?",
    summary: "Use the workspace switcher at the bottom of the sidebar to move between personal and team workspaces.",
    steps: ["Open the workspace menu in the sidebar.", "Choose the workspace you want.", "Your DTFs, positions, and settings update to that workspace."],
    example: "A manager switches from Personal workspace to Growth workspace to review the team's Index DTFs.",
    keywords: ["workspace", "team", "switch", "organisation"],
  },
  // Deposit
  {
    id: "how-deposit", category: "deposit",
    question: "How do I deposit into a DTF?",
    summary: "Open a DTF Profile, choose Deposit, enter an amount, review the transaction, and confirm it in your wallet.",
    steps: ["Go to Explore and open a DTF.", "Review strategy, risk, and documents.", "Select Deposit and enter an amount.", "Review network, gas, and contract, then confirm in your wallet.", "Wait for the transaction to show Confirmed."],
    example: "You deposit 1,000 USDC into Blue Chip Index on Base. After wallet confirmation the status moves Pending → Confirmed and the position appears under Positions.",
    keywords: ["deposit", "add funds", "invest", "fund", "put money", "add capital"],
  },
  {
    id: "deposit-pending", category: "deposit",
    question: "My deposit is stuck on Pending",
    summary: "Pending means the transaction has been sent but not yet confirmed on-chain. Network congestion or low gas usually causes delays.",
    steps: ["Open the transaction link to check it in a block explorer.", "If gas was too low, speed it up or cancel it in your wallet.", "Don't resend the deposit until the first one fails or is cancelled."],
    example: "A deposit sent with low gas during a busy period stays Pending for 10 minutes, then confirms once the network clears.",
    keywords: ["pending", "stuck", "not arrived", "arrived", "deposit not", "missing deposit", "delay", "not received", "not showing"],
  },
  {
    id: "deposit-minimum", category: "deposit",
    question: "Is there a minimum deposit?",
    summary: "Each DTF sets its own minimum. You'll see it on the DTF Profile and in the Deposit form before you confirm.",
    steps: ["Open the DTF Profile.", "Check Liquidity settings for the minimum deposit.", "The Deposit button stays disabled until the amount meets it."],
    example: "A Stablecoin Yield DTF with a 100 USDC minimum rejects a 50 USDC deposit with a clear message.",
    keywords: ["minimum", "min deposit", "smallest", "limit"],
  },
  // Withdraw
  {
    id: "how-withdraw", category: "withdraw",
    question: "How do I withdraw from a DTF?",
    summary: "Open your position, select Withdraw, enter the amount, and confirm in your wallet. Some DTFs process withdrawals through a queue.",
    steps: ["Go to Positions and open the DTF.", "Select Withdraw and enter an amount or choose Max.", "Review any withdrawal queue or cooldown.", "Confirm in your wallet."],
    example: "You withdraw 500 USDC from Stablecoin Yield. Liquidity is available, so funds return in the same transaction.",
    keywords: ["withdraw", "cash out", "take out", "redeem", "exit", "remove funds"],
  },
  {
    id: "withdraw-queue", category: "withdraw",
    question: "Why is my withdrawal in a queue?",
    summary: "When most of a DTF's capital is deployed, withdrawals wait in a queue until liquidity frees up. Your position keeps earning while it waits.",
    steps: ["Check Liquidity on the DTF Profile for queue size and estimated time.", "Track your request under Activity.", "Funds are released automatically when liquidity becomes available."],
    example: "A Perpetual DTF with 92% utilisation queues a 20,000 USDC withdrawal, releasing it after the next rebalance.",
    keywords: ["queue", "withdrawal delay", "waiting", "liquidity", "slow withdrawal"],
  },
  {
    id: "withdraw-paused", category: "withdraw",
    question: "Can I withdraw from a paused DTF?",
    summary: "Yes. Pausing stops new deposits and strategy activity, but LPs can still withdraw.",
    steps: ["Open the paused DTF from Positions.", "Select Withdraw.", "Confirm in your wallet."],
    example: "A manager pauses an Index DTF during a protocol incident; LPs can still exit their positions.",
    keywords: ["paused", "pause", "frozen"],
  },
  // Trading
  {
    id: "buy", category: "trading",
    question: "How do I buy an asset?",
    summary: "On the Trade screen, pick a market, choose Buy / Long, enter a size, and place the order.",
    steps: ["Open Trade and select a market, such as ETH-PERP.", "Choose Buy / Long.", "Pick Market or Limit and enter a size.", "Review cost, fees, and liquidation price, then place the order."],
    example: "You buy 0.5 ETH with a market order. The order fills at the best available price and appears under Positions.",
    keywords: ["buy", "long", "purchase", "open long"],
  },
  {
    id: "sell", category: "trading",
    question: "How do I sell or close a position?",
    summary: "Choose Sell / Short to open a short, or close an existing position from the Positions table.",
    steps: ["To close: open Positions and select Close on the row.", "To short: choose Sell / Short on the order form.", "Review the estimated PnL and fees, then confirm."],
    example: "You hold 0.5 ETH long. Selecting Close sells 0.5 ETH at market and realises your PnL.",
    keywords: ["sell", "short", "close", "exit position", "close position"],
  },
  {
    id: "slippage", category: "trading",
    question: "What is slippage?",
    summary: "Slippage is the difference between the price you expect and the price you get. It grows with order size and low liquidity.",
    steps: ["Set a slippage tolerance in trade settings.", "Use limit orders when price matters more than speed.", "Split large orders in thin markets."],
    example: "A market buy expected at $3,200 fills at $3,206, which is 0.19% slippage.",
    keywords: ["slippage", "price impact", "different price", "worse price"],
  },
  // Orders
  {
    id: "order-types", category: "orders",
    question: "What's the difference between market and limit orders?",
    summary: "Market orders fill immediately at the best available price. Limit orders fill only at your price or better, and may not fill at all.",
    steps: ["Use Market when you need to enter or exit now.", "Use Limit to control your entry price.", "Open limit orders appear under Open orders until filled or cancelled."],
    example: "ETH trades at $3,200. A limit buy at $3,150 waits until the price drops there, while a market buy fills right away.",
    keywords: ["market order", "limit order", "order type", "orders", "order"],
  },
  {
    id: "order-not-filled", category: "orders",
    question: "Why didn't my order fill?",
    summary: "Limit orders only fill when the market reaches your price. Orders can also be rejected for insufficient margin or size limits.",
    steps: ["Check Open orders to confirm the order is live.", "Compare your limit price with the current mark price.", "Check the order toast or Activity for a rejection reason."],
    example: "A limit sell at $3,500 stays open while ETH trades at $3,280; it fills only if the price reaches $3,500.",
    keywords: ["not filled", "unfilled", "open order", "rejected", "order failed", "cancelled"],
  },
  {
    id: "tpsl", category: "orders",
    question: "How do I set take profit and stop loss?",
    summary: "Turn on TP/SL in the order form to close your position automatically at a target profit or a maximum loss.",
    steps: ["Enable TP/SL on the order form.", "Enter a take-profit price and a stop-loss price.", "Review the estimated PnL for each and place the order."],
    example: "Long ETH at $3,200 with TP at $3,500 and SL at $3,050 locks in about +9.4% or limits the loss to about −4.7% before leverage.",
    keywords: ["take profit", "stop loss", "tp", "sl", "tp/sl", "stop"],
  },
  // Index
  {
    id: "index-what", category: "index",
    question: "What is an Index DTF?",
    summary: "An Index DTF spreads capital across several assets at target weights and rebalances to keep them on target.",
    steps: ["Capital enters in a base asset like USDC.", "It's allocated across assets such as BTC, ETH, and SOL.", "The DTF rebalances on a schedule or when weights drift past a threshold."],
    example: "Blue Chip Index holds 50% BTC, 35% ETH, and 15% SOL, and rebalances when any weight drifts by more than 5%.",
    keywords: ["index", "basket", "diversified", "allocation", "multi asset"],
  },
  {
    id: "index-rebalance", category: "index",
    question: "How does rebalancing work?",
    summary: "Rebalancing sells assets that grew above target and buys those below target to restore the allocation.",
    steps: ["Check the rebalance frequency and threshold on the Strategy tab.", "Each rebalance is logged under Activity.", "Rebalancing has trading costs, which show up in performance attribution."],
    example: "ETH rallies from 35% to 42% of the DTF; rebalancing trims ETH back to 35% and adds to BTC and SOL.",
    keywords: ["rebalance", "rebalancing", "drift", "weights"],
  },
  // Perp
  {
    id: "perp-what", category: "perp",
    question: "What is perpetual trading?",
    summary: "Perpetuals are futures without an expiry date. You can go long or short with leverage, and positions stay open as long as you have enough margin.",
    steps: ["Choose a perp market, such as ETH-PERP.", "Pick a direction (long or short) and leverage.", "Your margin backs the position; funding payments are exchanged periodically."],
    example: "With 1,000 USDC margin at 5× leverage you open a 5,000 USDC ETH long. A 2% move in ETH changes your PnL by about 100 USDC.",
    keywords: ["perp", "perpetual", "perps", "futures", "derivatives", "perp trading"],
  },
  {
    id: "leverage-liquidation", category: "perp",
    question: "How do leverage and liquidation work?",
    summary: "Leverage multiplies both gains and losses. If losses use up your margin down to the maintenance level, the position is liquidated.",
    steps: ["Check the liquidation price before placing any order.", "Lower leverage moves the liquidation price further away.", "Add margin to an open position to reduce liquidation risk."],
    example: "A 10× ETH long opened at $3,200 may be liquidated near $2,900. At 3× the liquidation price is far lower.",
    keywords: ["leverage", "liquidation", "liquidated", "margin call", "margin"],
  },
  {
    id: "funding", category: "perp",
    question: "What is the funding rate?",
    summary: "Funding is a periodic payment between longs and shorts that keeps the perp price close to the spot price. When it's positive, longs pay shorts.",
    steps: ["See the current and next funding rate in the market header.", "Funding is applied to open positions at each interval.", "Funding Capture DTFs aim to collect funding while hedging price risk."],
    example: "At +0.01% per hour, a 10,000 USDC short receives about 1 USDC each hour while funding stays positive.",
    keywords: ["funding", "funding rate", "funding fee"],
  },
  {
    id: "positions", category: "perp",
    question: "Where can I see my open positions?",
    summary: "Open positions are listed on the Trade screen under Positions, and DTF positions are on the Positions page.",
    steps: ["Open Trade and scroll to the Positions tab.", "Review size, entry price, mark price, PnL, and liquidation price.", "Use Close or TP/SL to manage each position."],
    example: "The Positions tab shows an ETH long of 0.5 at $3,200 entry with +42 USDC unrealised PnL.",
    keywords: ["positions", "position", "open positions", "my positions", "pnl"],
  },
  // Farms
  {
    id: "create-farm", category: "farms",
    question: "How do I create a DTF?",
    summary: "Choose a strategy type, start from a template, add details, review the live preview, and publish.",
    steps: ["Select Create DTF.", "Choose Index, Spot, or Perpetual.", "Pick a template; most settings are prefilled.", "Add a name, logo, and documents, then adjust the configuration.", "Review and publish."],
    example: "A manager picks Spot → Stablecoin Yield, uploads a logo and a risk methodology PDF, and publishes in a few minutes.",
    keywords: ["create DTF", "new DTF", "launch", "publish", "template"],
  },
  {
    id: "pause-farm", category: "farms",
    question: "How do I pause or archive a DTF?",
    summary: "Active DTFs can be paused or archived from the DTF workspace. Active DTFs can't be deleted, to protect LP capital.",
    steps: ["Open the DTF from DTFs.", "Select Pause to stop new deposits and strategy activity.", "Select Archive to retire the DTF once LPs have exited."],
    example: "A manager pauses an Index DTF during an oracle incident, then resumes it after the fix.",
    keywords: ["pause DTF", "archive", "retire", "delete DTF", "stop DTF"],
  },
  // Profile
  {
    id: "edit-profile", category: "profile",
    question: "How do I update my profile?",
    summary: "Go to Settings to change your display name and workspace details.",
    steps: ["Open the profile menu at the bottom of the sidebar.", "Choose Settings.", "Update your name or workspace and save."],
    example: "Alex renames the workspace from Personal workspace to Morgan Capital.",
    keywords: ["profile", "name", "settings", "edit profile", "change name"],
  },
  {
    id: "theme", category: "profile",
    question: "How do I change the theme?",
    summary: "Open the top-right menu and choose Light, Dark, or System under Theme.",
    steps: ["Open the menu in the top-right corner.", "Under Theme, choose Light, Dark, or System.", "System follows your device setting."],
    example: "Choosing System switches the app to light mode during the day if your device uses automatic appearance.",
    keywords: ["theme", "dark mode", "light mode", "appearance"],
  },
  // Wallet
  {
    id: "connect-wallet", category: "wallet",
    question: "How do I connect my wallet?",
    summary: "Select Connect wallet in the top bar, choose your wallet, and approve the connection request.",
    steps: ["Select Connect wallet.", "Choose your wallet provider.", "Approve the request in your wallet.", "Check that the network matches the DTF you're using."],
    example: "You connect MetaMask, approve the request, and the top bar shows your shortened address and network.",
    keywords: ["connect wallet", "wallet", "metamask", "connect", "walletconnect"],
  },
  {
    id: "wrong-network", category: "wallet",
    question: "It says I'm on the wrong network",
    summary: "Each DTF runs on one network. Switch your wallet to that network before depositing or trading.",
    steps: ["Check the DTF's network on its profile.", "Approve the network switch prompt, or switch manually in your wallet.", "Retry the action."],
    example: "Your wallet is on Solana but the DTF runs on Base. Approving the switch lets the deposit continue.",
    keywords: ["wrong network", "network", "chain", "switch network", "solana", "base"],
  },
  {
    id: "insufficient-gas", category: "wallet",
    question: "My transaction failed with insufficient gas",
    summary: "Every transaction needs the network's native token for gas, such as ETH. Top up the native token and retry.",
    steps: ["Check your native token balance in your wallet.", "Add a small amount of the native token.", "Retry the transaction."],
    example: "You hold 2,000 USDC but 0 ETH on Base. Adding 0.002 ETH covers gas for the deposit.",
    keywords: ["gas", "insufficient", "failed transaction", "transaction failed", "balance"],
  },
  // Stablecoin
  {
    id: "stable-what", category: "stablecoin",
    question: "What is a stablecoin?",
    summary: "A stablecoin is a token designed to track a reference asset, usually the US dollar. It's built to stay stable, but it can still lose its peg.",
    steps: ["USDC and USDT are the most common dollar stablecoins.", "Many DTFs use a stablecoin as their base asset.", "Check the issuer and reserve disclosures in DTF documents."],
    example: "A Stablecoin Yield DTF accepts USDC and lends it on Aave to earn variable interest.",
    keywords: ["stablecoin", "usdc", "usdt", "dai", "stable"],
  },
  {
    id: "stable-yield", category: "stablecoin",
    question: "Where does stablecoin yield come from?",
    summary: "Yield usually comes from lending interest, liquidity fees, or funding payments. It varies over time and is never guaranteed.",
    steps: ["Check the yield source on the DTF's Strategy tab.", "Compare estimated and historical APY, labelled separately.", "Review protocol and smart contract risk."],
    example: "A lending DTF shows a 5.2% estimated APY from Aave borrow demand. If demand falls, the rate falls with it.",
    keywords: ["yield", "apy", "interest", "earn", "stable yield"],
  },
  // DTF
  {
    id: "dtf-what", category: "dtf",
    question: "What is a DTF?",
    summary: "A DTF (decentralised token fund) is a basket of assets you hold as a single token. Its value tracks the assets inside it.",
    steps: ["Deposit the base asset to mint DTF tokens.", "The token represents your share of the basket.", "Redeem the token to get the underlying value back."],
    example: "A DeFi blue-chip DTF holds UNI, AAVE, and LDO. Owning one token gives exposure to all three.",
    keywords: ["dtf", "token fund", "tokenised", "tokenized", "basket token", "etf"],
  },
  {
    id: "dtf-vs-index", category: "dtf",
    question: "How is a DTF different from an Index DTF?",
    summary: "Both hold a basket. A DTF wraps it in a transferable token; an Index DTF tracks your share as a position inside the DTF.",
    steps: ["DTF: you hold a token you can transfer.", "Index Farm: your position is recorded by the DTF contract.", "Compare fees, liquidity, and redemption terms on each profile."],
    example: "You can send DTF tokens to another wallet, while an Index DTF position must be withdrawn first.",
    keywords: ["dtf vs index", "difference", "compare"],
  },
  // Fees
  {
    id: "fees", category: "fees",
    question: "What fees will I pay?",
    summary: "DTFs may charge management and performance fees, and every on-chain action costs network gas. Fees are listed on each DTF Profile.",
    steps: ["Open the DTF Profile and find Fees.", "Management fees accrue on capital over time.", "Performance fees apply only to gains, if the DTF sets them.", "Gas is estimated before you confirm each transaction."],
    example: "A DTF with a 1% management fee and a 10% performance fee that earns 8% in a year nets about 6.2% before gas.",
    keywords: ["fee", "fees", "cost", "charges", "commission", "gas fee"],
  },
  // Security
  {
    id: "security-basics", category: "security",
    question: "How do I keep my account safe?",
    summary: "Never share your seed phrase or private key. Dexponent will never ask for them.",
    steps: ["Only connect your wallet on the official Dexponent domain.", "Check transaction details in your wallet before signing.", "Use a hardware wallet for larger balances."],
    example: "Someone in a DM offers to help and asks for your seed phrase. That's a scam; report it and don't reply.",
    keywords: ["security", "scam", "seed phrase", "private key", "hack", "phishing", "safe"],
  },
  // Docs
  {
    id: "farm-docs", category: "docs",
    question: "Where can I find a DTF's documents?",
    summary: "Each DTF Profile has a Documents section with audits, strategy notes, and disclosures uploaded by the Manager.",
    steps: ["Open the DTF Profile.", "Go to Documents.", "Preview or download files where permitted."],
    example: "Before depositing, you open the audit report and the risk methodology PDF from the Documents tab.",
    keywords: ["documents", "docs", "audit", "pdf", "whitepaper", "disclosure"],
  },
  {
    id: "platform-docs", category: "docs",
    question: "Where are the Dexponent docs?",
    summary: "Product documentation, guides, and references are at docs.dexponent.com.",
    steps: ["Open the top-right menu.", "Choose Documentation.", "Search or browse by topic."],
    example: "A developer opens the docs to read how DTF contracts handle withdrawal queues.",
    keywords: ["documentation", "guide", "docs site", "learn"],
  },
];

/** Popular issues shown as quick-reply chips in chat and on the Support tab. */
export const popularIssues: { label: string; articleId: string }[] = [
  { label: "Perp trading", articleId: "perp-what" },
  { label: "Orders", articleId: "order-types" },
  { label: "Buy", articleId: "buy" },
  { label: "Sell", articleId: "sell" },
  { label: "Positions", articleId: "positions" },
  { label: "Deposit", articleId: "how-deposit" },
  { label: "Withdraw", articleId: "how-withdraw" },
  { label: "Liquidation", articleId: "leverage-liquidation" },
  { label: "Wallet", articleId: "connect-wallet" },
  { label: "Fees", articleId: "fees" },
];

export const articleById = (id: string) => helpArticles.find((a) => a.id === id);
export const articlesIn = (category: HelpCategoryId) =>
  helpArticles.filter((a) => a.category === category);
export const categoryById = (id: HelpCategoryId) =>
  helpCategories.find((c) => c.id === id);

const STOP_WORDS = new Set([
  "the", "and", "for", "you", "your", "are", "was", "why", "how", "what", "can", "does",
  "did", "not", "with", "this", "that", "have", "has", "from", "into", "when", "where",
  "which", "who", "will", "there", "they", "them", "its", "our", "out", "get", "got",
  "help", "need", "want", "please", "about", "any", "all", "but", "just", "doesn", "don",
]);

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9/ ]+/g, " ").trim();

/** Ranks articles against free text. Keyword phrase hits weigh most. */
export function searchArticles(query: string, limit = 5): HelpArticle[] {
  return rankArticles(query).slice(0, limit).map((r) => r.article);
}

function rankArticles(query: string): { article: HelpArticle; score: number }[] {
  const q = normalise(query);
  if (!q) return [];
  const words = q.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return helpArticles
    .map((article) => {
      let score = 0;
      for (const k of article.keywords) if (q.includes(k)) score += 4 + k.length / 10;
      const haystack = normalise(`${article.question} ${article.summary} ${article.keywords.join(" ")}`);
      for (const w of words) if (haystack.includes(w)) score += 1;
      return { article, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export type AssistantReply = { article?: HelpArticle; related: HelpArticle[] };

/** Picks the best article for a message; empty when nothing matches. */
export function assistantReply(message: string): AssistantReply {
  const ranked = rankArticles(message).slice(0, 4);
  const [best, ...rest] = ranked;
  // Only suggest follow-ups that are close in relevance to the top answer.
  let related = rest.filter((r) => best && r.score >= best.score * 0.4).map((r) => r.article);
  if (best && !related.length)
    related = articlesIn(best.article.category).filter((a) => a.id !== best.article.id).slice(0, 2);
  return { article: best?.article, related };
}

export function supportMailto(subject = "Support request: Dexponent app") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
