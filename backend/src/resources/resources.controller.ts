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
import { ResourcesService } from "./resources.service.js";
import {
  CreateResourceDto,
  QueryResourcesDto,
  UpdateResourceDto,
} from "./dto/index.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

@ApiTags("Resources")
@Controller("resources")
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  // ---------------------------------------------------------------------------
  // Public/Student: List Resources
  // ---------------------------------------------------------------------------

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Browse academic resources",
    description:
      "Public endpoint. Returns published resources with search, course, type, batch, and section filters. Admins can view unpublished resources.",
  })
  @ApiResponse({ status: 200, description: "Paginated list of resources" })
  async getResources(
    @Query() query: QueryResourcesDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.resourcesService.findAll(query, user);
  }

  // ---------------------------------------------------------------------------
  // Public/Student: List Courses for Filter Dropdowns
  // (Declared before :id so "courses" is not treated as a UUID parameter)
  // ---------------------------------------------------------------------------

  @Get("courses")
  @ApiOperation({
    summary: "List active courses",
    description:
      "Public endpoint. Returns active courses with department details for filtering resources.",
  })
  @ApiResponse({
    status: 200,
    description: "List of active courses with department info",
  })
  async getCourses() {
    return this.resourcesService.getCourses();
  }

  // ---------------------------------------------------------------------------
  // Public/Student: Single Resource Details
  // ---------------------------------------------------------------------------

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Get resource details by ID",
    description:
      "Public endpoint. Unpublished resources return 404 unless requested by ADMIN or RESOURCE_ADMIN.",
  })
  @ApiParam({ name: "id", description: "Resource UUID" })
  @ApiResponse({ status: 200, description: "Resource details" })
  @ApiResponse({ status: 404, description: "Resource not found" })
  async getResource(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.resourcesService.findById(id, user);
  }

  // ---------------------------------------------------------------------------
  // Admin / Resource Admin: Create Resource
  // ---------------------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Create a learning resource",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. uploadedBy is automatically set to the authenticated user.",
  })
  @ApiResponse({ status: 201, description: "Resource created successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Course not found" })
  async createResource(
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.create(dto, user);
  }

  // ---------------------------------------------------------------------------
  // Admin / Resource Admin: Update Resource
  // ---------------------------------------------------------------------------

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Update resource metadata",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. Cannot modify id, uploadedBy, or createdAt.",
  })
  @ApiParam({ name: "id", description: "Resource UUID" })
  @ApiResponse({ status: 200, description: "Resource updated successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Resource or Course not found" })
  async updateResource(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, dto);
  }

  // ---------------------------------------------------------------------------
  // Admin / Resource Admin: Soft Deactivate Resource
  // ---------------------------------------------------------------------------

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Soft-deactivate a resource",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. Sets isPublished to false.",
  })
  @ApiParam({ name: "id", description: "Resource UUID" })
  @ApiResponse({
    status: 200,
    description: "Resource deactivated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Resource not found" })
  async removeResource(@Param("id", ParseUUIDPipe) id: string) {
    return this.resourcesService.remove(id);
  }

  // ---------------------------------------------------------------------------
  // Admin / Resource Admin: Convenience Publish / Unpublish
  // ---------------------------------------------------------------------------

  @Patch(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Publish a resource",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. Sets isPublished to true.",
  })
  @ApiParam({ name: "id", description: "Resource UUID" })
  @ApiResponse({ status: 200, description: "Resource published successfully" })
  @ApiResponse({ status: 404, description: "Resource not found" })
  async publishResource(@Param("id", ParseUUIDPipe) id: string) {
    return this.resourcesService.publish(id);
  }

  @Patch(":id/unpublish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Unpublish a resource",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. Sets isPublished to false.",
  })
  @ApiParam({ name: "id", description: "Resource UUID" })
  @ApiResponse({
    status: 200,
    description: "Resource unpublished successfully",
  })
  @ApiResponse({ status: 404, description: "Resource not found" })
  async unpublishResource(@Param("id", ParseUUIDPipe) id: string) {
    return this.resourcesService.unpublish(id);
  }
}
