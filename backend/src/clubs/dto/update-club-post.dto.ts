import { PartialType } from "@nestjs/swagger";
import { CreateClubPostDto } from "./create-club-post.dto.js";

export class UpdateClubPostDto extends PartialType(CreateClubPostDto) {}
