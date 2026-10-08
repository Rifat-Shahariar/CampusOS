import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { UserRole } from "../generated/prisma/client.js";
import { ClubsService } from "./clubs.service.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

describe("ClubsService", () => {
  let service: ClubsService;
  let prismaMock: {
    club: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    clubAdminAssignment: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    clubPost: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    user: {
      findUnique: ReturnType<typeof vi.fn>;
    };
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

  const resourceAdminUser: AuthenticatedUser = {
    id: "resource-admin-uuid-001",
    email: "res.admin@campusos.dev",
    role: UserRole.RESOURCE_ADMIN,
  };

  const mockClub = {
    id: "club-uuid-001",
    name: "Computer Club",
    slug: "computer-club",
    description: "Programming and algorithms hub",
    logoUrl: "https://example.com/logo.png",
    coverImageUrl: "https://example.com/cover.png",
    contactEmail: "compclub@campusos.dev",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      club: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      clubAdminAssignment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      clubPost: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ClubsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = moduleRef.get<ClubsService>(ClubsService);
  });

  describe("Slug generation", () => {
    it("converts mixed strings into clean kebab-case slugs", () => {
      expect(service.generateSlug("Robotics & AI Society!!")).toBe(
        "robotics-ai-society",
      );
      expect(service.generateSlug("  Computer Club 2026 ")).toBe(
        "computer-club-2026",
      );
    });
  });

  describe("Public: findAll", () => {
    it("returns paginated list of active clubs with search filter", async () => {
      prismaMock.club.count.mockResolvedValue(1);
      prismaMock.club.findMany.mockResolvedValue([mockClub]);

      const result = await service.findAll({
        search: "computer",
        page: 1,
        limit: 10,
      });

      expect(prismaMock.club.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: "computer", mode: "insensitive" } },
            { description: { contains: "computer", mode: "insensitive" } },
          ],
        },
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe("Public: findById", () => {
    it("returns club details if active", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);

      const result = await service.findById(mockClub.id);
      expect(result.id).toBe(mockClub.id);
    });

    it("throws NotFoundException if club not found", async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.findById("unknown-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws NotFoundException if club is inactive", async () => {
      prismaMock.club.findUnique.mockResolvedValue({
        ...mockClub,
        isActive: false,
      });

      await expect(service.findById(mockClub.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("ADMIN: create", () => {
    it("creates a new club with auto-generated slug", async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);
      prismaMock.club.create.mockResolvedValue(mockClub);

      const result = await service.create({
        name: "Computer Club",
        description: "Programming hub",
      });

      expect(prismaMock.club.findUnique).toHaveBeenCalledWith({
        where: { slug: "computer-club" },
      });
      expect(prismaMock.club.create).toHaveBeenCalled();
      expect(result.name).toBe("Computer Club");
    });

    it("throws ConflictException if slug already exists", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);

      await expect(
        service.create({
          name: "Computer Club",
          description: "Duplicate slug test",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("ADMIN & CLUB_ADMIN: verifyClubAccess and update", () => {
    it("allows ADMIN to update any club including isActive and slug", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.club.findFirst.mockResolvedValue(null);
      prismaMock.club.update.mockResolvedValue({
        ...mockClub,
        name: "Updated Name",
      });

      const result = await service.update(
        mockClub.id,
        { name: "Updated Name" },
        adminUser,
      );

      expect(result.name).toBe("Updated Name");
    });

    it("allows assigned CLUB_ADMIN to update club details", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: clubAdminUser.id,
        clubId: mockClub.id,
      });
      prismaMock.club.update.mockResolvedValue({
        ...mockClub,
        description: "New description",
      });

      const result = await service.update(
        mockClub.id,
        { description: "New description" },
        clubAdminUser,
      );

      expect(result.description).toBe("New description");
    });

    it("prevents CLUB_ADMIN from managing an unassigned club", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          mockClub.id,
          { description: "Should fail" },
          clubAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("prevents CLUB_ADMIN from changing isActive", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: clubAdminUser.id,
        clubId: mockClub.id,
      });

      await expect(
        service.update(mockClub.id, { isActive: false }, clubAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it("prevents STUDENT and RESOURCE_ADMIN from managing clubs", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);

      await expect(
        service.update(
          mockClub.id,
          { name: "Attempt by Student" },
          studentUser,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update(
          mockClub.id,
          { name: "Attempt by Resource Admin" },
          resourceAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("ADMIN: deactivate", () => {
    it("deactivates club by setting isActive to false", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.club.update.mockResolvedValue({
        ...mockClub,
        isActive: false,
      });

      const result = await service.deactivate(mockClub.id);

      expect(prismaMock.club.update).toHaveBeenCalledWith({
        where: { id: mockClub.id },
        data: { isActive: false },
      });
      expect(result).toEqual({
        message: "Club deactivated successfully",
        id: mockClub.id,
      });
    });

    it("throws NotFoundException if club to deactivate does not exist", async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);

      await expect(service.deactivate("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("ADMIN: assignAdmin & removeAdmin", () => {
    it("assigns user with CLUB_ADMIN role to a club", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.user.findUnique.mockResolvedValue({
        id: "target-user-uuid",
        role: UserRole.CLUB_ADMIN,
      });
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue(null);
      prismaMock.clubAdminAssignment.create.mockResolvedValue({
        id: "assignment-uuid-001",
        userId: "target-user-uuid",
        clubId: mockClub.id,
      });

      const result = await service.assignAdmin(
        mockClub.id,
        { userId: "target-user-uuid" },
        adminUser,
      );

      expect(prismaMock.clubAdminAssignment.create).toHaveBeenCalledWith({
        data: {
          clubId: mockClub.id,
          userId: "target-user-uuid",
          assignedBy: adminUser.id,
        },
        select: expect.any(Object),
      });
      expect(result.id).toBe("assignment-uuid-001");
    });

    it("throws BadRequestException if candidate user does not have CLUB_ADMIN role", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.user.findUnique.mockResolvedValue({
        id: "student-candidate-uuid",
        role: UserRole.STUDENT,
      });

      await expect(
        service.assignAdmin(
          mockClub.id,
          { userId: "student-candidate-uuid" },
          adminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ConflictException if user is already assigned to the club", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.user.findUnique.mockResolvedValue({
        id: "already-admin-uuid",
        role: UserRole.CLUB_ADMIN,
      });
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: "already-admin-uuid",
        clubId: mockClub.id,
      });

      await expect(
        service.assignAdmin(
          mockClub.id,
          { userId: "already-admin-uuid" },
          adminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it("removes admin assignment successfully", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: "assigned-admin-uuid",
        clubId: mockClub.id,
      });
      prismaMock.clubAdminAssignment.delete.mockResolvedValue({});

      const result = await service.removeAdmin(
        mockClub.id,
        "assigned-admin-uuid",
      );

      expect(prismaMock.clubAdminAssignment.delete).toHaveBeenCalledWith({
        where: {
          userId_clubId: {
            userId: "assigned-admin-uuid",
            clubId: mockClub.id,
          },
        },
      });
      expect(result.message).toBe("Club admin assignment removed successfully");
    });
  });

  describe("Club Posts: findPosts, createPost, updatePost, deletePost", () => {
    const mockPost = {
      id: "post-uuid-001",
      clubId: mockClub.id,
      title: "First Announcement",
      content: "Details about orientation",
      coverImageUrl: null,
      isPublished: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: clubAdminUser.id,
    };

    it("Public findPosts returns published posts for active club", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubPost.count.mockResolvedValue(1);
      prismaMock.clubPost.findMany.mockResolvedValue([mockPost]);

      const result = await service.findPosts(mockClub.id, {
        page: 1,
        limit: 10,
      });

      expect(prismaMock.clubPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clubId: mockClub.id, isPublished: true },
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it("creates club post with publishedAt set when isPublished is true", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: clubAdminUser.id,
        clubId: mockClub.id,
      });
      prismaMock.clubPost.create.mockResolvedValue(mockPost);

      const result = await service.createPost(
        mockClub.id,
        {
          title: "First Announcement",
          content: "Details about orientation",
          isPublished: true,
        },
        clubAdminUser,
      );

      expect(prismaMock.clubPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clubId: mockClub.id,
            title: "First Announcement",
            isPublished: true,
            publishedAt: expect.any(Date),
            createdBy: clubAdminUser.id,
          }),
        }),
      );
      expect(result.title).toBe("First Announcement");
    });

    it("rejects updating post if post belongs to a different club", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: clubAdminUser.id,
        clubId: mockClub.id,
      });
      prismaMock.clubPost.findUnique.mockResolvedValue({
        ...mockPost,
        clubId: "different-club-uuid",
      });

      await expect(
        service.updatePost(
          mockClub.id,
          mockPost.id,
          { title: "Malicious update" },
          clubAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects deleting post if post belongs to a different club", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: clubAdminUser.id,
        clubId: mockClub.id,
      });
      prismaMock.clubPost.findUnique.mockResolvedValue({
        ...mockPost,
        clubId: "different-club-uuid",
      });

      await expect(
        service.deletePost(mockClub.id, mockPost.id, clubAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("allows assigned CLUB_ADMIN to delete post for their club", async () => {
      prismaMock.club.findUnique.mockResolvedValue(mockClub);
      prismaMock.clubAdminAssignment.findUnique.mockResolvedValue({
        userId: clubAdminUser.id,
        clubId: mockClub.id,
      });
      prismaMock.clubPost.findUnique.mockResolvedValue(mockPost);
      prismaMock.clubPost.delete.mockResolvedValue(mockPost);

      const result = await service.deletePost(
        mockClub.id,
        mockPost.id,
        clubAdminUser,
      );

      expect(prismaMock.clubPost.delete).toHaveBeenCalledWith({
        where: { id: mockPost.id },
      });
      expect(result.message).toBe("Club post deleted successfully");
    });
  });
});
