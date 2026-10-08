import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { API_PREFIX, applyAppSettings } from "../src/app.setup.js";
import { PrismaService } from "../src/database/prisma.service.js";

describe("Authentication & Persistent JWT Sessions (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let testDeptId: string;
  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(app);
    await app.init();

    prisma = app.get(PrismaService);

    // Get an active department for testing (e.g. CSE seeded)
    const dept = await prisma.department.findFirst({
      where: { isActive: true },
    });
    if (dept) {
      testDeptId = dept.id;
    }
  });

  afterAll(async () => {
    // Clean up created student user and cascade-delete sessions
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: { contains: "e2e-test-" } },
      });
      await prisma.department.deleteMany({
        where: { code: { contains: "INACT-" } },
      });
    }
    await app.close();
  });

  it("Full Auth Lifecycle: Register -> Login -> Me -> Refresh -> Logout -> Protected Guard", async () => {
    const registerPayload = {
      name: "E2E Test Student",
      email: `e2e-test-${uniqueSuffix}@campusos.dev`,
      password: "TestPassword#2026",
      studentId: `TEST-${uniqueSuffix}`,
      batch: "67",
      section: "B",
      departmentId: testDeptId,
    };

    // 0a. Reject registration without departmentId
    const missingDeptPayload = { ...registerPayload };
    delete (missingDeptPayload as Record<string, unknown>).departmentId;
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/register`)
      .send(missingDeptPayload)
      .expect(400);

    // 0b. Reject registration with invalid UUID departmentId
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/register`)
      .send({ ...registerPayload, departmentId: "invalid-uuid" })
      .expect(400);

    // 0c. Reject registration with non-existent departmentId
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/register`)
      .send({
        ...registerPayload,
        departmentId: "00000000-0000-4000-8000-000000000000",
      })
      .expect(404);

    // 1. POST /api/v1/auth/register (success with valid departmentId)
    const regRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/register`)
      .send(registerPayload)
      .expect(201);

    expect(regRes.body).toHaveProperty("accessToken");
    expect(regRes.body).toHaveProperty("refreshToken");
    expect(regRes.body.user).toMatchObject({
      name: registerPayload.name,
      email: registerPayload.email,
      studentId: registerPayload.studentId,
      role: "STUDENT",
      isActive: true,
    });
    expect(regRes.body.user.passwordHash).toBeUndefined();

    // Verify session persisted in the database
    const createdUserId = regRes.body.user.id;
    const initialSessionCount = await prisma.refreshTokenSession.count({
      where: { userId: createdUserId },
    });
    expect(initialSessionCount).toBe(1);

    // 2. Reject duplicate email on register
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/register`)
      .send(registerPayload)
      .expect(409);

    // 3. POST /api/v1/auth/login
    const loginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: registerPayload.email,
        password: registerPayload.password,
      })
      .expect(200);

    const accessToken = loginRes.body.accessToken;
    let refreshToken = loginRes.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // Multi-device verification: user now has 2 coexisting active sessions (register session + login session)
    const dualSessionCount = await prisma.refreshTokenSession.count({
      where: { userId: createdUserId },
    });
    expect(dualSessionCount).toBe(2);

    // 4. Reject login with invalid password
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: registerPayload.email,
        password: "WrongPassword123!",
      })
      .expect(401);

    // 5. GET /api/v1/auth/me (unauthenticated - missing token)
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/auth/me`)
      .expect(401);

    // 6. GET /api/v1/auth/me (authenticated)
    const meRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body.email).toBe(registerPayload.email);
    expect(meRes.body.passwordHash).toBeUndefined();

    // 7. POST /api/v1/auth/refresh (session renewal + rotation)
    const refreshRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/refresh`)
      .send({ refreshToken })
      .expect(200);

    const newAccessToken = refreshRes.body.accessToken;
    const newRefreshToken = refreshRes.body.refreshToken;
    expect(newAccessToken).toBeDefined();
    expect(newRefreshToken).toBeDefined();

    // Old refresh token must be deleted/revoked from DB and fail immediately on replay
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/refresh`)
      .send({ refreshToken })
      .expect(401);

    refreshToken = newRefreshToken;

    // 8. Simulated backend restart: Create a fresh Nest application instance
    const restartFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const restartedApp: INestApplication<App> =
      restartFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(restartedApp);
    await restartedApp.init();

    // The persistent session in PostgreSQL must still work across the restarted app
    const postRestartRefresh = await request(restartedApp.getHttpServer())
      .post(`/${API_PREFIX}/auth/refresh`)
      .send({ refreshToken })
      .expect(200);

    const rotatedTokenAfterRestart = postRestartRefresh.body.refreshToken;
    expect(rotatedTokenAfterRestart).toBeDefined();

    // 9. POST /api/v1/auth/logout
    await request(restartedApp.getHttpServer())
      .post(`/${API_PREFIX}/auth/logout`)
      .send({ refreshToken: rotatedTokenAfterRestart })
      .expect(200);

    // Refresh token should now be invalidated in the database
    await request(restartedApp.getHttpServer())
      .post(`/${API_PREFIX}/auth/refresh`)
      .send({ refreshToken: rotatedTokenAfterRestart })
      .expect(401);

    await restartedApp.close();
  });

  it("PATCH /auth/me updates allowed fields and enforces security restrictions", async () => {
    // Create two students: userA and userB
    const studentAEmail = `e2e-test-a-${uniqueSuffix}@campusos.dev`;
    const studentBEmail = `e2e-test-b-${uniqueSuffix}@campusos.dev`;
    const studentAId = `STU-A-${uniqueSuffix}`;
    const studentBId = `STU-B-${uniqueSuffix}`;

    const regARes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/register`)
      .send({
        name: "Student A",
        email: studentAEmail,
        password: "TestPassword#2026",
        studentId: studentAId,
        departmentId: testDeptId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/register`)
      .send({
        name: "Student B",
        email: studentBEmail,
        password: "TestPassword#2026",
        studentId: studentBId,
        departmentId: testDeptId,
      })
      .expect(201);

    const tokenA = regARes.body.accessToken;

    // 1. Unauthenticated PATCH is rejected
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .send({ name: "Unauthenticated Update" })
      .expect(401);

    // 2. Role cannot be changed through profile update
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ role: "ADMIN" })
      .expect(400);

    // 3. Email cannot be changed through profile update
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ email: "hacked@campusos.dev" })
      .expect(400);

    // 4. Invalid department UUID format is rejected
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ departmentId: "not-a-uuid" })
      .expect(400);

    // 5. Non-existent department UUID is rejected
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ departmentId: "00000000-0000-4000-8000-000000000000" })
      .expect(404);

    // 6. Inactive department is rejected
    const inactiveDept = await prisma.department.create({
      data: {
        name: `Inactive Dept ${uniqueSuffix}`,
        code: `INACT-${uniqueSuffix}`,
        isActive: false,
      },
    });

    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ departmentId: inactiveDept.id })
      .expect(404);

    // 7. Duplicate student ID is rejected (collides with studentB)
    await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ studentId: studentBId })
      .expect(409);

    // 8. Valid update succeeds
    const patchRes = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Student A Updated",
        studentId: `STU-A-NEW-${uniqueSuffix}`,
        batch: "70",
        section: "C",
      })
      .expect(200);

    expect(patchRes.body.name).toBe("Student A Updated");
    expect(patchRes.body.studentId).toBe(`STU-A-NEW-${uniqueSuffix}`);
    expect(patchRes.body.batch).toBe("70");
    expect(patchRes.body.section).toBe("C");
    expect(patchRes.body.passwordHash).toBeUndefined();
    expect(patchRes.body.refreshToken).toBeUndefined();

    // 9. Subsequent GET /auth/me returns updated profile
    const getMeRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/auth/me`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(getMeRes.body.name).toBe("Student A Updated");
    expect(getMeRes.body.studentId).toBe(`STU-A-NEW-${uniqueSuffix}`);
    expect(getMeRes.body.batch).toBe("70");
    expect(getMeRes.body.section).toBe("C");
    expect(getMeRes.body.passwordHash).toBeUndefined();
  });
});
