import type { TaskPriority } from "../types";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`badge priority-${priority.toLowerCase()}`}>
      {priority}
    </span>
  );
}
