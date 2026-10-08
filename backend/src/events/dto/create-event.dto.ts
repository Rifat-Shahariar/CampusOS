import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export class CreateEventDto {
  @ApiProperty({
    example: "ca000001-0000-4000-8000-000000000001",
    description: "UUID of the hosting club",
  })
  @IsUUID("4")
  @IsNotEmpty()
  clubId!: string;

  @ApiProperty({
    example: "Annual Hackathon 2026",
    description: "Event title",
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
    example: "annual-hackathon-2026",
    description: "Unique URL slug. Auto-generated from title if omitted.",
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must contain only lowercase letters, numbers, and hyphens",
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @ApiProperty({
    example:
      "A 48-hour competitive programming and product building hackathon.",
    description: "Full description of the event",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  description!: string;

  @ApiPropertyOptional({
    example: "https://campusos.dev/uploads/events/hackathon.jpg",
    description: "Public URL of the event banner/cover image",
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({
    example: "Hackathon",
    description:
      "Category/type of event (e.g. Workshop, Seminar, Hackathon, Cultural)",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  eventType!: string;

  @ApiProperty({
    example: "Auditorium A, Building 3",
    description: "Physical or virtual location",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  location!: string;

  @ApiProperty({
    example: "2026-11-10T10:00:00.000Z",
    description: "Event start date/time (ISO 8601)",
  })
  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({
    example: "2026-11-12T18:00:00.000Z",
    description: "Event end date/time (ISO 8601)",
  })
  @IsDateString()
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({
    example: "2026-10-01T00:00:00.000Z",
    description: "Registration opening date/time (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  registrationStart?: string;

  @ApiPropertyOptional({
    example: "2026-11-09T23:59:59.000Z",
    description: "Registration deadline date/time (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  registrationEnd?: string;

  @ApiPropertyOptional({
    example: 100,
    description: "Maximum attendee capacity",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Whether registration is required",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRegistrationRequired?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: "Active status of the event",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
