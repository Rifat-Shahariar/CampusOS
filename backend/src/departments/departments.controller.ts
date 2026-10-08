import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DepartmentsService } from "./departments.service.js";
import { DepartmentItemDto } from "./dto/department-response.dto.js";

@ApiTags("Departments")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({
    summary: "List active departments",
    description:
      "Public endpoint. Returns all active university departments for student registration and academic filters.",
  })
  @ApiOkResponse({
    type: [DepartmentItemDto],
    description: "List of active departments",
  })
  async getDepartments(): Promise<DepartmentItemDto[]> {
    return this.departmentsService.getActiveDepartments();
  }
}
