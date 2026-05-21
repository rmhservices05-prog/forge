import { createContext } from "react";
import type { ActivityEvent, Task, TaskInput } from "../types";

export type TaskContextValue = {
  tasks: Task[];
  activity: ActivityEvent[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (taskId: string, input: TaskInput) => Promise<Task | undefined>;
  updateTaskStatus: (taskId: string, status: Task["status"]) => Promise<Task | undefined>;
  deleteTask: (taskId: string) => Promise<void>;
};

export const TaskContext = createContext<TaskContextValue | undefined>(undefined);
