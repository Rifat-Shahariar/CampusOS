import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { DepartmentItemDto } from "./dto/department-response.dto.js";

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all active departments sorted alphabetically by name.
   */
  async getActiveDepartments(): Promise<DepartmentItemDto[]> {
    return this.prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    });
  }
}
