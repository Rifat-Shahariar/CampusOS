import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateClubPostDto {
  @ApiProperty({
    example: "Annual Hackathon Registration is Live!",
    description: "Title of the club announcement / post",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  title!: string;

  @ApiProperty({
    example:
      "We are excited to announce our upcoming campus hackathon. Form teams of 3-4 students and register before next Friday.",
    description: "Detailed body content of the announcement",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  content!: string;

  @ApiPropertyOptional({
    example:
      "https://campusos.dev/uploads/clubs/computer-club/hackathon-banner.jpg",
    description: "Cover or promotional banner image for the post",
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the post should be published immediately",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
