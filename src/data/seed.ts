import type { ActivityEvent, Task } from "../types";

export const seedTasks: Task[] = [
  {
    id: "task-secure-onboarding",
    title: "Prepare internal onboarding checklist",
    description: "Draft the first operator onboarding checklist using placeholder workflows only.",
    assigneeId: "user-me",
    status: "In Progress",
    priority: "High",
    dueDate: "2026-05-24",
    createdAt: "2026-05-18T09:00:00.000Z",
    updatedAt: "2026-05-20T08:40:00.000Z",
  },
  {
    id: "task-task-taxonomy",
    title: "Define v1 task priority policy",
    description: "Agree what counts as Low, Medium, High, and Critical for internal task operations.",
    assigneeId: "user-teammate",
    status: "To Do",
    priority: "Medium",
    dueDate: "2026-05-28",
    createdAt: "2026-05-17T11:30:00.000Z",
    updatedAt: "2026-05-19T16:15:00.000Z",
  },
  {
    id: "task-audit-placeholder",
    title: "Map audit log requirements",
    description: "List future audit events for task changes, assignments, deletions, and permission changes.",
    assigneeId: "user-me",
    status: "To Do",
    priority: "Critical",
    dueDate: "2026-05-19",
    createdAt: "2026-05-15T14:20:00.000Z",
    updatedAt: "2026-05-18T13:05:00.000Z",
  },
];

export const seedActivity: ActivityEvent[] = [
  {
    id: "activity-1",
    taskId: "task-secure-onboarding",
    actorId: "user-me",
    action: "Updated status to In Progress",
    createdAt: "2026-05-20T08:40:00.000Z",
  },
  {
    id: "activity-2",
    taskId: "task-task-taxonomy",
    actorId: "user-teammate",
    action: "Created task",
    createdAt: "2026-05-17T11:30:00.000Z",
  },
];
