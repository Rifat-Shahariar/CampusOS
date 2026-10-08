import { Reflector } from "@nestjs/core";
import { Roles, ROLES_KEY } from "./roles.decorator.js";
import { UserRole } from "../../generated/prisma/client.js";

describe("Roles Decorator", () => {
  it("attaches metadata with the specified UserRole array", () => {
    class TestClass {
      @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
      testMethod(this: void) {}
    }

    const reflector = new Reflector();
    const metadata = reflector.get<UserRole[]>(
      ROLES_KEY,
      TestClass.prototype.testMethod,
    );

    expect(metadata).toEqual([UserRole.ADMIN, UserRole.CLUB_ADMIN]);
  });
});
