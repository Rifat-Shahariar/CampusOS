/**
 * Prisma-only connection-string options that the node-postgres driver behind
 * `@prisma/adapter-pg` does not understand. Passing them through blindly is a
 * common source of confusing runtime errors, so they are removed before the
 * URL reaches the driver. Driver-relevant parameters (e.g. `sslmode`) and any
 * unknown ones are preserved.
 *
 * @see https://www.prisma.io/docs/orm/overview/databases/postgresql
 */
const PRISMA_ONLY_PARAMS = new Set([
  "pgbouncer",
  "schema",
  "connection_limit",
  "pool_timeout",
  "connect_timeout",
  "socket_timeout",
  "statement_cache_size",
  "sslaccept",
]);

/**
 * Normalises a Prisma/PostgreSQL connection string into one that
 * node-postgres can consume. Invalid or empty input is returned unchanged so
 * the driver reports the real problem instead of this helper hiding it.
 */
export function toNodePostgresUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "";
  }

  try {
    const url = new URL(trimmed);
    for (const key of [...url.searchParams.keys()]) {
      if (PRISMA_ONLY_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    return trimmed;
  }
}
