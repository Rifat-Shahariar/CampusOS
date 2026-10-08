# CampusOS

Smart Digital Campus Hub — a monorepo containing the CampusOS web client and API.

## Monorepo structure

```
CampusOS/
├── frontend/   # Next.js web client (Vercel)
├── backend/    # NestJS REST API (Render)
├── docs/       # Project documentation
├── README.md
├── .gitignore
└── package.json
```

## Technology

| Layer      | Stack                                                        |
| ---------- | ------------------------------------------------------------ |
| Frontend   | Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui |
| Backend    | NestJS · TypeScript · REST API                               |
| Database   | PostgreSQL (Supabase) · Prisma ORM                           |
| Deployment | Frontend → Vercel · Backend → Render · Database → Supabase   |
| Tooling    | npm workspaces · ESLint · Prettier                           |

## Demo Credentials

The following four pre-seeded demo accounts can be used to test and demonstrate all CampusOS role capabilities:

**Password for all demo accounts:** `CampusOS#2026`

### 1. ADMIN
- **Email:** `admin@campusos.dev`
- **Name:** Ayesha Rahman
- **Demonstration Capabilities:**
  - Full platform administration and oversight
  - Club admin assignment and revocation
  - Administrative oversight across events, clubs, and resources

### 2. CLUB_ADMIN
- **Email:** `club.admin@campusos.dev`
- **Name:** Tanvir Ahmed
- **Demonstration Capabilities:**
  - Club & event management for assigned club
  - Create and publish club announcements
  - Create, update, and manage club events (capacity, dates, ticket fees)
  - Live event attendee registration management and QR ticket check-in
  - Access to real-time event attendance metrics

### 3. RESOURCE_ADMIN
- **Email:** `resource.admin@campusos.dev`
- **Name:** Nusrat Jahan
- **Demonstration Capabilities:**
  - Academic Resource Hub management
  - Upload course resources (Lecture Notes, Question Papers, Lab Manuals, Notices)
  - Publish and unpublish academic resources
  - Course and semester curriculum management

### 4. STUDENT
- **Email:** `student1@campusos.dev`
- **Name:** Rafid Hasan
- **Demonstration Capabilities:**
  - Student registration and login
  - Browse campus clubs and announcements
  - Explore upcoming events and register with instant confirmation
  - View personalized digital event entry ticket with unique ticket code & QR code
  - Browse Academic Resource Hub organized hierarchically: Department → Semester → Section → Resources
  - View user profile with clean academic details (never exposes database UUIDs)
  - Edit profile with university department selection dropdown

## Prerequisites

- Node.js 20.11+ (developed on Node 24)
- npm 10+
- A PostgreSQL database (Supabase) for backend work

## Setup

```bash
npm install                 # installs both workspaces
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Fill in the values in both env files — see [frontend/.env.example](frontend/.env.example)
and [backend/.env.example](backend/.env.example). Never commit real env files.

### Database (Supabase)

The backend reads two connection strings from `backend/.env` (git-ignored):

- `DATABASE_URL` — runtime connection (Supabase **transaction pooler**, port 6543)
- `DIRECT_URL` — direct connection used by Prisma Migrate/seed (**direct/session**, port 5432)

Provisions in Supabase come from **Project Settings → Database → Connection string**.
Create migrations and load the demo data from the repository root:

```bash
npm run prisma:migrate --workspace backend   # apply/create migrations (uses DIRECT_URL)
npm run prisma:seed                          # idempotent demo data
```

Any PostgreSQL 14+ works for local development — point both variables at it. See
[docs/architecture.md](docs/architecture.md) for the full Supabase setup and
migration/seed workflow.

## Development commands

Run from the repository root:

| Command                   | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `npm run dev`             | Start frontend and backend together                  |
| `npm run dev:frontend`    | Start the Next.js dev server (http://localhost:3000) |
| `npm run dev:backend`     | Start the NestJS dev server (http://localhost:3001)  |
| `npm run build`           | Build both workspaces                                |
| `npm run lint`            | Lint both workspaces                                 |
| `npm run typecheck`       | Type-check both workspaces                           |
| `npm run format`          | Format the repo with Prettier                        |
| `npm run format:check`    | Verify formatting without writing                    |
| `npm run test`            | Run workspace test suites                            |
| `npm run prisma:validate` | Validate `backend/prisma/schema.prisma`              |
| `npm run prisma:generate` | Generate the Prisma client                           |
| `npm run prisma:migrate`  | Apply/create database migrations (via `DIRECT_URL`)  |
| `npm run prisma:seed`     | Load the idempotent demo data                        |

### Per-workspace commands

```bash
npm run <script> --workspace frontend
npm run <script> --workspace backend
```

## Documentation

See [docs/architecture.md](docs/architecture.md).
