import { normalizeArticle } from "./normalization";
import type { NewsArticle, NewsSource, RawNewsArticle } from "./types";

const now = "2026-05-20T09:00:00.000Z";

export const seedNewsSources: NewsSource[] = [
  {
    id: "source-demo-defence-briefs",
    name: "Demo Defence Briefs",
    type: "manual",
    url: "manual://demo-defence-briefs",
    category: "defence-tech",
    enabled: true,
    refreshFrequency: "daily",
    trustLevel: "medium",
    notes: "Demo source for internal Newsroom UI and ranking validation.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source-demo-quantum-watch",
    name: "Demo Quantum Watch",
    type: "manual",
    url: "manual://demo-quantum-watch",
    category: "quantum-security",
    enabled: true,
    refreshFrequency: "daily",
    trustLevel: "medium",
    notes: "Demo source covering PQC and secure communications themes.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source-demo-geopolitics",
    name: "Demo Allied Market Watch",
    type: "manual",
    url: "manual://demo-allied-market-watch",
    category: "geopolitics",
    enabled: true,
    refreshFrequency: "daily",
    trustLevel: "watch",
    notes: "Demo source focused on allied procurement timing and regional signals.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source-nato-news",
    name: "NATO News",
    type: "rss",
    url: "https://www.nato.int/rss/news.xml",
    category: "alliances",
    enabled: false,
    refreshFrequency: "daily",
    trustLevel: "high",
    notes: "Official alliance news. Enable when runtime environment supports feed fetches.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source-nist",
    name: "NIST News",
    type: "rss",
    url: "https://www.nist.gov/news-events/news/rss.xml",
    category: "quantum-security",
    enabled: false,
    refreshFrequency: "weekly",
    trustLevel: "high",
    notes: "Official standards and guidance feed for cryptography and security topics.",
    createdAt: now,
    updatedAt: now,
  },
];

export const demoArticlesBySourceId: Record<string, RawNewsArticle[]> = {
  "source-demo-defence-briefs": [
    {
      title: "[Demo] Anduril expands autonomous maritime trials with NATO-aligned navy",
      summary:
        "A fictional demo brief describes an autonomous surface platform trial involving NATO-aligned customers, secure communications requirements, and follow-on procurement evaluation.",
      url: "https://example.com/demo/anduril-maritime-trials",
      publishedAt: "2026-05-20T07:30:00.000Z",
      author: "Demo Desk",
    },
    {
      title: "[Demo] Shield AI and a European UAV OEM announce joint field evaluation",
      summary:
        "A demo industry note highlights collaborative testing for contested GPS environments, electronic warfare resilience, and future export pathways.",
      url: "https://example.com/demo/shield-ai-uav-evaluation",
      publishedAt: "2026-05-19T16:20:00.000Z",
      author: "Demo Desk",
    },
  ],
  "source-demo-quantum-watch": [
    {
      title: "[Demo] NIST-aligned migration deadline prompts review of post-quantum secure links",
      summary:
        "A demo standards bulletin outlines how procurement teams are reviewing quantum-safe communications, cryptographic transition timing, and compliance milestones.",
      url: "https://example.com/demo/nist-pqc-migration",
      publishedAt: "2026-05-20T06:10:00.000Z",
      author: "Demo Lab",
    },
    {
      title: "[Demo] Secure comms failure in contested environment drives interest in quantum-safe upgrades",
      summary:
        "A fictional after-action summary describes operational disruption linked to insecure communications in a GNSS-denied scenario.",
      url: "https://example.com/demo/secure-comms-failure",
      publishedAt: "2026-05-18T12:00:00.000Z",
      author: "Demo Lab",
    },
  ],
  "source-demo-geopolitics": [
    {
      title: "[Demo] Allied procurement window opens after rapid UAS funding package",
      summary:
        "A demo geopolitical brief points to accelerated procurement timing across allied programs for counter-UAS, secure communications, and trial deployments.",
      url: "https://example.com/demo/allied-procurement-window",
      publishedAt: "2026-05-20T05:45:00.000Z",
      author: "Demo Intelligence",
    },
    {
      title: "[Demo] Limited article data available",
      summary: "",
      url: "https://example.com/demo/limited-data-article",
      publishedAt: "2026-05-17T08:00:00.000Z",
      author: "Demo Intelligence",
    },
  ],
};

export const seedNewsArticles: NewsArticle[] = Object.entries(demoArticlesBySourceId).flatMap(
  ([sourceId, articles]) => {
    const source = seedNewsSources.find((candidate) => candidate.id === sourceId);

    if (!source) {
      return [];
    }

    return articles.map((article) => normalizeArticle(source, article, now));
  },
);
