import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  SafeUserDto,
  UpdateProfileDto,
} from "./dto/index.js";
import { JwtAuthGuard } from "./guards/index.js";
import { CurrentUser } from "./decorators/index.js";
import type { AuthenticatedUser } from "./interfaces/index.js";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register student",
    description:
      "Public registration creating a STUDENT account. Validates department, unique email, and unique studentId.",
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: "Successfully registered and authenticated",
  })
  @ApiConflictResponse({ description: "Email or student ID already in use" })
  @ApiNotFoundResponse({
    description: "Referenced department not found or inactive",
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login user",
    description:
      "Authenticates with email and password, issuing access and refresh JWT tokens.",
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: "Successfully authenticated",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials or deactivated account",
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh session",
    description:
      "Renews access and refresh tokens using a valid, unrevoked refresh token.",
  })
  @ApiOkResponse({ type: AuthResponseDto, description: "Session renewed" })
  @ApiUnauthorizedResponse({
    description: "Invalid, expired, or revoked refresh token",
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Logout user",
    description: "Revokes refresh token session.",
  })
  @ApiOkResponse({ description: "Logged out successfully" })
  async logout(
    @Body() dto: Partial<RefreshTokenDto>,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.logout(dto?.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current authenticated user",
    description:
      "Returns profile information for the authenticated user extracted from the JWT token.",
  })
  @ApiOkResponse({ type: SafeUserDto, description: "User profile details" })
  @ApiUnauthorizedResponse({
    description: "Missing, expired, or invalid token",
  })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<SafeUserDto> {
    return this.authService.getMe(user.id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update current authenticated user profile",
    description:
      "Updates personal profile details for the authenticated user. Email and role cannot be changed.",
  })
  @ApiOkResponse({
    type: SafeUserDto,
    description: "Updated user profile details",
  })
  @ApiConflictResponse({ description: "Student ID already in use" })
  @ApiNotFoundResponse({
    description: "Referenced department not found or inactive",
  })
  @ApiUnauthorizedResponse({
    description: "Missing, expired, or invalid token",
  })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<SafeUserDto> {
    return this.authService.updateProfile(user.id, dto);
  }
}
