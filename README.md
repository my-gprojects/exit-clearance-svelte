# Exit Clearance (SvelteKit)

Port of the Exit Clearance app using **SvelteKit + Vite**. No IIS. Data lives in static JSON for now; swap `src/lib/server/db.ts` later for SQL Server or PostgreSQL.

## Run

```bash
cd projects/exit-clearance-svelte
npm install
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

## Demo accounts

| Username   | Password          | Roles                         |
|------------|-------------------|-------------------------------|
| john.doe   | DevPassword123!   | employee                      |
| admin.ec   | DevPassword123!   | admin, ppc_people_services    |
| sarah.hr   | DevPassword123!   | ppc_people_services           |
| mike.it    | DevPassword123!   | it                            |

## Structure

- `src/data/*.json` — users, cases/tasks, navigation, notes, notifications, interviewers, templates
- `src/lib/server/db.ts` — in-memory JSON data access (task actions, admin, reports)
- Routes: `/login`, `/dashboard`, `/cases`, `/cases/[id]`, `/notifications`, `/reports`, `/notes`, `/admin/users`, `/admin/exit-interviewers`, `/admin/task-templates`

## Later: SQL Server / PostgreSQL

Keep route loaders the same; replace functions in `db.ts` with queries. Auth can stay cookie-based or move to AD/SSO without IIS.
