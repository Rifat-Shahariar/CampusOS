import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env files on its own. Node's built-in loader keeps
// this project free of a dotenv dependency; in CI/production the variables
// come from the real environment and no .env file exists.
try {
  process.loadEnvFile();
} catch {
  // No .env file present — rely on the process environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // The seed is TypeScript with .js import specifiers, so it needs a TS-capable
    // loader (Node's built-in type stripping does not remap .js to .ts).
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI operations (migrate / studio / introspect) must run over the
    // direct connection: Supabase's pooled runtime URL (pgbouncer, port 6543)
    // cannot be used for migrations. The running application keeps using
    // DATABASE_URL (see src/database/prisma.service.ts).
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
