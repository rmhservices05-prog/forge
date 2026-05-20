import type { NewsArticle, NewsFilters, NewsViewKey } from "./types";

export const newsViews: { key: NewsViewKey; label: string }[] = [
  { key: "all", label: "All news" },
  { key: "high-relevance", label: "High relevance" },
  { key: "saved", label: "Saved" },
  { key: "company-mentions", label: "Company mentions" },
  { key: "procurement-funding", label: "Procurement/funding" },
  { key: "geopolitical-risk", label: "Geopolitical risk" },
  { key: "quantum-pqc", label: "Quantum/PQC" },
  { key: "drone-oem", label: "Drone/OEM activity" },
];

function articleMatchesView(article: NewsArticle, view: NewsViewKey): boolean {
  switch (view) {
    case "high-relevance":
      return article.relevanceScore >= 70;
    case "saved":
      return article.bookmarked;
    case "company-mentions":
      return article.companiesMentioned.length > 0;
    case "procurement-funding":
      return article.tags.includes("NATO procurement") || article.salesSignals.some((signal) =>
        ["New defence contracts", "Funding rounds", "Trials / field deployments"].includes(signal),
      );
    case "geopolitical-risk":
      return article.tags.includes("Geopolitical risk affecting defence procurement");
    case "quantum-pqc":
      return article.tags.some((tag) =>
        ["Post-quantum cryptography", "Quantum-safe security", "Secure communications"].includes(tag),
      );
    case "drone-oem":
      return article.tags.some((tag) =>
        ["Drone companies", "UAV / UxV systems", "Autonomous systems", "OEM partnerships"].includes(tag),
      );
    default:
      return true;
  }
}

export function defaultNewsFilters(): NewsFilters {
  return {
    query: "",
    topic: "",
    company: "",
    region: "",
    sourceId: "",
    minRelevance: "",
    readStatus: "",
    bookmarkedOnly: false,
    dateFrom: "",
    dateTo: "",
    view: "all",
  };
}

export function filterNewsArticles(articles: NewsArticle[], filters: NewsFilters): NewsArticle[] {
  const query = filters.query.trim().toLowerCase();

  return articles.filter((article) => {
    const haystack = [
      article.title,
      article.summary,
      article.whyThisMatters,
      article.possibleDelatrAngle,
      article.suggestedAction,
      article.tags.join(" "),
      article.companiesMentioned.join(" "),
      article.regionsMentioned.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || haystack.includes(query);
    const matchesTopic = !filters.topic || article.tags.includes(filters.topic);
    const matchesCompany = !filters.company || article.companiesMentioned.includes(filters.company);
    const matchesRegion = !filters.region || article.regionsMentioned.includes(filters.region);
    const matchesSource = !filters.sourceId || article.sourceId === filters.sourceId;
    const matchesRelevance = !filters.minRelevance || article.relevanceScore >= Number(filters.minRelevance);
    const matchesRead =
      !filters.readStatus ||
      (filters.readStatus === "read" ? article.read : !article.read);
    const matchesBookmarked = !filters.bookmarkedOnly || article.bookmarked;
    const matchesFrom = !filters.dateFrom || article.publishedAt.slice(0, 10) >= filters.dateFrom;
    const matchesTo = !filters.dateTo || article.publishedAt.slice(0, 10) <= filters.dateTo;
    const matchesView = articleMatchesView(article, filters.view);

    return (
      matchesQuery &&
      matchesTopic &&
      matchesCompany &&
      matchesRegion &&
      matchesSource &&
      matchesRelevance &&
      matchesRead &&
      matchesBookmarked &&
      matchesFrom &&
      matchesTo &&
      matchesView
    );
  });
}
