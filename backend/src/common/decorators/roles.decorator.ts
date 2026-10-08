import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../generated/prisma/client.js";

/** Metadata key used to store required roles for endpoints */
export const ROLES_KEY = "roles";

/**
 * Decorator to declare one or more allowed UserRole(s) for a route or controller.
 * Example:
 *   @Roles(UserRole.ADMIN)
 *   @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
