import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class QueryEventsDto {
  @ApiPropertyOptional({
    example: "hackathon",
    description: "Search filter for title or description (case-insensitive)",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "ca000001-0000-4000-8000-000000000001",
    description: "Filter by hosting club UUID",
  })
  @IsOptional()
  @IsUUID("4")
  clubId?: string;

  @ApiPropertyOptional({
    example: "computer-club",
    description: "Filter by hosting club slug",
  })
  @IsOptional()
  @IsString()
  clubSlug?: string;

  @ApiPropertyOptional({
    example: "Workshop",
    description:
      "Filter by event type (e.g. Workshop, Seminar, Hackathon, Cultural)",
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({
    example: "2026-10-01T00:00:00.000Z",
    description: "Filter events starting on or after this ISO date",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: "2026-12-31T23:59:59.000Z",
    description: "Filter events ending on or before this ISO date",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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
