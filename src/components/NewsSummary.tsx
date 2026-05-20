import { Bookmark, BriefcaseBusiness, Flame, MailOpen, Newspaper } from "lucide-react";
import type { NewsSummary as NewsSummaryType } from "../news/types";

const summaryConfig = [
  { key: "newToday", label: "New articles today", icon: Newspaper },
  { key: "highRelevance", label: "High relevance", icon: Flame },
  { key: "bookmarked", label: "Bookmarked", icon: Bookmark },
  { key: "unread", label: "Unread", icon: MailOpen },
  { key: "salesOpportunities", label: "Sales opportunities", icon: BriefcaseBusiness },
] as const;

type NewsSummaryProps = {
  summary: NewsSummaryType;
};

export function NewsSummary({ summary }: NewsSummaryProps) {
  return (
    <section className="summary-grid" aria-label="Newsroom summary">
      {summaryConfig.map((item) => {
        const Icon = item.icon;

        return (
          <article className="summary-card" key={item.key}>
            <div>
              <p>{item.label}</p>
              <strong>{summary[item.key]}</strong>
            </div>
            <span className="summary-icon">
              <Icon size={18} />
            </span>
          </article>
        );
      })}
    </section>
  );
}
