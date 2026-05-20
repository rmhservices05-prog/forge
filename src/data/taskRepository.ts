import { seedActivity, seedTasks } from "./seed";
import type { ActivityEvent, Task, TaskInput } from "../types";

const TASKS_STORAGE_KEY = "forge.tasks.v1";
const ACTIVITY_STORAGE_KEY = "forge.activity.v1";

// TODO: Replace localStorage with permission-aware API calls when authentication is added.
// TODO: Route task mutations through server-side audit logging before production use.
function readJson<T>(key: string, fallback: T): T {
  const storedValue = window.localStorage.getItem(key);

  if (!storedValue) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function activityEvent(taskId: string, action: string, actorId: string): ActivityEvent {
  return {
    id: createId("activity"),
    taskId,
    actorId,
    action,
    createdAt: new Date().toISOString(),
  };
}

export const taskRepository = {
  listTasks(): Task[] {
    return readJson<Task[]>(TASKS_STORAGE_KEY, seedTasks);
  },

  listActivity(): ActivityEvent[] {
    return readJson<ActivityEvent[]>(ACTIVITY_STORAGE_KEY, seedActivity);
  },

  createTask(input: TaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: createId("task"),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const tasks = [task, ...this.listTasks()];
    const activity = [
      activityEvent(task.id, "Created task", input.assigneeId),
      ...this.listActivity(),
    ];

    writeJson(TASKS_STORAGE_KEY, tasks);
    writeJson(ACTIVITY_STORAGE_KEY, activity);

    return task;
  },

  updateTask(taskId: string, input: TaskInput): Task | undefined {
    let updatedTask: Task | undefined;

    const tasks = this.listTasks().map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      updatedTask = {
        ...task,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      return updatedTask;
    });

    if (!updatedTask) {
      return undefined;
    }

    const activity = [
      activityEvent(taskId, "Updated task fields", input.assigneeId),
      ...this.listActivity(),
    ];

    writeJson(TASKS_STORAGE_KEY, tasks);
    writeJson(ACTIVITY_STORAGE_KEY, activity);

    return updatedTask;
  },

  updateTaskStatus(taskId: string, status: Task["status"]): Task | undefined {
    const task = this.listTasks().find((candidate) => candidate.id === taskId);

    if (!task) {
      return undefined;
    }

    return this.updateTask(taskId, { ...task, status });
  },

  deleteTask(taskId: string): void {
    const tasks = this.listTasks().filter((task) => task.id !== taskId);
    const activity = this.listActivity().filter((event) => event.taskId !== taskId);

    writeJson(TASKS_STORAGE_KEY, tasks);
    writeJson(ACTIVITY_STORAGE_KEY, activity);
  },
};
