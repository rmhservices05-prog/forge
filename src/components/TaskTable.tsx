import { ArrowUpRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getUserById } from "../data/users";
import type { Task } from "../types";
import { formatDate, formatDateTime, isTaskOverdue } from "../utils/date";
import { statusOptions } from "../utils/tasks";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

type TaskTableProps = {
  tasks: Task[];
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onDelete: (task: Task) => void;
};

export function TaskTable({ tasks, onStatusChange, onDelete }: TaskTableProps) {
  if (!tasks.length) {
    return (
      <section className="empty-state">
        <h2>No tasks match this view</h2>
        <p>Create a new task or adjust the filters to bring work back into focus.</p>
      </section>
    );
  }

  return (
    <div className="table-shell">
      <table className="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Assignee</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Updated</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const assignee = getUserById(task.assigneeId);
            const overdue = isTaskOverdue(task);

            return (
              <tr key={task.id} className={overdue ? "overdue-row" : undefined}>
                <td>
                  <Link to={`/tasks/${task.id}`} className="task-title-link">
                    {task.title}
                  </Link>
                  <p>{task.description}</p>
                  <span>Created {formatDate(task.createdAt)}</span>
                </td>
                <td>{assignee?.name ?? "Unassigned"}</td>
                <td>
                  <div className="status-control">
                    <StatusBadge status={task.status} />
                    <select
                      value={task.status}
                      onChange={(event) => onStatusChange(task, event.target.value as Task["status"])}
                      aria-label={`Update status for ${task.title}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td>
                  <span className={overdue ? "overdue-text" : undefined}>{formatDate(task.dueDate)}</span>
                </td>
                <td>{formatDateTime(task.updatedAt)}</td>
                <td className="row-actions">
                  <Link className="icon-button" to={`/tasks/${task.id}`} aria-label={`Open ${task.title}`}>
                    <ArrowUpRight size={17} />
                  </Link>
                  <button className="icon-button danger-button" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>
                    <Trash2 size={17} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
