export type NewsSourceType = "rss" | "api" | "manual";

export type NewsSourceCategory =
  | "defence-tech"
  | "procurement"
  | "quantum-security"
  | "geopolitics"
  | "alliances"
  | "industry";

export type NewsTrustLevel = "high" | "medium" | "watch";

export type NewsRefreshFrequency = "hourly" | "daily" | "weekly" | "manual";

export type NewsInternalNote = {
  id: string;
  body: string;
  createdAt: string;
};

export type NewsSource = {
  id: string;
  name: string;
  type: NewsSourceType;
  url: string;
  category: NewsSourceCategory;
  enabled: boolean;
  refreshFrequency: NewsRefreshFrequency;
  trustLevel: NewsTrustLevel;
  notes: string;
  lastFetchedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewsArticle = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  summary: string;
  url: string;
  canonicalUrl: string;
  publishedAt: string;
  fetchedAt: string;
  author: string;
  imageUrl?: string;
  rawContent?: string;
  tags: string[];
  companiesMentioned: string[];
  regionsMentioned: string[];
  relevanceScore: number;
  relevanceReasons: string[];
  salesSignals: string[];
  whyThisMatters: string;
  possibleDelatrAngle: string;
  suggestedAction: string;
  bookmarked: boolean;
  read: boolean;
  internalNotes: NewsInternalNote[];
  createdAt: string;
  updatedAt: string;
};

export type NewsSourceInput = Pick<
  NewsSource,
  "name" | "type" | "url" | "category" | "enabled" | "refreshFrequency" | "trustLevel" | "notes"
>;

export type NewsArticlePatch = Partial<Pick<NewsArticle, "bookmarked" | "read">>;

export type NewsFilters = {
  query: string;
  topic: string;
  company: string;
  region: string;
  sourceId: string;
  minRelevance: string;
  readStatus: "" | "read" | "unread";
  bookmarkedOnly: boolean;
  dateFrom: string;
  dateTo: string;
  view: NewsViewKey;
};

export type NewsViewKey =
  | "all"
  | "high-relevance"
  | "saved"
  | "company-mentions"
  | "procurement-funding"
  | "geopolitical-risk"
  | "quantum-pqc"
  | "drone-oem";

export type RawNewsArticle = {
  title: string;
  summary?: string;
  url: string;
  publishedAt?: string;
  author?: string;
  imageUrl?: string;
  rawContent?: string;
};

export type NewsRefreshSourceResult = {
  sourceId: string;
  sourceName: string;
  status: "success" | "skipped" | "failed";
  articleCount: number;
  message?: string;
};

export type NewsRefreshResult = {
  refreshedAt: string;
  totalArticles: number;
  newArticles: number;
  deduplicatedArticles: number;
  sourceResults: NewsRefreshSourceResult[];
};

export type NewsSummary = {
  newToday: number;
  highRelevance: number;
  bookmarked: number;
  unread: number;
  salesOpportunities: number;
};
