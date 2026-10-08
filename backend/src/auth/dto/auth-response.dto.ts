import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../generated/prisma/client.js";

export class DepartmentResponseDto {
  @ApiProperty({ example: "ca000000-0000-4000-8000-000000000001" })
  id!: string;

  @ApiProperty({ example: "Computer Science & Engineering" })
  name!: string;

  @ApiProperty({ example: "CSE" })
  code!: string;
}

export class SafeUserDto {
  @ApiProperty({ example: "ea000000-0000-4000-8000-000000000001" })
  id!: string;

  @ApiProperty({ example: "Rafid Hasan" })
  name!: string;

  @ApiProperty({ example: "student1@campusos.dev" })
  email!: string;

  @ApiPropertyOptional({ example: "CSE-2023-142", nullable: true })
  studentId!: string | null;

  @ApiPropertyOptional({ example: "67", nullable: true })
  batch!: string | null;

  @ApiPropertyOptional({ example: "A", nullable: true })
  section!: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  role!: UserRole;

  @ApiPropertyOptional({ example: null, nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ type: DepartmentResponseDto, nullable: true })
  department?: DepartmentResponseDto | null;

  @ApiProperty({ example: "2026-10-08T00:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-10-08T00:00:00.000Z" })
  updatedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: "Short-lived JWT access token" })
  accessToken!: string;

  @ApiProperty({ description: "Long-lived refresh token" })
  refreshToken!: string;

  @ApiProperty({ type: SafeUserDto })
  user!: SafeUserDto;
}
