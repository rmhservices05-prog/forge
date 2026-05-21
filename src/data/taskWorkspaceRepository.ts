import { requireSupabase } from "../lib/supabase";
import type { TaskComment, TaskSubtask } from "../types";

type SubtaskRow = {
  id: string;
  organization_id: string;
  task_id: string;
  text: string;
  completed: boolean;
  created_at: string;
};

type CommentRow = {
  id: string;
  organization_id: string;
  task_id: string;
  body: string;
  created_at: string;
};

type PreferenceRow = {
  organization_id: string;
  project_icon: string | null;
  updated_at: string;
};

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function mapSubtask(row: SubtaskRow): TaskSubtask {
  return {
    id: row.id,
    taskId: row.task_id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

function mapComment(row: CommentRow): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export const taskWorkspaceRepository = {
  async listSubtasks(organizationId: string): Promise<TaskSubtask[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("task_subtasks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapSubtask(row as SubtaskRow));
  },

  async listComments(organizationId: string): Promise<TaskComment[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("task_comments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapComment(row as CommentRow));
  },

  async getProjectIcon(organizationId: string): Promise<string> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("organization_preferences")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as PreferenceRow | null)?.project_icon ?? "";
  },

  async addSubtask(organizationId: string, taskId: string, text: string): Promise<TaskSubtask> {
    const client = requireSupabase();
    const row: SubtaskRow = {
      id: createId("subtask"),
      organization_id: organizationId,
      task_id: taskId,
      text,
      completed: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await client.from("task_subtasks").insert(row);

    if (error) {
      throw error;
    }

    return mapSubtask(row);
  },

  async toggleSubtask(organizationId: string, subtaskId: string, completed: boolean): Promise<void> {
    const client = requireSupabase();
    const { error } = await client
      .from("task_subtasks")
      .update({ completed })
      .eq("organization_id", organizationId)
      .eq("id", subtaskId);

    if (error) {
      throw error;
    }
  },

  async removeSubtask(organizationId: string, subtaskId: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client
      .from("task_subtasks")
      .delete()
      .eq("organization_id", organizationId)
      .eq("id", subtaskId);

    if (error) {
      throw error;
    }
  },

  async addComment(organizationId: string, taskId: string, body: string): Promise<TaskComment> {
    const client = requireSupabase();
    const row: CommentRow = {
      id: createId("comment"),
      organization_id: organizationId,
      task_id: taskId,
      body,
      created_at: new Date().toISOString(),
    };

    const { error } = await client.from("task_comments").insert(row);

    if (error) {
      throw error;
    }

    return mapComment(row);
  },

  async setProjectIcon(organizationId: string, projectIcon: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client.from("organization_preferences").upsert({
      organization_id: organizationId,
      project_icon: projectIcon,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  },
};
