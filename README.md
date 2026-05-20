# Forge

Forge is the first internal CRM/task operations app for Dealtr.com. Version 1 focuses on a small internal team creating, assigning, tracking, updating, filtering, and deleting tasks.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- localStorage persistence behind a small repository layer

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Architecture

- `src/components` contains reusable UI such as `TaskForm`, `TaskTable`, `StatusBadge`, `PriorityBadge`, `Filters`, and `DashboardSummary`.
- `src/pages` contains route-level screens for `/dashboard`, `/tasks`, `/tasks/:id`, and `/settings`.
- `src/data` contains seed users/tasks and the localStorage task repository.
- `src/types` contains shared TypeScript models for `User`, `Task`, `TaskStatus`, `TaskPriority`, and `ActivityEvent`.
- `src/utils` contains date and task filtering/summary helpers.

## Extension Points

Forge is structured so future CRM modules can plug in beside tasks:

- contacts
- companies
- opportunities
- contracts
- compliance and audit logs
- customer support tickets

The current app uses placeholder data only. Before production use with sensitive data, add authentication, role-based permissions, server-side audit logging, and a backend data store.
