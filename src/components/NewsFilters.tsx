import { Search } from "lucide-react";
import { newsViews } from "../news/filters";
import type { NewsFilters as NewsFiltersType, NewsSource } from "../news/types";

type NewsFiltersProps = {
  filters: NewsFiltersType;
  topics: string[];
  companies: string[];
  regions: string[];
  sources: NewsSource[];
  onChange: (filters: NewsFiltersType) => void;
};

export function NewsFilters({ filters, topics, companies, regions, sources, onChange }: NewsFiltersProps) {
  return (
    <>
      <section className="news-view-tabs" aria-label="Newsroom views">
        {newsViews.map((view) => (
          <button
            className={`news-view-tab ${filters.view === view.key ? "active" : ""}`.trim()}
            key={view.key}
            onClick={() => onChange({ ...filters, view: view.key })}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </section>

      <section className="filters news-filters" aria-label="News filters">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Search title, summary, tags, or Delatr angles"
          />
        </label>

        <select value={filters.topic} onChange={(event) => onChange({ ...filters, topic: event.target.value })}>
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        <select value={filters.company} onChange={(event) => onChange({ ...filters, company: event.target.value })}>
          <option value="">All companies</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>

        <select value={filters.region} onChange={(event) => onChange({ ...filters, region: event.target.value })}>
          <option value="">All regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <select value={filters.sourceId} onChange={(event) => onChange({ ...filters, sourceId: event.target.value })}>
          <option value="">All sources</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>

        <select
          value={filters.minRelevance}
          onChange={(event) => onChange({ ...filters, minRelevance: event.target.value })}
        >
          <option value="">Any relevance</option>
          <option value="40">40+</option>
          <option value="60">60+</option>
          <option value="75">75+</option>
          <option value="90">90+</option>
        </select>

        <select
          value={filters.readStatus}
          onChange={(event) =>
            onChange({ ...filters, readStatus: event.target.value as NewsFiltersType["readStatus"] })
          }
        >
          <option value="">Read and unread</option>
          <option value="unread">Unread only</option>
          <option value="read">Read only</option>
        </select>

        <label className="toggle-chip">
          <input
            checked={filters.bookmarkedOnly}
            onChange={(event) => onChange({ ...filters, bookmarkedOnly: event.target.checked })}
            type="checkbox"
          />
          Bookmarked only
        </label>

        <label className="date-filter">
          <span>From</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
          />
        </label>

        <label className="date-filter">
          <span>To</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
          />
        </label>
      </section>
    </>
  );
}
