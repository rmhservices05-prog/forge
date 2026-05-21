import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { taskRepository } from "../data/taskRepository";
import { useAuth } from "../hooks/useAuth";
import { TaskContext, type TaskContextValue } from "./taskContextValue";

export function TaskProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const [tasks, setTasks] = useState<TaskContextValue["tasks"]>([]);
  const [activity, setActivity] = useState<TaskContextValue["activity"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user || !profile) {
      setTasks([]);
      setActivity([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [nextTasks, nextActivity] = await Promise.all([
        taskRepository.listTasks(profile.organizationId),
        taskRepository.listActivity(profile.organizationId),
      ]);
      setTasks(nextTasks);
      setActivity(nextActivity);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [profile, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      activity,
      loading,
      error,
      refresh,
      async createTask(input) {
        if (!user || !profile) {
          throw new Error("You must be signed in to create a task.");
        }

        const task = await taskRepository.createTask(profile.organizationId, user.id, input);
        await refresh();
        return task;
      },
      async updateTask(taskId, input) {
        if (!user || !profile) {
          throw new Error("You must be signed in to update a task.");
        }

        const task = await taskRepository.updateTask(profile.organizationId, user.id, taskId, input);
        await refresh();
        return task;
      },
      async updateTaskStatus(taskId, status) {
        if (!user || !profile) {
          throw new Error("You must be signed in to update a task.");
        }

        const task = await taskRepository.updateTaskStatus(profile.organizationId, user.id, taskId, status);
        await refresh();
        return task;
      },
      async deleteTask(taskId) {
        if (!user || !profile) {
          throw new Error("You must be signed in to delete a task.");
        }

        await taskRepository.deleteTask(profile.organizationId, taskId);
        await refresh();
      },
    }),
    [activity, error, loading, profile, refresh, tasks, user],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
