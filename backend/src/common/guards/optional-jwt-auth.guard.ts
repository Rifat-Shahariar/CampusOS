import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Optional JWT Auth Guard.
 * If a valid JWT Bearer token is provided, populates `request.user`.
 * If no token is provided or the token is invalid/expired, gracefully allows the
 * request to continue without setting `request.user` (i.e. guest visitor).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      return null as any;
    }
    return user;
  }
}
