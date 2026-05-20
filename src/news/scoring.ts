import type { NewsArticle, NewsSummary, RawNewsArticle } from "./types";

const trackedCompanies = [
  "Anduril",
  "Palantir",
  "Helsing",
  "Arondite",
  "Quantum Systems",
  "Skydio",
  "Shield AI",
  "Teledyne FLIR",
  "AeroVironment",
  "BAE Systems",
  "Leonardo",
  "Thales",
  "Rheinmetall",
  "Saab",
  "Airbus Defence",
  "Lockheed Martin",
  "Northrop Grumman",
  "RTX",
  "Raytheon",
  "NATO DIANA",
  "UK Defence Innovation",
  "DSTL",
  "HMGCC",
  "AUKUS",
  "NCSC",
  "NIST",
] as const;

const regionRules = [
  { label: "NATO", terms: ["nato"] },
  { label: "United Kingdom", terms: ["uk", "britain", "british", "dstl", "hmgcc"] },
  { label: "Europe", terms: ["europe", "european", "eu"] },
  { label: "United States", terms: ["us ", "u.s.", "america", "american", "nist"] },
  { label: "Ukraine", terms: ["ukraine", "ukrainian"] },
  { label: "Maritime", terms: ["maritime", "navy", "naval"] },
] as const;

const topicRules = [
  { tag: "Defence technology", terms: ["defence tech", "defense tech", "military technology"], weight: 8, reason: "Defence technology market activity" },
  { tag: "Drone companies", terms: ["drone", "uav", "unmanned aerial", "oem"], weight: 16, reason: "Drone or UAV ecosystem mention" },
  { tag: "UAV / UxV systems", terms: ["uav", "uxv", "unmanned system", "autonomous platform"], weight: 14, reason: "Unmanned systems relevance" },
  { tag: "Autonomous systems", terms: ["autonomous", "autonomy", "robotic"], weight: 12, reason: "Autonomous systems signal" },
  { tag: "Counter-UAS", terms: ["counter-uas", "counter uas", "counter-drone"], weight: 14, reason: "Counter-UAS demand signal" },
  { tag: "Electronic warfare", terms: ["electronic warfare", "ew"], weight: 12, reason: "Electronic warfare context" },
  { tag: "GPS jamming / GNSS-denied operations", terms: ["gps jamming", "gnss-denied", "contested gps", "jamming"], weight: 13, reason: "GNSS-denied operations signal" },
  { tag: "Secure communications", terms: ["secure communications", "secure comms", "encrypted link"], weight: 15, reason: "Secure communications need" },
  { tag: "Post-quantum cryptography", terms: ["post-quantum", "pqc", "post quantum"], weight: 18, reason: "Post-quantum cryptography relevance" },
  { tag: "Quantum-safe security", terms: ["quantum-safe", "quantum safe"], weight: 18, reason: "Quantum-safe security relevance" },
  { tag: "NATO procurement", terms: ["procurement", "tender", "contract award", "allied funding"], weight: 17, reason: "Procurement or funding signal" },
  { tag: "UK defence innovation", terms: ["uk defence innovation", "dstl", "uk mod"], weight: 11, reason: "UK defence innovation activity" },
  { tag: "European defence tech", terms: ["european defence", "european defense", "european oem"], weight: 10, reason: "European defence market activity" },
  { tag: "US defence tech", terms: ["pentagon", "u.s. defense", "us defense"], weight: 10, reason: "US defence market activity" },
  { tag: "Ukraine battlefield technology", terms: ["ukraine battlefield", "battlefield technology", "ukraine"], weight: 11, reason: "Ukraine battlefield technology relevance" },
  { tag: "Maritime autonomy", terms: ["maritime autonomy", "autonomous vessel", "surface platform"], weight: 12, reason: "Maritime autonomy opportunity" },
  { tag: "Ground robotics", terms: ["ground robot", "ground robotics", "ugv"], weight: 10, reason: "Ground robotics relevance" },
  { tag: "Satellite communications", terms: ["satellite communications", "satcom"], weight: 10, reason: "Satellite communications signal" },
  { tag: "Defence AI", terms: ["defence ai", "defense ai", "battle management ai"], weight: 12, reason: "Defence AI signal" },
  { tag: "Prime contractors", terms: ["prime contractor", "lockheed", "northrop", "bae systems", "thales"], weight: 9, reason: "Prime contractor mention" },
  { tag: "OEM partnerships", terms: ["partnership", "integration", "joint evaluation"], weight: 14, reason: "Partnership or integration signal" },
  { tag: "Geopolitical risk affecting defence procurement", terms: ["sanction", "geopolitical", "export control", "allied risk"], weight: 13, reason: "Geopolitical timing signal" },
] as const;

const salesSignalRules = [
  { label: "New defence contracts", terms: ["contract", "award", "procurement", "tender"] },
  { label: "New product launches", terms: ["launch", "unveiled", "introduced"] },
  { label: "Partnerships", terms: ["partnership", "collaboration", "joint evaluation", "integration"] },
  { label: "Acquisitions", terms: ["acquisition", "acquires", "merger"] },
  { label: "Funding rounds", terms: ["funding", "raised", "investment"] },
  { label: "Trials / field deployments", terms: ["trial", "field evaluation", "deployment", "pilot"] },
  { label: "Regulatory or compliance deadlines", terms: ["deadline", "compliance", "mandate", "migration"] },
  { label: "Operational failures caused by insecure comms", terms: ["communications failure", "insecure communications", "disruption"] },
] as const;

function includesTerm(text: string, term: string): boolean {
  return text.includes(term.toLowerCase());
}

export function detectCompanies(text: string): string[] {
  return trackedCompanies.filter((company) => text.includes(company.toLowerCase())).map(String);
}

export function detectRegions(text: string): string[] {
  return regionRules
    .filter((rule) => rule.terms.some((term) => includesTerm(text, term)))
    .map((rule) => rule.label);
}

export function summarizeNews(articles: NewsArticle[]): NewsSummary {
  const today = new Date().toISOString().slice(0, 10);

  return {
    newToday: articles.filter((article) => article.publishedAt.slice(0, 10) === today).length,
    highRelevance: articles.filter((article) => article.relevanceScore >= 70).length,
    bookmarked: articles.filter((article) => article.bookmarked).length,
    unread: articles.filter((article) => !article.read).length,
    salesOpportunities: articles.filter((article) => article.salesSignals.length > 0 && article.relevanceScore >= 60).length,
  };
}

export function scoreArticleSignals(input: Pick<RawNewsArticle, "title" | "summary" | "rawContent">) {
  const text = [input.title, input.summary ?? "", input.rawContent ?? ""].join(" ").toLowerCase();
  const tags = new Set<string>();
  const reasons = new Set<string>();
  let score = 0;

  for (const rule of topicRules) {
    if (rule.terms.some((term) => includesTerm(text, term))) {
      tags.add(rule.tag);
      reasons.add(rule.reason);
      score += rule.weight;
    }
  }

  const companiesMentioned = detectCompanies(text);
  if (companiesMentioned.length > 0) {
    score += Math.min(companiesMentioned.length * 6, 18);
    reasons.add("Tracked defence company or institution mentioned");
  }

  const regionsMentioned = detectRegions(text);
  if (regionsMentioned.length > 0) {
    score += Math.min(regionsMentioned.length * 4, 12);
  }

  const salesSignals = salesSignalRules
    .filter((rule) => rule.terms.some((term) => includesTerm(text, term)))
    .map((rule) => rule.label);

  score += Math.min(salesSignals.length * 5, 20);

  return {
    tags: [...tags],
    companiesMentioned,
    regionsMentioned,
    relevanceReasons: [...reasons],
    salesSignals,
    relevanceScore: Math.max(10, Math.min(100, score)),
  };
}

export function buildInternalInsightFields(input: {
  title: string;
  summary: string;
  sourceName: string;
  tags: string[];
  salesSignals: string[];
  companiesMentioned: string[];
  relevanceReasons: string[];
}): Pick<NewsArticle, "whyThisMatters" | "possibleDelatrAngle" | "suggestedAction"> {
  const limitedData = !input.summary.trim();
  if (limitedData) {
    return {
      whyThisMatters: "Limited article data available.",
      possibleDelatrAngle: "Limited article data available.",
      suggestedAction: "Open the original source and qualify whether this should enter Delatr follow-up.",
    };
  }

  const primaryCompany = input.companiesMentioned[0];
  const primaryTag = input.tags[0] ?? "defence market";
  const primarySignal = input.salesSignals[0];

  const whyThisMatters = primaryCompany
    ? `${primaryCompany} appears in a ${primaryTag.toLowerCase()} story that could influence partner timing, platform strategy, or buyer priorities.`
    : `This article points to ${primaryTag.toLowerCase()} movement that may affect Delatr sales timing or integration priorities.`;

  const possibleDelatrAngle = input.tags.some((tag) =>
    ["Post-quantum cryptography", "Quantum-safe security", "Secure communications"].includes(tag),
  )
    ? "Position Delatr as a quantum-safe communications layer that strengthens existing systems without forcing platform redesign."
    : input.tags.some((tag) =>
          ["Drone companies", "UAV / UxV systems", "Autonomous systems", "OEM partnerships"].includes(tag),
        )
      ? "Frame Delatr as a secure communications and resilience layer that can slot into unmanned platforms, field trials, or OEM integrations."
      : "Use this signal to test whether Delatr can support secure communications, resilience, or partner readiness in the target program.";

  const suggestedAction = primarySignal
    ? `Log this as a ${primarySignal.toLowerCase()} signal, identify decision-makers, and qualify whether Delatr should start outreach now.`
    : input.relevanceReasons.length > 0
      ? "Add the company or program to the sales watchlist and review for partnership, procurement, or timing relevance."
      : `Review ${input.sourceName} directly and decide whether to promote this to CRM follow-up.`;

  return {
    whyThisMatters,
    possibleDelatrAngle,
    suggestedAction,
  };
}
