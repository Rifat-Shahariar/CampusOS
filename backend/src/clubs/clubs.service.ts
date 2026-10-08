import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";
import {
  AssignClubAdminDto,
  CreateClubDto,
  CreateClubPostDto,
  QueryClubPostsDto,
  QueryClubsDto,
  UpdateClubDto,
  UpdateClubPostDto,
} from "./dto/index.js";

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a URL-friendly slug from a string.
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Verifies that the user has permission to manage the specified club:
   * - ADMIN: can manage any club.
   * - CLUB_ADMIN: must be assigned to this specific club.
   * - Other roles: forbidden.
   */
  async verifyClubAccess(clubId: string, user: AuthenticatedUser) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    if (user.role === UserRole.ADMIN) {
      return club;
    }

    if (user.role === UserRole.CLUB_ADMIN) {
      const assignment = await this.prisma.clubAdminAssignment.findUnique({
        where: {
          userId_clubId: {
            userId: user.id,
            clubId,
          },
        },
      });

      if (!assignment) {
        throw new ForbiddenException(
          "You are not assigned as an administrator for this club",
        );
      }

      return club;
    }

    throw new ForbiddenException(
      "You do not have permission to manage this club",
    );
  }

  // ---------------------------------------------------------------------------
  // Public Club Queries
  // ---------------------------------------------------------------------------

  /**
   * Public: List all active clubs with optional search and pagination.
   */
  async findAll(query: QueryClubsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: {
      isActive: boolean;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      isActive: true,
    };

    if (query.search?.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.club.count({ where }),
      this.prisma.club.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          coverImageUrl: true,
          contactEmail: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              events: true,
              posts: true,
            },
          },
        },
      }),
    ]);

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

  /**
   * Public: Get an active club by ID.
   */
  async findById(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        contactEmail: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            events: true,
            posts: true,
          },
        },
      },
    });

    if (!club || !club.isActive) {
      throw new NotFoundException("Club not found");
    }

    return club;
  }

  // ---------------------------------------------------------------------------
  // Club Management (ADMIN & Assigned CLUB_ADMIN)
  // ---------------------------------------------------------------------------

  /**
   * ADMIN only: Create a new club.
   */
  async create(dto: CreateClubDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existingSlug = await this.prisma.club.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException("Club with this slug already exists");
    }

    return this.prisma.club.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        coverImageUrl: dto.coverImageUrl,
        contactEmail: dto.contactEmail,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        contactEmail: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * ADMIN or Assigned CLUB_ADMIN: Update club details.
   */
  async update(id: string, dto: UpdateClubDto, user: AuthenticatedUser) {
    await this.verifyClubAccess(id, user);

    // Non-admin CLUB_ADMINs cannot change club lifecycle state or slug
    if (user.role !== UserRole.ADMIN) {
      if (dto.isActive !== undefined) {
        throw new ForbiddenException(
          "Only administrators can activate or deactivate a club",
        );
      }
      if (dto.slug !== undefined) {
        throw new ForbiddenException(
          "Only administrators can update the club slug",
        );
      }
    }

    if (dto.slug) {
      const slugConflict = await this.prisma.club.findFirst({
        where: {
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (slugConflict) {
        throw new ConflictException("Club with this slug already exists");
      }
    }

    return this.prisma.club.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.coverImageUrl !== undefined && {
          coverImageUrl: dto.coverImageUrl,
        }),
        ...(dto.contactEmail !== undefined && {
          contactEmail: dto.contactEmail,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverImageUrl: true,
        contactEmail: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * ADMIN only: Soft-delete / deactivate a club.
   * Respects relational integrity (onDelete: Restrict) so historical posts and events are preserved.
   */
  async deactivate(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    await this.prisma.club.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: "Club deactivated successfully",
      id,
    };
  }

  // ---------------------------------------------------------------------------
  // Club Admin Assignments (ADMIN only)
  // ---------------------------------------------------------------------------

  /**
   * Get administrators assigned to a club.
   * Accessible by ADMIN and assigned CLUB_ADMIN.
   */
  async getAdmins(clubId: string, user: AuthenticatedUser) {
    await this.verifyClubAccess(clubId, user);

    const assignments = await this.prisma.clubAdminAssignment.findMany({
      where: { clubId },
      orderBy: { assignedAt: "asc" },
      select: {
        id: true,
        userId: true,
        clubId: true,
        assignedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        assignedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return assignments;
  }

  /**
   * ADMIN only: Assign a user as administrator of a club.
   */
  async assignAdmin(
    clubId: string,
    dto: AssignClubAdminDto,
    adminUser: AuthenticatedUser,
  ) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    const candidateUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!candidateUser) {
      throw new NotFoundException("User not found");
    }

    if (candidateUser.role !== UserRole.CLUB_ADMIN) {
      throw new BadRequestException(
        "User must have the CLUB_ADMIN role to be assigned as a club admin",
      );
    }

    const existingAssignment = await this.prisma.clubAdminAssignment.findUnique(
      {
        where: {
          userId_clubId: {
            userId: dto.userId,
            clubId,
          },
        },
      },
    );

    if (existingAssignment) {
      throw new ConflictException("User is already an admin of this club");
    }

    return this.prisma.clubAdminAssignment.create({
      data: {
        clubId,
        userId: dto.userId,
        assignedBy: adminUser.id,
      },
      select: {
        id: true,
        userId: true,
        clubId: true,
        assignedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        assignedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * ADMIN only: Remove a club admin assignment.
   */
  async removeAdmin(clubId: string, userId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException("Club not found");
    }

    const assignment = await this.prisma.clubAdminAssignment.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException("Club admin assignment not found");
    }

    await this.prisma.clubAdminAssignment.delete({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    return {
      message: "Club admin assignment removed successfully",
      clubId,
      userId,
    };
  }

  // ---------------------------------------------------------------------------
  // Club Posts Management
  // ---------------------------------------------------------------------------

  /**
   * Public: List published posts for an active club.
   */
  async findPosts(clubId: string, query: QueryClubPostsDto) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || !club.isActive) {
      throw new NotFoundException("Club not found");
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      clubId,
      isPublished: true,
    };

    const [total, data] = await Promise.all([
      this.prisma.clubPost.count({ where }),
      this.prisma.clubPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          clubId: true,
          title: true,
          content: true,
          coverImageUrl: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          createdByUser: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

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

  /**
   * ADMIN or Assigned CLUB_ADMIN: Create a post for a club.
   */
  async createPost(
    clubId: string,
    dto: CreateClubPostDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyClubAccess(clubId, user);

    const isPublished = dto.isPublished ?? false;
    const publishedAt = isPublished ? new Date() : null;

    return this.prisma.clubPost.create({
      data: {
        clubId,
        title: dto.title,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        isPublished,
        publishedAt,
        createdBy: user.id,
      },
      select: {
        id: true,
        clubId: true,
        title: true,
        content: true,
        coverImageUrl: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * ADMIN or Assigned CLUB_ADMIN: Update a post for a club.
   */
  async updatePost(
    clubId: string,
    postId: string,
    dto: UpdateClubPostDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyClubAccess(clubId, user);

    const post = await this.prisma.clubPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException("Club post not found");
    }

    if (post.clubId !== clubId) {
      throw new BadRequestException(
        "Club post does not belong to the specified club",
      );
    }

    let publishedAt: Date | null | undefined = undefined;
    if (dto.isPublished !== undefined) {
      if (dto.isPublished && !post.publishedAt) {
        publishedAt = new Date();
      } else if (!dto.isPublished) {
        publishedAt = null;
      }
    }

    return this.prisma.clubPost.update({
      where: { id: postId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.coverImageUrl !== undefined && {
          coverImageUrl: dto.coverImageUrl,
        }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
      select: {
        id: true,
        clubId: true,
        title: true,
        content: true,
        coverImageUrl: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * ADMIN or Assigned CLUB_ADMIN: Delete a post for a club.
   */
  async deletePost(clubId: string, postId: string, user: AuthenticatedUser) {
    await this.verifyClubAccess(clubId, user);

    const post = await this.prisma.clubPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException("Club post not found");
    }

    if (post.clubId !== clubId) {
      throw new BadRequestException(
        "Club post does not belong to the specified club",
      );
    }

    await this.prisma.clubPost.delete({
      where: { id: postId },
    });

    return {
      message: "Club post deleted successfully",
      id: postId,
    };
  }
}
