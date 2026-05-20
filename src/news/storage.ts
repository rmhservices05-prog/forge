import { seedNewsArticles, seedNewsSources } from "./seed";
import type {
  NewsArticle,
  NewsArticlePatch,
  NewsInternalNote,
  NewsSource,
  NewsSourceInput,
} from "./types";

const ARTICLES_STORAGE_KEY = "forge.news.articles.v1";
const SOURCES_STORAGE_KEY = "forge.news.sources.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function readJson<T>(storage: StorageLike, key: string, fallback: T): T {
  const storedValue = storage.getItem(key);

  if (!storedValue) {
    storage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    storage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function writeJson<T>(storage: StorageLike, key: string, value: T): void {
  storage.setItem(key, JSON.stringify(value));
}

export function createNewsRepository(storage: StorageLike) {
  return {
    listArticles(): NewsArticle[] {
      return readJson(storage, ARTICLES_STORAGE_KEY, seedNewsArticles);
    },

    listSources(): NewsSource[] {
      return readJson(storage, SOURCES_STORAGE_KEY, seedNewsSources);
    },

    saveArticles(articles: NewsArticle[]): NewsArticle[] {
      writeJson(storage, ARTICLES_STORAGE_KEY, articles);
      return articles;
    },

    saveSources(sources: NewsSource[]): NewsSource[] {
      writeJson(storage, SOURCES_STORAGE_KEY, sources);
      return sources;
    },

    getArticle(articleId: string): NewsArticle | undefined {
      return this.listArticles().find((article) => article.id === articleId);
    },

    createSource(input: NewsSourceInput): NewsSource {
      const now = new Date().toISOString();
      const source: NewsSource = {
        id: createId("source"),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      const nextSources = [...this.listSources(), source];
      this.saveSources(nextSources);
      return source;
    },

    updateSource(sourceId: string, input: Partial<NewsSourceInput> & Pick<NewsSource, "enabled">): NewsSource | undefined {
      let updatedSource: NewsSource | undefined;
      const nextSources = this.listSources().map((source) => {
        if (source.id !== sourceId) {
          return source;
        }

        updatedSource = {
          ...source,
          ...input,
          updatedAt: new Date().toISOString(),
        };

        return updatedSource;
      });

      if (!updatedSource) {
        return undefined;
      }

      this.saveSources(nextSources);
      return updatedSource;
    },

    disableSource(sourceId: string): NewsSource | undefined {
      const source = this.listSources().find((candidate) => candidate.id === sourceId);
      if (!source) {
        return undefined;
      }

      return this.updateSource(sourceId, { enabled: false });
    },

    updateArticle(articleId: string, patch: NewsArticlePatch): NewsArticle | undefined {
      let updatedArticle: NewsArticle | undefined;
      const nextArticles = this.listArticles().map((article) => {
        if (article.id !== articleId) {
          return article;
        }

        updatedArticle = {
          ...article,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        return updatedArticle;
      });

      if (!updatedArticle) {
        return undefined;
      }

      this.saveArticles(nextArticles);
      return updatedArticle;
    },

    addNote(articleId: string, body: string): NewsInternalNote | undefined {
      const trimmedBody = body.trim();
      if (!trimmedBody) {
        return undefined;
      }

      let createdNote: NewsInternalNote | undefined;
      const nextArticles = this.listArticles().map((article) => {
        if (article.id !== articleId) {
          return article;
        }

        createdNote = {
          id: createId("note"),
          body: trimmedBody,
          createdAt: new Date().toISOString(),
        };

        return {
          ...article,
          internalNotes: [createdNote, ...article.internalNotes],
          updatedAt: new Date().toISOString(),
        };
      });

      if (!createdNote) {
        return undefined;
      }

      this.saveArticles(nextArticles);
      return createdNote;
    },
  };
}

export function createMemoryStorage(seed: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function getBrowserStorage(): StorageLike {
  return window.localStorage;
}

export const newsRepository = {
  listArticles() {
    return createNewsRepository(getBrowserStorage()).listArticles();
  },
  listSources() {
    return createNewsRepository(getBrowserStorage()).listSources();
  },
  saveArticles(articles: NewsArticle[]) {
    return createNewsRepository(getBrowserStorage()).saveArticles(articles);
  },
  saveSources(sources: NewsSource[]) {
    return createNewsRepository(getBrowserStorage()).saveSources(sources);
  },
  getArticle(articleId: string) {
    return createNewsRepository(getBrowserStorage()).getArticle(articleId);
  },
  createSource(input: NewsSourceInput) {
    return createNewsRepository(getBrowserStorage()).createSource(input);
  },
  updateSource(sourceId: string, input: Partial<NewsSourceInput> & Pick<NewsSource, "enabled">) {
    return createNewsRepository(getBrowserStorage()).updateSource(sourceId, input);
  },
  disableSource(sourceId: string) {
    return createNewsRepository(getBrowserStorage()).disableSource(sourceId);
  },
  updateArticle(articleId: string, patch: NewsArticlePatch) {
    return createNewsRepository(getBrowserStorage()).updateArticle(articleId, patch);
  },
  addNote(articleId: string, body: string) {
    return createNewsRepository(getBrowserStorage()).addNote(articleId, body);
  },
};
