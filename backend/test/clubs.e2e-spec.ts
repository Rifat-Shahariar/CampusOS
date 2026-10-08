import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { API_PREFIX, applyAppSettings } from "../src/app.setup.js";
import { PrismaService } from "../src/database/prisma.service.js";

describe("Clubs Module (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let clubAdminToken: string;
  let studentToken: string;
  let testClubId: string;
  let testPostId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(app);
    await app.init();

    prisma = app.get(PrismaService);

    // Login accounts
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
    // Clean up created test club if it exists
    if (testClubId) {
      await prisma.clubPost.deleteMany({ where: { clubId: testClubId } });
      await prisma.clubAdminAssignment.deleteMany({
        where: { clubId: testClubId },
      });
      await prisma.club.delete({ where: { id: testClubId } }).catch(() => {});
    }
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Public Club Endpoints
  // ---------------------------------------------------------------------------
  describe("Public Club Endpoints", () => {
    it("GET /clubs returns active clubs with pagination metadata", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("meta");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify no sensitive fields leaked
      const club = res.body.data[0];
      expect(club).toHaveProperty("id");
      expect(club).toHaveProperty("name");
      expect(club).toHaveProperty("slug");
      expect(club).not.toHaveProperty("passwordHash");
    });

    it("GET /clubs?search=computer filters by club name", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs?search=Computer`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.data.some((c: { name: string }) =>
          c.name.toLowerCase().includes("computer"),
        ),
      ).toBe(true);
    });

    it("GET /clubs/:id returns public club details", async () => {
      // Fetch computer club from list
      const listRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs?search=Computer`)
        .expect(200);
      const computerClub = listRes.body.data[0];

      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs/${computerClub.id}`)
        .expect(200);

      expect(res.body.id).toBe(computerClub.id);
      expect(res.body.name).toBe(computerClub.name);
      expect(res.body._count).toHaveProperty("posts");
      expect(res.body._count).toHaveProperty("events");
    });

    it("GET /clubs/:id returns 404 for non-existent UUID", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ADMIN Club Management & RBAC
  // ---------------------------------------------------------------------------
  describe("Admin Club Management & Access Control", () => {
    it("rejects non-admin (STUDENT) from creating a club (403)", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          name: "Unauthorized Club",
          description: "Student cannot create clubs",
        })
        .expect(403);
    });

    it("rejects CLUB_ADMIN from creating a club (403)", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          name: "Unauthorized Club 2",
          description: "Club admin cannot create new clubs",
        })
        .expect(403);
    });

    it("allows ADMIN to create a new club (201)", async () => {
      const uniqueSuffix = Date.now();
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: `Robotics Club ${uniqueSuffix}`,
          slug: `robotics-club-${uniqueSuffix}`,
          description: "Hardware and robotics projects for students.",
          contactEmail: `robotics.${uniqueSuffix}@campusos.dev`,
        })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toContain("Robotics Club");
      testClubId = res.body.id;
    });

    it("rejects duplicate slug on creation with 409 Conflict", async () => {
      const existingClubRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs/${testClubId}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Robotics Club Duplicate",
          slug: existingClubRes.body.slug,
          description: "This should fail because slug is taken.",
        })
        .expect(409);
    });

    it("allows ADMIN to update any club (200)", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/clubs/${testClubId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          description: "Updated description by Admin.",
        })
        .expect(200);

      expect(res.body.description).toBe("Updated description by Admin.");
    });

    it("prevents unassigned CLUB_ADMIN from managing the new club (403)", async () => {
      await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/clubs/${testClubId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          description: "Malicious update by unassigned club admin.",
        })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Club Admin Assignments (ADMIN only)
  // ---------------------------------------------------------------------------
  describe("Club Admin Assignments", () => {
    let clubAdminUserId: string;

    beforeAll(async () => {
      const user = await prisma.user.findUnique({
        where: { email: "club.admin@campusos.dev" },
      });
      clubAdminUserId = user!.id;
    });

    it("rejects non-admin from assigning club admins (403)", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs/${testClubId}/admins`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ userId: clubAdminUserId })
        .expect(403);
    });

    it("rejects assigning a user who is not a CLUB_ADMIN (400)", async () => {
      const student = await prisma.user.findUnique({
        where: { email: "student1@campusos.dev" },
      });

      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs/${testClubId}/admins`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: student!.id })
        .expect(400);
    });

    it("allows ADMIN to assign CLUB_ADMIN to the club (201)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs/${testClubId}/admins`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: clubAdminUserId })
        .expect(201);

      expect(res.body.userId).toBe(clubAdminUserId);
      expect(res.body.clubId).toBe(testClubId);
      expect(res.body.user.role).toBe("CLUB_ADMIN");
    });

    it("rejects duplicate assignment with 409 Conflict", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs/${testClubId}/admins`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: clubAdminUserId })
        .expect(409);
    });

    it("allows assigned CLUB_ADMIN to now update the club (200)", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/clubs/${testClubId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          description: "Legitimate update by newly assigned club admin.",
        })
        .expect(200);

      expect(res.body.description).toBe(
        "Legitimate update by newly assigned club admin.",
      );
    });

    it("prevents assigned CLUB_ADMIN from deactivating the club (403)", async () => {
      await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/clubs/${testClubId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          isActive: false,
        })
        .expect(403);
    });

    it("allows ADMIN to list admins for the club (200)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs/${testClubId}/admins`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].userId).toBe(clubAdminUserId);
    });

    it("allows ADMIN to remove admin assignment (200)", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/clubs/${testClubId}/admins/${clubAdminUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe(
        "Club admin assignment removed successfully",
      );

      // Verify assignment was deleted
      const checkRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs/${testClubId}/admins`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(checkRes.body).toHaveLength(0);
    });

    // Re-assign for subsequent post tests
    it("re-assigns CLUB_ADMIN for post testing", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs/${testClubId}/admins`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ userId: clubAdminUserId })
        .expect(201);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Club Posts Management
  // ---------------------------------------------------------------------------
  describe("Club Posts Management", () => {
    it("rejects STUDENT from creating club posts (403)", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs/${testClubId}/posts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Student Post",
          content: "Should be forbidden",
        })
        .expect(403);
    });

    it("allows assigned CLUB_ADMIN to create published post (201)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/clubs/${testClubId}/posts`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          title: "Robotics Orientation 2026",
          content: "Welcome to all freshman students interested in robotics!",
          isPublished: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe("Robotics Orientation 2026");
      expect(res.body.isPublished).toBe(true);
      expect(res.body.publishedAt).not.toBeNull();
      testPostId = res.body.id;
    });

    it("GET /clubs/:clubId/posts returns the published post publicly", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs/${testClubId}/posts`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(testPostId);
      expect(res.body.data[0].createdByUser).toHaveProperty("name");
    });

    it("allows assigned CLUB_ADMIN to update post (200)", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/clubs/${testClubId}/posts/${testPostId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          title: "Robotics Orientation 2026 (Updated Venue)",
        })
        .expect(200);

      expect(res.body.title).toBe("Robotics Orientation 2026 (Updated Venue)");
    });

    it("rejects updating post with mismatched clubId (400)", async () => {
      // Use computer club id with testPostId
      const listRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs?search=Computer`)
        .expect(200);
      const computerClubId = listRes.body.data[0].id;

      await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/clubs/${computerClubId}/posts/${testPostId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          title: "Cross-club injection attempt",
        })
        .expect(400);
    });

    it("allows assigned CLUB_ADMIN to delete their club post (200)", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/clubs/${testClubId}/posts/${testPostId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .expect(200);

      expect(res.body.message).toBe("Club post deleted successfully");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Club Deactivation & Inactive Behavior
  // ---------------------------------------------------------------------------
  describe("Club Deactivation", () => {
    it("rejects non-admin (STUDENT) from deactivating a club (403)", async () => {
      await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/clubs/${testClubId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);
    });

    it("allows ADMIN to deactivate a club (200)", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/clubs/${testClubId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe("Club deactivated successfully");
      expect(res.body.id).toBe(testClubId);
    });

    it("GET /clubs/:id returns 404 for deactivated club", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs/${testClubId}`)
        .expect(404);
    });

    it("GET /clubs does not include deactivated club in public list", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/clubs?search=Robotics`)
        .expect(200);

      const found = res.body.data.find(
        (c: { id: string }) => c.id === testClubId,
      );
      expect(found).toBeUndefined();
    });
  });
});
