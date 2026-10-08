import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CheckInDto {
  @ApiPropertyOptional({
    example: "9f1c4b7a2d8e4f6081a3c5d7e9b0f213",
    description: "Unique QR token scanned from attendee's ticket",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  qrToken?: string;

  @ApiPropertyOptional({
    example: "COS-REG-1001",
    description:
      "Human-readable registration code for manual fallback check-in",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  registrationCode?: string;
}
