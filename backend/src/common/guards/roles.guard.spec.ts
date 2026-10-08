import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard.js";
import { UserRole } from "../../generated/prisma/client.js";
import type { AuthenticatedUser } from "../../auth/interfaces/authenticated-user.interface.js";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockExecutionContext(
    user?: AuthenticatedUser,
  ): ExecutionContext {
    const handler = () => {};
    const classRef = class TestController {};
    return {
      getHandler: () => handler,
      getClass: () => classRef,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it("allows request when no @Roles metadata exists", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    const context = createMockExecutionContext({
      id: "usr-1",
      email: "test@campusos.dev",
      role: UserRole.STUDENT,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows request when handler has empty roles metadata", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([]);

    const context = createMockExecutionContext({
      id: "usr-1",
      email: "test@campusos.dev",
      role: UserRole.STUDENT,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws UnauthorizedException (401) when user is missing from request", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN]);

    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("allows ADMIN access to ADMIN endpoint", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN]);

    const context = createMockExecutionContext({
      id: "usr-admin",
      email: "admin@campusos.dev",
      role: UserRole.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects STUDENT with ForbiddenException (403) on ADMIN endpoint", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN]);

    const context = createMockExecutionContext({
      id: "usr-student",
      email: "student@campusos.dev",
      role: UserRole.STUDENT,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("rejects CLUB_ADMIN with ForbiddenException (403) on ADMIN endpoint", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([UserRole.ADMIN]);

    const context = createMockExecutionContext({
      id: "usr-club-admin",
      email: "clubadmin@campusos.dev",
      role: UserRole.CLUB_ADMIN,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows CLUB_ADMIN on endpoint with ADMIN or CLUB_ADMIN", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRole.ADMIN,
      UserRole.CLUB_ADMIN,
    ]);

    const context = createMockExecutionContext({
      id: "usr-club-admin",
      email: "clubadmin@campusos.dev",
      role: UserRole.CLUB_ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows ADMIN on endpoint with ADMIN or CLUB_ADMIN", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRole.ADMIN,
      UserRole.CLUB_ADMIN,
    ]);

    const context = createMockExecutionContext({
      id: "usr-admin",
      email: "admin@campusos.dev",
      role: UserRole.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects STUDENT on endpoint with ADMIN or CLUB_ADMIN", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRole.ADMIN,
      UserRole.CLUB_ADMIN,
    ]);

    const context = createMockExecutionContext({
      id: "usr-student",
      email: "student@campusos.dev",
      role: UserRole.STUDENT,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows RESOURCE_ADMIN on RESOURCE_ADMIN endpoint and rejects others", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRole.RESOURCE_ADMIN,
    ]);

    const resAdminContext = createMockExecutionContext({
      id: "usr-res-admin",
      email: "resadmin@campusos.dev",
      role: UserRole.RESOURCE_ADMIN,
    });
    expect(guard.canActivate(resAdminContext)).toBe(true);

    const studentContext = createMockExecutionContext({
      id: "usr-student",
      email: "student@campusos.dev",
      role: UserRole.STUDENT,
    });
    expect(() => guard.canActivate(studentContext)).toThrow(ForbiddenException);
  });
});
