import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { UserRole } from "../generated/prisma/client.js";
import { AuthService } from "./auth.service.js";
import { PasswordService } from "./password.service.js";

describe("AuthService", () => {
  let authService: AuthService;
  let prismaMock: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    department: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    refreshTokenSession: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };
  let passwordServiceMock: {
    hash: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
  };
  let jwtServiceMock: {
    signAsync: ReturnType<typeof vi.fn>;
    verifyAsync: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      department: {
        findUnique: vi.fn(),
      },
      refreshTokenSession: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    passwordServiceMock = {
      hash: vi.fn(),
      verify: vi.fn(),
    };

    jwtServiceMock = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    };

    const configMock = {
      get: vi.fn((key: string) => {
        if (key === "JWT_ACCESS_SECRET")
          return "test-access-secret-32-chars-long!!";
        if (key === "JWT_REFRESH_SECRET")
          return "test-refresh-secret-32-chars-long!";
        if (key === "JWT_ACCESS_EXPIRES_IN") return "15m";
        if (key === "JWT_REFRESH_EXPIRES_IN") return "7d";
        return undefined;
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PasswordService, useValue: passwordServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe("register", () => {
    const registerDto = {
      name: "New Student",
      email: "new.student@campusos.dev",
      password: "StrongPassword#2026",
      studentId: "STU-2026-001",
      batch: "67",
      section: "A",
      departmentId: "ca000000-0000-4000-8000-000000000001",
    };

    it("registers a student and creates a persistent refreshTokenSession", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // email check
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // studentId check
      prismaMock.department.findUnique.mockResolvedValueOnce({
        id: registerDto.departmentId,
        isActive: true,
      });

      passwordServiceMock.hash.mockResolvedValueOnce("hashed_password_123");
      const createdUser = {
        id: "usr-uuid-1",
        name: registerDto.name,
        email: registerDto.email,
        passwordHash: "hashed_password_123",
        studentId: registerDto.studentId,
        batch: registerDto.batch,
        section: registerDto.section,
        departmentId: registerDto.departmentId,
        role: UserRole.STUDENT,
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        department: {
          id: registerDto.departmentId,
          name: "Computer Science",
          code: "CSE",
        },
      };
      prismaMock.user.create.mockResolvedValueOnce(createdUser);

      jwtServiceMock.signAsync
        .mockResolvedValueOnce("mock.access.token")
        .mockResolvedValueOnce("mock.refresh.token");

      prismaMock.refreshTokenSession.create.mockResolvedValueOnce({
        id: "session-1",
      });

      const result = await authService.register(registerDto);

      expect(result.accessToken).toBe("mock.access.token");
      expect(result.refreshToken).toBe("mock.refresh.token");
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(prismaMock.refreshTokenSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: createdUser.id,
          }),
        }),
      );
    });

    it("rejects duplicate email with ConflictException", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: "existing-user" });

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("rejects duplicate studentId with ConflictException", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // email check
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: "existing-student",
      }); // studentId check

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("rejects missing department with BadRequestException", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        authService.register({ ...registerDto, departmentId: "" as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects non-existent department with NotFoundException", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.department.findUnique.mockResolvedValueOnce(null);

      await expect(authService.register(registerDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("rejects inactive department with NotFoundException", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.department.findUnique.mockResolvedValueOnce({
        id: registerDto.departmentId,
        isActive: false,
      });

      await expect(authService.register(registerDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("login", () => {
    const loginDto = {
      email: "student1@campusos.dev",
      password: "CampusOS#2026",
    };

    it("successfully logs in and creates a database RefreshTokenSession", async () => {
      const user = {
        id: "usr-uuid-1",
        name: "Rafid Hasan",
        email: loginDto.email,
        passwordHash: "hashed_pass",
        studentId: "CSE-2023-142",
        batch: "67",
        section: "A",
        role: UserRole.STUDENT,
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        department: null,
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      passwordServiceMock.verify.mockResolvedValueOnce(true);

      jwtServiceMock.signAsync
        .mockResolvedValueOnce("access-token-jwt")
        .mockResolvedValueOnce("refresh-token-jwt");

      prismaMock.refreshTokenSession.create.mockResolvedValueOnce({
        id: "session-1",
      });

      const result = await authService.login(loginDto);

      expect(result.accessToken).toBe("access-token-jwt");
      expect(result.refreshToken).toBe("refresh-token-jwt");
      expect(result.user.email).toBe(loginDto.email);
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(prismaMock.refreshTokenSession.create).toHaveBeenCalled();
    });

    it("rejects login with non-existent email with generic UnauthorizedException", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects login with wrong password with generic UnauthorizedException", async () => {
      const user = {
        id: "usr-uuid-1",
        email: loginDto.email,
        passwordHash: "hashed_pass",
        isActive: true,
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      passwordServiceMock.verify.mockResolvedValueOnce(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects login when user is deactivated", async () => {
      const user = {
        id: "usr-uuid-1",
        email: loginDto.email,
        passwordHash: "hashed_pass",
        isActive: false,
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("refresh and logout with persistent sessions", () => {
    it("rotates refresh token session in database", async () => {
      const user = {
        id: "usr-uuid-1",
        name: "Rafid Hasan",
        email: "student1@campusos.dev",
        role: UserRole.STUDENT,
        isActive: true,
        department: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentId: null,
        batch: null,
        section: null,
        avatarUrl: null,
      };

      // 1. Verify refresh token JWT
      jwtServiceMock.verifyAsync.mockResolvedValueOnce({
        sub: user.id,
        jti: "old-jti",
      });

      // 2. Mock persistent database session lookup
      prismaMock.refreshTokenSession.findUnique.mockResolvedValueOnce({
        id: "session-uuid-1",
        userId: user.id,
        tokenHash: "hashed-token-1",
        jti: "old-jti",
        expiresAt: new Date(Date.now() + 100000),
      });

      // 3. User lookup
      prismaMock.user.findUnique.mockResolvedValueOnce(user);

      // 4. Issue new tokens
      jwtServiceMock.signAsync
        .mockResolvedValueOnce("new-access-token")
        .mockResolvedValueOnce("new-refresh-token");

      prismaMock.refreshTokenSession.delete.mockResolvedValueOnce({
        id: "session-uuid-1",
      });
      prismaMock.refreshTokenSession.create.mockResolvedValueOnce({
        id: "session-uuid-2",
      });

      const res = await authService.refresh("mock-refresh-token");

      expect(res.accessToken).toBe("new-access-token");
      expect(res.refreshToken).toBe("new-refresh-token");
      // Old session was deleted to enforce rotation
      expect(prismaMock.refreshTokenSession.delete).toHaveBeenCalledWith({
        where: { id: "session-uuid-1" },
      });
      // New session was persisted
      expect(prismaMock.refreshTokenSession.create).toHaveBeenCalled();
    });

    it("rejects refresh if session not found in database (revoked/replayed)", async () => {
      jwtServiceMock.verifyAsync.mockResolvedValueOnce({
        sub: "usr-uuid-1",
        jti: "replayed-jti",
      });
      prismaMock.refreshTokenSession.findUnique.mockResolvedValueOnce(null);

      await expect(
        authService.refresh("replayed-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejects refresh if session is expired in database", async () => {
      jwtServiceMock.verifyAsync.mockResolvedValueOnce({
        sub: "usr-uuid-1",
        jti: "expired-jti",
      });
      prismaMock.refreshTokenSession.findUnique.mockResolvedValueOnce({
        id: "session-uuid-1",
        userId: "usr-uuid-1",
        tokenHash: "expired-hash",
        jti: "expired-jti",
        expiresAt: new Date(Date.now() - 10000), // Expired in past
      });

      await expect(
        authService.refresh("expired-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
      // Cleaned up expired session
      expect(prismaMock.refreshTokenSession.delete).toHaveBeenCalledWith({
        where: { id: "session-uuid-1" },
      });
    });

    it("logout deletes the session from the database", async () => {
      prismaMock.refreshTokenSession.deleteMany.mockResolvedValueOnce({
        count: 1,
      });

      const res = await authService.logout("valid-refresh-token");
      expect(res.success).toBe(true);
      expect(prismaMock.refreshTokenSession.deleteMany).toHaveBeenCalled();
    });
  });

  describe("getMe", () => {
    it("returns safe user data", async () => {
      const user = {
        id: "usr-uuid-1",
        name: "Rafid Hasan",
        email: "student1@campusos.dev",
        passwordHash: "super-secret-hash",
        studentId: "CSE-2023-142",
        batch: "67",
        section: "A",
        role: UserRole.STUDENT,
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        department: null,
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);

      const me = await authService.getMe("usr-uuid-1");
      expect(me.id).toBe("usr-uuid-1");
      expect(me.email).toBe("student1@campusos.dev");
      expect((me as any).passwordHash).toBeUndefined();
    });

    it("throws NotFoundException if user does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      await expect(authService.getMe("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws UnauthorizedException if user is deactivated", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: "usr-uuid-1",
        isActive: false,
      });
      await expect(authService.getMe("usr-uuid-1")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("updateProfile", () => {
    const existingUser = {
      id: "usr-uuid-1",
      name: "Rafid Hasan",
      email: "student1@campusos.dev",
      passwordHash: "super-secret-hash",
      studentId: "CSE-2023-142",
      batch: "67",
      section: "A",
      role: UserRole.STUDENT,
      avatarUrl: null,
      isActive: true,
      departmentId: "dept-uuid-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      department: {
        id: "dept-uuid-1",
        name: "Computer Science & Engineering",
        code: "CSE",
      },
    };

    it("updates allowed fields and returns safe user data", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser);
      prismaMock.department.findUnique.mockResolvedValueOnce({
        id: "dept-uuid-2",
        name: "Electrical & Electronic Engineering",
        code: "EEE",
        isActive: true,
      });

      const updatedUser = {
        ...existingUser,
        name: "Rafid Updated",
        studentId: "CSE-2023-999",
        batch: "68",
        section: "B",
        departmentId: "dept-uuid-2",
        department: {
          id: "dept-uuid-2",
          name: "Electrical & Electronic Engineering",
          code: "EEE",
        },
      };
      // Student ID check: none found for new ID
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.update.mockResolvedValueOnce(updatedUser);

      const result = await authService.updateProfile("usr-uuid-1", {
        name: "Rafid Updated",
        studentId: "CSE-2023-999",
        batch: "68",
        section: "B",
        departmentId: "dept-uuid-2",
      });

      expect(result.id).toBe("usr-uuid-1");
      expect(result.name).toBe("Rafid Updated");
      expect(result.studentId).toBe("CSE-2023-999");
      expect(result.batch).toBe("68");
      expect(result.section).toBe("B");
      expect(result.department?.code).toBe("EEE");
      expect((result as any).passwordHash).toBeUndefined();
    });

    it("throws NotFoundException if user does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      await expect(
        authService.updateProfile("non-existent", { name: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws UnauthorizedException if user is deactivated", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...existingUser,
        isActive: false,
      });
      await expect(
        authService.updateProfile("usr-uuid-1", { name: "Test" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws NotFoundException if target department is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser);
      prismaMock.department.findUnique.mockResolvedValueOnce(null);

      await expect(
        authService.updateProfile("usr-uuid-1", {
          departmentId: "invalid-dept",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException if target department is inactive", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser);
      prismaMock.department.findUnique.mockResolvedValueOnce({
        id: "dept-inactive",
        isActive: false,
      });

      await expect(
        authService.updateProfile("usr-uuid-1", {
          departmentId: "dept-inactive",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException if studentId belongs to another user", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser);
      // Another user has this student ID
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: "other-user-uuid",
      });

      await expect(
        authService.updateProfile("usr-uuid-1", {
          studentId: "DUPLICATE-ID",
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("allows keeping own studentId without throwing conflict", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser);
      prismaMock.user.update.mockResolvedValueOnce(existingUser);

      const result = await authService.updateProfile("usr-uuid-1", {
        studentId: "CSE-2023-142",
      });

      expect(result.studentId).toBe("CSE-2023-142");
      // Uniqueness query should not have been run because it didn't change
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
