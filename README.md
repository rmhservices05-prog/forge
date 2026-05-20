# Forge

Forge is the first internal CRM/task operations app for Dealtr.com. Version 1 focuses on a small internal team creating, assigning, tracking, updating, filtering, and deleting tasks.
It now also includes an internal-only Newsroom for sales intelligence, source tracking, article ranking, bookmarking, and Delatr-specific follow-up notes.

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
npm test
```

## Architecture

- `src/components` contains reusable UI such as `TaskForm`, `TaskTable`, `StatusBadge`, `PriorityBadge`, `Filters`, and `DashboardSummary`.
- `src/news` contains the Newsroom source registry, local persistence, article normalization, relevance scoring, refresh logic, and API adapter for `/api/news/*`.
- `src/pages` contains route-level screens for `/dashboard`, `/tasks`, `/tasks/:id`, and `/settings`.
- `src/pages/NewsRoom.tsx` contains the Newsroom route for ranked intelligence feed review.
- `src/data` contains seed users/tasks and the localStorage task repository.
- `src/types` contains shared TypeScript models for task entities, while `src/news/types.ts` contains Newsroom-specific models.
- `src/utils` contains date and task filtering/summary helpers.

## Newsroom Notes

- Newsroom is local-first and stores source configuration, article metadata, bookmarks, read state, and internal notes in `localStorage`.
- Demo/manual sources are enabled by default so the UI works before live feeds are configured.
- RSS sources can be enabled later from the source registry; API-key-based sources are intentionally not enabled in this frontend-only build.

## Extension Points

Forge is structured so future CRM modules can plug in beside tasks:

- contacts
- companies
- opportunities
- contracts
- compliance and audit logs
- customer support tickets

The current app uses placeholder data only. Before production use with sensitive data, add authentication, role-based permissions, server-side audit logging, and a backend data store.
