import { Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardSummary } from "../components/DashboardSummary";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { useOrganization } from "../hooks/useOrganization";
import { useTasks } from "../hooks/useTasks";
import { formatDate, formatDateTime, isTaskOverdue } from "../utils/date";

export function Dashboard() {
  const { getUserById, organization } = useOrganization();
  const { tasks, activity } = useTasks();
  const recentTasks = [...tasks]
    .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Forge command center</p>
          <h2>Task Operations Dashboard</h2>
          <span>{organization?.name ?? "Forge Internal"} shared workspace</span>
        </div>
        <Link className="primary-button" to="/tasks">
          Open tasks
          <ArrowRight size={17} />
        </Link>
      </header>

      <DashboardSummary tasks={tasks} />

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <h3>Recently Updated</h3>
            <Link to="/tasks">View all</Link>
          </div>

          <div className="recent-list">
            {recentTasks.map((task) => {
              const assignee = getUserById(task.assigneeId);

              return (
                <Link className="recent-task" to={`/tasks/${task.id}`} key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{assignee?.name ?? "Unassigned"} · Due {formatDate(task.dueDate)}</span>
                  </div>
                  <div className="badge-row">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {isTaskOverdue(task) ? <span className="badge overdue-badge">Overdue</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Activity</h3>
            <Activity size={18} />
          </div>

          <div className="activity-list">
            {activity.slice(0, 5).map((event) => {
              const actor = getUserById(event.actorId);
              const task = tasks.find((candidate) => candidate.id === event.taskId);

              return (
                <div className="activity-item" key={event.id}>
                  <strong>{event.action}</strong>
                  <span>
                    {actor?.name ?? "System"} · {task?.title ?? "Deleted task"} · {formatDateTime(event.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
