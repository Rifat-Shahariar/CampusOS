import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class RegisterDto {
  @ApiProperty({
    example: "Rafid Hasan",
    description: "Full name of the student",
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  name!: string;

  @ApiProperty({
    example: "rafid.hasan@campusos.dev",
    description: "Unique university email address",
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    example: "SecurePass@2026",
    description: "Password (min 8 characters)",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password!: string;

  @ApiPropertyOptional({
    example: "CSE-2023-142",
    description: "Student ID / Roll Number",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  studentId?: string;

  @ApiPropertyOptional({ example: "67", description: "Batch number/name" })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  batch?: string;

  @ApiPropertyOptional({ example: "A", description: "Section name" })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  section?: string;

  @ApiPropertyOptional({
    example: "ca000000-0000-4000-8000-000000000001",
    description: "Department UUID",
  })
  @IsOptional()
  @IsUUID(4, { message: "departmentId must be a valid UUIDv4" })
  departmentId?: string;
}
