import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload } from "../interfaces/jwt-payload.interface.js";
import type { AuthenticatedUser } from "../interfaces/authenticated-user.interface.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    const secret =
      config.get<string>("JWT_ACCESS_SECRET") ??
      config.get<string>("JWT_SECRET") ??
      "dev-access-secret-campusos-fallback";

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Passport attaches the return value to `req.user`.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    await Promise.resolve();
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException("Invalid token payload");
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
