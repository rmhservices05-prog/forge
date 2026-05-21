export type UserRole = "Owner" | "Operator" | "Manager" | "Observer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type CompanyStatus = "Active" | "Prospect" | "Inactive";

export type Company = {
  id: number;
  name: string;
  industry: string;
  location: string;
  status: CompanyStatus;
  lastInteraction: string;
  employeeRange: string;
  logoColor: string;
  city: string;
  country: string;
  contactAddress: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
  phoneNumber: string;
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

export type TaskSubtask = {
  id: string;
  taskId: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  body: string;
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
