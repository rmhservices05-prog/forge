import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { NewsContext, type NewsContextValue } from "./newsContextValue";
import type { NewsArticle, NewsRefreshResult, NewsSource, NewsSourceInput } from "../news/types";

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "News request failed");
  }

  return payload;
}

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshResult, setRefreshResult] = useState<NewsRefreshResult | null>(null);
  const [refreshError, setRefreshError] = useState("");

  const loadNews = useCallback(async () => {
    setLoading(true);
    setRefreshError("");

    try {
      const [articlesPayload, sourcesPayload] = await Promise.all([
        apiJson<{ articles: NewsArticle[] }>("/api/news/articles"),
        apiJson<{ sources: NewsSource[] }>("/api/news/sources"),
      ]);

      setArticles(articlesPayload.articles);
      setSources(sourcesPayload.sources);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Unable to load newsroom data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const refreshNews = useCallback(async () => {
    setLoading(true);
    setRefreshError("");

    try {
      const payload = await apiJson<{ result: NewsRefreshResult }>("/api/news/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      setRefreshResult(payload.result);
      await loadNews();
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Unable to refresh sources");
      setLoading(false);
    }
  }, [loadNews]);

  const mutateArticle = useCallback(async (articleId: string, endpoint: string, body: Record<string, unknown>) => {
    await apiJson(`/api/news/articles/${articleId}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await loadNews();
  }, [loadNews]);

  const value = useMemo<NewsContextValue>(
    () => ({
      articles,
      sources,
      loading,
      refreshResult,
      refreshError,
      loadNews,
      refreshNews,
      toggleBookmark(articleId, bookmarked) {
        return mutateArticle(articleId, "bookmark", { bookmarked });
      },
      toggleRead(articleId, read) {
        return mutateArticle(articleId, "read", { read });
      },
      async addNote(articleId, body) {
        await mutateArticle(articleId, "notes", { body });
      },
      async addSource(input: NewsSourceInput) {
        await apiJson("/api/news/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await loadNews();
      },
      async toggleSource(sourceId, enabled) {
        await apiJson(`/api/news/sources/${sourceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        await loadNews();
      },
    }),
    [articles, loadNews, loading, mutateArticle, refreshError, refreshNews, refreshResult, sources],
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}
