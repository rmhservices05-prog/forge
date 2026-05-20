import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Filters } from "../components/Filters";
import { TaskForm } from "../components/TaskForm";
import { TaskTable } from "../components/TaskTable";
import { useTasks } from "../hooks/useTasks";
import type { Task, TaskFilters } from "../types";
import { filterTasks } from "../utils/tasks";

const defaultFilters: TaskFilters = {
  assigneeId: "",
  status: "",
  priority: "",
  query: "",
};

export function Tasks() {
  const { tasks, createTask, updateTaskStatus, deleteTask } = useTasks();
  const [filters, setFilters] = useState(defaultFilters);
  const [isCreating, setIsCreating] = useState(false);
  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [filters, tasks]);

  function handleDelete(task: Task) {
    if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      deleteTask(task.id);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Task control</p>
          <h2>Tasks</h2>
          <span>Create, assign, filter, and update internal work from one view.</span>
        </div>
        <button className="primary-button" onClick={() => setIsCreating((current) => !current)}>
          <Plus size={17} />
          New task
        </button>
      </header>

      {isCreating ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Create Task</h3>
          </div>
          <TaskForm
            submitLabel="Create task"
            onSubmit={(input) => {
              createTask(input);
              setIsCreating(false);
            }}
          />
        </section>
      ) : null}

      <Filters filters={filters} onChange={setFilters} />

      <TaskTable
        tasks={visibleTasks}
        onStatusChange={(task, status) => updateTaskStatus(task.id, status)}
        onDelete={handleDelete}
      />
    </div>
  );
}
