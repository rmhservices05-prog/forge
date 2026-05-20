import type { Task, TaskFilters, TaskPriority, TaskStatus } from "../types";
import { isTaskOverdue } from "./date";

export const statusOptions: TaskStatus[] = ["Backlog", "To Do", "In Progress", "Blocked", "Done"];
export const priorityOptions: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.query.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesAssignee = !filters.assigneeId || task.assigneeId === filters.assigneeId;
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesQuery =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query);

    return matchesAssignee && matchesStatus && matchesPriority && matchesQuery;
  });
}

export function taskSummary(tasks: Task[]) {
  return {
    total: tasks.length,
    open: tasks.filter((task) => task.status !== "Done").length,
    inProgress: tasks.filter((task) => task.status === "In Progress").length,
    completed: tasks.filter((task) => task.status === "Done").length,
    overdue: tasks.filter(isTaskOverdue).length,
  };
}
