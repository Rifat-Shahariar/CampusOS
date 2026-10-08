# CampusOS Architecture

This document describes the repository layout and the conventions every change
must follow. It is set up during project initialization; features are added in
later steps.

## System overview

| Component | Technology                 | Hosting  |
| --------- | -------------------------- | -------- |
| Frontend  | Next.js + TypeScript       | Vercel   |
| Backend   | NestJS + TypeScript (REST) | Render   |
| Database  | PostgreSQL via Prisma      | Supabase |
| Storage   | Supabase Storage           | Supabase |

The frontend and backend are deployed independently. The backend is the only
component that talks to the database and to file storage.

## Monorepo

```
CampusOS/
├── frontend/   # Next.js workspace
├── backend/    # NestJS workspace
├── docs/       # Documentation
└── package.json  # npm workspaces root — shared scripts, ESLint/Prettier config
```

npm workspaces are used so both applications install from a single root
`package.json` and share one lockfile.

## Frontend (`frontend/`)

```
frontend/src/
├── app/          # App Router routes, layouts and global styles
├── components/
│   └── ui/       # shadcn/ui primitives (reusable, presentation only)
├── features/     # Feature modules: auth, events, resources, clubs, dashboard
├── lib/
│   ├── api/      # API client and request helpers
│   ├── auth/     # Auth session helpers
│   └── utils/    # Shared utilities (e.g. `cn`)
├── hooks/        # Shared React hooks
├── types/        # Shared TypeScript types
└── config/       # App configuration (site metadata, breakpoints)
```

Rules:

- Feature-specific components, hooks, API calls, schemas and types live inside
  the owning `features/<name>/` directory — not in shared folders.
- `components/` and `lib/` hold only genuinely reusable code.
- `@/*` resolves to `src/*`.

### Responsive design

Mobile-first. Breakpoints are declared in `src/app/globals.css` (`@theme`) and
mirrored in `src/config/breakpoints.ts`:

| Variant | Width  | Target         |
| ------- | ------ | -------------- |
| `sm`    | 640px  | Large phones   |
| `md`    | 768px  | Tablets        |
| `lg`    | 1024px | Laptops        |
| `xl`    | 1280px | Desktops       |
| `2xl`   | 1536px | Large displays |
| `3xl`   | 1920px | Extra large    |

Layouts must avoid horizontal overflow, fixed widths and desktop-only
navigation, and must keep touch targets usable on small screens.

## Backend (`backend/`)

```
backend/
├── src/
│   ├── auth/            # Authentication module
│   ├── users/           # User module
│   ├── clubs/           # Club module
│   ├── events/          # Event module
│   ├── registrations/   # Event registration / check-in module
│   ├── resources/       # Course resource module
│   ├── uploads/         # File upload module (Supabase Storage)
│   ├── database/        # Prisma integration module (DatabaseModule, PrismaService)
│   ├── health/          # Liveness / readiness endpoints
│   ├── config/          # Environment validation
│   ├── generated/prisma/# Generated Prisma Client (git-ignored)
│   └── common/          # guards, decorators, filters, interceptors, utils
├── prisma/
│   ├── schema.prisma    # Prisma schema (models, enums, indexes)
│   ├── migrations/      # Migration history
│   └── seed.ts          # Development seed (wraps `prisma db seed`)
├── prisma7.config.ts    # Prisma 7 config: schema path, migrations, seed, URL
├── src/app.setup.ts     # Shared API config: prefix, CORS, validation, Swagger
└── test/                # End-to-end tests
```

Rules:

- Each feature module owns its own controllers, services and DTOs. Module
  directories are currently empty placeholders — they are filled in when the
  corresponding feature is implemented.
- Cross-cutting concerns belong in `src/common/`.
- Database access goes through Prisma from the `database/` module; no other
  module talks to the database directly.
- Configuration is read from environment variables (see `backend/.env.example`).

### API foundation

The REST API is served under the `/api/v1` prefix.

- `src/main.ts` bootstraps the app, enables shutdown hooks (so `PrismaService`
  disconnects cleanly) and passes the Express adapter explicitly.
- `src/app.setup.ts` holds the shared configuration used by `main.ts` and the
  end-to-end tests: the global prefix, CORS (from `FRONTEND_URL`), the global
  `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) and the
  Swagger document. Body parsing is capped at 1 MB.
- Swagger UI is mounted at `/api/docs` (JSON at `/api/docs/json`); new
  controllers appear automatically via decorators.
- `GET /api/v1/health` is a liveness probe that never touches the database;
  `GET /api/v1/health/ready` reports database connectivity via `PrismaService`
  and returns `503` when it is unreachable.
- The Prisma connection is opened lazily on the first query, so an unreachable
  database cannot block API startup.

## Database

PostgreSQL (Supabase) accessed through **Prisma ORM 7.10**.

### How Prisma is wired

| Concern                                                    | Where                                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Schema                                                     | `backend/prisma/schema.prisma`                                             |
| CLI config (schema path, migrations, seed, connection URL) | `backend/prisma7.config.ts`                                                |
| Runtime connection                                         | `@prisma/adapter-pg` — Prisma 7 requires a driver adapter at runtime       |
| Generated client                                           | `backend/src/generated/prisma` (git-ignored, rebuilt by `prisma generate`) |
| Services inject                                            | `PrismaService` (global `DatabaseModule`, `@prisma/adapter-pg`)            |

Prisma 7 does not read `.env` files by itself, so `prisma7.config.ts`, `src/main.ts`
and `prisma/seed.ts` each load the environment with Node's built-in
`process.loadEnvFile()` — no `dotenv` dependency.

`prisma generate` runs on `postinstall`, so a fresh `npm install` always has a
current client for type-checking, linting and building.

### Naming

Prisma models and fields are camelCase; the physical PostgreSQL objects are
snake_case via `@@map` / `@map`, matching the table and column names in the
approved project plan (`users`, `password_hash`, `event_registrations`, …).

### Enums

`UserRole` (ADMIN, CLUB_ADMIN, RESOURCE_ADMIN, STUDENT),
`EventRegistrationStatus` (REGISTERED, CANCELLED, ATTENDED),
`ResourceType` (NOTE, QUESTION_PAPER, LAB_MANUAL, NOTICE, OTHER),
`NoticePriority` (NORMAL, IMPORTANT, URGENT).

`events.event_type` is intentionally free text — the product plan does not fix an
event-type vocabulary yet.

### Entities and relationships

| Entity                | Key relationships                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                | → Department (optional), ← ClubAdminAssignment (as admin _and_ as assigner), ← Event (creator), ← EventRegistration, ← EventAttendance (checker), ← ClubPost, ← OfficialNotice, ← Resource (uploader) |
| `Department`          | → many Users, → many Courses                                                                                                                                                                          |
| `Club`                | → many ClubAdminAssignments, → many Events, → many ClubPosts                                                                                                                                          |
| `ClubAdminAssignment` | → User (the admin), → Club, → User (assignedBy). `unique(userId, clubId)` — one user may administer **many** clubs                                                                                    |     | `Event`  | → Club, → User (creator), → many EventRegistrations. `slug` is globally unique. Indexed on clubId, startTime, eventType, isActive |
| `EventRegistration`   | → Event, → User, ← EventAttendance. `unique(eventId, userId)` — one registration per student per event; `unique(registrationCode)`, `unique(qrToken)`                                                 |
| `EventAttendance`     | → EventRegistration (`unique(registrationId)` — one check-in per registration), → User (checkedInBy)                                                                                                  |
| `ClubPost`            | → Club, → User (creator)                                                                                                                                                                              |
| `OfficialNotice`      | → User (creator)                                                                                                                                                                                      |     | `Course` | → Department, → many Resources. `code` is unique                                                                                  |
| `Resource`            | → Course, → User (uploader). Batch/section are plain nullable strings                                                                                                                                 |

There is deliberately **no** resource-admin assignment entity: any
`RESOURCE_ADMIN` manages resources of any course, and there are no Batch or
Section tables — batch and section stay as simple fields, as specified.

### Referential actions

Deleting a row is restricted wherever it would destroy history or content.
Only two relations cascade, and both are authorization rows that carry no
history of their own.

| Relation                                                   | onDelete   | Rationale                                                    |
| ---------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `users.department_id` → `departments`                      | `SET NULL` | Optional organisational link; a user outlives its department |
| `club_admin_assignments.user_id` → `users`                 | `CASCADE`  | Authorization row — meaningless without the user             |
| `club_admin_assignments.club_id` → `clubs`                 | `CASCADE`  | Authorization row — carries no history                       |
| `club_admin_assignments.assigned_by` → `users`             | `RESTRICT` | Audit: who granted the assignment must stay resolvable       |
| `events.club_id` → `clubs`                                 | `RESTRICT` | A club that has events cannot be deleted                     |
| `events.created_by` → `users`                              | `RESTRICT` | Authorship is preserved                                      |
| `event_registrations.event_id` → `events`                  | `RESTRICT` | Registration history must never be cascaded away             |
| `event_registrations.user_id` → `users`                    | `RESTRICT` | Same                                                         |
| `event_attendance.registration_id` → `event_registrations` | `RESTRICT` | Check-in records are historical evidence                     |
| `event_attendance.checked_in_by` → `users`                 | `RESTRICT` | Audit trail for check-ins                                    |
| `club_posts.club_id` → `clubs`                             | `RESTRICT` | Published club content is protected                          |
| `club_posts.created_by` → `users`                          | `RESTRICT` | Authorship is preserved                                      |
| `official_notices.created_by` → `users`                    | `RESTRICT` | Published notices are protected                              |
| `courses.department_id` → `departments`                    | `RESTRICT` | Academic structure stays intact                              |
| `resources.course_id` → `courses`                          | `RESTRICT` | Uploaded material is protected                               |
| `resources.uploaded_by` → `users`                          | `RESTRICT` | Upload attribution is preserved                              |

`onUpdate` keeps Prisma's default `CASCADE`. Primary/foreign keys are UUIDs and
are never updated, so it only exists for completeness.

**Consequence — deactivate instead of delete.** Because of the restrictions
above, records that have history cannot be hard-deleted: users are marked
`is_active = false`, events `is_active = false`, clubs `is_active = false`, and
content `is_published = false`. Hard deletes are reserved for rows with no
dependent history (for example a club with no events, posts or assignments).

### Indexing policy

1. `@id` / `@unique` fields are indexed by their constraint — no duplicate index.
2. Foreign keys that back a real read pattern (`children of X`, `rows owned by X`)
   get an explicit index, because PostgreSQL does not index foreign keys.
3. The indexes mandated by the plan are present verbatim: `events`
   (clubId, startTime, eventType, isActive) and `event_registrations`
   (eventId, userId, status).
4. Low-cardinality boolean flags (`isActive`, `isPublished`) are **not** indexed
   on their own — except `events.isActive`, which the plan requires. Elsewhere they
   are either combined with an indexed column or the table is small enough that the
   index would not be selective.

Resulting extra indexes: `users(departmentId)`, `users(role)`,
`club_admin_assignments(clubId)`, `event_attendance(checkedInBy)`,
`club_posts(clubId)`, `official_notices(priority)`, `courses(departmentId)`,
`resources(courseId)`, `resources(resourceType)`, `resources(batch, section)`,
`resources(uploadedBy)`.

Composite indexes tuned to a measured query shape are deliberately postponed
until the API queries exist.

### Seed data

`backend/prisma/seed.ts` (`npm run prisma:seed`) creates development-only demo
data: 5 users (1 ADMIN, 1 CLUB_ADMIN, 1 RESOURCE_ADMIN, 2 STUDENTS), 2
departments, 6 courses, 2 clubs, 2 club-admin assignments (the club admin is
assigned to both clubs), 6 events (upcoming and past), 5 registrations covering
all three statuses, 1 attendance record, 10 resources covering all five resource
types across every course, 4 club posts and 4 official notices covering all
notice priorities.

- The script is idempotent: natural unique keys are upserted (email, code, slug,
  `userId+clubId`, `eventId+userId`, `registrationId`), and models without a
  natural key (courses, events, resources, posts, notices) use stable seed UUIDs.
- Files are placeholders (`https://example.invalid/...`) because Supabase Storage
  is not wired up yet.
- Every demo account shares one development-only password; it is printed by the
  seed and must never be reused outside local development.
- Password hashes are produced with Node's built-in `scrypt`:
  `scrypt$<N>$<r>$<p>$<salt-hex>$<derived-key-hex>`
  (`N=16384, r=8, p=1`, 64-byte key, 16-byte random salt). The authentication step
  must verify against this format.

### Migration workflow

Two connection strings live in `backend/.env` (both git-ignored):

| Variable       | Used by                                  | Supabase connection                  |
| -------------- | ---------------------------------------- | ------------------------------------ |
| `DATABASE_URL` | the running API (`PrismaService`)        | **Transaction pooler** (port `6543`) |
| `DIRECT_URL`   | Prisma CLI — migrate / seed / introspect | **Direct / session** (port `5432`)   |

Supabase's pooled endpoint runs pgbouncer in transaction mode, which cannot run
migrations, so `backend/prisma7.config.ts` hands the Prisma CLI
`DIRECT_URL ?? DATABASE_URL`. The NestJS app always connects with `DATABASE_URL`,
and `PrismaService` strips Prisma-only URL parameters (`pgbouncer`, `schema`, …)
before the URL reaches node-postgres.

**Supabase setup requirements**

1. A Supabase project with its PostgreSQL database provisioned (free tier is fine).
2. From **Project Settings → Database → Connection string**, copy both:
   - the _Transaction pooler_ URI (port `6543`) → `DATABASE_URL`
   - the _Direct connection_ / session URI (port `5432`) → `DIRECT_URL`
3. Replace `<password>` with the database password and drop Prisma-only query
   parameters such as `?pgbouncer=true` / `?schema=public` from `DATABASE_URL`.
4. Set `FRONTEND_URL` (and optionally `CORS_ORIGINS`) to your browser origin.

**Commands**

```bash
npm run prisma:validate                     # schema is valid
npm run prisma:generate                     # regenerate the client
npm run prisma:migrate --workspace backend  # prisma migrate dev (uses DIRECT_URL)
npm run prisma:seed                         # load the demo data
npm run prisma:migrate --workspace backend -- --name <change>   # add a migration
```

A reachable PostgreSQL is required from `prisma:migrate` onward. The initial
migration lives at `backend/prisma/migrations/<timestamp>_init/`.

**Local development workflow**

- Any PostgreSQL 14+ works locally — Supabase's hosted database, a container, or a
  locally installed server. Point both variables at it; for a plain local server
  they are usually identical (e.g.
  `postgresql://postgres:postgres@localhost:5432/campusos`).
- Re-running `npm run prisma:seed` is safe: the seed is idempotent.
- Confirm the API↔database link with `GET /api/v1/health/ready`: `200`
  `{ "database": "up" }` when reachable, `503` when it is not.

### Known gaps

- `event_registrations.event_id` duplicates the leading column of
  `unique(event_id, user_id)`; it is kept because the approved index list requires it.
- No `deleted_at` / soft-delete column exists; deactivation uses the existing
  `is_active` / `is_published` flags.

Resolved by owner decision: `events.slug` is now globally unique (canonical
`/events/:slug` URLs) and `courses.code` is now unique.

Resolved in the backend foundation: the generated Prisma Client now lives at
`backend/src/generated/prisma` (inside `rootDir`), so `nest build` emits it into
`dist/` alongside the application code. Prisma-only connection-string options
(`pgbouncer`, `schema`, …) are stripped before the URL reaches node-postgres.

## Code quality

- ESLint is configured per workspace (Next.js config on the frontend,
  type-aware `typescript-eslint` on the backend).
- Prettier is configured once at the repository root (`.prettierrc`) and shared
  by both workspaces.
- Environment files are git-ignored in every workspace; only `.env.example`
  files are committed.

## Local ports

| Service  | Port |
| -------- | ---- |
| Frontend | 3000 |
| Backend  | 3001 |
