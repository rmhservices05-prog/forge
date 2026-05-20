import { AlertTriangle, CheckCircle2, CircleDot, ClipboardList, Timer } from "lucide-react";
import type { Task } from "../types";
import { taskSummary } from "../utils/tasks";

export function DashboardSummary({ tasks }: { tasks: Task[] }) {
  const summary = taskSummary(tasks);
  const cards = [
    { label: "Total tasks", value: summary.total, icon: ClipboardList },
    { label: "Open tasks", value: summary.open, icon: CircleDot },
    { label: "In progress", value: summary.inProgress, icon: Timer },
    { label: "Completed", value: summary.completed, icon: CheckCircle2 },
    { label: "Overdue", value: summary.overdue, icon: AlertTriangle, danger: summary.overdue > 0 },
  ];

  return (
    <section className="summary-grid" aria-label="Task summary">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article className={`summary-card ${card.danger ? "summary-card-danger" : ""}`} key={card.label}>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </div>
            <Icon size={22} />
          </article>
        );
      })}
    </section>
  );
}
