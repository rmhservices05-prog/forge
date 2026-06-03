import type { OutreachStatus } from "../types/partner";

export type PartnerSummaryStat = {
  label: string;
  value: string;
};

type PartnerSummaryBarProps = {
  total: number;
  statusCounts: Array<{ status: OutreachStatus; label: string; count: number }>;
};

export function PartnerSummaryBar({ total, statusCounts }: PartnerSummaryBarProps) {
  const stats: PartnerSummaryStat[] = [
    { label: "Total Partners", value: total.toString() },
    ...statusCounts.filter((stat) => stat.count > 0).map((stat) => ({ label: stat.label, value: stat.count.toString() })),
  ];

  return (
    <div className="summary-grid partner-summary-bar" aria-label="Partner summary">
      {stats.map((stat) => (
        <article className="summary-card partner-summary-card" key={stat.label}>
          <p>{stat.label}</p>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </div>
  );
}
