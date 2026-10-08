import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { API_PREFIX, applyAppSettings } from "../src/app.setup.js";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../src/common/guards/roles.guard.js";
import { Roles } from "../src/common/decorators/roles.decorator.js";
import { UserRole } from "../src/generated/prisma/client.js";

/**
 * Test-only support controller mounted strictly within test compilation module
 * to verify live execution of JwtAuthGuard + RolesGuard over HTTP.
 */
@Controller("test-rbac")
class RbacTestSupportController {
  @Get("admin-only")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminOnly() {
    return { access: "granted", role: UserRole.ADMIN };
  }

  @Get("club-or-admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  clubOrAdmin() {
    return { access: "granted", roles: [UserRole.ADMIN, UserRole.CLUB_ADMIN] };
  }

  @Get("student-only")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  studentOnly() {
    return { access: "granted", role: UserRole.STUDENT };
  }

  @Get("authenticated-open")
  @UseGuards(JwtAuthGuard, RolesGuard)
  authenticatedOpen() {
    return { access: "granted", roles: "all-authenticated" };
  }
}

describe("Role-Based Access Control (RBAC) (e2e)", () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let clubAdminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    // Mount the support controller on the TestingModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [RbacTestSupportController],
    }).compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(app);
    await app.init();

    // Log in with seeded accounts
    // Seed password is "CampusOS#2026"
    const adminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "admin@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    const clubAdminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "club.admin@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    clubAdminToken = clubAdminLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "student1@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("ADMIN endpoint: @Roles(UserRole.ADMIN)", () => {
    it("allows ADMIN access (200 OK)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/admin-only`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ access: "granted", role: UserRole.ADMIN });
    });

    it("rejects CLUB_ADMIN with 403 Forbidden", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/admin-only`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .expect(403);

      expect(res.body.message).toContain("permission");
    });

    it("rejects STUDENT with 403 Forbidden", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/admin-only`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      expect(res.body.message).toContain("permission");
    });

    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/admin-only`)
        .expect(401);
    });
  });

  describe("Multi-role endpoint: @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)", () => {
    it("allows ADMIN access (200 OK)", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/club-or-admin`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });

    it("allows CLUB_ADMIN access (200 OK)", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/club-or-admin`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .expect(200);
    });

    it("rejects STUDENT with 403 Forbidden", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/club-or-admin`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe("STUDENT endpoint: @Roles(UserRole.STUDENT)", () => {
    it("allows STUDENT access (200 OK)", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/student-only`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);
    });

    it("rejects ADMIN with 403 Forbidden", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/student-only`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe("Endpoint without @Roles metadata", () => {
    it("allows any authenticated user (ADMIN, CLUB_ADMIN, STUDENT)", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/authenticated-open`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/authenticated-open`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);
    });

    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/test-rbac/authenticated-open`)
        .expect(401);
    });
  });
});
