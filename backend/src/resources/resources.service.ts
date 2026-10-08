import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { ResourceType, UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";
import {
  CreateResourceDto,
  QueryResourcesDto,
  UpdateResourceDto,
} from "./dto/index.js";

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a resource entity into a consistent API response
   * providing both `resourceType` and `type`, plus uploader aliases.
   */
  private formatResource<
    T extends {
      resourceType: ResourceType;
      uploadedByUser?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      } | null;
    },
  >(resource: T) {
    const { uploadedByUser, ...rest } = resource;
    const uploader = uploadedByUser
      ? {
          id: uploadedByUser.id,
          name: uploadedByUser.name,
          fullName: uploadedByUser.name,
          email: uploadedByUser.email,
          role: uploadedByUser.role,
        }
      : undefined;

    return {
      ...rest,
      type: resource.resourceType,
      uploadedByUser: uploader,
      uploader,
    };
  }

  /**
   * List resources with search, filters, and pagination.
   * Public/student requests strictly receive published resources only.
   * Admin / Resource Admin can filter by `isPublished` or see all if unconstrained.
   */
  async findAll(query: QueryResourcesDto, user?: AuthenticatedUser) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(Number(query.limit), 50) : 10;
    const skip = (page - 1) * limit;

    const isAdminOrResourceAdmin =
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.RESOURCE_ADMIN);

    const where: {
      isPublished?: boolean;
      courseId?: string;
      resourceType?: ResourceType;
      batch?: string;
      section?: string;
      course?: {
        semester?: number;
      };
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
        fileName?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (!isAdminOrResourceAdmin) {
      where.isPublished = true;
    } else if (query.isPublished !== undefined) {
      if (query.isPublished === true || query.isPublished === "true") {
        where.isPublished = true;
      } else if (query.isPublished === false || query.isPublished === "false") {
        where.isPublished = false;
      }
    }

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    const typeFilter = query.resourceType || query.type;
    if (typeFilter) {
      where.resourceType = typeFilter;
    }

    if (query.batch) {
      where.batch = query.batch;
    }

    if (query.section) {
      where.section = query.section;
    }

    if (query.semester !== undefined) {
      where.course = {
        semester: Number(query.semester),
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { fileName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, resources] = await Promise.all([
      this.prisma.resource.count({ where }),
      this.prisma.resource.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              semester: true,
              department: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          uploadedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: resources.map((r) => this.formatResource(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves active courses with department details for filtering.
   */
  async getCourses() {
    return this.prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        semester: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  /**
   * Retrieve a single resource by UUID.
   * If unpublished, only accessible by ADMIN or RESOURCE_ADMIN.
   */
  async findById(id: string, user?: AuthenticatedUser) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    const isAdminOrResourceAdmin =
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.RESOURCE_ADMIN);

    if (!resource.isPublished && !isAdminOrResourceAdmin) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    return this.formatResource(resource);
  }

  /**
   * Create a new resource.
   * UploadedBy is strictly set from the authenticated user.
   */
  async create(dto: CreateResourceDto, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${dto.courseId}" not found`);
    }

    const resourceType = dto.resourceType || dto.type || ResourceType.NOTE;
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : true;

    const resource = await this.prisma.resource.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description ?? null,
        resourceType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        batch: dto.batch ?? null,
        section: dto.section ?? null,
        uploadedBy: user.id,
        isPublished,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return this.formatResource(resource);
  }

  /**
   * Update an existing resource.
   * uploadedBy, id, and createdAt cannot be modified.
   */
  async update(id: string, dto: UpdateResourceDto) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new NotFoundException(
          `Course with ID "${dto.courseId}" not found`,
        );
      }
    }

    const resourceType = dto.resourceType ?? dto.type;

    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        ...(dto.courseId && { courseId: dto.courseId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(resourceType !== undefined && { resourceType }),
        ...(dto.fileName !== undefined && { fileName: dto.fileName }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        ...(dto.fileSize !== undefined && { fileSize: dto.fileSize }),
        ...(dto.mimeType !== undefined && { mimeType: dto.mimeType }),
        ...(dto.batch !== undefined && { batch: dto.batch }),
        ...(dto.section !== undefined && { section: dto.section }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return this.formatResource(updated);
  }

  /**
   * Soft-deactivates a resource by setting isPublished = false.
   */
  async remove(id: string) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    const deactivated = await this.prisma.resource.update({
      where: { id },
      data: { isPublished: false },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return this.formatResource(deactivated);
  }

  /**
   * Publish a resource.
   */
  async publish(id: string) {
    return this.update(id, { isPublished: true });
  }

  /**
   * Unpublish a resource.
   */
  async unpublish(id: string) {
    return this.update(id, { isPublished: false });
  }
}
