import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { API_PREFIX, applyAppSettings } from "../src/app.setup.js";
import { PrismaService } from "../src/database/prisma.service.js";
import { ResourceType } from "../src/generated/prisma/client.js";

describe("Resources Module (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let resourceAdminToken: string;
  let clubAdminToken: string;
  let student1Token: string;

  let resourceAdminUserId: string;
  let sampleCourseId: string;
  let publishedResourceId: string;
  let unpublishedResourceId: string;
  const createdResourceIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(app);
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Authenticate test accounts
    const adminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "admin@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    const resourceAdminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "resource.admin@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    resourceAdminToken = resourceAdminLogin.body.accessToken;

    const clubAdminLogin = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "club.admin@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    clubAdminToken = clubAdminLogin.body.accessToken;

    const student1Login = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "student1@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    student1Token = student1Login.body.accessToken;

    const resourceAdminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "resource.admin@campusos.dev" },
    });
    resourceAdminUserId = resourceAdminUser.id;

    // 2. Fetch seeded course
    const course = await prisma.course.findFirstOrThrow({
      where: { isActive: true },
    });
    sampleCourseId = course.id;

    // 3. Fetch seeded published and unpublished resources
    const published = await prisma.resource.findFirstOrThrow({
      where: { isPublished: true },
    });
    publishedResourceId = published.id;

    const unpublished = await prisma.resource.findFirstOrThrow({
      where: { isPublished: false },
    });
    unpublishedResourceId = unpublished.id;
  });

  afterAll(async () => {
    if (createdResourceIds.length > 0) {
      await prisma.resource.deleteMany({
        where: { id: { in: createdResourceIds } },
      });
    }
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // 1. GET /resources
  // ---------------------------------------------------------------------------

  describe(`GET /${API_PREFIX}/resources`, () => {
    it("should return paginated list of published resources publicly", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("meta");
      const body = res.body as { data: unknown[]; meta: { total: number } };
      expect(body.meta.total).toBeGreaterThanOrEqual(body.data.length);

      // Verify no unpublished items are returned for public requests
      const unpublishedItems = res.body.data.filter(
        (r: { isPublished: boolean }) => !r.isPublished,
      );
      expect(unpublishedItems).toHaveLength(0);

      // Verify structure of first item
      const item = res.body.data[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("resourceType");
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("fileUrl");
      expect(item).toHaveProperty("course");
      expect(item.course).toHaveProperty("code");
      expect(item.course).toHaveProperty("semester");
      expect(item).toHaveProperty("uploader");
    });

    it("should filter resources by semester=4", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?semester=4`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      for (const item of res.body.data) {
        expect(item.course.semester).toBe(4);
      }
    });

    it("should filter resources by semester=1", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?semester=1`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      for (const item of res.body.data) {
        expect(item.course.semester).toBe(1);
      }
    });

    it("should reject invalid semester values with 400", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?semester=0`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?semester=13`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?semester=abc`)
        .expect(400);
    });

    it("should filter resources by search keyword", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?search=Slides`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      for (const item of res.body.data) {
        const matches =
          item.title.toLowerCase().includes("slides") ||
          (item.description &&
            item.description.toLowerCase().includes("slides")) ||
          item.fileName.toLowerCase().includes("slides");
        expect(matches).toBe(true);
      }
    });

    it("should filter resources by courseId", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?courseId=${sampleCourseId}`)
        .expect(200);

      for (const item of res.body.data) {
        expect(item.courseId).toBe(sampleCourseId);
      }
    });

    it("should filter resources by resourceType", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?resourceType=NOTE`)
        .expect(200);

      for (const item of res.body.data) {
        expect(item.resourceType).toBe("NOTE");
      }
    });

    it("should support type alias for filtering", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?type=QUESTION_PAPER`)
        .expect(200);

      for (const item of res.body.data) {
        expect(item.resourceType).toBe("QUESTION_PAPER");
      }
    });

    it("should allow RESOURCE_ADMIN to query unpublished resources", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources?isPublished=false`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.some(
          (r: { id: string }) => r.id === unpublishedResourceId,
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /resources/courses
  // ---------------------------------------------------------------------------

  describe(`GET /${API_PREFIX}/resources/courses`, () => {
    it("should return active courses with department details", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/courses`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const course = res.body[0];
      expect(course).toHaveProperty("id");
      expect(course).toHaveProperty("code");
      expect(course).toHaveProperty("name");
      expect(course).toHaveProperty("semester");
      expect(typeof course.semester).toBe("number");
      expect(course).toHaveProperty("department");
      expect(course.department).toHaveProperty("code");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /resources/:id
  // ---------------------------------------------------------------------------

  describe(`GET /${API_PREFIX}/resources/:id`, () => {
    it("should return details of a published resource publicly", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/${publishedResourceId}`)
        .expect(200);

      expect(res.body.id).toBe(publishedResourceId);
      expect(res.body.isPublished).toBe(true);
      expect(res.body).toHaveProperty("course");
      expect(res.body).toHaveProperty("uploader");
    });

    it("should return 404 for non-existent UUID", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });

    it("should return 400 for invalid non-UUID format", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/not-a-valid-uuid`)
        .expect(400);
    });

    it("should return 404 for unpublished resource when requested by student or guest", async () => {
      // Guest
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/${unpublishedResourceId}`)
        .expect(404);

      // Student
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/${unpublishedResourceId}`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(404);
    });

    it("should return unpublished resource when requested by RESOURCE_ADMIN or ADMIN", async () => {
      // Resource Admin
      const resAdmin = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/${unpublishedResourceId}`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .expect(200);
      expect(resAdmin.body.id).toBe(unpublishedResourceId);
      expect(resAdmin.body.isPublished).toBe(false);

      // Admin
      const adminRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/resources/${unpublishedResourceId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(adminRes.body.id).toBe(unpublishedResourceId);
      expect(adminRes.body.isPublished).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. POST /resources
  // ---------------------------------------------------------------------------

  describe(`POST /${API_PREFIX}/resources`, () => {
    it("should return 401 when unauthenticated", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/resources`)
        .send({
          courseId: sampleCourseId,
          title: "Test Resource",
          resourceType: ResourceType.NOTE,
          fileName: "test.pdf",
          fileUrl: "https://campusos.dev/test.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
        })
        .expect(401);
    });

    it("should return 403 when authenticated as STUDENT", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/resources`)
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          courseId: sampleCourseId,
          title: "Test Resource",
          resourceType: ResourceType.NOTE,
          fileName: "test.pdf",
          fileUrl: "https://campusos.dev/test.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
        })
        .expect(403);
    });

    it("should return 403 when authenticated as CLUB_ADMIN", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/resources`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          courseId: sampleCourseId,
          title: "Test Resource",
          resourceType: ResourceType.NOTE,
          fileName: "test.pdf",
          fileUrl: "https://campusos.dev/test.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
        })
        .expect(403);
    });

    it("should return 404 if courseId does not exist", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/resources`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .send({
          courseId: "00000000-0000-4000-8000-000000000000",
          title: "Test Resource",
          resourceType: ResourceType.NOTE,
          fileName: "test.pdf",
          fileUrl: "https://campusos.dev/test.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
        })
        .expect(404);
    });

    it("should return 400 if validation fails", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/resources`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .send({
          courseId: sampleCourseId,
          // title missing
          resourceType: "INVALID_TYPE",
          fileName: "",
          fileUrl: "",
        })
        .expect(400);
    });

    it("should successfully create a resource as RESOURCE_ADMIN", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/resources`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .send({
          courseId: sampleCourseId,
          title: "Automata & Computability Notes",
          description: "DFA, NFA and Turing machines chapter notes",
          resourceType: ResourceType.NOTE,
          fileName: "automata-notes.pdf",
          fileUrl: "https://campusos.dev/uploads/resources/automata-notes.pdf",
          fileSize: 2048000,
          mimeType: "application/pdf",
          batch: "67",
          section: "A",
        })
        .expect(201);

      const created = res.body as {
        id: string;
        title: string;
        uploadedBy: string;
        isPublished: boolean;
        courseId: string;
        uploader: { id: string };
      };
      createdResourceIds.push(created.id);

      expect(created.title).toBe("Automata & Computability Notes");
      expect(created.uploadedBy).toBe(resourceAdminUserId);
      expect(created.isPublished).toBe(true);
      expect(created.courseId).toBe(sampleCourseId);
      expect(created.uploader).toBeDefined();
      expect(created.uploader.id).toBe(resourceAdminUserId);
    });

    it("should successfully create a resource with type alias as ADMIN", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/resources`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          courseId: sampleCourseId,
          title: "Operating Systems Lab Guide",
          type: ResourceType.LAB_MANUAL,
          fileName: "os-lab-guide.pdf",
          fileUrl: "https://campusos.dev/uploads/resources/os-lab-guide.pdf",
          fileSize: 1024000,
          mimeType: "application/pdf",
        })
        .expect(201);

      const created = res.body as {
        id: string;
        title: string;
        resourceType: string;
        type: string;
      };
      createdResourceIds.push(created.id);

      expect(created.title).toBe("Operating Systems Lab Guide");
      expect(created.resourceType).toBe("LAB_MANUAL");
      expect(created.type).toBe("LAB_MANUAL");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. PATCH /resources/:id
  // ---------------------------------------------------------------------------

  describe(`PATCH /${API_PREFIX}/resources/:id`, () => {
    let targetResourceId: string;

    beforeAll(async () => {
      const created = await prisma.resource.create({
        data: {
          courseId: sampleCourseId,
          title: "Pre-patch Resource",
          resourceType: ResourceType.NOTE,
          fileName: "pre-patch.pdf",
          fileUrl: "https://campusos.dev/pre-patch.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
          uploadedBy: resourceAdminUserId,
          isPublished: true,
        },
      });
      targetResourceId = created.id;
      createdResourceIds.push(created.id);
    });

    it("should return 403 for STUDENT", async () => {
      await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/resources/${targetResourceId}`)
        .set("Authorization", `Bearer ${student1Token}`)
        .send({ title: "Student Update Attempt" })
        .expect(403);
    });

    it("should update metadata as RESOURCE_ADMIN", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/resources/${targetResourceId}`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .send({
          title: "Patched Resource Title",
          description: "Updated description text",
        })
        .expect(200);

      expect(res.body.title).toBe("Patched Resource Title");
      expect(res.body.description).toBe("Updated description text");
    });

    it("should return 404 for non-existent resource", async () => {
      await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/resources/00000000-0000-0000-0000-000000000000`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Updated" })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. DELETE /resources/:id (Soft-deactivate)
  // ---------------------------------------------------------------------------

  describe(`DELETE /${API_PREFIX}/resources/:id`, () => {
    let deactivateResourceId: string;

    beforeAll(async () => {
      const created = await prisma.resource.create({
        data: {
          courseId: sampleCourseId,
          title: "Resource to Deactivate",
          resourceType: ResourceType.NOTE,
          fileName: "to-deactivate.pdf",
          fileUrl: "https://campusos.dev/to-deactivate.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
          uploadedBy: resourceAdminUserId,
          isPublished: true,
        },
      });
      deactivateResourceId = created.id;
      createdResourceIds.push(created.id);
    });

    it("should return 403 for STUDENT", async () => {
      await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/resources/${deactivateResourceId}`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(403);
    });

    it("should soft deactivate resource as RESOURCE_ADMIN", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/resources/${deactivateResourceId}`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .expect(200);

      expect(res.body.isPublished).toBe(false);

      // Verify in DB that it is deactivated
      const dbRecord = await prisma.resource.findUniqueOrThrow({
        where: { id: deactivateResourceId },
      });
      expect(dbRecord.isPublished).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Convenience Publish / Unpublish endpoints
  // ---------------------------------------------------------------------------

  describe(`PATCH /${API_PREFIX}/resources/:id/publish & unpublish`, () => {
    let toggleResourceId: string;

    beforeAll(async () => {
      const created = await prisma.resource.create({
        data: {
          courseId: sampleCourseId,
          title: "Toggle Publication Resource",
          resourceType: ResourceType.OTHER,
          fileName: "toggle.pdf",
          fileUrl: "https://campusos.dev/toggle.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
          uploadedBy: resourceAdminUserId,
          isPublished: false,
        },
      });
      toggleResourceId = created.id;
      createdResourceIds.push(created.id);
    });

    it("should publish an unpublished resource", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/resources/${toggleResourceId}/publish`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .expect(200);

      expect(res.body.isPublished).toBe(true);
    });

    it("should unpublish a published resource", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/resources/${toggleResourceId}/unpublish`)
        .set("Authorization", `Bearer ${resourceAdminToken}`)
        .expect(200);

      expect(res.body.isPublished).toBe(false);
    });
  });
});
