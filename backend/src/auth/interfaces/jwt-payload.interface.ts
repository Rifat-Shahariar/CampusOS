import type { UserRole } from "../../generated/prisma/client.js";

/**
 * Payload encoded inside the access token JWT.
 * Kept minimal and non-sensitive.
 */
export interface JwtPayload {
  /** User identifier (UUID) */
  sub: string;
  /** User email */
  email: string;
  /** User system role */
  role: UserRole;
}

/**
 * Payload encoded inside the refresh token JWT.
 */
export interface JwtRefreshPayload {
  /** User identifier (UUID) */
  sub: string;
  /** Unique token identifier (UUID) for tracking session/token instances */
  jti: string;
}
