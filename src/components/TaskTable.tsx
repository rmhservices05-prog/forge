import { Check, ChevronDown, MessageSquare, Trash2, X } from "lucide-react";
import { Fragment } from "react";
import { useState } from "react";
import type { Task, TaskInput, TaskStatus, User } from "../types";
import { isTaskOverdue } from "../utils/date";
import { statusOptions } from "../utils/tasks";

type TaskTableProps = {
  users: User[];
  draftTask: TaskInput | null;
  hasProgressColumn: boolean;
  tasks: Task[];
  commentCountByTaskId: Record<string, number>;
  progressByTaskId: Record<string, { total: number; completed: number }>;
  onCancelDraft: () => void;
  onCreateDraft: () => void;
  onDraftChange: (task: TaskInput) => void;
  onDueDateChange: (task: Task, dueDate: string) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onAssigneeChange: (task: Task, assigneeId: string) => void;
  onOpenTask: (task: Task) => void;
  onOpenComments: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskTable({
  users,
  draftTask,
  hasProgressColumn,
  tasks,
  commentCountByTaskId,
  progressByTaskId,
  onCancelDraft,
  onCreateDraft,
  onDraftChange,
  onDueDateChange,
  onStatusChange,
  onAssigneeChange,
  onOpenTask,
  onOpenComments,
  onDelete,
}: TaskTableProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(null);
  const getUserById = (userId: string) => users.find((user) => user.id === userId);

  if (!tasks.length && !draftTask) {
    return (
      <section className="empty-state">
        <h2>No tasks match this view</h2>
        <p>Create a new task or adjust the filters to bring work back into focus.</p>
      </section>
    );
  }

  const groupedTasks = statusOptions
    .map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status),
    }))
    .filter((group) => group.tasks.length > 0);

  return (
    <div className="table-shell">
      <table className="task-table">
        <thead>
          <tr>
            <th>Task name</th>
            <th>Assignee</th>
            <th>Due date</th>
            {hasProgressColumn ? <th>Progress</th> : null}
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {draftTask ? (
            <tr className="task-draft-row">
              <td>
                <div className="task-name-cell">
                  <span className="completion-circle" aria-hidden="true" />
                  <div className="task-draft-title-wrap">
                    <input
                      autoFocus
                      className="task-draft-input"
                      onChange={(event) => onDraftChange({ ...draftTask, title: event.target.value })}
                      placeholder="Task name"
                      value={draftTask.title}
                    />
                  </div>
                </div>
              </td>
              <td>
                <div className="assignee-cell">
                  <span className="avatar avatar-blue">{initials(users.find((user) => user.id === draftTask.assigneeId)?.name ?? "Unassigned")}</span>
                  <select
                    className="assignee-select"
                    onChange={(event) => onDraftChange({ ...draftTask, assigneeId: event.target.value })}
                    value={draftTask.assigneeId}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td>
                <input
                  className="task-draft-date"
                  onChange={(event) => onDraftChange({ ...draftTask, dueDate: event.target.value })}
                  type="date"
                  value={draftTask.dueDate}
                />
              </td>
              {hasProgressColumn ? (
                <td>
                  <span className="task-progress-empty">-</span>
                </td>
              ) : null}
              <td>
                <select
                  className={`status-pill-select ${statusClassName(draftTask.status)}`}
                  onChange={(event) => onDraftChange({ ...draftTask, status: event.target.value as Task["status"] })}
                  value={draftTask.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="row-actions">
                <button className="plus-cell draft-action-button" onClick={onCreateDraft} type="button">
                  <Check size={16} />
                </button>
                <button className="icon-button draft-action-button" onClick={onCancelDraft} type="button">
                  <X size={16} />
                </button>
              </td>
            </tr>
          ) : null}
          {groupedTasks.map((group) => (
            <Fragment key={group.status}>
              <tr className="section-row">
                <td
                  colSpan={hasProgressColumn ? 6 : 5}
                  className={dropTargetStatus === group.status ? "section-drop-target" : undefined}
                  onDragEnter={() => setDropTargetStatus(group.status)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropTargetStatus(group.status);
                  }}
                  onDragLeave={() => {
                    if (dropTargetStatus === group.status) {
                      setDropTargetStatus(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();

                    const droppedTaskId = event.dataTransfer.getData("text/task-id");
                    if (!droppedTaskId) {
                      setDropTargetStatus(null);
                      return;
                    }

                    const droppedTask = tasks.find((candidate) => candidate.id === droppedTaskId);
                    if (droppedTask && droppedTask.status !== group.status) {
                      onStatusChange(droppedTask, group.status);
                    }

                    setDraggedTaskId(null);
                    setDropTargetStatus(null);
                  }}
                >
                  <ChevronDown size={16} />
                  <strong>{sectionLabel(group.status)}</strong>
                  <span>{group.tasks.length}</span>
                </td>
              </tr>

              {group.tasks.map((task) => {
                const assignee = getUserById(task.assigneeId);
                const overdue = isTaskOverdue(task);
                const commentCount = commentCountByTaskId[task.id] ?? 0;
                const progress = progressByTaskId[task.id];
                const progressPercent = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

                return (
                  <tr
                    key={task.id}
                    className={`${overdue ? "overdue-row" : ""} ${task.status === "Done" ? "task-done-row" : ""}`.trim()}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/task-id", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedTaskId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDropTargetStatus(null);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    data-dragging={draggedTaskId === task.id}
                  >
                    <td>
                      <div className="task-name-cell">
                        <button
                          className={`completion-circle ${task.status === "Done" ? "complete" : ""}`}
                          aria-label={
                            task.status === "Done"
                              ? `Mark ${task.title} as to do`
                              : `Mark ${task.title} as done`
                          }
                          onClick={() => {
                            onStatusChange(task, task.status === "Done" ? "To Do" : "Done");
                          }}
                          type="button"
                        />
                        <div>
                          <button className="task-title-link task-open-button" onClick={() => onOpenTask(task)} type="button">
                            {task.title}
                          </button>
                          <div className="task-row-meta">
                            <button
                              className="task-meta-button"
                              onClick={() => onOpenComments(task)}
                              type="button"
                            >
                              <MessageSquare size={13} />
                              {commentCount}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="assignee-cell">
                        <span className="avatar avatar-blue">{initials(assignee?.name ?? "Unassigned")}</span>
                        <select
                          className="assignee-select"
                          value={task.assigneeId}
                          onChange={(event) => onAssigneeChange(task, event.target.value)}
                          aria-label={`Assign ${task.title}`}
                        >
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <input
                        className={`table-date-input ${overdue ? "overdue-text" : ""}`.trim()}
                        onChange={(event) => onDueDateChange(task, event.target.value)}
                        type="date"
                        value={task.dueDate}
                      />
                    </td>
                    {hasProgressColumn ? (
                      <td>
                        {progress ? (
                          <div className="task-progress-cell">
                            <div
                              aria-hidden="true"
                              className="task-progress-bar"
                            >
                              <div
                                className="task-progress-fill"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="task-progress-label">
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                        ) : null}
                      </td>
                    ) : null}
                    <td>
                      <select
                        className={`status-pill-select ${statusClassName(task.status)}`}
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
                    </td>
                    <td className="row-actions">
                      <button className="icon-button danger-button" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sectionLabel(status: TaskStatus): string {
  if (status === "To Do") {
    return "To do";
  }

  if (status === "In Progress") {
    return "In progress";
  }

  return status;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusClassName(status: TaskStatus): string {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}
