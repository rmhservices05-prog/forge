import { demoArticlesBySourceId } from "./seed";
import { filterNewsArticles } from "./filters";
import { mergeArticles, normalizeArticle } from "./normalization";
import { createNewsRepository, newsRepository } from "./storage";
import type {
  NewsArticle,
  NewsArticlePatch,
  NewsRefreshResult,
  NewsSource,
  NewsSourceInput,
  RawNewsArticle,
} from "./types";

type RefreshDependencies = {
  fetchText?: (url: string) => Promise<string>;
  now?: () => string;
};

function refreshIntervalMs(frequency: NewsSource["refreshFrequency"]): number {
  switch (frequency) {
    case "hourly":
      return 60 * 60 * 1000;
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "manual":
    default:
      return 0;
  }
}

export async function parseRssFeed(xml: string): Promise<RawNewsArticle[]> {
  if (typeof DOMParser === "undefined") {
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map((match) => {
        const itemXml = match[1] ?? "";
        const readTag = (tagName: string) => {
          const tagMatch = itemXml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
          return tagMatch?.[1]?.trim() ?? "";
        };

        return {
          title: readTag("title"),
          summary: readTag("description"),
          url: readTag("link"),
          publishedAt: readTag("pubDate") || undefined,
          author: readTag("author") || undefined,
        };
      })
      .filter((article) => article.title && article.url);
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(xml, "text/xml");
  const items = [...document.querySelectorAll("item")];

  return items
    .map((item) => ({
      title: item.querySelector("title")?.textContent?.trim() ?? "",
      summary: item.querySelector("description")?.textContent?.trim() ?? "",
      url: item.querySelector("link")?.textContent?.trim() ?? "",
      publishedAt: item.querySelector("pubDate")?.textContent?.trim() ?? undefined,
      author: item.querySelector("author")?.textContent?.trim() ?? item.querySelector("dc\\:creator")?.textContent?.trim() ?? undefined,
      imageUrl:
        item.querySelector("media\\:thumbnail")?.getAttribute("url") ??
        item.querySelector("enclosure")?.getAttribute("url") ??
        undefined,
    }))
    .filter((article) => article.title && article.url);
}

async function defaultFetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`);
  }

  return response.text();
}

async function loadArticlesForSource(
  source: NewsSource,
  dependencies: RefreshDependencies,
): Promise<RawNewsArticle[]> {
  if (source.type === "manual") {
    return demoArticlesBySourceId[source.id] ?? [];
  }

  if (source.type === "api") {
    throw new Error("API sources require a backend adapter and are not enabled in this local build.");
  }

  const fetchText = dependencies.fetchText ?? defaultFetchText;
  const xml = await fetchText(source.url);
  return parseRssFeed(xml);
}

export async function refreshNewsSources(
  repository: ReturnType<typeof createNewsRepository>,
  options?: { force?: boolean },
  dependencies: RefreshDependencies = {},
): Promise<NewsRefreshResult> {
  const now = dependencies.now?.() ?? new Date().toISOString();
  const sourceResults: NewsRefreshResult["sourceResults"] = [];
  const existingArticles = repository.listArticles();
  const existingSources = repository.listSources();
  const normalizedArticles: NewsArticle[] = [];
  const updatedSources = [...existingSources];

  for (const source of existingSources) {
    if (!source.enabled) {
      sourceResults.push({
        sourceId: source.id,
        sourceName: source.name,
        status: "skipped",
        articleCount: 0,
        message: "Source disabled",
      });
      continue;
    }

    const tooSoon =
      !options?.force &&
      source.lastFetchedAt &&
      Date.now() - new Date(source.lastFetchedAt).getTime() < refreshIntervalMs(source.refreshFrequency);

    if (tooSoon) {
      sourceResults.push({
        sourceId: source.id,
        sourceName: source.name,
        status: "skipped",
        articleCount: 0,
        message: "Refresh window not reached yet",
      });
      continue;
    }

    try {
      const rawArticles = await loadArticlesForSource(source, dependencies);
      normalizedArticles.push(...rawArticles.map((article) => normalizeArticle(source, article, now)));
      sourceResults.push({
        sourceId: source.id,
        sourceName: source.name,
        status: "success",
        articleCount: rawArticles.length,
      });

      const sourceIndex = updatedSources.findIndex((candidate) => candidate.id === source.id);
      updatedSources[sourceIndex] = {
        ...source,
        lastFetchedAt: now,
        lastError: undefined,
        updatedAt: now,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown refresh error";
      sourceResults.push({
        sourceId: source.id,
        sourceName: source.name,
        status: "failed",
        articleCount: 0,
        message,
      });
      const sourceIndex = updatedSources.findIndex((candidate) => candidate.id === source.id);
      updatedSources[sourceIndex] = {
        ...source,
        lastError: message,
        updatedAt: now,
      };
    }
  }

  const mergedArticles = mergeArticles(existingArticles, normalizedArticles);
  repository.saveArticles(mergedArticles);
  repository.saveSources(updatedSources);

  return {
    refreshedAt: now,
    totalArticles: mergedArticles.length,
    newArticles: Math.max(0, mergedArticles.length - existingArticles.length),
    deduplicatedArticles: normalizedArticles.length - Math.max(0, mergedArticles.length - existingArticles.length),
    sourceResults,
  };
}

export const newsService = {
  listArticles(filters?: Parameters<typeof filterNewsArticles>[1]) {
    const articles = newsRepository.listArticles();
    return filters ? filterNewsArticles(articles, filters) : articles;
  },
  getArticle(articleId: string) {
    return newsRepository.getArticle(articleId);
  },
  async refresh(options?: { force?: boolean }) {
    return refreshNewsSources(createNewsRepository(window.localStorage), options);
  },
  updateArticle(articleId: string, patch: NewsArticlePatch) {
    return newsRepository.updateArticle(articleId, patch);
  },
  addNote(articleId: string, body: string) {
    return newsRepository.addNote(articleId, body);
  },
  listSources() {
    return newsRepository.listSources();
  },
  createSource(input: NewsSourceInput) {
    return newsRepository.createSource(input);
  },
  updateSource(sourceId: string, input: Partial<NewsSourceInput> & Pick<NewsSource, "enabled">) {
    return newsRepository.updateSource(sourceId, input);
  },
  disableSource(sourceId: string) {
    return newsRepository.disableSource(sourceId);
  },
};
