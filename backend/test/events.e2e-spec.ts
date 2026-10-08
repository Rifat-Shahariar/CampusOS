import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { API_PREFIX, applyAppSettings } from "../src/app.setup.js";
import { PrismaService } from "../src/database/prisma.service.js";
import { EventRegistrationStatus } from "../src/generated/prisma/client.js";

describe("Events Module (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let clubAdminToken: string;
  let student1Token: string;
  let student2Token: string;

  let adminUserId: string;
  let seededClubId: string;
  let unassignedClubId: string;
  let testEventId: string;
  let testEventForCheckInId: string;
  let fullEventId: string;
  let closedEventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(app);
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Authenticate seeded test accounts
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

    const student1Login = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "student1@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    student1Token = student1Login.body.accessToken;

    const student2Login = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: "student2@campusos.dev", password: "CampusOS#2026" })
      .expect(200);
    student2Token = student2Login.body.accessToken;

    // 2. Fetch seeded computer club (assigned to clubAdmin) and admin user
    const compClub = await prisma.club.findUniqueOrThrow({
      where: { slug: "computer-club" },
    });
    seededClubId = compClub.id;

    const adminUserRecord = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@campusos.dev" },
    });
    adminUserId = adminUserRecord.id;

    // 3. Create a temporary unassigned club (no assignment for clubAdmin)
    const unassignedClub = await prisma.club.create({
      data: {
        name: "Robotics Club",
        slug: `robotics-club-${Date.now()}`,
        description: "Autonomous robots and hardware prototyping",
      },
    });
    unassignedClubId = unassignedClub.id;

    // 4. Create an event with maxAttendees: 1 for capacity testing
    const fullEvent = await prisma.event.create({
      data: {
        clubId: seededClubId,
        title: `Capacity Test Event ${Date.now()}`,
        slug: `capacity-test-event-${Date.now()}`,
        description: "Event with strict 1 person capacity",
        eventType: "Workshop",
        location: "Lab 1",
        startTime: new Date(Date.now() + 86400000 * 10),
        endTime: new Date(Date.now() + 86400000 * 11),
        maxAttendees: 1,
        isRegistrationRequired: true,
        createdBy: adminUserId,
      },
    });
    fullEventId = fullEvent.id;

    // Register student2 directly to fill the event
    await prisma.eventRegistration.create({
      data: {
        eventId: fullEventId,
        userId: (
          await prisma.user.findUniqueOrThrow({
            where: { email: "student2@campusos.dev" },
          })
        ).id,
        registrationCode: `COS-REG-FULL-${Date.now().toString().slice(-4)}`,
        qrToken: `full-qr-token-${Date.now()}`,
        status: EventRegistrationStatus.REGISTERED,
      },
    });

    // 5. Create an event whose registration window has ended
    const closedEvent = await prisma.event.create({
      data: {
        clubId: seededClubId,
        title: `Closed Window Event ${Date.now()}`,
        slug: `closed-window-event-${Date.now()}`,
        description: "Event whose registration deadline has passed",
        eventType: "Seminar",
        location: "Room 101",
        startTime: new Date(Date.now() + 86400000 * 5),
        endTime: new Date(Date.now() + 86400000 * 6),
        registrationStart: new Date(Date.now() - 86400000 * 10),
        registrationEnd: new Date(Date.now() - 86400000 * 2), // Closed 2 days ago
        isRegistrationRequired: true,
        createdBy: adminUserId,
      },
    });
    closedEventId = closedEvent.id;
  });

  afterAll(async () => {
    // Clean up created test data
    const allEventIds = [
      testEventId,
      testEventForCheckInId,
      fullEventId,
      closedEventId,
    ].filter(Boolean);

    for (const eid of allEventIds) {
      await prisma.eventAttendance
        .deleteMany({
          where: { registration: { eventId: eid } },
        })
        .catch(() => {});
      await prisma.eventRegistration
        .deleteMany({
          where: { eventId: eid },
        })
        .catch(() => {});
      await prisma.event.delete({ where: { id: eid } }).catch(() => {});
    }

    if (unassignedClubId) {
      await prisma.club
        .delete({ where: { id: unassignedClubId } })
        .catch(() => {});
    }

    await app.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Public Event Feed & Details
  // ---------------------------------------------------------------------------
  describe("Public Event Feed & Details", () => {
    it("GET /events returns active events with pagination metadata", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("meta");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const event = res.body.data[0];
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("club");
      expect(event.club).toHaveProperty("name");
      expect(event).toHaveProperty("isRegistrationOpen");
      expect(event).not.toHaveProperty("qrToken");
    });

    it("GET /events?search=Git filters by title/description", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events?search=Git`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.data.some((e: { title: string }) =>
          e.title.toLowerCase().includes("git"),
        ),
      ).toBe(true);
    });

    it("GET /events/:id returns public event details for unauthenticated visitor", async () => {
      const listRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events`)
        .expect(200);

      const publicEvent = listRes.body.data[0];

      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${publicEvent.id}`)
        .expect(200);

      expect(res.body.id).toBe(publicEvent.id);
      expect(res.body.title).toBe(publicEvent.title);
      expect(res.body.isUserRegistered).toBe(false);
      expect(res.body.userRegistrationCode).toBeNull();
      expect(res.body).not.toHaveProperty("qrToken");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Admin & Club Admin Event Management
  // ---------------------------------------------------------------------------
  describe("Admin & Club Admin Event Management", () => {
    it("POST /events: assigned CLUB_ADMIN can create an event for their club", async () => {
      const startTime = new Date(Date.now() + 86400000 * 20).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 21).toISOString();

      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          clubId: seededClubId,
          title: `E2E Tech Fest ${Date.now()}`,
          description: "Annual university technical festival and hackathon",
          eventType: "Festival",
          location: "Central Field",
          startTime,
          endTime,
          isRegistrationRequired: true,
          maxAttendees: 50,
        })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.clubId).toBe(seededClubId);
      testEventId = res.body.id;
    });

    it("POST /events: STUDENT cannot create an event (403 Forbidden)", async () => {
      const startTime = new Date(Date.now() + 86400000 * 20).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 21).toISOString();

      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events`)
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          clubId: seededClubId,
          title: "Student Unauthorized Event",
          description: "Attempted creation by unauthorized student",
          eventType: "Social",
          location: "Cafeteria",
          startTime,
          endTime,
        })
        .expect(403);
    });

    it("POST /events: CLUB_ADMIN cannot create event for unassigned club (403 Forbidden)", async () => {
      const startTime = new Date(Date.now() + 86400000 * 20).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 21).toISOString();

      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          clubId: unassignedClubId,
          title: "Unassigned Club Event Attempt",
          description: "Attempt by club admin without assignment",
          eventType: "Workshop",
          location: "Lab",
          startTime,
          endTime,
        })
        .expect(403);
    });

    it("PATCH /events/:id: assigned CLUB_ADMIN can update event metadata", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/${API_PREFIX}/events/${testEventId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({
          title: "E2E Tech Fest 2026 Updated",
          location: "Updated Auditorium B",
        })
        .expect(200);

      expect(res.body.title).toBe("E2E Tech Fest 2026 Updated");
      expect(res.body.location).toBe("Updated Auditorium B");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Student Registration Flow & Capacity Rules
  // ---------------------------------------------------------------------------
  describe("Student Registration Flow", () => {
    it("POST /events/:eventId/register: STUDENT can register for an active event", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${testEventId}/register`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.registration).toHaveProperty("registrationCode");
      expect(res.body.registration.status).toBe(
        EventRegistrationStatus.REGISTERED,
      );
    });

    it("POST /events/:eventId/register: duplicate registration is blocked (409 Conflict)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${testEventId}/register`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(409);

      expect(res.body.message).toContain("already registered");
    });

    it("POST /events/:eventId/register: blocked when event capacity is full (409 Conflict)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${fullEventId}/register`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(409);

      expect(res.body.message).toContain("maximum capacity");
    });

    it("POST /events/:eventId/register: blocked when registration window is closed (400 Bad Request)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${closedEventId}/register`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(400);

      expect(res.body.message).toContain("Registration deadline has passed");
    });

    it("GET /events/:id: shows current student is registered", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventId}`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(200);

      expect(res.body.isUserRegistered).toBe(true);
      expect(res.body.userRegistrationCode).toMatch(/^COS-REG-/);
      expect(res.body).not.toHaveProperty("qrToken");
    });

    it("GET /events/my-registrations: returns registrations without leaking QR tokens", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/my-registrations`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const reg = res.body.data.find(
        (r: { event: { id: string } }) => r.event.id === testEventId,
      );
      expect(reg).toBeDefined();
      expect(reg).toHaveProperty("registrationCode");
      expect(reg).not.toHaveProperty("qrToken");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. QR Ticket Flow & Student Privacy
  // ---------------------------------------------------------------------------
  describe("QR Ticket Flow & Security", () => {
    it("GET /events/:eventId/ticket: STUDENT can retrieve their QR ticket", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventId}/ticket`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty("qrToken");
      expect(res.body).toHaveProperty("registrationCode");
      expect(res.body.status).toBe(EventRegistrationStatus.REGISTERED);
      expect(res.body.attendee.email).toBe("student1@campusos.dev");
    });

    it("GET /events/:eventId/ticket: student2 cannot retrieve student1's ticket (404 Not Found)", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventId}/ticket`)
        .set("Authorization", `Bearer ${student2Token}`)
        .expect(404);
    });

    it("DELETE /events/:eventId/register: student can cancel registration", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/events/${testEventId}/register`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it("GET /events/:eventId/ticket on cancelled registration returns 400 Bad Request", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventId}/ticket`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(400);
    });

    it("POST /events/:eventId/register reactivates cancelled registration with fresh ticket", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${testEventId}/register`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(201);

      expect(res.body.success).toBe(true);

      const ticketRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventId}/ticket`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(200);

      expect(ticketRes.body.status).toBe(EventRegistrationStatus.REGISTERED);
      expect(ticketRes.body.qrToken).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Check-In & Attendance Flow
  // ---------------------------------------------------------------------------
  describe("Check-In & Attendance Flow", () => {
    let checkInQrToken: string;

    beforeAll(async () => {
      // Create dedicated check-in event
      const startTime = new Date(Date.now() + 86400000 * 2).toISOString();
      const endTime = new Date(Date.now() + 86400000 * 3).toISOString();

      const eventRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          clubId: seededClubId,
          title: `Check-in Test Event ${Date.now()}`,
          description:
            "Event for end-to-end check-in and attendance verification",
          eventType: "Workshop",
          location: "Room 404",
          startTime,
          endTime,
          isRegistrationRequired: true,
        })
        .expect(201);
      testEventForCheckInId = eventRes.body.id;

      // Student1 registers
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${testEventForCheckInId}/register`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(201);

      // Student1 retrieves QR token
      const ticketRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventForCheckInId}/ticket`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(200);
      checkInQrToken = ticketRes.body.qrToken;
    });

    it("POST /events/:eventId/check-in: STUDENT cannot check in attendees (403 Forbidden)", async () => {
      await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${testEventForCheckInId}/check-in`)
        .set("Authorization", `Bearer ${student1Token}`)
        .send({ qrToken: checkInQrToken })
        .expect(403);
    });

    it("POST /events/:eventId/check-in: unassigned CLUB_ADMIN cannot check in for another club (403)", async () => {
      // Create an event for the unassigned club
      const otherEvent = await prisma.event.create({
        data: {
          clubId: unassignedClubId,
          title: `Other Club Event ${Date.now()}`,
          slug: `other-club-event-${Date.now()}`,
          description: "Unassigned club event",
          eventType: "Social",
          location: "Grounds",
          startTime: new Date(Date.now() + 86400000),
          endTime: new Date(Date.now() + 86400000 * 2),
          createdBy: adminUserId,
        },
      });

      try {
        await request(app.getHttpServer())
          .post(`/${API_PREFIX}/events/${otherEvent.id}/check-in`)
          .set("Authorization", `Bearer ${clubAdminToken}`)
          .send({ qrToken: "dummy-qr-token" })
          .expect(403);
      } finally {
        await prisma.event
          .delete({ where: { id: otherEvent.id } })
          .catch(() => {});
      }
    });

    it("POST /events/:eventId/check-in: assigned CLUB_ADMIN can check in valid registration", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${testEventForCheckInId}/check-in`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({ qrToken: checkInQrToken })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.registration.status).toBe(
        EventRegistrationStatus.ATTENDED,
      );
      expect(res.body.attendance).toHaveProperty("checkedInAt");
    });

    it("POST /events/:eventId/check-in: duplicate check-in is blocked (409 Conflict)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/events/${testEventForCheckInId}/check-in`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .send({ qrToken: checkInQrToken })
        .expect(409);

      expect(res.body.message).toContain("already checked in");
    });

    it("GET /events/:eventId/attendance: STUDENT cannot access attendance (403 Forbidden)", async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventForCheckInId}/attendance`)
        .set("Authorization", `Bearer ${student1Token}`)
        .expect(403);
    });

    it("GET /events/:eventId/attendance: assigned CLUB_ADMIN can retrieve attendance records and metrics", async () => {
      const res = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/events/${testEventForCheckInId}/attendance`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("summary");
      expect(res.body.summary.totalAttended).toBe(1);
      expect(res.body.summary.attendanceRate).toBeGreaterThan(0);
      expect(res.body.attendees.length).toBe(1);
      expect(res.body.attendees[0].student.email).toBe("student1@campusos.dev");
      expect(res.body.attendees[0].checkedInBy.email).toBe(
        "club.admin@campusos.dev",
      );
    });

    it("DELETE /events/:id: assigned CLUB_ADMIN can deactivate event", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/${API_PREFIX}/events/${testEventId}`)
        .set("Authorization", `Bearer ${clubAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.event.isActive).toBe(false);
    });
  });
});
