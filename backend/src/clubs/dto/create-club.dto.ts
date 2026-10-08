import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateClubDto {
  @ApiProperty({
    example: "Computer Club",
    description: "Full name of the campus club",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  name!: string;

  @ApiPropertyOptional({
    example: "computer-club",
    description:
      "Unique URL-friendly slug. Auto-generated from name if omitted.",
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
      "Programming contests, workshops and tech talks for the campus developer community.",
    description: "Detailed description of club objectives and activities",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  description!: string;

  @ApiPropertyOptional({
    example: "https://campusos.dev/uploads/clubs/computer-club/logo.png",
    description: "Public URL of the club logo",
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: "https://campusos.dev/uploads/clubs/computer-club/cover.jpg",
    description: "Public URL of the club banner/cover image",
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    example: "computer.club@campusos.dev",
    description: "Official contact email for inquiries",
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  contactEmail?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Active status of the club",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
