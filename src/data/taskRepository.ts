import type { ActivityEvent, Task, TaskInput } from "../types";
import { requireSupabase } from "../lib/supabase";

type TaskRow = {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  assignee_id: string;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string;
  created_at: string;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  organization_id: string;
  task_id: string;
  actor_id: string;
  action: string;
  created_at: string;
};

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function activityEvent(taskId: string, action: string, actorId: string, organizationId: string): ActivityRow {
  return {
    id: createId("activity"),
    organization_id: organizationId,
    task_id: taskId,
    actor_id: actorId,
    action,
    created_at: new Date().toISOString(),
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    taskId: row.task_id,
    actorId: row.actor_id,
    action: row.action,
    createdAt: row.created_at,
  };
}

async function insertActivity(event: ActivityRow): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("task_activity").insert(event);

  if (error) {
    throw error;
  }
}

export const taskRepository = {
  async listTasks(organizationId: string): Promise<Task[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("tasks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapTask(row as TaskRow));
  },

  async listActivity(organizationId: string): Promise<ActivityEvent[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("task_activity")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapActivity(row as ActivityRow));
  },

  async createTask(organizationId: string, actorId: string, input: TaskInput): Promise<Task> {
    const client = requireSupabase();
    const now = new Date().toISOString();
    const row: TaskRow = {
      id: createId("task"),
      organization_id: organizationId,
      title: input.title,
      description: input.description,
      assignee_id: input.assigneeId,
      status: input.status,
      priority: input.priority,
      due_date: input.dueDate,
      created_at: now,
      updated_at: now,
    };

    const { error } = await client.from("tasks").insert(row);

    if (error) {
      throw error;
    }

    await insertActivity(activityEvent(row.id, "Created task", actorId, organizationId));

    return mapTask(row);
  },

  async updateTask(
    organizationId: string,
    actorId: string,
    taskId: string,
    input: TaskInput,
  ): Promise<Task | undefined> {
    const client = requireSupabase();
    const updatedAt = new Date().toISOString();
    const { data, error } = await client
      .from("tasks")
      .update({
        title: input.title,
        description: input.description,
        assignee_id: input.assigneeId,
        status: input.status,
        priority: input.priority,
        due_date: input.dueDate,
        updated_at: updatedAt,
      })
      .eq("organization_id", organizationId)
      .eq("id", taskId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return undefined;
    }

    await insertActivity(activityEvent(taskId, "Updated task fields", actorId, organizationId));

    return mapTask(data as TaskRow);
  },

  async updateTaskStatus(
    organizationId: string,
    actorId: string,
    taskId: string,
    status: Task["status"],
  ): Promise<Task | undefined> {
    const client = requireSupabase();
    const { data: existingTask, error: lookupError } = await client
      .from("tasks")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", taskId)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (!existingTask) {
      return undefined;
    }

    return this.updateTask(organizationId, actorId, taskId, {
      title: existingTask.title,
      description: existingTask.description,
      assigneeId: existingTask.assignee_id,
      status,
      priority: existingTask.priority,
      dueDate: existingTask.due_date,
    });
  },

  async deleteTask(organizationId: string, taskId: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client
      .from("tasks")
      .delete()
      .eq("organization_id", organizationId)
      .eq("id", taskId);

    if (error) {
      throw error;
    }
  },
};
