import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../database/prisma.service.js";
import { UserRole } from "../generated/prisma/client.js";
import { PasswordService } from "./password.service.js";
import type {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  SafeUserDto,
} from "./dto/index.js";
import type { JwtPayload, JwtRefreshPayload } from "./interfaces/index.js";

@Injectable()
export class AuthService {
  private readonly jwtAccessSecret: string;
  private readonly jwtAccessExpiresIn: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.jwtAccessSecret =
      this.config.get<string>("JWT_ACCESS_SECRET") ??
      this.config.get<string>("JWT_SECRET") ??
      "dev-access-secret-campusos-fallback";

    this.jwtAccessExpiresIn =
      this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m";

    this.jwtRefreshSecret =
      this.config.get<string>("JWT_REFRESH_SECRET") ??
      "dev-refresh-secret-campusos-fallback";

    this.jwtRefreshExpiresIn =
      this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d";
  }

  /**
   * Register a new student account.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();

    // 1. Check for duplicate email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      throw new ConflictException("An account with this email already exists");
    }

    // 2. Check for duplicate studentId if provided
    if (dto.studentId) {
      const existingStudentId = await this.prisma.user.findUnique({
        where: { studentId: dto.studentId },
        select: { id: true },
      });
      if (existingStudentId) {
        throw new ConflictException(
          "An account with this student ID already exists",
        );
      }
    }

    // 3. Verify referenced department exists and is active
    if (!dto.departmentId) {
      throw new BadRequestException("Department is required");
    }

    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true, isActive: true },
    });
    if (!department || !department.isActive) {
      throw new NotFoundException(
        "Referenced department not found or inactive",
      );
    }

    // 4. Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // 5. Create user strictly with STUDENT role
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        passwordHash,
        studentId: dto.studentId ?? null,
        batch: dto.batch ?? null,
        section: dto.section ?? null,
        departmentId: dto.departmentId,
        role: UserRole.STUDENT,
        isActive: true,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toSafeUser(user),
    };
  }

  /**
   * Log in an existing user.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Safe generic authentication error
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    const isPasswordValid = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toSafeUser(user),
    };
  }

  /**
   * Refresh session tokens using a valid refresh token.
   * Rotates refresh token upon successful verification.
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token required");
    }

    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshToken,
        {
          secret: this.jwtRefreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const tokenHash = this.hashToken(refreshToken);

    // Look up persistent refresh token session in PostgreSQL
    const session = await this.prisma.refreshTokenSession.findUnique({
      where: { tokenHash },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt.getTime() < Date.now()
    ) {
      // Invalidate if found but expired or mismatched
      if (session) {
        await this.prisma.refreshTokenSession.delete({
          where: { id: session.id },
        });
      }
      throw new UnauthorizedException(
        "Refresh token has been revoked or expired",
      );
    }

    // Immediately remove/invalidate the used token to enforce rotation
    await this.prisma.refreshTokenSession.delete({
      where: { id: session.id },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or deactivated");
    }

    const newTokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      user: this.toSafeUser(user),
    };
  }

  /**
   * Invalidate a refresh token session on logout.
   */
  async logout(
    refreshToken?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshTokenSession.deleteMany({
        where: { tokenHash },
      });
    }

    return { success: true, message: "Logged out successfully" };
  }

  /**
   * Get current authenticated user details.
   */
  async getMe(userId: string): Promise<SafeUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    return this.toSafeUser(user);
  }

  /**
   * Issue access and refresh tokens, persisting the new refresh session.
   */
  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.jwtAccessSecret,
      expiresIn: this.jwtAccessExpiresIn as any,
    });

    const jti = randomUUID();
    const refreshPayload: JwtRefreshPayload = {
      sub: userId,
      jti,
    };

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiresIn as any,
    });

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.parseExpiresInToMs(this.jwtRefreshExpiresIn),
    );

    // Persist refresh token session in database
    await this.prisma.refreshTokenSession.create({
      data: {
        userId,
        tokenHash,
        jti,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private parseExpiresInToMs(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // default 7d
    }
    const val = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case "s":
        return val * 1000;
      case "m":
        return val * 60 * 1000;
      case "h":
        return val * 60 * 60 * 1000;
      case "d":
        return val * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Sanitizes User record to ensure sensitive fields are never returned.
   */
  toSafeUser(user: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    batch: string | null;
    section: string | null;
    role: UserRole;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    department?: { id: string; name: string; code: string } | null;
  }): SafeUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      batch: user.batch,
      section: user.section,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      department: user.department ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
