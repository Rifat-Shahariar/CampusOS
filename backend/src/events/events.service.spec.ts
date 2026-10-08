import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { ClubsService } from "../clubs/clubs.service.js";
import {
  EventRegistrationStatus,
  UserRole,
} from "../generated/prisma/client.js";
import { EventsService } from "./events.service.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

describe("EventsService", () => {
  let service: EventsService;
  let prismaMock: {
    event: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    eventRegistration: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    eventAttendance: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    clubAdminAssignment: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  let clubsServiceMock: {
    verifyClubAccess: ReturnType<typeof vi.fn>;
  };

  const adminUser: AuthenticatedUser = {
    id: "admin-uuid-001",
    email: "admin@campusos.dev",
    role: UserRole.ADMIN,
  };

  const clubAdminUser: AuthenticatedUser = {
    id: "club-admin-uuid-001",
    email: "club.admin@campusos.dev",
    role: UserRole.CLUB_ADMIN,
  };

  const studentUser: AuthenticatedUser = {
    id: "student-uuid-001",
    email: "student@campusos.dev",
    role: UserRole.STUDENT,
  };

  const mockClub = {
    id: "club-uuid-001",
    name: "Computer Club",
    slug: "computer-club",
    logoUrl: "https://example.com/logo.png",
    contactEmail: "compclub@campusos.dev",
  };

  const mockEvent = {
    id: "event-uuid-001",
    clubId: "club-uuid-001",
    title: "Hackathon 2026",
    slug: "hackathon-2026",
    description: "48-hour competitive product build",
    coverImageUrl: "https://example.com/cover.jpg",
    eventType: "Hackathon",
    location: "Auditorium 1",
    startTime: new Date(Date.now() + 86400000 * 5),
    endTime: new Date(Date.now() + 86400000 * 7),
    registrationStart: new Date(Date.now() - 86400000),
    registrationEnd: new Date(Date.now() + 86400000 * 4),
    maxAttendees: 100,
    isRegistrationRequired: true,
    isActive: true,
    createdBy: "admin-uuid-001",
    createdAt: new Date(),
    updatedAt: new Date(),
    club: mockClub,
    registrations: [],
  };

  beforeEach(async () => {
    prismaMock = {
      event: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      eventRegistration: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      eventAttendance: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      clubAdminAssignment: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: any) => Promise<unknown>) =>
        cb(prismaMock),
      ),
    };

    clubsServiceMock = {
      verifyClubAccess: vi.fn().mockResolvedValue(mockClub),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ClubsService, useValue: clubsServiceMock },
      ],
    }).compile();

    service = moduleRef.get<EventsService>(EventsService);
  });

  // ---------------------------------------------------------------------------
  // 1. findAll (List/Filtering)
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("returns paginated events with registration status metadata", async () => {
      prismaMock.event.count.mockResolvedValue(1);
      prismaMock.event.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockEvent.id);
      expect(result.data[0].isRegistrationOpen).toBe(true);
      expect(result.data[0].isFull).toBe(false);
      expect(result.meta.total).toBe(1);
      expect(prismaMock.event.findMany).toHaveBeenCalled();
    });

    it("filters by search term, event type, and club", async () => {
      prismaMock.event.count.mockResolvedValue(0);
      prismaMock.event.findMany.mockResolvedValue([]);

      await service.findAll({
        search: "hackathon",
        eventType: "Hackathon",
        clubId: "club-uuid-001",
        clubSlug: "computer-club",
      });

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            clubId: "club-uuid-001",
            club: { slug: "computer-club" },
            eventType: { equals: "Hackathon", mode: "insensitive" },
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. findById (Details)
  // ---------------------------------------------------------------------------
  describe("findById", () => {
    it("returns event details with user registration status for authenticated student", async () => {
      prismaMock.event.findFirst.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: "reg-uuid-1",
        status: EventRegistrationStatus.REGISTERED,
        registrationCode: "COS-REG-1234",
      });

      const result = await service.findById(mockEvent.id, studentUser);

      expect(result.id).toBe(mockEvent.id);
      expect(result.isUserRegistered).toBe(true);
      expect(result.userRegistrationCode).toBe("COS-REG-1234");
    });

    it("returns public details without user registration for guest visitors", async () => {
      prismaMock.event.findFirst.mockResolvedValue(mockEvent);

      const result = await service.findById(mockEvent.id, null);

      expect(result.id).toBe(mockEvent.id);
      expect(result.isUserRegistered).toBe(false);
      expect(result.userRegistrationCode).toBeNull();
    });

    it("throws NotFoundException when event does not exist", async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);

      await expect(service.findById("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. create (Creation & Authorization)
  // ---------------------------------------------------------------------------
  describe("create", () => {
    const validDto = {
      clubId: "club-uuid-001",
      title: "New Workshop",
      description: "Hands-on coding workshop",
      eventType: "Workshop",
      location: "Lab 3",
      startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    };

    it("creates an event successfully when authorized", async () => {
      prismaMock.event.findUnique.mockResolvedValue(null); // Slug unique
      prismaMock.event.create.mockResolvedValue({
        ...mockEvent,
        title: validDto.title,
      });

      const result = await service.create(validDto, clubAdminUser);

      expect(clubsServiceMock.verifyClubAccess).toHaveBeenCalledWith(
        validDto.clubId,
        clubAdminUser,
      );
      expect(result.title).toBe(validDto.title);
    });

    it("throws BadRequestException if startTime >= endTime", async () => {
      const invalidDatesDto = {
        ...validDto,
        startTime: new Date(Date.now() + 86400000 * 5).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      };

      await expect(
        service.create(invalidDatesDto, clubAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException if registrationStart > registrationEnd", async () => {
      const invalidRegDatesDto = {
        ...validDto,
        registrationStart: new Date(Date.now() + 86400000 * 2).toISOString(),
        registrationEnd: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(
        service.create(invalidRegDatesDto, clubAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException if user is not authorized for the club", async () => {
      clubsServiceMock.verifyClubAccess.mockRejectedValue(
        new ForbiddenException("Not authorized"),
      );

      await expect(service.create(validDto, clubAdminUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 4. update & remove (Management)
  // ---------------------------------------------------------------------------
  describe("update and remove", () => {
    it("updates event details when authorized", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        title: "Updated Title",
      });

      const result = await service.update(
        mockEvent.id,
        { title: "Updated Title" },
        adminUser,
      );

      expect(clubsServiceMock.verifyClubAccess).toHaveBeenCalledWith(
        mockEvent.clubId,
        adminUser,
      );
      expect(result.title).toBe("Updated Title");
    });

    it("soft-deactivates event on remove", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.update.mockResolvedValue({
        id: mockEvent.id,
        title: mockEvent.title,
        isActive: false,
      });

      const result = await service.remove(mockEvent.id, adminUser);

      expect(result.success).toBe(true);
      expect(prismaMock.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockEvent.id },
          data: { isActive: false },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. register (Student Registration & Rules)
  // ---------------------------------------------------------------------------
  describe("register", () => {
    it("successfully registers student and returns confirmation", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
      prismaMock.eventRegistration.count.mockResolvedValue(10); // Under capacity
      prismaMock.eventRegistration.create.mockResolvedValue({
        id: "reg-1",
        registrationCode: "COS-REG-AAA1",
        status: EventRegistrationStatus.REGISTERED,
        registeredAt: new Date(),
      });

      const result = await service.register(mockEvent.id, studentUser);

      expect(result.success).toBe(true);
      expect(result.registration.status).toBe(
        EventRegistrationStatus.REGISTERED,
      );
      expect(prismaMock.eventRegistration.create).toHaveBeenCalled();
    });

    it("blocks duplicate registration with ConflictException", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: "existing-reg",
        status: EventRegistrationStatus.REGISTERED,
      });

      await expect(service.register(mockEvent.id, studentUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it("blocks registration when event is full with ConflictException", async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        maxAttendees: 50,
      });
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
      prismaMock.eventRegistration.count.mockResolvedValue(50); // Full!

      await expect(service.register(mockEvent.id, studentUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it("blocks registration when registration has closed with BadRequestException", async () => {
      const closedEvent = {
        ...mockEvent,
        registrationEnd: new Date(Date.now() - 3600000), // 1 hour ago
      };
      prismaMock.event.findUnique.mockResolvedValue(closedEvent);

      await expect(service.register(mockEvent.id, studentUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("reactivates previously cancelled registration", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: "cancelled-reg-1",
        status: EventRegistrationStatus.CANCELLED,
      });
      prismaMock.eventRegistration.count.mockResolvedValue(5);
      prismaMock.eventRegistration.update.mockResolvedValue({
        id: "cancelled-reg-1",
        registrationCode: "COS-REG-REACT1",
        status: EventRegistrationStatus.REGISTERED,
        registeredAt: new Date(),
      });

      const result = await service.register(mockEvent.id, studentUser);

      expect(result.success).toBe(true);
      expect(prismaMock.eventRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cancelled-reg-1" },
          data: expect.objectContaining({
            status: EventRegistrationStatus.REGISTERED,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. cancelRegistration & getTicket (Student Ownership)
  // ---------------------------------------------------------------------------
  describe("cancelRegistration & getTicket", () => {
    it("cancels registration by setting status to CANCELLED", async () => {
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: "reg-1",
        status: EventRegistrationStatus.REGISTERED,
      });
      prismaMock.eventRegistration.update.mockResolvedValue({
        id: "reg-1",
        status: EventRegistrationStatus.CANCELLED,
      });

      const result = await service.cancelRegistration(
        mockEvent.id,
        studentUser,
      );

      expect(result.success).toBe(true);
      expect(prismaMock.eventRegistration.update).toHaveBeenCalledWith({
        where: { id: "reg-1" },
        data: { status: EventRegistrationStatus.CANCELLED },
      });
    });

    it("throws BadRequestException if student attempts to cancel attended event", async () => {
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: "reg-1",
        status: EventRegistrationStatus.ATTENDED,
      });

      await expect(
        service.cancelRegistration(mockEvent.id, studentUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("returns ticket with qrToken only for the owner", async () => {
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: "reg-1",
        registrationCode: "COS-REG-1001",
        qrToken: "secure-qr-token-abc",
        status: EventRegistrationStatus.REGISTERED,
        registeredAt: new Date(),
        event: mockEvent,
        user: { id: studentUser.id, name: "Student 1" },
      });

      const result = await service.getTicket(mockEvent.id, studentUser);

      expect(result.qrToken).toBe("secure-qr-token-abc");
      expect(result.registrationCode).toBe("COS-REG-1001");
    });
  });

  // ---------------------------------------------------------------------------
  // 7. checkIn & getAttendance (Admin Check-in & Metrics)
  // ---------------------------------------------------------------------------
  describe("checkIn & getAttendance", () => {
    it("successfully checks in an attendee via qrToken and creates attendance record", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findFirst.mockResolvedValue({
        id: "reg-1",
        eventId: mockEvent.id,
        registrationCode: "COS-REG-1001",
        status: EventRegistrationStatus.REGISTERED,
        attendance: null,
        user: { id: studentUser.id, name: "Student 1" },
      });
      prismaMock.eventAttendance.findUnique.mockResolvedValue(null);
      prismaMock.eventAttendance.create.mockResolvedValue({
        id: "att-1",
        registrationId: "reg-1",
        checkedInBy: clubAdminUser.id,
        checkedInAt: new Date(),
      });
      prismaMock.eventRegistration.update.mockResolvedValue({
        id: "reg-1",
        registrationCode: "COS-REG-1001",
        status: EventRegistrationStatus.ATTENDED,
      });

      const result = await service.checkIn(
        mockEvent.id,
        { qrToken: "valid-qr-token" },
        clubAdminUser,
      );

      expect(result.success).toBe(true);
      expect(result.registration.status).toBe(EventRegistrationStatus.ATTENDED);
      expect(prismaMock.eventAttendance.create).toHaveBeenCalled();
    });

    it("rejects duplicate check-in with ConflictException", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findFirst.mockResolvedValue({
        id: "reg-1",
        eventId: mockEvent.id,
        status: EventRegistrationStatus.ATTENDED, // Already attended!
        attendance: { id: "existing-att" },
      });

      await expect(
        service.checkIn(
          mockEvent.id,
          { qrToken: "valid-qr-token" },
          clubAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it("returns attendance records and metrics for authorized club admin", async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventAttendance.findMany.mockResolvedValue([
        {
          id: "att-1",
          registrationId: "reg-1",
          checkedInAt: new Date(),
          registration: {
            registrationCode: "COS-REG-1001",
            registeredAt: new Date(),
            user: { id: studentUser.id, name: "Student 1" },
          },
          checkedInByUser: {
            id: clubAdminUser.id,
            name: "Club Admin",
            email: "club.admin@campusos.dev",
          },
        },
      ]);
      prismaMock.eventRegistration.count.mockResolvedValue(2); // 1 attended, 2 registered -> 0.50 rate

      const result = await service.getAttendance(mockEvent.id, clubAdminUser);

      expect(result.summary.totalRegistered).toBe(2);
      expect(result.summary.totalAttended).toBe(1);
      expect(result.summary.attendanceRate).toBe(0.5);
      expect(result.attendees).toHaveLength(1);
    });
  });
});
