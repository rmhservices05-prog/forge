import { ChevronDown, MoreHorizontal, Plus, X } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { Filters } from "../components/Filters";
import { TaskForm } from "../components/TaskForm";
import { TaskTable } from "../components/TaskTable";
import { getUserById, users } from "../data/users";
import { useTasks } from "../hooks/useTasks";
import type { Task, TaskFilters, TaskInput } from "../types";
import { formatDate, formatDateTime, isTaskOverdue } from "../utils/date";
import { filterTasks } from "../utils/tasks";

const defaultFilters: TaskFilters = {
  assigneeId: "",
  status: "",
  priority: "",
  query: "",
};

type SubtaskItem = {
  id: string;
  taskId: string;
  text: string;
  completed: boolean;
};

type TaskComment = {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
};

type TaskProgressSummary = {
  total: number;
  completed: number;
};

const SUBTASKS_STORAGE_KEY = "forge.subtasks.v1";
const COMMENTS_STORAGE_KEY = "forge.comments.v1";
const PROJECT_ICON_STORAGE_KEY = "forge.projectIcon.v1";
const defaultDraftTask: TaskInput = {
  title: "",
  description: "",
  assigneeId: users[0]?.id ?? "",
  status: "To Do",
  priority: "Medium",
  dueDate: new Date().toISOString().slice(0, 10),
};

function readSubtasks(): SubtaskItem[] {
  const storedValue = window.localStorage.getItem(SUBTASKS_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as SubtaskItem[];
  } catch {
    return [];
  }
}

function readComments(): TaskComment[] {
  const storedValue = window.localStorage.getItem(COMMENTS_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as TaskComment[];
  } catch {
    return [];
  }
}

function readProjectIcon(): string {
  return window.localStorage.getItem(PROJECT_ICON_STORAGE_KEY) ?? "";
}

export function Tasks() {
  const { tasks, activity, createTask, updateTask, updateTaskStatus, deleteTask } = useTasks();
  const [filters, setFilters] = useState(defaultFilters);
  const [draftTask, setDraftTask] = useState<TaskInput | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>(() => readSubtasks());
  const [comments, setComments] = useState<TaskComment[]>(() => readComments());
  const [projectIcon, setProjectIcon] = useState(() => readProjectIcon());
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
    if (selectedTaskId !== focusCommentsForTaskId || !commentsSectionRef.current) {
      return;
    }

    commentsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    setFocusCommentsForTaskId(null);
  }, [focusCommentsForTaskId, selectedTaskId]);

  function writeSubtasks(nextSubtasks: SubtaskItem[]) {
    setSubtasks(nextSubtasks);
    window.localStorage.setItem(SUBTASKS_STORAGE_KEY, JSON.stringify(nextSubtasks));
  }

  function writeComments(nextComments: TaskComment[]) {
    setComments(nextComments);
    window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(nextComments));
  }

  function handleProjectIconChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextIcon = typeof reader.result === "string" ? reader.result : "";
      setProjectIcon(nextIcon);
      window.localStorage.setItem(PROJECT_ICON_STORAGE_KEY, nextIcon);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function addSubtask(taskId: string) {
    const trimmedDraft = subtaskDraft.trim();
    if (!trimmedDraft) {
      return;
    }

    const nextSubtasks: SubtaskItem[] = [
      {
        id: `subtask-${crypto.randomUUID()}`,
        taskId,
        text: trimmedDraft,
        completed: false,
      },
      ...subtasks,
    ];

    writeSubtasks(nextSubtasks);
    setSubtaskDraft("");
  }

  function toggleSubtask(subtaskId: string) {
    const nextSubtasks = subtasks.map((item) => {
      if (item.id !== subtaskId) {
        return item;
      }

      return { ...item, completed: !item.completed };
    });

    writeSubtasks(nextSubtasks);
  }

  function removeSubtask(subtaskId: string) {
    const nextSubtasks = subtasks.filter((item) => item.id !== subtaskId);
    writeSubtasks(nextSubtasks);
  }

  function addComment(taskId: string) {
    const trimmedDraft = commentDraft.trim();
    if (!trimmedDraft) {
      return;
    }

    const nextComments: TaskComment[] = [
      {
        id: `comment-${crypto.randomUUID()}`,
        taskId,
        body: trimmedDraft,
        createdAt: new Date().toISOString(),
      },
      ...comments,
    ];

    writeComments(nextComments);
    setCommentDraft("");
  }

  function handleDelete(task: Task) {
    if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      deleteTask(task.id);
      if (selectedTaskId === task.id) {
        setSelectedTaskId(null);
      }
    }
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
            onChange={handleProjectIconChange}
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

      <section className="list-toolbar">
        <div className="toolbar-left">
          <button
            className="add-task-button"
            onClick={() => setDraftTask((current) => current ?? { ...defaultDraftTask })}
          >
            <Plus size={16} />
            Add task
          </button>
        </div>
        <button className="toolbar-icon-button" aria-label="More options">
          <MoreHorizontal size={18} />
        </button>
      </section>

      <Filters filters={filters} onChange={setFilters} />

      <TaskTable
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

          const nextTask = createTask({
            ...draftTask,
            title: draftTask.title.trim(),
            description: draftTask.description.trim() || draftTask.title.trim(),
          });

          setDraftTask(null);
          setSelectedTaskId(nextTask.id);
        }}
        onDraftChange={(nextDraftTask) => setDraftTask(nextDraftTask)}
        onDueDateChange={(task, dueDate) => {
          updateTask(task.id, {
            title: task.title,
            description: task.description,
            assigneeId: task.assigneeId,
            status: task.status,
            priority: task.priority,
            dueDate,
          });
        }}
        onStatusChange={(task, status) => updateTaskStatus(task.id, status)}
        onAssigneeChange={(task, assigneeId) => {
          updateTask(task.id, {
            title: task.title,
            description: task.description,
            assigneeId,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
          });
        }}
        onOpenTask={(task) => setSelectedTaskId(task.id)}
        onOpenComments={(task) => {
          setSelectedTaskId(task.id);
          setFocusCommentsForTaskId(task.id);
        }}
        onDelete={handleDelete}
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
                    addSubtask(selectedTask.id);
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
                            onChange={() => toggleSubtask(item.id)}
                            type="checkbox"
                          />
                          <span className={item.completed ? "completed" : ""}>{item.text}</span>
                        </label>
                        <button
                          className="subtask-remove-button"
                          onClick={() => removeSubtask(item.id)}
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
                  updateTask(selectedTask.id, input);
                }}
              />
            </section>

            <section className="task-side-activity" ref={commentsSectionRef}>
              <h4>Comments</h4>
              <form
                className="task-comment-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  addComment(selectedTask.id);
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
