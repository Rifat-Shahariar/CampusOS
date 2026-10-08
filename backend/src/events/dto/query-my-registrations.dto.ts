import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { EventRegistrationStatus } from "../../generated/prisma/client.js";

export class QueryMyRegistrationsDto {
  @ApiPropertyOptional({
    enum: EventRegistrationStatus,
    description:
      "Filter registrations by status (REGISTERED, ATTENDED, CANCELLED)",
  })
  @IsOptional()
  @IsEnum(EventRegistrationStatus)
  status?: EventRegistrationStatus;

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
