import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { EventsService } from "./events.service.js";
import {
  CheckInDto,
  CreateEventDto,
  QueryEventsDto,
  QueryMyRegistrationsDto,
  UpdateEventDto,
} from "./dto/index.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

@ApiTags("Events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ---------------------------------------------------------------------------
  // Public Events List
  // ---------------------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: "List active events",
    description:
      "Public endpoint. Returns active/upcoming events with search, filters and pagination.",
  })
  @ApiResponse({ status: 200, description: "Paginated list of events" })
  async getEvents(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  // ---------------------------------------------------------------------------
  // Student: My Registrations
  // (Declared before :id so "my-registrations" is not treated as an id parameter)
  // ---------------------------------------------------------------------------

  @Get("my-registrations")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Get current student's event registrations",
    description:
      "STUDENT only. Returns registered/attended events for the logged-in student. Never returns QR tokens.",
  })
  @ApiResponse({ status: 200, description: "Paginated registrations list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires STUDENT role",
  })
  async getMyRegistrations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryMyRegistrationsDto,
  ) {
    return this.eventsService.getMyRegistrations(user, query);
  }

  // ---------------------------------------------------------------------------
  // Public Event Details
  // ---------------------------------------------------------------------------

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Get event details",
    description:
      "Public endpoint. Returns event details, club information, and registration availability. If logged in, indicates if current user is registered.",
  })
  @ApiParam({ name: "id", description: "Event UUID or unique slug" })
  @ApiResponse({ status: 200, description: "Event details found" })
  @ApiResponse({ status: 404, description: "Event not found or inactive" })
  async getEventById(
    @Param("id") id: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.eventsService.findById(id, user);
  }

  // ---------------------------------------------------------------------------
  // Admin / Club Admin: Event Management
  // ---------------------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Create a new event",
    description:
      "ADMIN (any club) or CLUB_ADMIN (assigned club only). Creates a new event.",
  })
  @ApiResponse({ status: 201, description: "Event successfully created" })
  @ApiResponse({
    status: 400,
    description: "Validation error or invalid dates",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not authorized to manage this club",
  })
  @ApiResponse({ status: 404, description: "Club not found" })
  @ApiResponse({ status: 409, description: "Event slug collision" })
  async createEvent(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.create(dto, user);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Update event details",
    description:
      "ADMIN (any club) or CLUB_ADMIN (assigned club only). Updates event metadata.",
  })
  @ApiParam({ name: "id", description: "Event UUID" })
  @ApiResponse({ status: 200, description: "Event successfully updated" })
  @ApiResponse({
    status: 400,
    description: "Validation error or invalid dates",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not authorized to manage this club",
  })
  @ApiResponse({ status: 404, description: "Event not found" })
  @ApiResponse({ status: 409, description: "Event slug collision" })
  async updateEvent(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.update(id, dto, user);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Deactivate an event",
    description:
      "ADMIN (any club) or CLUB_ADMIN (assigned club only). Safely deactivates event preserving integrity.",
  })
  @ApiParam({ name: "id", description: "Event UUID" })
  @ApiResponse({ status: 200, description: "Event successfully deactivated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not authorized to manage this club",
  })
  @ApiResponse({ status: 404, description: "Event not found" })
  async removeEvent(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.remove(id, user);
  }

  // ---------------------------------------------------------------------------
  // Student: Registration & Tickets
  // ---------------------------------------------------------------------------

  @Post(":eventId/register")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Register for an event",
    description:
      "STUDENT only. Registers the current user for an active event. Generates registration code and secure QR token.",
  })
  @ApiParam({ name: "eventId", description: "Event UUID" })
  @ApiResponse({ status: 201, description: "Successfully registered" })
  @ApiResponse({
    status: 400,
    description: "Event has ended or registration window closed",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires STUDENT role",
  })
  @ApiResponse({ status: 404, description: "Event not found or inactive" })
  @ApiResponse({
    status: 409,
    description: "Already registered or event at maximum capacity",
  })
  async registerForEvent(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.register(eventId, user);
  }

  @Delete(":eventId/register")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Cancel event registration",
    description:
      "STUDENT only. Cancels the student's own registration. Sets status to CANCELLED.",
  })
  @ApiParam({ name: "eventId", description: "Event UUID" })
  @ApiResponse({ status: 200, description: "Registration cancelled" })
  @ApiResponse({
    status: 400,
    description: "Cannot cancel already attended event",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires STUDENT role",
  })
  @ApiResponse({ status: 404, description: "No active registration found" })
  async cancelRegistration(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.cancelRegistration(eventId, user);
  }

  @Get(":eventId/ticket")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Get QR ticket for registered event",
    description:
      "STUDENT only. Returns ticket information including qrToken for rendering mobile/web QR pass. Accessible only by ticket owner.",
  })
  @ApiParam({ name: "eventId", description: "Event UUID" })
  @ApiResponse({ status: 200, description: "Ticket details found" })
  @ApiResponse({ status: 400, description: "Registration was cancelled" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires STUDENT role",
  })
  @ApiResponse({ status: 404, description: "Registration not found" })
  async getTicket(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.getTicket(eventId, user);
  }

  // ---------------------------------------------------------------------------
  // Admin / Club Admin: Check-In & Attendance
  // ---------------------------------------------------------------------------

  @Post(":eventId/check-in")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Check in attendee with QR token or registration code",
    description:
      "ADMIN or assigned CLUB_ADMIN. Scans QR token or enters registration code to record attendance and mark registration as ATTENDED.",
  })
  @ApiParam({ name: "eventId", description: "Event UUID" })
  @ApiResponse({ status: 201, description: "Check-in successful" })
  @ApiResponse({
    status: 400,
    description: "Missing tokens or cancelled registration",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not authorized for this club",
  })
  @ApiResponse({ status: 404, description: "Event or registration not found" })
  @ApiResponse({ status: 409, description: "Attendee already checked in" })
  async checkIn(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @Body() dto: CheckInDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.checkIn(eventId, dto, user);
  }

  @Get(":eventId/attendance")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Get attendance list and check-in metrics",
    description:
      "ADMIN or assigned CLUB_ADMIN. Returns list of attendees checked in for this event.",
  })
  @ApiParam({ name: "eventId", description: "Event UUID" })
  @ApiResponse({ status: 200, description: "Attendance records and metrics" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - not authorized for this club",
  })
  @ApiResponse({ status: 404, description: "Event not found" })
  async getAttendance(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.getAttendance(eventId, user);
  }
}
