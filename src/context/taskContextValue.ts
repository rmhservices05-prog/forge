import { createContext } from "react";
import type { ActivityEvent, Task, TaskInput } from "../types";

export type TaskContextValue = {
  tasks: Task[];
  activity: ActivityEvent[];
  createTask: (input: TaskInput) => Task;
  updateTask: (taskId: string, input: TaskInput) => Task | undefined;
  updateTaskStatus: (taskId: string, status: Task["status"]) => Task | undefined;
  deleteTask: (taskId: string) => void;
};

export const TaskContext = createContext<TaskContextValue | undefined>(undefined);
