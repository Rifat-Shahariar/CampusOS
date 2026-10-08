import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { ResourceType, UserRole } from "../generated/prisma/client.js";
import { ResourcesService } from "./resources.service.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

describe("ResourcesService", () => {
  let service: ResourcesService;
  let prismaMock: {
    resource: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    course: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  const adminUser: AuthenticatedUser = {
    id: "admin-uuid-001",
    email: "admin@campusos.dev",
    role: UserRole.ADMIN,
  };

  const resourceAdminUser: AuthenticatedUser = {
    id: "resource-admin-uuid-001",
    email: "resource.admin@campusos.dev",
    role: UserRole.RESOURCE_ADMIN,
  };

  const studentUser: AuthenticatedUser = {
    id: "student-uuid-001",
    email: "student@campusos.dev",
    role: UserRole.STUDENT,
  };

  const mockCourse = {
    id: "course-uuid-001",
    code: "CSE 2115",
    name: "Data Structures",
    department: {
      id: "dept-uuid-001",
      code: "CSE",
      name: "Computer Science and Engineering",
    },
  };

  const mockResource = {
    id: "resource-uuid-001",
    courseId: "course-uuid-001",
    title: "Linked Lists Slides",
    description: "Singly and doubly linked lists notes",
    resourceType: ResourceType.NOTE,
    fileName: "linked-lists.pdf",
    fileUrl: "https://campusos.dev/uploads/resources/linked-lists.pdf",
    fileSize: 1048576,
    mimeType: "application/pdf",
    batch: "67",
    section: "A",
    uploadedBy: "resource-admin-uuid-001",
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    course: mockCourse,
    uploadedByUser: {
      id: "resource-admin-uuid-001",
      name: "Resource Admin",
      email: "resource.admin@campusos.dev",
      role: UserRole.RESOURCE_ADMIN,
    },
  };

  beforeEach(async () => {
    prismaMock = {
      resource: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      course: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get<ResourcesService>(ResourcesService);
  });

  describe("findAll", () => {
    it("should return paginated published resources for public/students", async () => {
      prismaMock.resource.count.mockResolvedValue(1);
      prismaMock.resource.findMany.mockResolvedValue([mockResource]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prismaMock.resource.count).toHaveBeenCalledWith({
        where: { isPublished: true },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(ResourceType.NOTE);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it("should apply search and filters correctly", async () => {
      prismaMock.resource.count.mockResolvedValue(1);
      prismaMock.resource.findMany.mockResolvedValue([mockResource]);

      await service.findAll({
        search: "lists",
        courseId: "course-uuid-001",
        resourceType: ResourceType.NOTE,
        batch: "67",
        section: "A",
      });

      expect(prismaMock.resource.count).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          courseId: "course-uuid-001",
          resourceType: ResourceType.NOTE,
          batch: "67",
          section: "A",
          OR: [
            { title: { contains: "lists", mode: "insensitive" } },
            { description: { contains: "lists", mode: "insensitive" } },
            { fileName: { contains: "lists", mode: "insensitive" } },
          ],
        },
      });
    });

    it("should allow ADMIN to filter by publication status", async () => {
      prismaMock.resource.count.mockResolvedValue(0);
      prismaMock.resource.findMany.mockResolvedValue([]);

      await service.findAll({ isPublished: false }, adminUser);

      expect(prismaMock.resource.count).toHaveBeenCalledWith({
        where: { isPublished: false },
      });
    });
  });

  describe("getCourses", () => {
    it("should return active courses ordered by code", async () => {
      prismaMock.course.findMany.mockResolvedValue([mockCourse]);

      const result = await service.getCourses();

      expect(prismaMock.course.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.objectContaining({ id: true, code: true }),
        orderBy: { code: "asc" },
      });
      expect(result).toEqual([mockCourse]);
    });
  });

  describe("findById", () => {
    it("should return published resource for any requester", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(mockResource);

      const result = await service.findById("resource-uuid-001");

      expect(result.id).toBe("resource-uuid-001");
      expect(result.type).toBe(ResourceType.NOTE);
    });

    it("should throw NotFoundException if resource does not exist", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(null);

      await expect(service.findById("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if resource is unpublished and caller is student or guest", async () => {
      prismaMock.resource.findUnique.mockResolvedValue({
        ...mockResource,
        isPublished: false,
      });

      await expect(
        service.findById("resource-uuid-001", studentUser),
      ).rejects.toThrow(NotFoundException);

      await expect(service.findById("resource-uuid-001")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return unpublished resource if caller is ADMIN or RESOURCE_ADMIN", async () => {
      prismaMock.resource.findUnique.mockResolvedValue({
        ...mockResource,
        isPublished: false,
      });

      const resAdminResult = await service.findById(
        "resource-uuid-001",
        resourceAdminUser,
      );
      expect(resAdminResult.isPublished).toBe(false);

      const adminResult = await service.findById(
        "resource-uuid-001",
        adminUser,
      );
      expect(adminResult.isPublished).toBe(false);
    });
  });

  describe("create", () => {
    it("should create a resource with uploadedBy set to authenticated user", async () => {
      prismaMock.course.findUnique.mockResolvedValue(mockCourse);
      prismaMock.resource.create.mockResolvedValue(mockResource);

      const dto = {
        courseId: "course-uuid-001",
        title: "Linked Lists Slides",
        description: "Singly and doubly linked lists notes",
        resourceType: ResourceType.NOTE,
        fileName: "linked-lists.pdf",
        fileUrl: "https://campusos.dev/uploads/resources/linked-lists.pdf",
        fileSize: 1048576,
        mimeType: "application/pdf",
        batch: "67",
        section: "A",
      };

      const result = await service.create(dto, resourceAdminUser);

      expect(prismaMock.course.findUnique).toHaveBeenCalledWith({
        where: { id: "course-uuid-001" },
      });
      expect(prismaMock.resource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          courseId: "course-uuid-001",
          uploadedBy: "resource-admin-uuid-001",
          isPublished: true,
        }),
        include: expect.any(Object),
      });
      expect(result.id).toBe("resource-uuid-001");
    });

    it("should throw NotFoundException if target course does not exist", async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      const dto = {
        courseId: "invalid-course-uuid",
        title: "Test",
        resourceType: ResourceType.NOTE,
        fileName: "test.pdf",
        fileUrl: "https://example.com/test.pdf",
        fileSize: 1234,
        mimeType: "application/pdf",
      };

      await expect(service.create(dto, adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update resource metadata", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(mockResource);
      prismaMock.resource.update.mockResolvedValue({
        ...mockResource,
        title: "Updated Title",
      });

      const result = await service.update("resource-uuid-001", {
        title: "Updated Title",
      });

      expect(prismaMock.resource.update).toHaveBeenCalledWith({
        where: { id: "resource-uuid-001" },
        data: expect.objectContaining({ title: "Updated Title" }),
        include: expect.any(Object),
      });
      expect(result.title).toBe("Updated Title");
    });

    it("should throw NotFoundException if resource to update does not exist", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(null);

      await expect(
        service.update("invalid-id", { title: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should validate course existence if courseId is being updated", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(mockResource);
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        service.update("resource-uuid-001", {
          courseId: "non-existent-course",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should soft-deactivate resource by setting isPublished to false", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(mockResource);
      prismaMock.resource.update.mockResolvedValue({
        ...mockResource,
        isPublished: false,
      });

      const result = await service.remove("resource-uuid-001");

      expect(prismaMock.resource.update).toHaveBeenCalledWith({
        where: { id: "resource-uuid-001" },
        data: { isPublished: false },
        include: expect.any(Object),
      });
      expect(result.isPublished).toBe(false);
    });

    it("should throw NotFoundException if resource does not exist", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(null);

      await expect(service.remove("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("publish and unpublish", () => {
    it("should publish resource", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(mockResource);
      prismaMock.resource.update.mockResolvedValue({
        ...mockResource,
        isPublished: true,
      });

      const result = await service.publish("resource-uuid-001");
      expect(result.isPublished).toBe(true);
    });

    it("should unpublish resource", async () => {
      prismaMock.resource.findUnique.mockResolvedValue(mockResource);
      prismaMock.resource.update.mockResolvedValue({
        ...mockResource,
        isPublished: false,
      });

      const result = await service.unpublish("resource-uuid-001");
      expect(result.isPublished).toBe(false);
    });
  });
});
