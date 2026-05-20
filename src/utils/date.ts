import type { Task } from "../types";

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status === "Done") {
    return false;
  }

  const dueDate = new Date(`${task.dueDate}T23:59:59`);
  return dueDate.getTime() < Date.now();
}
