import { ApiProperty } from "@nestjs/swagger";

export class DepartmentItemDto {
  @ApiProperty({
    example: "ca000000-0000-4000-8000-000000000001",
    description: "Internal department unique identifier",
  })
  id!: string;

  @ApiProperty({
    example: "Department of Computer Science & Engineering (CSE)",
    description: "Official university department name",
  })
  name!: string;

  @ApiProperty({
    example: "CSE",
    description: "Department code",
  })
  code!: string;
}
