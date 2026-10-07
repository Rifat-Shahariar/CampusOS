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

### Per-workspace commands

```bash
npm run <script> --workspace frontend
npm run <script> --workspace backend
```

## Documentation

See [docs/architecture.md](docs/architecture.md).
