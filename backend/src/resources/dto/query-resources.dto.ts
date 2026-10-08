import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ResourceType } from "../../generated/prisma/client.js";

export class QueryResourcesDto {
  @ApiPropertyOptional({
    example: "algorithms",
    description:
      "Search filter for title, description, or fileName (case-insensitive)",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional({
    example: "ca000001-0000-4000-8000-000000000001",
    description: "Filter by course UUID",
  })
  @IsOptional()
  @IsUUID("4")
  courseId?: string;

  @ApiPropertyOptional({
    enum: ResourceType,
    example: ResourceType.NOTE,
    description:
      "Filter by resource type: NOTE, QUESTION_PAPER, LAB_MANUAL, NOTICE, OTHER",
  })
  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @ApiPropertyOptional({
    enum: ResourceType,
    example: ResourceType.NOTE,
    description: "Alias for resourceType filter",
  })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({
    example: "67",
    description: "Filter by student academic batch",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  batch?: string;

  @ApiPropertyOptional({
    example: "A",
    description: "Filter by course section",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  section?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Filter by publication status (applicable for admin requests)",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  isPublished?: boolean | string;

  @ApiPropertyOptional({
    example: 1,
    description: "Page number (1-indexed)",
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: "Items per page (max 50)",
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
