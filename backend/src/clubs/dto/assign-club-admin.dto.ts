import { IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignClubAdminDto {
  @ApiProperty({
    example: "ba000001-0000-4000-8000-000000000001",
    description:
      "UUID of the user to assign as club admin (must have CLUB_ADMIN role)",
  })
  @IsUUID("4")
  @IsNotEmpty()
  userId!: string;
}
