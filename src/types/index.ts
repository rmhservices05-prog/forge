export type UserRole = "Owner" | "Operator" | "Manager" | "Observer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type TaskStatus = "To Do" | "In Progress" | "Done";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type Task = {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityEvent = {
  id: string;
  taskId: string;
  actorId: string;
  action: string;
  createdAt: string;
};

export type TaskFilters = {
  assigneeId: string;
  status: string;
  priority: string;
  query: string;
};

export type TaskInput = Pick<
  Task,
  "title" | "description" | "assigneeId" | "status" | "priority" | "dueDate"
>;
