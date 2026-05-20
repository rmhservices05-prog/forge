const test = require("node:test");
const assert = require("node:assert/strict");
const { handleNewsApiRequest } = require("../.tmp-tests/news/api.js");
const { defaultNewsFilters, filterNewsArticles } = require("../.tmp-tests/news/filters.js");
const { mergeArticles, normalizeArticle } = require("../.tmp-tests/news/normalization.js");
const { summarizeNews } = require("../.tmp-tests/news/scoring.js");
const { seedNewsSources } = require("../.tmp-tests/news/seed.js");
const { createMemoryStorage, createNewsRepository } = require("../.tmp-tests/news/storage.js");
const { parseRssFeed, refreshNewsSources } = require("../.tmp-tests/news/service.js");

function installTestWindow(storage = createMemoryStorage()) {
  Object.assign(globalThis, {
    window: {
      localStorage: storage,
      location: { origin: "http://localhost" },
      fetch,
    },
  });
}

test("RSS ingestion parses feed items", async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <item>
        <title>Demo NATO procurement update</title>
        <link>https://example.com/article-1</link>
        <description>Post-quantum communications trial for allied UAV fleet.</description>
        <pubDate>Wed, 20 May 2026 08:00:00 GMT</pubDate>
        <author>Desk</author>
      </item>
    </channel>
  </rss>`;

  const articles = await parseRssFeed(xml);

  assert.equal(articles.length, 1);
  assert.equal(articles[0]?.title, "Demo NATO procurement update");
  assert.equal(articles[0]?.author, "Desk");
});

test("article normalization enriches tags, scores, and Delatr insights", () => {
  const source = seedNewsSources[0];
  const article = normalizeArticle(
    source,
    {
      title: "Anduril wins NATO-aligned drone procurement linked to secure communications",
      summary: "The trial mentions UAV operations, post-quantum migration, and allied funding pathways.",
      url: "https://example.com/item?utm_source=test",
    },
    "2026-05-20T09:00:00.000Z",
  );

  assert.equal(article.canonicalUrl, "https://example.com/item");
  assert.ok(article.relevanceScore >= 70);
  assert.ok(article.tags.includes("Drone companies"));
  assert.ok(article.tags.includes("Secure communications"));
  assert.ok(article.companiesMentioned.includes("Anduril"));
  assert.match(article.whyThisMatters, /Anduril|Delatr/i);
});

test("deduplication keeps user state while refreshing article metadata", () => {
  const source = seedNewsSources[0];
  const existing = normalizeArticle(
    source,
    {
      title: "Demo procurement item",
      summary: "Initial summary.",
      url: "https://example.com/demo-item?utm_campaign=1",
    },
    "2026-05-19T09:00:00.000Z",
  );
  existing.bookmarked = true;
  existing.read = true;
  existing.internalNotes = [{ id: "note-1", body: "Watch this", createdAt: "2026-05-19T10:00:00.000Z" }];

  const incoming = normalizeArticle(
    source,
    {
      title: "Demo procurement item",
      summary: "Updated summary with NATO funding detail.",
      url: "https://example.com/demo-item?utm_campaign=2",
    },
    "2026-05-20T09:00:00.000Z",
  );

  const merged = mergeArticles([existing], [incoming]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.bookmarked, true);
  assert.equal(merged[0]?.read, true);
  assert.equal(merged[0]?.internalNotes.length, 1);
  assert.match(merged[0]?.summary ?? "", /Updated summary/);
});

test("filtering supports topic, company, bookmark, read state, and views", () => {
  const source = seedNewsSources[0];
  const first = normalizeArticle(
    source,
    {
      title: "Anduril drone launch with NATO customers",
      summary: "UAV program launch and procurement motion.",
      url: "https://example.com/a",
    },
    "2026-05-20T09:00:00.000Z",
  );
  const second = normalizeArticle(
    source,
    {
      title: "Generic policy note",
      summary: "Limited relevance.",
      url: "https://example.com/b",
    },
    "2026-05-18T09:00:00.000Z",
  );
  first.bookmarked = true;
  second.read = true;

  const filters = defaultNewsFilters();
  filters.company = "Anduril";
  filters.bookmarkedOnly = true;
  filters.readStatus = "unread";
  filters.view = "drone-oem";

  const filtered = filterNewsArticles([first, second], filters);

  assert.deepEqual(filtered.map((article) => article.title), [first.title]);
});

test("repository updates bookmarking, read state, notes, and summary metrics", () => {
  const repository = createNewsRepository(createMemoryStorage());
  const articles = repository.listArticles();
  const firstArticle = articles[0];

  repository.updateArticle(firstArticle.id, { bookmarked: true, read: true });
  repository.addNote(firstArticle.id, "Warm intro candidate for partnerships.");

  const updated = repository.getArticle(firstArticle.id);
  const summary = summarizeNews(repository.listArticles());

  assert.equal(updated?.bookmarked, true);
  assert.equal(updated?.read, true);
  assert.equal(updated?.internalNotes.length, 1);
  assert.ok(summary.bookmarked >= 1);
});

test("refresh isolates failing sources and keeps successful article ingestion", async () => {
  const storage = createMemoryStorage();
  const repository = createNewsRepository(storage);
  const customSources = [
    {
      ...seedNewsSources[0],
      id: "source-demo-defence-briefs",
      name: "Manual Demo",
      type: "manual",
      url: "manual://demo-defence-briefs",
      enabled: true,
    },
    {
      ...seedNewsSources[3],
      id: "rss-source",
      name: "Broken RSS",
      enabled: true,
      url: "https://example.com/rss.xml",
    },
  ];
  repository.saveSources(customSources);

  const result = await refreshNewsSources(repository, { force: true }, {
    fetchText: async () => {
      throw new Error("CORS blocked");
    },
    now: () => "2026-05-20T09:00:00.000Z",
  });

  assert.equal(result.sourceResults.length, 2);
  assert.equal(result.sourceResults[0]?.status, "success");
  assert.equal(result.sourceResults[1]?.status, "failed");
  assert.ok(repository.listArticles().length > 0);
});

test("API validation rejects invalid source payloads", async () => {
  const storage = createMemoryStorage();
  installTestWindow(storage);

  const response = await handleNewsApiRequest("http://localhost/api/news/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  assert.equal(response?.status, 400);
  const payload = await response?.json();
  assert.equal(payload?.error, "Invalid source payload");
});
