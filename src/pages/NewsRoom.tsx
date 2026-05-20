import { LoaderCircle, RefreshCw, Rss, SatelliteDish } from "lucide-react";
import { useMemo, useState } from "react";
import { NewsFeed } from "../components/NewsFeed";
import { NewsFilters } from "../components/NewsFilters";
import { NewsSummary } from "../components/NewsSummary";
import { useNews } from "../hooks/useNews";
import { defaultNewsFilters, filterNewsArticles } from "../news/filters";
import { summarizeNews } from "../news/scoring";
import type { NewsSourceInput } from "../news/types";

const defaultSourceInput: NewsSourceInput = {
  name: "",
  type: "rss",
  url: "",
  category: "industry",
  enabled: true,
  refreshFrequency: "daily",
  trustLevel: "watch",
  notes: "",
};

export function NewsRoom() {
  const { articles, sources, loading, refreshResult, refreshError, refreshNews, toggleBookmark, toggleRead, addNote, addSource, toggleSource } =
    useNews();
  const [filters, setFilters] = useState(() => defaultNewsFilters());
  const [draftSource, setDraftSource] = useState(defaultSourceInput);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceError, setSourceError] = useState("");

  const filteredArticles = useMemo(() => filterNewsArticles(articles, filters), [articles, filters]);
  const summary = useMemo(() => summarizeNews(articles), [articles]);
  const topics = useMemo(() => [...new Set(articles.flatMap((article) => article.tags))].sort(), [articles]);
  const companies = useMemo(
    () => [...new Set(articles.flatMap((article) => article.companiesMentioned))].sort(),
    [articles],
  );
  const regions = useMemo(
    () => [...new Set(articles.flatMap((article) => article.regionsMentioned))].sort(),
    [articles],
  );

  async function handleSourceSubmit() {
    setSourceError("");

    if (!draftSource.name.trim() || !draftSource.url.trim()) {
      setSourceError("Source name and URL are required.");
      return;
    }

    try {
      await addSource(draftSource);
      setDraftSource(defaultSourceInput);
      setShowSourceForm(false);
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : "Unable to add source");
    }
  }

  const failedSources = refreshResult?.sourceResults.filter((result) => result.status === "failed") ?? [];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Internal sales intelligence</p>
          <h2>News Room</h2>
          <span>
            Curated external coverage for Delatr sales timing, partnerships, investor context, and defence-market signals.
          </span>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={() => setShowSourceForm((current) => !current)} type="button">
            <Rss size={16} />
            {showSourceForm ? "Hide sources" : "Manage sources"}
          </button>
          <button className="primary-button" disabled={loading} onClick={() => void refreshNews()} type="button">
            {loading ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
            Refresh feed
          </button>
        </div>
      </header>

      <NewsSummary summary={summary} />

      {refreshError ? <section className="panel news-status-banner error-banner">{refreshError}</section> : null}
      {failedSources.length > 0 ? (
        <section className="panel news-status-banner warning-banner">
          {failedSources.length} source{failedSources.length === 1 ? "" : "s"} failed during the last refresh. Remaining sources still updated.
        </section>
      ) : null}

      <NewsFilters
        companies={companies}
        filters={filters}
        onChange={setFilters}
        regions={regions}
        sources={sources}
        topics={topics}
      />

      <section className="split-grid newsroom-grid">
        <div className="news-main-column">
          <section className="panel panel-heading-inline">
            <div className="panel-heading">
              <h3>Ranked Feed</h3>
              <span>{filteredArticles.length} articles in view</span>
            </div>
          </section>

          <NewsFeed
            articles={filteredArticles}
            onAddNote={addNote}
            onToggleBookmark={toggleBookmark}
            onToggleRead={toggleRead}
          />
        </div>

        <aside className="news-side-column">
          <section className="panel">
            <div className="panel-heading">
              <h3>Configured Sources</h3>
              <SatelliteDish size={18} />
            </div>

            <div className="source-list">
              {sources.map((source) => (
                <article className="source-item" key={source.id}>
                  <div>
                    <strong>{source.name}</strong>
                    <span>
                      {source.type.toUpperCase()} · {source.category} · {source.trustLevel}
                    </span>
                    <span>{source.notes || "No internal notes"}</span>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => void toggleSource(source.id, !source.enabled)}
                    type="button"
                  >
                    {source.enabled ? "Disable" : "Enable"}
                  </button>
                </article>
              ))}
            </div>

            {showSourceForm ? (
              <div className="source-form">
                <label>
                  <span>Name</span>
                  <input
                    value={draftSource.name}
                    onChange={(event) => setDraftSource({ ...draftSource, name: event.target.value })}
                  />
                </label>

                <label>
                  <span>URL</span>
                  <input
                    value={draftSource.url}
                    onChange={(event) => setDraftSource({ ...draftSource, url: event.target.value })}
                    placeholder="https://example.com/feed.xml"
                  />
                </label>

                <label>
                  <span>Type</span>
                  <select
                    value={draftSource.type}
                    onChange={(event) =>
                      setDraftSource({ ...draftSource, type: event.target.value as NewsSourceInput["type"] })
                    }
                  >
                    <option value="rss">RSS</option>
                    <option value="api">API</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>

                <label>
                  <span>Category</span>
                  <select
                    value={draftSource.category}
                    onChange={(event) =>
                      setDraftSource({
                        ...draftSource,
                        category: event.target.value as NewsSourceInput["category"],
                      })
                    }
                  >
                    <option value="defence-tech">Defence tech</option>
                    <option value="procurement">Procurement</option>
                    <option value="quantum-security">Quantum security</option>
                    <option value="geopolitics">Geopolitics</option>
                    <option value="alliances">Alliances</option>
                    <option value="industry">Industry</option>
                  </select>
                </label>

                <label>
                  <span>Refresh</span>
                  <select
                    value={draftSource.refreshFrequency}
                    onChange={(event) =>
                      setDraftSource({
                        ...draftSource,
                        refreshFrequency: event.target.value as NewsSourceInput["refreshFrequency"],
                      })
                    }
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>

                <label>
                  <span>Trust</span>
                  <select
                    value={draftSource.trustLevel}
                    onChange={(event) =>
                      setDraftSource({
                        ...draftSource,
                        trustLevel: event.target.value as NewsSourceInput["trustLevel"],
                      })
                    }
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="watch">Watch</option>
                  </select>
                </label>

                <label>
                  <span>Internal notes</span>
                  <textarea
                    value={draftSource.notes}
                    onChange={(event) => setDraftSource({ ...draftSource, notes: event.target.value })}
                    placeholder="Feed purpose, restrictions, or qualification notes"
                  />
                </label>

                {sourceError ? <p className="form-error">{sourceError}</p> : null}

                <div className="source-form-actions">
                  <button className="secondary-button" onClick={() => setShowSourceForm(false)} type="button">
                    Cancel
                  </button>
                  <button className="primary-button" onClick={() => void handleSourceSubmit()} type="button">
                    Add source
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h3>Refresh Notes</h3>
              <RefreshCw size={18} />
            </div>

            <div className="activity-list">
              <div className="activity-item">
                <strong>Local-first persistence</strong>
                <span>Article metadata, notes, saved state, and read state are stored locally for this Forge install.</span>
              </div>
              <div className="activity-item">
                <strong>Graceful source failures</strong>
                <span>Each source refresh is isolated so one failing feed does not block the rest of the intelligence feed.</span>
              </div>
              <div className="activity-item">
                <strong>Limited content policy</strong>
                <span>Newsroom stores titles, summaries, links, and Delatr notes rather than full copyrighted article bodies.</span>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
