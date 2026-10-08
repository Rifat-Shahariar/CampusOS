import type { UserRole } from "../../generated/prisma/client.js";

/**
 * Safe user object attached to Express Request by JwtAuthGuard / JwtStrategy.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
