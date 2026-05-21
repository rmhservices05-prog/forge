import { ChevronDown, MoreHorizontal, Plus, X } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Filters } from "../components/Filters";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { TaskForm } from "../components/TaskForm";
import { TaskTable } from "../components/TaskTable";
import { taskWorkspaceRepository } from "../data/taskWorkspaceRepository";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";
import { useTasks } from "../hooks/useTasks";
import type { Task, TaskComment, TaskFilters, TaskInput, TaskSubtask } from "../types";
import { formatDate, formatDateTime, isTaskOverdue } from "../utils/date";
import { filterTasks } from "../utils/tasks";

const defaultFilters: TaskFilters = {
  assigneeId: "",
  status: "",
  priority: "",
  query: "",
};

type TaskProgressSummary = {
  total: number;
  completed: number;
};

export function Tasks() {
  const { profile, user } = useAuth();
  const { users, getUserById } = useOrganization();
  const { tasks, activity, loading, error, createTask, updateTask, updateTaskStatus, deleteTask } = useTasks();
  const defaultDraftTask: TaskInput = {
    title: "",
    description: "",
    assigneeId: users[0]?.id ?? user?.id ?? "",
    status: "To Do",
    priority: "Medium",
    dueDate: new Date().toISOString().slice(0, 10),
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [draftTask, setDraftTask] = useState<TaskInput | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [projectIcon, setProjectIcon] = useState("");
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [focusCommentsForTaskId, setFocusCommentsForTaskId] = useState<string | null>(null);
  const commentsSectionRef = useRef<HTMLElement | null>(null);
  const projectIconInputRef = useRef<HTMLInputElement | null>(null);
  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [filters, tasks]);
  const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) : undefined;
  const selectedTaskSubtasks = selectedTask ? subtasks.filter((item) => item.taskId === selectedTask.id) : [];
  const selectedTaskComments = selectedTask ? comments.filter((item) => item.taskId === selectedTask.id) : [];
  const progressByTaskId = useMemo(
    () =>
      subtasks.reduce<Record<string, TaskProgressSummary>>((accumulator, item) => {
        const current = accumulator[item.taskId] ?? { total: 0, completed: 0 };
        current.total += 1;
        if (item.completed) {
          current.completed += 1;
        }
        accumulator[item.taskId] = current;
        return accumulator;
      }, {}),
    [subtasks],
  );
  const commentCountByTaskId = useMemo(
    () =>
      comments.reduce<Record<string, number>>((counts, comment) => {
        counts[comment.taskId] = (counts[comment.taskId] ?? 0) + 1;
        return counts;
      }, {}),
    [comments],
  );

  useEffect(() => {
    if (!profile) {
      setSubtasks([]);
      setComments([]);
      setProjectIcon("");
      setWorkspaceLoading(false);
      setWorkspaceError("");
      return;
    }

    let isMounted = true;
    setWorkspaceLoading(true);
    setWorkspaceError("");

    void Promise.all([
      taskWorkspaceRepository.listSubtasks(profile.organizationId),
      taskWorkspaceRepository.listComments(profile.organizationId),
      taskWorkspaceRepository.getProjectIcon(profile.organizationId),
    ])
      .then(([nextSubtasks, nextComments, nextProjectIcon]) => {
        if (!isMounted) {
          return;
        }

        setSubtasks(nextSubtasks);
        setComments(nextComments);
        setProjectIcon(nextProjectIcon);
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        setWorkspaceError(loadError instanceof Error ? loadError.message : "Unable to load task workspace");
      })
      .finally(() => {
        if (isMounted) {
          setWorkspaceLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile]);

  useEffect(() => {
    if (selectedTaskId !== focusCommentsForTaskId || !commentsSectionRef.current) {
      return;
    }

    commentsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    setFocusCommentsForTaskId(null);
  }, [focusCommentsForTaskId, selectedTaskId]);

  async function handleProjectIconChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !profile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextIcon = typeof reader.result === "string" ? reader.result : "";
      setProjectIcon(nextIcon);
      void taskWorkspaceRepository.setProjectIcon(profile.organizationId, nextIcon).catch((saveError) => {
        setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to save project icon");
      });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function addSubtask(taskId: string) {
    const trimmedDraft = subtaskDraft.trim();
    if (!trimmedDraft || !profile) {
      return;
    }

    try {
      const nextSubtask = await taskWorkspaceRepository.addSubtask(profile.organizationId, taskId, trimmedDraft);
      setSubtasks((current) => [nextSubtask, ...current]);
      setSubtaskDraft("");
    } catch (saveError) {
      setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to add subtask");
    }
  }

  async function toggleSubtask(subtaskId: string) {
    if (!profile) {
      return;
    }

    const currentSubtask = subtasks.find((item) => item.id === subtaskId);
    if (!currentSubtask) {
      return;
    }

    const nextCompleted = !currentSubtask.completed;
    setSubtasks((current) =>
      current.map((item) => (item.id === subtaskId ? { ...item, completed: nextCompleted } : item)),
    );

    try {
      await taskWorkspaceRepository.toggleSubtask(profile.organizationId, subtaskId, nextCompleted);
    } catch (saveError) {
      setSubtasks((current) =>
        current.map((item) => (item.id === subtaskId ? { ...item, completed: currentSubtask.completed } : item)),
      );
      setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to update subtask");
    }
  }

  async function removeSubtask(subtaskId: string) {
    if (!profile) {
      return;
    }

    const previousSubtasks = subtasks;
    setSubtasks((current) => current.filter((item) => item.id !== subtaskId));

    try {
      await taskWorkspaceRepository.removeSubtask(profile.organizationId, subtaskId);
    } catch (saveError) {
      setSubtasks(previousSubtasks);
      setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to remove subtask");
    }
  }

  async function addComment(taskId: string) {
    const trimmedDraft = commentDraft.trim();
    if (!trimmedDraft || !profile) {
      return;
    }

    try {
      const nextComment = await taskWorkspaceRepository.addComment(profile.organizationId, taskId, trimmedDraft);
      setComments((current) => [nextComment, ...current]);
      setCommentDraft("");
    } catch (saveError) {
      setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to add comment");
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteTask(task.id);
      if (selectedTaskId === task.id) {
        setSelectedTaskId(null);
      }
      setSubtasks((current) => current.filter((item) => item.taskId !== task.id));
      setComments((current) => current.filter((item) => item.taskId !== task.id));
    } catch (deleteError) {
      setWorkspaceError(deleteError instanceof Error ? deleteError.message : "Unable to delete task");
    }
  }

  if (loading || workspaceLoading) {
    return (
      <div className="centered-state">
        <h2>Loading tasks...</h2>
        <p>Pulling your saved workspace from Supabase.</p>
      </div>
    );
  }

  return (
    <div className="asana-project">
      <header className="asana-project-header">
        <div className="project-title-group">
          <button
            className="project-icon project-icon-button"
            onClick={() => projectIconInputRef.current?.click()}
            type="button"
          >
            {projectIcon ? <img alt="Project icon" className="project-icon-image" src={projectIcon} /> : "F"}
          </button>
          <input
            accept="image/*"
            className="project-icon-input"
            onChange={(event) => void handleProjectIconChange(event)}
            ref={projectIconInputRef}
            type="file"
          />
          <div>
            <div className="project-title-row">
              <h2>Task Management</h2>
              <ChevronDown size={17} />
            </div>
          </div>
        </div>
      </header>

      {error ? <div className="inline-alert error">{error}</div> : null}
      {workspaceError ? <div className="inline-alert error">{workspaceError}</div> : null}

      <section className="list-toolbar">
        <div className="toolbar-left">
          <button
            className="add-task-button"
            onClick={() =>
              setDraftTask((current) => current ?? { ...defaultDraftTask, assigneeId: users[0]?.id ?? user?.id ?? "" })
            }
          >
            <Plus size={16} />
            Add task
          </button>
        </div>
        <button className="toolbar-icon-button" aria-label="More options">
          <MoreHorizontal size={18} />
        </button>
      </section>

      <Filters filters={filters} onChange={setFilters} users={users} />

      <TaskTable
        users={users}
        draftTask={draftTask}
        hasProgressColumn={visibleTasks.some((task) => Boolean(progressByTaskId[task.id]))}
        tasks={visibleTasks}
        commentCountByTaskId={commentCountByTaskId}
        progressByTaskId={progressByTaskId}
        onCancelDraft={() => setDraftTask(null)}
        onCreateDraft={() => {
          if (!draftTask || !draftTask.title.trim()) {
            return;
          }

          void createTask({
            ...draftTask,
            title: draftTask.title.trim(),
            description: draftTask.description.trim() || draftTask.title.trim(),
          })
            .then((nextTask) => {
              setDraftTask(null);
              setSelectedTaskId(nextTask.id);
            })
            .catch((saveError) => {
              setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to create task");
            });
        }}
        onDraftChange={(nextDraftTask) => setDraftTask(nextDraftTask)}
        onDueDateChange={(task, dueDate) => {
          void updateTask(task.id, {
            title: task.title,
            description: task.description,
            assigneeId: task.assigneeId,
            status: task.status,
            priority: task.priority,
            dueDate,
          }).catch((saveError) => {
            setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to update task");
          });
        }}
        onStatusChange={(task, status) => {
          void updateTaskStatus(task.id, status).catch((saveError) => {
            setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to update task status");
          });
        }}
        onAssigneeChange={(task, assigneeId) => {
          void updateTask(task.id, {
            title: task.title,
            description: task.description,
            assigneeId,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
          }).catch((saveError) => {
            setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to update assignee");
          });
        }}
        onOpenTask={(task) => setSelectedTaskId(task.id)}
        onOpenComments={(task) => {
          setSelectedTaskId(task.id);
          setFocusCommentsForTaskId(task.id);
        }}
        onDelete={(task) => {
          void handleDelete(task);
        }}
      />

      <aside className={`task-side-panel ${selectedTask ? "open" : ""}`} aria-hidden={!selectedTask}>
        {selectedTask ? (
          <div className="task-side-content">
            <header className="task-side-header">
              <h3>{selectedTask.title}</h3>
              <button className="toolbar-icon-button" aria-label="Close task panel" onClick={() => setSelectedTaskId(null)} type="button">
                <X size={18} />
              </button>
            </header>

            <p className="task-side-description">{selectedTask.description}</p>

            <div className="badge-row">
              <StatusBadge status={selectedTask.status} />
              <PriorityBadge priority={selectedTask.priority} />
              {isTaskOverdue(selectedTask) ? <span className="badge overdue-badge">Overdue</span> : null}
            </div>

            <dl className="task-side-meta">
              <div>
                <dt>Assignee</dt>
                <dd>{getUserById(selectedTask.assigneeId)?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(selectedTask.dueDate)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(selectedTask.createdAt)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDateTime(selectedTask.updatedAt)}</dd>
              </div>
            </dl>

            <section className="task-side-form">
              <h4>Edit task</h4>
              <div className="task-side-project-row">
                <span className="task-side-project-name">Forge internal task list</span>
                <span className="task-side-project-status">{selectedTask.status}</span>
              </div>
              <div className="task-side-properties">
                <div className="task-side-property-row">
                  <span>Priority</span>
                  <PriorityBadge priority={selectedTask.priority} />
                </div>
                <div className="task-side-property-row">
                  <span>Status</span>
                  <StatusBadge status={selectedTask.status} />
                </div>
              </div>
              <div className="task-side-description-block">
                <h5>Description</h5>
                <p>{selectedTask.description}</p>
              </div>
              <div className="task-side-section-divider" />
              <div className="task-side-subsection">
                <h5>Subtasks</h5>
                <form
                  className="subtasks-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void addSubtask(selectedTask.id);
                  }}
                >
                  <input
                    value={subtaskDraft}
                    onChange={(event) => setSubtaskDraft(event.target.value)}
                    placeholder="Type to add a subtask..."
                  />
                  <button type="submit">Add</button>
                </form>
                <div className="subtasks-list">
                  {selectedTaskSubtasks.length ? (
                    selectedTaskSubtasks.map((item) => (
                      <div className="subtask-item" key={item.id}>
                        <label>
                          <input
                            checked={item.completed}
                            onChange={() => void toggleSubtask(item.id)}
                            type="checkbox"
                          />
                          <span className={item.completed ? "completed" : ""}>{item.text}</span>
                        </label>
                        <button
                          className="subtask-remove-button"
                          onClick={() => void removeSubtask(item.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="subtasks-empty">No subtasks yet.</p>
                  )}
                </div>
              </div>
              <div className="task-side-subsection">
                <h5>Attachments</h5>
              </div>
              <TaskForm
                initialTask={selectedTask}
                submitLabel="Update task"
                onSubmit={(input) => {
                  void updateTask(selectedTask.id, input).catch((saveError) => {
                    setWorkspaceError(saveError instanceof Error ? saveError.message : "Unable to update task");
                  });
                }}
              />
            </section>

            <section className="task-side-activity" ref={commentsSectionRef}>
              <h4>Comments</h4>
              <form
                className="task-comment-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void addComment(selectedTask.id);
                }}
              >
                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Add a comment"
                  rows={3}
                />
                <button className="primary-button" type="submit">
                  Add comment
                </button>
              </form>
              <div className="activity-list">
                {selectedTaskComments.length ? (
                  selectedTaskComments.map((comment) => (
                    <div className="activity-item" key={comment.id}>
                      <strong>{comment.body}</strong>
                      <span>{formatDateTime(comment.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="subtasks-empty">No comments yet.</p>
                )}
              </div>
              <h4>Activity</h4>
              <div className="activity-list">
                {activity
                  .filter((event) => event.taskId === selectedTask.id)
                  .slice(0, 8)
                  .map((event) => (
                    <div className="activity-item" key={event.id}>
                      <strong>{event.action}</strong>
                      <span>{formatDateTime(event.createdAt)}</span>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
