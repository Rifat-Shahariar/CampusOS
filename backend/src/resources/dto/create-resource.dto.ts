import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ResourceType } from "../../generated/prisma/client.js";

export class CreateResourceDto {
  @ApiProperty({
    example: "ca000001-0000-4000-8000-000000000001",
    description: "UUID of the associated Course",
  })
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({
    example: "Linked Lists — Lecture Slides",
    description: "Resource title",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  title!: string;

  @ApiPropertyOptional({
    example: "Singly, doubly and circular linked lists with complexity notes.",
    description: "Detailed description of the learning resource",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  description?: string;

  @ApiPropertyOptional({
    enum: ResourceType,
    example: ResourceType.NOTE,
    description:
      "Type of resource: NOTE, QUESTION_PAPER, LAB_MANUAL, NOTICE, OTHER",
  })
  @ValidateIf((o: CreateResourceDto) => !o.type)
  @IsEnum(ResourceType, {
    message:
      "resourceType or type must be one of: NOTE, QUESTION_PAPER, LAB_MANUAL, NOTICE, OTHER",
  })
  @IsNotEmpty()
  resourceType?: ResourceType;

  @ApiPropertyOptional({
    enum: ResourceType,
    example: ResourceType.NOTE,
    description: "Alias for resourceType",
  })
  @ValidateIf((o: CreateResourceDto) => !o.resourceType)
  @IsEnum(ResourceType, {
    message:
      "resourceType or type must be one of: NOTE, QUESTION_PAPER, LAB_MANUAL, NOTICE, OTHER",
  })
  @IsNotEmpty()
  type?: ResourceType;

  @ApiProperty({
    example: "cse-2115-linked-lists.pdf",
    description: "Original filename of the resource",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  fileName!: string;

  @ApiProperty({
    example: "https://campusos.dev/uploads/resources/cse-2115-linked-lists.pdf",
    description: "Public URL or storage location of the resource file",
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  fileUrl!: string;

  @ApiProperty({
    example: 1486848,
    description: "File size in bytes",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize!: number;

  @ApiProperty({
    example: "application/pdf",
    description: "MIME type of the uploaded file",
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  mimeType!: string;

  @ApiPropertyOptional({
    example: "67",
    description: "Applicable student academic batch/session",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  batch?: string;

  @ApiPropertyOptional({
    example: "A",
    description: "Applicable course section/group",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  section?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the resource is published immediately",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
