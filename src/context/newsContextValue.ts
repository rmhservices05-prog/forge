import { createContext } from "react";
import type { NewsArticle, NewsFilters, NewsRefreshResult, NewsSource, NewsSourceInput } from "../news/types";

export type NewsContextValue = {
  articles: NewsArticle[];
  sources: NewsSource[];
  loading: boolean;
  refreshResult: NewsRefreshResult | null;
  refreshError: string;
  loadNews: () => Promise<void>;
  refreshNews: () => Promise<void>;
  updateFilters?: (filters: NewsFilters) => void;
  toggleBookmark: (articleId: string, bookmarked: boolean) => Promise<void>;
  toggleRead: (articleId: string, read: boolean) => Promise<void>;
  addNote: (articleId: string, body: string) => Promise<void>;
  addSource: (input: NewsSourceInput) => Promise<void>;
  toggleSource: (sourceId: string, enabled: boolean) => Promise<void>;
};

export const NewsContext = createContext<NewsContextValue | undefined>(undefined);
