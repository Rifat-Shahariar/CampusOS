import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { ClubsService } from "./clubs.service.js";
import {
  AssignClubAdminDto,
  CreateClubDto,
  CreateClubPostDto,
  QueryClubPostsDto,
  QueryClubsDto,
  UpdateClubDto,
  UpdateClubPostDto,
} from "./dto/index.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

@ApiTags("Clubs")
@Controller("clubs")
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // ---------------------------------------------------------------------------
  // Public Endpoints
  // ---------------------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: "List active clubs",
    description:
      "Public endpoint. Returns active clubs with optional text search and pagination.",
  })
  @ApiResponse({ status: 200, description: "Paginated list of active clubs" })
  async getClubs(@Query() query: QueryClubsDto) {
    return this.clubsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get club details",
    description: "Public endpoint. Returns details for an active club.",
  })
  @ApiParam({ name: "id", description: "Club UUID" })
  @ApiResponse({ status: 200, description: "Club details found" })
  @ApiResponse({ status: 404, description: "Club not found or inactive" })
  async getClubById(@Param("id", ParseUUIDPipe) id: string) {
    return this.clubsService.findById(id);
  }

  // ---------------------------------------------------------------------------
  // Club Management (Admin / Assigned Club Admin)
  // ---------------------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Create a new club",
    description: "ADMIN only. Creates a new club with unique slug.",
  })
  @ApiResponse({ status: 201, description: "Club successfully created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 409, description: "Club slug already exists" })
  async createClub(@Body() dto: CreateClubDto) {
    return this.clubsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Update club details",
    description:
      "ADMIN or assigned CLUB_ADMIN. Updates club metadata. Only ADMIN can toggle isActive or slug.",
  })
  @ApiParam({ name: "id", description: "Club UUID" })
  @ApiResponse({ status: 200, description: "Club successfully updated" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Club not found" })
  @ApiResponse({ status: 409, description: "Slug already exists" })
  async updateClub(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClubDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Deactivate a club",
    description:
      "ADMIN only. Soft-deactivates the club (isActive: false) to protect historical relations.",
  })
  @ApiParam({ name: "id", description: "Club UUID" })
  @ApiResponse({ status: 200, description: "Club deactivated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "Club not found" })
  async deactivateClub(@Param("id", ParseUUIDPipe) id: string) {
    return this.clubsService.deactivate(id);
  }

  // ---------------------------------------------------------------------------
  // Club Admin Assignments (ADMIN only)
  // ---------------------------------------------------------------------------

  @Get(":clubId/admins")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "List assigned admins for a club",
    description:
      "ADMIN or assigned CLUB_ADMIN. Returns administrators assigned to this club.",
  })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiResponse({ status: 200, description: "List of assigned club admins" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Club not found" })
  async getClubAdmins(
    @Param("clubId", ParseUUIDPipe) clubId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.getAdmins(clubId, user);
  }

  @Post(":clubId/admins")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Assign an administrator to a club",
    description:
      "ADMIN only. Assigns a user with CLUB_ADMIN role to manage the specified club.",
  })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiResponse({ status: 201, description: "Admin successfully assigned" })
  @ApiResponse({ status: 400, description: "Validation error or wrong role" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "Club or user not found" })
  @ApiResponse({
    status: 409,
    description: "User is already an admin of this club",
  })
  async assignClubAdmin(
    @Param("clubId", ParseUUIDPipe) clubId: string,
    @Body() dto: AssignClubAdminDto,
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    return this.clubsService.assignAdmin(clubId, dto, adminUser);
  }

  @Delete(":clubId/admins/:userId")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Remove an administrator assignment from a club",
    description: "ADMIN only. Removes the assignment between user and club.",
  })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiParam({ name: "userId", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Assignment successfully removed" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "Assignment or club not found" })
  async removeClubAdmin(
    @Param("clubId", ParseUUIDPipe) clubId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    return this.clubsService.removeAdmin(clubId, userId);
  }

  // ---------------------------------------------------------------------------
  // Club Posts
  // ---------------------------------------------------------------------------

  @Get(":clubId/posts")
  @ApiOperation({
    summary: "List published club posts",
    description:
      "Public endpoint. Returns published posts for an active club, paginated.",
  })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiResponse({ status: 200, description: "Paginated published posts" })
  @ApiResponse({ status: 404, description: "Club not found or inactive" })
  async getClubPosts(
    @Param("clubId", ParseUUIDPipe) clubId: string,
    @Query() query: QueryClubPostsDto,
  ) {
    return this.clubsService.findPosts(clubId, query);
  }

  @Post(":clubId/posts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Create a post for a club",
    description:
      "ADMIN or assigned CLUB_ADMIN. Creates a new post/announcement for the club.",
  })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiResponse({ status: 201, description: "Post successfully created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Club not found" })
  async createClubPost(
    @Param("clubId", ParseUUIDPipe) clubId: string,
    @Body() dto: CreateClubPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.createPost(clubId, dto, user);
  }

  @Patch(":clubId/posts/:postId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Update a club post",
    description:
      "ADMIN or assigned CLUB_ADMIN. Updates title, content, cover, or publish state.",
  })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiParam({ name: "postId", description: "Post UUID" })
  @ApiResponse({ status: 200, description: "Post successfully updated" })
  @ApiResponse({
    status: 400,
    description: "Validation error or club mismatch",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Post not found" })
  async updateClubPost(
    @Param("clubId", ParseUUIDPipe) clubId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
    @Body() dto: UpdateClubPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.updatePost(clubId, postId, dto, user);
  }

  @Delete(":clubId/posts/:postId")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Delete a club post",
    description: "ADMIN or assigned CLUB_ADMIN. Deletes the post.",
  })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiParam({ name: "postId", description: "Post UUID" })
  @ApiResponse({ status: 200, description: "Post successfully deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Post not found" })
  async deleteClubPost(
    @Param("clubId", ParseUUIDPipe) clubId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.deletePost(clubId, postId, user);
  }
}
