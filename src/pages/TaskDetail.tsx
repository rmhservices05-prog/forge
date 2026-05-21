import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { TaskForm } from "../components/TaskForm";
import { useOrganization } from "../hooks/useOrganization";
import { useTasks } from "../hooks/useTasks";
import { formatDate, formatDateTime, isTaskOverdue } from "../utils/date";

export function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { users, getUserById } = useOrganization();
  const { tasks, activity, loading, error, updateTask, deleteTask } = useTasks();
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (loading) {
    return (
      <div className="centered-state">
        <h2>Loading task...</h2>
        <p>Pulling the latest task details from Supabase.</p>
      </div>
    );
  }

  if (!task) {
    return <Navigate to="/tasks" replace />;
  }

  const currentTask = task;
  const assignee = getUserById(currentTask.assigneeId);
  const taskActivity = activity.filter((event) => event.taskId === currentTask.id);
  const overdue = isTaskOverdue(currentTask);

  function handleDelete() {
    if (window.confirm(`Delete "${currentTask.title}"? This cannot be undone.`)) {
      void deleteTask(currentTask.id).then(() => {
        navigate("/tasks");
      });
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Link className="back-link" to="/tasks">
            <ArrowLeft size={16} />
            Back to tasks
          </Link>
          <h2>{currentTask.title}</h2>
          <span>{currentTask.description}</span>
        </div>
        <button className="secondary-button danger-button" onClick={handleDelete}>
          <Trash2 size={17} />
          Delete
        </button>
      </header>

      {error ? <div className="inline-alert error">{error}</div> : null}

      <section className="detail-grid">
        <article className="panel">
          <div className="panel-heading">
            <h3>Task Detail</h3>
            <div className="badge-row">
              <StatusBadge status={currentTask.status} />
              <PriorityBadge priority={currentTask.priority} />
              {overdue ? <span className="badge overdue-badge">Overdue</span> : null}
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Assignee</dt>
              <dd>{assignee?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd className={overdue ? "overdue-text" : undefined}>{formatDate(currentTask.dueDate)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(currentTask.createdAt)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDateTime(currentTask.updatedAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Edit Task</h3>
          </div>
          <TaskForm
            initialTask={currentTask}
            submitLabel="Update task"
            users={users}
            onSubmit={(input) => {
              void updateTask(currentTask.id, input);
            }}
          />
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Activity and Audit Trail</h3>
        </div>
        <div className="activity-list">
          {taskActivity.length ? (
            taskActivity.map((event) => {
              const actor = getUserById(event.actorId);

              return (
                <div className="activity-item" key={event.id}>
                  <strong>{event.action}</strong>
                  <span>{actor?.name ?? "System"} · {formatDateTime(event.createdAt)}</span>
                </div>
              );
            })
          ) : (
            <div className="empty-state compact-empty">
              <h2>No activity recorded yet</h2>
              <p>Future comments, approval history, and audit logs will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
