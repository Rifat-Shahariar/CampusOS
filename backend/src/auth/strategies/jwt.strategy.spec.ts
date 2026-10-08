import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy.js";
import { UserRole } from "../../generated/prisma/client.js";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  const config = {
    get: vi.fn((key: string) => {
      if (key === "JWT_ACCESS_SECRET")
        return "test-secret-key-12345678901234567890";
      return undefined;
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    strategy = new JwtStrategy(config);
  });

  it("validates and extracts user from valid payload", async () => {
    const payload = {
      sub: "ea000000-0000-4000-8000-000000000001",
      email: "student@campusos.dev",
      role: UserRole.STUDENT,
    };

    const user = await strategy.validate(payload);
    expect(user).toEqual({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  });

  it("throws UnauthorizedException on invalid payload", async () => {
    await expect(
      strategy.validate({ sub: "", email: "", role: UserRole.STUDENT }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
