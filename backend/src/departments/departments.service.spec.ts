import { Test, TestingModule } from "@nestjs/testing";
import { DepartmentsService } from "./departments.service.js";
import { PrismaService } from "../database/prisma.service.js";

describe("DepartmentsService", () => {
  let service: DepartmentsService;
  let prismaMock: {
    department: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      department: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it("returns active departments sorted alphabetically by name", async () => {
    const mockDepartments = [
      {
        id: "dept-1",
        name: "Department of Computer Science & Engineering (CSE)",
        code: "CSE",
      },
      {
        id: "dept-2",
        name: "Department of Electrical & Electronic Engineering (EEE)",
        code: "EEE",
      },
    ];

    prismaMock.department.findMany.mockResolvedValueOnce(mockDepartments);

    const result = await service.getActiveDepartments();

    expect(prismaMock.department.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    });
    expect(result).toEqual(mockDepartments);
    expect(result).toHaveLength(2);
  });
});
