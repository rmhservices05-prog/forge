import { Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";
import type { Task, TaskInput, User } from "../types";
import { priorityOptions, statusOptions } from "../utils/tasks";

type TaskFormProps = {
  initialTask?: Task;
  submitLabel: string;
  onSubmit: (input: TaskInput) => void;
  users?: User[];
};

export function TaskForm({ initialTask, submitLabel, onSubmit, users: usersProp }: TaskFormProps) {
  const { user } = useAuth();
  const organization = useOrganization();
  const users = usersProp ?? organization.users;
  const emptyForm: TaskInput = {
    title: "",
    description: "",
    assigneeId: users[0]?.id ?? user?.id ?? "",
    priority: "Medium",
    status: "To Do",
    dueDate: new Date().toISOString().slice(0, 10),
  };
  const [form, setForm] = useState<TaskInput>(() =>
    initialTask
      ? {
          title: initialTask.title,
          description: initialTask.description,
          assigneeId: initialTask.assigneeId,
          priority: initialTask.priority,
          status: initialTask.status,
          dueDate: initialTask.dueDate,
        }
      : emptyForm,
  );
  const [submitted, setSubmitted] = useState(false);

  const hasRequiredFields = form.title.trim() && form.description.trim() && form.assigneeId && form.dueDate;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!hasRequiredFields) {
      return;
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    });

    if (!initialTask) {
      setForm(emptyForm);
      setSubmitted(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Define the task outcome"
          aria-invalid={submitted && !form.title.trim()}
        />
      </label>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Add concise operational context"
          rows={4}
          aria-invalid={submitted && !form.description.trim()}
        />
      </label>

      <div className="form-grid">
        <label>
          Assignee
          <select
            value={form.assigneeId}
            onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as TaskInput["status"] })}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value as TaskInput["priority"] })}
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        <label>
          Due date
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            aria-invalid={submitted && !form.dueDate}
          />
        </label>
      </div>

      {submitted && !hasRequiredFields ? (
        <p className="form-error">Title, description, assignee, and due date are required.</p>
      ) : null}

      <button className="primary-button" type="submit">
        <Save size={17} />
        {submitLabel}
      </button>
    </form>
  );
}
