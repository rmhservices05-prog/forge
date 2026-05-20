import { buildInternalInsightFields, scoreArticleSignals } from "./scoring";
import type { NewsArticle, NewsSource, RawNewsArticle } from "./types";

const TRACKING_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function canonicalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const queryParam of TRACKING_QUERY_PARAMS) {
      parsed.searchParams.delete(queryParam);
    }

    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function createArticleId(sourceId: string, title: string, canonicalUrl: string): string {
  return `article-${sourceId}-${slugify(title || canonicalUrl)}`;
}

export function normalizeArticle(source: NewsSource, article: RawNewsArticle, fetchedAt: string): NewsArticle {
  const summary = stripHtml(article.summary ?? "");
  const canonicalUrl = canonicalizeUrl(article.url);
  const publishedAt = article.publishedAt && !Number.isNaN(Date.parse(article.publishedAt))
    ? new Date(article.publishedAt).toISOString()
    : fetchedAt;
  const signalData = scoreArticleSignals({
    title: article.title,
    summary,
    rawContent: article.rawContent,
  });
  const insightFields = buildInternalInsightFields({
    title: article.title,
    summary,
    sourceName: source.name,
    tags: signalData.tags,
    salesSignals: signalData.salesSignals,
    companiesMentioned: signalData.companiesMentioned,
    relevanceReasons: signalData.relevanceReasons,
  });

  return {
    id: createArticleId(source.id, article.title, canonicalUrl),
    sourceId: source.id,
    sourceName: source.name,
    title: article.title.trim(),
    summary,
    url: article.url.trim(),
    canonicalUrl,
    publishedAt,
    fetchedAt,
    author: article.author?.trim() ?? "",
    imageUrl: article.imageUrl?.trim() || undefined,
    rawContent: article.rawContent?.trim() || undefined,
    tags: signalData.tags,
    companiesMentioned: signalData.companiesMentioned,
    regionsMentioned: signalData.regionsMentioned,
    relevanceScore: signalData.relevanceScore,
    relevanceReasons: signalData.relevanceReasons,
    salesSignals: signalData.salesSignals,
    whyThisMatters: insightFields.whyThisMatters,
    possibleDelatrAngle: insightFields.possibleDelatrAngle,
    suggestedAction: insightFields.suggestedAction,
    bookmarked: false,
    read: false,
    internalNotes: [],
    createdAt: fetchedAt,
    updatedAt: fetchedAt,
  };
}

export function mergeArticles(existingArticles: NewsArticle[], incomingArticles: NewsArticle[]): NewsArticle[] {
  const byKey = new Map<string, NewsArticle>();
  const dedupeKeys = new Map<string, string>();

  for (const article of existingArticles) {
    byKey.set(article.id, article);
    dedupeKeys.set(article.canonicalUrl, article.id);
    dedupeKeys.set(`${article.sourceId}:${article.title.toLowerCase()}:${article.publishedAt.slice(0, 10)}`, article.id);
  }

  for (const article of incomingArticles) {
    const signature = `${article.sourceId}:${article.title.toLowerCase()}:${article.publishedAt.slice(0, 10)}`;
    const existingId = dedupeKeys.get(article.canonicalUrl) ?? dedupeKeys.get(signature);

    if (!existingId) {
      byKey.set(article.id, article);
      dedupeKeys.set(article.canonicalUrl, article.id);
      dedupeKeys.set(signature, article.id);
      continue;
    }

    const existing = byKey.get(existingId);
    if (!existing) {
      continue;
    }

    byKey.set(existingId, {
      ...article,
      id: existingId,
      bookmarked: existing.bookmarked,
      read: existing.read,
      internalNotes: existing.internalNotes,
      createdAt: existing.createdAt,
      updatedAt: article.fetchedAt,
    });
  }

  return [...byKey.values()].sort((first, second) => {
    if (second.relevanceScore !== first.relevanceScore) {
      return second.relevanceScore - first.relevanceScore;
    }

    return new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime();
  });
}
