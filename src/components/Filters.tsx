import { Search } from "lucide-react";
import type { TaskFilters, User } from "../types";
import { priorityOptions, statusOptions } from "../utils/tasks";

type FiltersProps = {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  users: User[];
};

export function Filters({ filters, onChange, users }: FiltersProps) {
  return (
    <section className="filters" aria-label="Task filters">
      <label className="search-field">
        <Search size={18} />
        <input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Search title or description"
        />
      </label>

      <select
        value={filters.assigneeId}
        onChange={(event) => onChange({ ...filters, assigneeId: event.target.value })}
        aria-label="Task filter assignee"
      >
        <option value="">All assignees</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value })}
        aria-label="Task filter status"
      >
        <option value="">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(event) => onChange({ ...filters, priority: event.target.value })}
        aria-label="Task filter priority"
      >
        <option value="">All priorities</option>
        {priorityOptions.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>
    </section>
  );
}
