import { Bookmark, BookmarkCheck, ExternalLink, Eye, EyeOff, MessageSquarePlus } from "lucide-react";
import { useMemo, useState } from "react";
import type { NewsArticle } from "../news/types";
import { formatDateTime } from "../utils/date";

type NewsFeedProps = {
  articles: NewsArticle[];
  onToggleBookmark: (articleId: string, bookmarked: boolean) => Promise<void>;
  onToggleRead: (articleId: string, read: boolean) => Promise<void>;
  onAddNote: (articleId: string, body: string) => Promise<void>;
};

export function NewsFeed({ articles, onToggleBookmark, onToggleRead, onAddNote }: NewsFeedProps) {
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [openNoteEditorId, setOpenNoteEditorId] = useState<string | null>(null);
  const [pendingArticleId, setPendingArticleId] = useState<string | null>(null);
  const noteCountLabel = useMemo(
    () =>
      articles.reduce<Record<string, string>>((counts, article) => {
        counts[article.id] = `${article.internalNotes.length} note${article.internalNotes.length === 1 ? "" : "s"}`;
        return counts;
      }, {}),
    [articles],
  );

  if (!articles.length) {
    return (
      <section className="empty-state">
        <h2>No articles match this view</h2>
        <p>Adjust the filters or refresh enabled sources to rebuild the feed.</p>
      </section>
    );
  }

  return (
    <section className="news-feed" aria-label="Curated newsroom feed">
      {articles.map((article) => (
        <article className={`news-card ${article.read ? "news-card-read" : ""}`.trim()} key={article.id}>
          <div className="news-card-top">
            <div>
              <div className="news-card-meta">
                <span>{article.sourceName}</span>
                <span>{formatDateTime(article.publishedAt)}</span>
                <span>Score {article.relevanceScore}</span>
              </div>
              <h3>{article.title}</h3>
            </div>

            <div className="news-card-actions">
              <button
                className="secondary-button"
                disabled={pendingArticleId === article.id}
                onClick={async () => {
                  setPendingArticleId(article.id);
                  await onToggleBookmark(article.id, !article.bookmarked);
                  setPendingArticleId(null);
                }}
                type="button"
              >
                {article.bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {article.bookmarked ? "Saved" : "Save"}
              </button>

              <button
                className="secondary-button"
                disabled={pendingArticleId === article.id}
                onClick={async () => {
                  setPendingArticleId(article.id);
                  await onToggleRead(article.id, !article.read);
                  setPendingArticleId(null);
                }}
                type="button"
              >
                {article.read ? <EyeOff size={16} /> : <Eye size={16} />}
                {article.read ? "Mark unread" : "Mark read"}
              </button>

              <a className="primary-button" href={article.url} rel="noreferrer" target="_blank">
                Open source
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <p className="news-summary">{article.summary || "Limited article data available."}</p>

          <div className="news-tag-row">
            {article.tags.map((tag) => (
              <span className="badge news-tag" key={tag}>
                {tag}
              </span>
            ))}
            {article.salesSignals.map((signal) => (
              <span className="badge opportunity-badge" key={signal}>
                {signal}
              </span>
            ))}
          </div>

          <div className="news-insight-grid">
            <div className="news-insight-card">
              <strong>Why this matters</strong>
              <p>{article.whyThisMatters}</p>
            </div>
            <div className="news-insight-card">
              <strong>Possible Delatr angle</strong>
              <p>{article.possibleDelatrAngle}</p>
            </div>
            <div className="news-insight-card">
              <strong>Suggested action</strong>
              <p>{article.suggestedAction}</p>
            </div>
          </div>

          <div className="news-footer-row">
            <div className="news-card-supporting">
              <span>{article.companiesMentioned.join(", ") || "No tracked company detected"}</span>
              <span>{article.regionsMentioned.join(", ") || "No region detected"}</span>
              <span>{noteCountLabel[article.id]}</span>
            </div>

            <button
              className="icon-button"
              onClick={() => setOpenNoteEditorId((current) => (current === article.id ? null : article.id))}
              type="button"
            >
              <MessageSquarePlus size={16} />
            </button>
          </div>

          {openNoteEditorId === article.id ? (
            <div className="note-editor">
              <textarea
                placeholder="Add internal note for Delatr follow-up"
                value={noteDrafts[article.id] ?? ""}
                onChange={(event) =>
                  setNoteDrafts((current) => ({
                    ...current,
                    [article.id]: event.target.value,
                  }))
                }
              />
              <div className="note-editor-actions">
                <button
                  className="secondary-button"
                  onClick={() => setOpenNoteEditorId(null)}
                  type="button"
                >
                  Close
                </button>
                <button
                  className="primary-button"
                  disabled={!noteDrafts[article.id]?.trim()}
                  onClick={async () => {
                    setPendingArticleId(article.id);
                    await onAddNote(article.id, noteDrafts[article.id] ?? "");
                    setNoteDrafts((current) => ({ ...current, [article.id]: "" }));
                    setOpenNoteEditorId(null);
                    setPendingArticleId(null);
                  }}
                  type="button"
                >
                  Save note
                </button>
              </div>
            </div>
          ) : null}

          {article.internalNotes.length > 0 ? (
            <div className="note-list">
              {article.internalNotes.map((note) => (
                <div className="note-item" key={note.id}>
                  <strong>Internal note</strong>
                  <p>{note.body}</p>
                  <span>{formatDateTime(note.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
