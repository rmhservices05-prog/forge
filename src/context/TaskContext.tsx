import { useCallback, useMemo, useState, type ReactNode } from "react";
import { taskRepository } from "../data/taskRepository";
import { TaskContext, type TaskContextValue } from "./taskContextValue";

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(() => taskRepository.listTasks());
  const [activity, setActivity] = useState(() => taskRepository.listActivity());

  const refresh = useCallback(() => {
    setTasks(taskRepository.listTasks());
    setActivity(taskRepository.listActivity());
  }, []);

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      activity,
      createTask(input) {
        const task = taskRepository.createTask(input);
        refresh();
        return task;
      },
      updateTask(taskId, input) {
        const task = taskRepository.updateTask(taskId, input);
        refresh();
        return task;
      },
      updateTaskStatus(taskId, status) {
        const task = taskRepository.updateTaskStatus(taskId, status);
        refresh();
        return task;
      },
      deleteTask(taskId) {
        taskRepository.deleteTask(taskId);
        refresh();
      },
    }),
    [activity, refresh, tasks],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
