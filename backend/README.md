# CampusOS — Backend

NestJS + TypeScript REST API for CampusOS.

See the [root README](../README.md) for setup and [docs/architecture.md](../docs/architecture.md)
for the module layout.

```bash
npm run start:dev --workspace backend    # from the repository root
npm run build --workspace backend
npm run lint --workspace backend
npm run prisma:validate --workspace backend
```

Environment variables: copy `.env.example` to `.env` and fill it in.

The API is served under the `/api/v1` prefix. Module directories under `src/`
are placeholders for the implementation steps that follow.
