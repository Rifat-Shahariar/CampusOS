import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service.js";
import { ClubsService } from "../clubs/clubs.service.js";
import {
  EventRegistrationStatus,
  UserRole,
} from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";
import {
  CheckInDto,
  CreateEventDto,
  QueryEventsDto,
  QueryMyRegistrationsDto,
  UpdateEventDto,
} from "./dto/index.js";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clubsService: ClubsService,
  ) {}

  /**
   * Helper to validate event time boundaries and registration windows.
   */
  private validateDates(
    startTime: Date,
    endTime: Date,
    registrationStart?: Date | null,
    registrationEnd?: Date | null,
  ): void {
    if (startTime >= endTime) {
      throw new BadRequestException("Event start time must be before end time");
    }

    if (
      registrationStart &&
      registrationEnd &&
      registrationStart > registrationEnd
    ) {
      throw new BadRequestException(
        "Registration start time must be before or equal to registration end time",
      );
    }

    if (registrationEnd && registrationEnd > endTime) {
      throw new BadRequestException(
        "Registration deadline cannot be after the event end time",
      );
    }
  }

  /**
   * Generates a URL-safe unique slug for the event.
   */
  private async generateUniqueSlug(
    title: string,
    customSlug?: string,
  ): Promise<string> {
    const raw = customSlug || title;
    let baseSlug = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!baseSlug) {
      baseSlug = "event";
    }

    const existing = await this.prisma.event.findUnique({
      where: { slug: baseSlug },
    });

    if (!existing) {
      return baseSlug;
    }

    if (customSlug) {
      throw new ConflictException(
        `Event slug "${customSlug}" is already taken`,
      );
    }

    const suffix = randomBytes(3).toString("hex");
    return `${baseSlug}-${suffix}`;
  }

  /**
   * Generates a human-friendly unique registration code.
   */
  generateRegistrationCode(): string {
    const code = randomBytes(3).toString("hex").toUpperCase();
    return `COS-REG-${code}`;
  }

  // ---------------------------------------------------------------------------
  // Public Events List
  // ---------------------------------------------------------------------------

  /**
   * Public: List active/upcoming events with search, filters, and pagination.
   */
  async findAll(query: QueryEventsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: {
      isActive: boolean;
      clubId?: string;
      club?: { slug: string };
      eventType?: { equals: string; mode: "insensitive" };
      startTime?: { gte: Date };
      endTime?: { lte: Date };
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      isActive: true,
    };

    if (query.clubId) {
      where.clubId = query.clubId;
    }

    if (query.clubSlug) {
      where.club = { slug: query.clubSlug };
    }

    if (query.eventType) {
      where.eventType = { equals: query.eventType, mode: "insensitive" };
    }

    if (query.startDate) {
      where.startTime = { gte: new Date(query.startDate) };
    }

    if (query.endDate) {
      where.endTime = { lte: new Date(query.endDate) };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          registrations: {
            where: {
              status: {
                in: [
                  EventRegistrationStatus.REGISTERED,
                  EventRegistrationStatus.ATTENDED,
                ],
              },
            },
            select: { id: true },
          },
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const now = new Date();
    const data = events.map((event) => {
      const activeCount = event.registrations.length;
      const isFull =
        event.maxAttendees !== null && activeCount >= event.maxAttendees;
      const hasStarted = now >= event.startTime;
      const hasEnded = now >= event.endTime;
      const isPastRegStart =
        !event.registrationStart || now >= event.registrationStart;
      const isBeforeRegEnd =
        !event.registrationEnd || now <= event.registrationEnd;
      const isRegistrationOpen =
        event.isActive &&
        !hasStarted &&
        !hasEnded &&
        isPastRegStart &&
        isBeforeRegEnd &&
        !isFull;

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        coverImageUrl: event.coverImageUrl,
        eventType: event.eventType,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        registrationStart: event.registrationStart,
        registrationEnd: event.registrationEnd,
        maxAttendees: event.maxAttendees,
        isRegistrationRequired: event.isRegistrationRequired,
        isActive: event.isActive,
        club: event.club,
        currentAttendeesCount: activeCount,
        isFull,
        isRegistrationOpen,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Public Event Details
  // ---------------------------------------------------------------------------

  /**
   * Public: Retrieve details for an event by UUID or slug.
   * If an authenticated user is provided, checks if they are registered.
   */
  async findById(idOrSlug: string, currentUser?: AuthenticatedUser | null) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const event = await this.prisma.event.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            contactEmail: true,
          },
        },
        registrations: {
          where: {
            status: {
              in: [
                EventRegistrationStatus.REGISTERED,
                EventRegistrationStatus.ATTENDED,
              ],
            },
          },
          select: { id: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    if (!event.isActive) {
      // Inactive events can only be viewed by ADMIN or assigned CLUB_ADMIN
      if (!currentUser) {
        throw new NotFoundException("Event not found");
      }
      if (currentUser.role !== UserRole.ADMIN) {
        if (currentUser.role === UserRole.CLUB_ADMIN) {
          const assignment = await this.prisma.clubAdminAssignment.findUnique({
            where: {
              userId_clubId: {
                userId: currentUser.id,
                clubId: event.clubId,
              },
            },
          });
          if (!assignment) {
            throw new NotFoundException("Event not found");
          }
        } else {
          throw new NotFoundException("Event not found");
        }
      }
    }

    // Check user registration if authenticated
    let userRegistration: {
      id: string;
      status: EventRegistrationStatus;
      registrationCode: string;
    } | null = null;

    if (currentUser?.id) {
      userRegistration = await this.prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: currentUser.id,
          },
        },
        select: {
          id: true,
          status: true,
          registrationCode: true,
        },
      });
    }

    const now = new Date();
    const activeCount = event.registrations.length;
    const isFull =
      event.maxAttendees !== null && activeCount >= event.maxAttendees;
    const hasStarted = now >= event.startTime;
    const hasEnded = now >= event.endTime;
    const isPastRegStart =
      !event.registrationStart || now >= event.registrationStart;
    const isBeforeRegEnd =
      !event.registrationEnd || now <= event.registrationEnd;
    const isRegistrationOpen =
      event.isActive &&
      !hasStarted &&
      !hasEnded &&
      isPastRegStart &&
      isBeforeRegEnd &&
      !isFull;

    const isUserRegistered =
      userRegistration?.status === EventRegistrationStatus.REGISTERED ||
      userRegistration?.status === EventRegistrationStatus.ATTENDED;

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      coverImageUrl: event.coverImageUrl,
      eventType: event.eventType,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      registrationStart: event.registrationStart,
      registrationEnd: event.registrationEnd,
      maxAttendees: event.maxAttendees,
      isRegistrationRequired: event.isRegistrationRequired,
      isActive: event.isActive,
      club: event.club,
      currentAttendeesCount: activeCount,
      isFull,
      isRegistrationOpen,
      isUserRegistered,
      userRegistrationStatus: userRegistration?.status ?? null,
      userRegistrationCode: isUserRegistered
        ? userRegistration?.registrationCode
        : null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Admin / Club Admin Event Management
  // ---------------------------------------------------------------------------

  /**
   * Create a new event.
   * Access: ADMIN (any club), CLUB_ADMIN (assigned club only).
   */
  async create(dto: CreateEventDto, user: AuthenticatedUser) {
    // Verify club exists and user has management access
    await this.clubsService.verifyClubAccess(dto.clubId, user);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const regStart = dto.registrationStart
      ? new Date(dto.registrationStart)
      : null;
    const regEnd = dto.registrationEnd ? new Date(dto.registrationEnd) : null;

    this.validateDates(startTime, endTime, regStart, regEnd);

    const slug = await this.generateUniqueSlug(dto.title, dto.slug);

    const event = await this.prisma.event.create({
      data: {
        clubId: dto.clubId,
        title: dto.title,
        slug,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl ?? null,
        eventType: dto.eventType,
        location: dto.location,
        startTime,
        endTime,
        registrationStart: regStart,
        registrationEnd: regEnd,
        maxAttendees: dto.maxAttendees ?? null,
        isRegistrationRequired: dto.isRegistrationRequired ?? false,
        isActive: dto.isActive ?? true,
        createdBy: user.id,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    return event;
  }

  /**
   * Update an existing event.
   * Access: ADMIN (any club), CLUB_ADMIN (assigned club only).
   */
  async update(id: string, dto: UpdateEventDto, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    // Verify access to current club
    await this.clubsService.verifyClubAccess(event.clubId, user);

    // If changing clubId, verify access to the target club as well
    if (dto.clubId && dto.clubId !== event.clubId) {
      await this.clubsService.verifyClubAccess(dto.clubId, user);
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : event.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : event.endTime;
    const regStart =
      dto.registrationStart !== undefined
        ? dto.registrationStart
          ? new Date(dto.registrationStart)
          : null
        : event.registrationStart;
    const regEnd =
      dto.registrationEnd !== undefined
        ? dto.registrationEnd
          ? new Date(dto.registrationEnd)
          : null
        : event.registrationEnd;

    this.validateDates(startTime, endTime, regStart, regEnd);

    let slug = event.slug;
    if (dto.slug && dto.slug !== event.slug) {
      const existing = await this.prisma.event.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(
          `Event slug "${dto.slug}" is already taken`,
        );
      }
      slug = dto.slug;
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        clubId: dto.clubId ?? event.clubId,
        title: dto.title ?? event.title,
        slug,
        description: dto.description ?? event.description,
        coverImageUrl:
          dto.coverImageUrl !== undefined
            ? dto.coverImageUrl
            : event.coverImageUrl,
        eventType: dto.eventType ?? event.eventType,
        location: dto.location ?? event.location,
        startTime,
        endTime,
        registrationStart: regStart,
        registrationEnd: regEnd,
        maxAttendees:
          dto.maxAttendees !== undefined
            ? dto.maxAttendees
            : event.maxAttendees,
        isRegistrationRequired:
          dto.isRegistrationRequired !== undefined
            ? dto.isRegistrationRequired
            : event.isRegistrationRequired,
        isActive: dto.isActive !== undefined ? dto.isActive : event.isActive,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Deactivate an event (safe deactivation preserving referential integrity).
   * Access: ADMIN or assigned CLUB_ADMIN.
   */
  async remove(id: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    await this.clubsService.verifyClubAccess(event.clubId, user);

    const deactivated = await this.prisma.event.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, title: true, isActive: true },
    });

    return {
      success: true,
      message: "Event deactivated successfully",
      event: deactivated,
    };
  }

  // ---------------------------------------------------------------------------
  // Student Event Registration
  // ---------------------------------------------------------------------------

  /**
   * Register for an event.
   * Access: Authenticated STUDENT.
   *
   * Business rules:
   * - Event must exist and be active.
   * - Event must not have ended.
   * - If registration windows are set, they are strictly enforced.
   * - If maxAttendees is set, active registrations must not exceed capacity.
   * - Concurrency safe via Prisma transaction.
   * - Cancelled registrations are reactivated to preserve (eventId, userId) unique constraint.
   */
  async register(eventId: string, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
      });

      if (!event || !event.isActive) {
        throw new NotFoundException("Event not found or is currently inactive");
      }

      const now = new Date();

      if (now >= event.endTime) {
        throw new BadRequestException("Event has already ended");
      }

      if (event.registrationStart && now < event.registrationStart) {
        throw new BadRequestException(
          "Registration has not opened yet for this event",
        );
      }

      if (event.registrationEnd && now > event.registrationEnd) {
        throw new BadRequestException(
          "Registration deadline has passed for this event",
        );
      }

      // Check existing registration
      const existing = await tx.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
      });

      if (existing) {
        if (existing.status === EventRegistrationStatus.REGISTERED) {
          throw new ConflictException(
            "You are already registered for this event",
          );
        }
        if (existing.status === EventRegistrationStatus.ATTENDED) {
          throw new ConflictException(
            "You have already attended this event and cannot re-register",
          );
        }
      }

      // Check capacity
      if (event.maxAttendees !== null) {
        const activeCount = await tx.eventRegistration.count({
          where: {
            eventId,
            status: {
              in: [
                EventRegistrationStatus.REGISTERED,
                EventRegistrationStatus.ATTENDED,
              ],
            },
          },
        });

        if (activeCount >= event.maxAttendees) {
          throw new ConflictException("Event has reached maximum capacity");
        }
      }

      const registrationCode = this.generateRegistrationCode();
      const qrToken = randomBytes(16).toString("hex");

      let registrationRecord;

      if (existing && existing.status === EventRegistrationStatus.CANCELLED) {
        // Reactivate previously cancelled registration
        registrationRecord = await tx.eventRegistration.update({
          where: { id: existing.id },
          data: {
            registrationCode,
            qrToken,
            status: EventRegistrationStatus.REGISTERED,
            registeredAt: new Date(),
          },
        });
      } else {
        // Create new registration
        registrationRecord = await tx.eventRegistration.create({
          data: {
            eventId,
            userId: user.id,
            registrationCode,
            qrToken,
            status: EventRegistrationStatus.REGISTERED,
            registeredAt: new Date(),
          },
        });
      }

      return {
        success: true,
        message: "Registration successful",
        registration: {
          id: registrationRecord.id,
          registrationCode: registrationRecord.registrationCode,
          status: registrationRecord.status,
          registeredAt: registrationRecord.registeredAt,
          event: {
            id: event.id,
            title: event.title,
            slug: event.slug,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            club: event.club,
          },
        },
      };
    });
  }

  /**
   * Cancel an event registration.
   * Access: Authenticated STUDENT (must own the registration).
   */
  async cancelRegistration(eventId: string, user: AuthenticatedUser) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (
      !registration ||
      registration.status === EventRegistrationStatus.CANCELLED
    ) {
      throw new NotFoundException(
        "No active registration found for this event",
      );
    }

    if (registration.status === EventRegistrationStatus.ATTENDED) {
      throw new BadRequestException(
        "Cannot cancel registration for an event you have already attended",
      );
    }

    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: EventRegistrationStatus.CANCELLED,
      },
    });

    return {
      success: true,
      message: "Registration cancelled successfully",
    };
  }

  // ---------------------------------------------------------------------------
  // My Registrations
  // ---------------------------------------------------------------------------

  /**
   * List registrations for the authenticated student.
   * QR tokens are NEVER returned in this list.
   */
  async getMyRegistrations(
    user: AuthenticatedUser,
    query: QueryMyRegistrationsDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, registrations] = await Promise.all([
      this.prisma.eventRegistration.count({ where }),
      this.prisma.eventRegistration.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              eventType: true,
              location: true,
              startTime: true,
              endTime: true,
              coverImageUrl: true,
              isActive: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
        orderBy: { registeredAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const data = registrations.map((reg) => ({
      id: reg.id,
      registrationCode: reg.registrationCode,
      status: reg.status,
      registeredAt: reg.registeredAt,
      event: reg.event,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // QR Ticket
  // ---------------------------------------------------------------------------

  /**
   * Retrieve ticket with QR token for an active registration.
   * Access: Authenticated STUDENT (must own the registration).
   * Note: This is the ONLY endpoint where qrToken is exposed.
   */
  async getTicket(eventId: string, user: AuthenticatedUser) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            eventType: true,
            location: true,
            startTime: true,
            endTime: true,
            coverImageUrl: true,
            isActive: true,
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            batch: true,
            section: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(
        "You do not have a registration for this event",
      );
    }

    if (registration.status === EventRegistrationStatus.CANCELLED) {
      throw new BadRequestException(
        "Your registration for this event has been cancelled",
      );
    }

    return {
      id: registration.id,
      registrationCode: registration.registrationCode,
      qrToken: registration.qrToken,
      status: registration.status,
      registeredAt: registration.registeredAt,
      event: registration.event,
      attendee: registration.user,
    };
  }

  // ---------------------------------------------------------------------------
  // Check-In
  // ---------------------------------------------------------------------------

  /**
   * Check in an attendee using their QR token or registration code.
   * Access: ADMIN or assigned CLUB_ADMIN for the event's club.
   */
  async checkIn(eventId: string, dto: CheckInDto, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    // Verify caller can manage this club
    await this.clubsService.verifyClubAccess(event.clubId, user);

    if (!dto.qrToken && !dto.registrationCode) {
      throw new BadRequestException(
        "Either qrToken or registrationCode must be provided",
      );
    }

    const registration = await this.prisma.eventRegistration.findFirst({
      where: {
        eventId,
        ...(dto.qrToken
          ? { qrToken: dto.qrToken }
          : { registrationCode: dto.registrationCode }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            batch: true,
            section: true,
          },
        },
        attendance: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(
        "No matching registration found for this event",
      );
    }

    if (
      registration.status === EventRegistrationStatus.ATTENDED ||
      registration.attendance
    ) {
      throw new ConflictException("Attendee is already checked in");
    }

    if (registration.status === EventRegistrationStatus.CANCELLED) {
      throw new BadRequestException(
        "Registration was cancelled and is not valid for check-in",
      );
    }

    if (registration.status !== EventRegistrationStatus.REGISTERED) {
      throw new BadRequestException("Registration is not valid for check-in");
    }

    return this.prisma.$transaction(async (tx) => {
      const existingAttendance = await tx.eventAttendance.findUnique({
        where: { registrationId: registration.id },
      });

      if (existingAttendance) {
        throw new ConflictException("Attendee is already checked in");
      }

      const attendance = await tx.eventAttendance.create({
        data: {
          registrationId: registration.id,
          checkedInBy: user.id,
          checkedInAt: new Date(),
        },
      });

      const updatedRegistration = await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: EventRegistrationStatus.ATTENDED,
        },
      });

      return {
        success: true,
        message: "Check-in successful",
        attendance: {
          id: attendance.id,
          checkedInAt: attendance.checkedInAt,
          checkedInBy: user.id,
        },
        registration: {
          id: updatedRegistration.id,
          registrationCode: updatedRegistration.registrationCode,
          status: updatedRegistration.status,
          attendee: registration.user,
        },
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Attendance List & Metrics
  // ---------------------------------------------------------------------------

  /**
   * Retrieve event attendance records and check-in metrics.
   * Access: ADMIN or assigned CLUB_ADMIN for the event's club.
   */
  async getAttendance(eventId: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    await this.clubsService.verifyClubAccess(event.clubId, user);

    const [attendances, totalRegistered] = await Promise.all([
      this.prisma.eventAttendance.findMany({
        where: {
          registration: {
            eventId,
          },
        },
        include: {
          registration: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  studentId: true,
                  batch: true,
                  section: true,
                },
              },
            },
          },
          checkedInByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { checkedInAt: "desc" },
      }),
      this.prisma.eventRegistration.count({
        where: {
          eventId,
          status: {
            in: [
              EventRegistrationStatus.REGISTERED,
              EventRegistrationStatus.ATTENDED,
            ],
          },
        },
      }),
    ]);

    const totalAttended = attendances.length;
    const attendanceRate =
      totalRegistered > 0
        ? Number((totalAttended / totalRegistered).toFixed(2))
        : 0;

    return {
      eventId: event.id,
      eventTitle: event.title,
      summary: {
        totalRegistered,
        totalAttended,
        attendanceRate,
      },
      attendees: attendances.map((att) => ({
        attendanceId: att.id,
        registrationId: att.registrationId,
        registrationCode: att.registration.registrationCode,
        registeredAt: att.registration.registeredAt,
        checkedInAt: att.checkedInAt,
        checkedInBy: att.checkedInByUser,
        student: att.registration.user,
      })),
    };
  }
}
