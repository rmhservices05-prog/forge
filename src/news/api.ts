import { defaultNewsFilters } from "./filters";
import { newsService } from "./service";
import type {
  NewsArticlePatch,
  NewsFilters,
  NewsRefreshFrequency,
  NewsSourceCategory,
  NewsSource,
  NewsSourceInput,
  NewsSourceType,
  NewsTrustLevel,
} from "./types";

type JsonObject = Record<string, unknown>;

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function readJsonBody(request: Request): Promise<JsonObject> {
  try {
    return (await request.json()) as JsonObject;
  } catch {
    return {};
  }
}

function getArticleFilters(url: URL): NewsFilters {
  const filters = defaultNewsFilters();
  filters.query = url.searchParams.get("query") ?? "";
  filters.topic = url.searchParams.get("topic") ?? "";
  filters.company = url.searchParams.get("company") ?? "";
  filters.region = url.searchParams.get("region") ?? "";
  filters.sourceId = url.searchParams.get("source") ?? "";
  filters.minRelevance = url.searchParams.get("minRelevance") ?? "";
  filters.readStatus = (url.searchParams.get("readStatus") as NewsFilters["readStatus"]) ?? "";
  filters.bookmarkedOnly = url.searchParams.get("bookmarked") === "true";
  filters.dateFrom = url.searchParams.get("dateFrom") ?? "";
  filters.dateTo = url.searchParams.get("dateTo") ?? "";
  filters.view = (url.searchParams.get("view") as NewsFilters["view"]) ?? "all";
  return filters;
}

function validateSourceInput(body: JsonObject): body is NewsSourceInput {
  return (
    typeof body.name === "string" &&
    typeof body.type === "string" &&
    typeof body.url === "string" &&
    typeof body.category === "string" &&
    typeof body.enabled === "boolean" &&
    typeof body.refreshFrequency === "string" &&
    typeof body.trustLevel === "string" &&
    typeof body.notes === "string"
  );
}

function validateArticlePatch(body: JsonObject): body is NewsArticlePatch {
  return (
    ("bookmarked" in body ? typeof body.bookmarked === "boolean" : true) &&
    ("read" in body ? typeof body.read === "boolean" : true)
  );
}

function applySourcePatch(source: NewsSource, body: JsonObject): Partial<NewsSourceInput> & Pick<NewsSource, "enabled"> {
  return {
    name: typeof body.name === "string" ? body.name : source.name,
    type: (typeof body.type === "string" ? body.type : source.type) as NewsSourceType,
    url: typeof body.url === "string" ? body.url : source.url,
    category: (typeof body.category === "string" ? body.category : source.category) as NewsSourceCategory,
    enabled: typeof body.enabled === "boolean" ? body.enabled : source.enabled,
    refreshFrequency: (
      typeof body.refreshFrequency === "string" ? body.refreshFrequency : source.refreshFrequency
    ) as NewsRefreshFrequency,
    trustLevel: (
      typeof body.trustLevel === "string" ? body.trustLevel : source.trustLevel
    ) as NewsTrustLevel,
    notes: typeof body.notes === "string" ? body.notes : source.notes,
  };
}

export async function handleNewsApiRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response | undefined> {
  const request = input instanceof Request ? input : new Request(input, init);
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const requestUrl = new URL(request.url, fallbackOrigin);

  if (!requestUrl.pathname.startsWith("/api/news")) {
    return undefined;
  }

  const path = requestUrl.pathname.replace(/^\/api\/news/, "") || "/";
  const method = request.method.toUpperCase();
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 1 && segments[0] === "articles" && method === "GET") {
    return jsonResponse({ articles: newsService.listArticles(getArticleFilters(requestUrl)) });
  }

  if (segments.length === 2 && segments[0] === "articles" && method === "GET") {
    const article = newsService.getArticle(segments[1]);
    return article
      ? jsonResponse({ article })
      : jsonResponse({ error: "Article not found" }, { status: 404 });
  }

  if (segments.length === 2 && segments[0] === "articles" && method === "PATCH") {
    const body = await readJsonBody(request);
    if (!validateArticlePatch(body)) {
      return jsonResponse({ error: "Invalid article patch" }, { status: 400 });
    }

    const article = newsService.updateArticle(segments[1], body);
    return article
      ? jsonResponse({ article })
      : jsonResponse({ error: "Article not found" }, { status: 404 });
  }

  if (segments.length === 3 && segments[0] === "articles" && segments[2] === "notes" && method === "POST") {
    const body = await readJsonBody(request);
    if (typeof body.body !== "string" || !body.body.trim()) {
      return jsonResponse({ error: "Note body is required" }, { status: 400 });
    }

    const note = newsService.addNote(segments[1], body.body);
    return note
      ? jsonResponse({ note })
      : jsonResponse({ error: "Article not found" }, { status: 404 });
  }

  if (segments.length === 3 && segments[0] === "articles" && segments[2] === "bookmark" && method === "POST") {
    const body = await readJsonBody(request);
    const article = newsService.updateArticle(segments[1], {
      bookmarked: typeof body.bookmarked === "boolean" ? body.bookmarked : true,
    });
    return article
      ? jsonResponse({ article })
      : jsonResponse({ error: "Article not found" }, { status: 404 });
  }

  if (segments.length === 3 && segments[0] === "articles" && segments[2] === "read" && method === "POST") {
    const body = await readJsonBody(request);
    const article = newsService.updateArticle(segments[1], {
      read: typeof body.read === "boolean" ? body.read : true,
    });
    return article
      ? jsonResponse({ article })
      : jsonResponse({ error: "Article not found" }, { status: 404 });
  }

  if (segments.length === 1 && segments[0] === "refresh" && method === "POST") {
    const body = await readJsonBody(request);
    const result = await newsService.refresh({ force: body.force === true });
    return jsonResponse({ result });
  }

  if (segments.length === 1 && segments[0] === "sources" && method === "GET") {
    return jsonResponse({ sources: newsService.listSources() });
  }

  if (segments.length === 1 && segments[0] === "sources" && method === "POST") {
    const body = await readJsonBody(request);
    if (!validateSourceInput(body)) {
      return jsonResponse({ error: "Invalid source payload" }, { status: 400 });
    }

    return jsonResponse({ source: newsService.createSource(body) }, { status: 201 });
  }

  if (segments.length === 2 && segments[0] === "sources" && method === "PATCH") {
    const source = newsService.listSources().find((candidate) => candidate.id === segments[1]);
    if (!source) {
      return jsonResponse({ error: "Source not found" }, { status: 404 });
    }

    const body = await readJsonBody(request);
    const updatedSource = newsService.updateSource(segments[1], applySourcePatch(source, body));
    return updatedSource
      ? jsonResponse({ source: updatedSource })
      : jsonResponse({ error: "Source not found" }, { status: 404 });
  }

  if (segments.length === 2 && segments[0] === "sources" && method === "DELETE") {
    const source = newsService.disableSource(segments[1]);
    return source
      ? jsonResponse({ source })
      : jsonResponse({ error: "Source not found" }, { status: 404 });
  }

  return jsonResponse({ error: "News API route not found" }, { status: 404 });
}

export function installNewsApiInterceptor() {
  if ((window as Window & { __forgeNewsApiInstalled?: boolean }).__forgeNewsApiInstalled) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await handleNewsApiRequest(input, init);
    if (response) {
      return response;
    }

    return originalFetch(input, init);
  };

  (window as Window & { __forgeNewsApiInstalled?: boolean }).__forgeNewsApiInstalled = true;
}
