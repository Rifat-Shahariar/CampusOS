import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../generated/prisma/client.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import type { AuthenticatedUser } from "../../auth/interfaces/authenticated-user.interface.js";

/**
 * Role-Based Access Control (RBAC) Guard.
 * Relies on JwtAuthGuard having already authenticated the user.
 *
 * Flow:
 * - Reads `@Roles(...)` metadata on handler or controller class.
 * - If no roles metadata exists, allows request (public/open within auth scope).
 * - Checks for authenticated user on `request.user`. If missing -> 401 Unauthorized.
 * - Checks whether user's role is in the allowed roles list.
 * - If role matches -> allowed (true).
 * - If role does not match -> 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, the endpoint does not restrict by role
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        "You do not have permission to access this resource",
      );
    }

    return true;
  }
}
