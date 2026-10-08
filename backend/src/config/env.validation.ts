import { Logger } from "@nestjs/common";

/**
 * Environment validation for the CampusOS API.
 *
 * Wired into `ConfigModule.forRoot({ validate })`. It is intentionally
 * *non-blocking* about the database: the app must be able to build, boot and
 * answer `GET /api/v1/health` without a reachable PostgreSQL instance, and a
 * database-backed request should fail clearly on first use instead.
 *
 * So: malformed values (bad port, non-URL FRONTEND_URL, non-postgres URL) are
 * hard errors, while a missing DATABASE_URL is only a warning.
 */

export const NODE_ENVS = ["development", "test", "production"] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

/** Reads an env value as a trimmed string without ever coercing objects. */
function readString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPostgresUrl(value: string): boolean {
  try {
    return POSTGRES_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function validateEnv(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const logger = new Logger("EnvValidation");
  const errors: string[] = [];

  const nodeEnv = readString(raw["NODE_ENV"]) || "development";
  if (!NODE_ENVS.includes(nodeEnv as NodeEnv)) {
    errors.push(
      `NODE_ENV must be one of ${NODE_ENVS.join(", ")} (received "${nodeEnv}").`,
    );
  }

  // NOTE: some environments export `PORT=0` to mean "unset"; that (and an empty
  // value) falls back to the documented default instead of being rejected.
  const portValue = readString(raw["PORT"]);
  let port = 3001;
  if (portValue !== "") {
    const parsedPort = Number(portValue);
    if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
      errors.push(
        `PORT must be an integer between 0 and 65535 (received "${portValue}").`,
      );
    } else if (parsedPort > 0) {
      port = parsedPort;
    }
  }

  const frontendUrl = readString(raw["FRONTEND_URL"]);
  if (frontendUrl !== "" && !isHttpUrl(frontendUrl)) {
    errors.push(
      `FRONTEND_URL must be an absolute http(s) URL (received "${frontendUrl}").`,
    );
  }

  const corsOrigins = readString(raw["CORS_ORIGINS"]);
  for (const origin of corsOrigins.split(",").map((item) => item.trim())) {
    if (origin !== "" && !isHttpUrl(origin)) {
      errors.push(`CORS_ORIGINS contains an invalid origin "${origin}".`);
    }
  }

  const databaseUrl = readString(raw["DATABASE_URL"]);
  const directUrl = readString(raw["DIRECT_URL"]);
  if (databaseUrl !== "" && !isPostgresUrl(databaseUrl)) {
    errors.push("DATABASE_URL must be a postgres:// or postgresql:// URL.");
  }
  if (directUrl !== "" && !isPostgresUrl(directUrl)) {
    errors.push("DIRECT_URL must be a postgres:// or postgresql:// URL.");
  }
  if (databaseUrl === "") {
    logger.warn(
      "DATABASE_URL is not set — the API will start and answer /api/v1/health, " +
        "but every database-backed request will fail until it is configured.",
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join("\n- ")}`,
    );
  }

  return {
    ...raw,
    NODE_ENV: nodeEnv,
    PORT: port,
    FRONTEND_URL: frontendUrl,
    CORS_ORIGINS: corsOrigins,
    DATABASE_URL: databaseUrl === "" ? undefined : databaseUrl,
    DIRECT_URL: directUrl === "" ? undefined : directUrl,
  };
}
