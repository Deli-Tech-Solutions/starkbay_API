import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger"
import { UserService } from "../providers/user.service";
import { UserProfileService } from "../providers/user-profile.service";
import { UserPreferencesService } from "../providers/user-preferences.service";
import { EmailVerificationService } from "../providers/email-verification.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { UserQueryDto } from "../dto/user-query.dto";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { UpdateUserDto } from "../dto/update-user.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { UserStatus } from "../entities/user.entity";
import { CreateUserProfileDto, UpdateUserProfileDto } from "../dto/user-profile.dto";
import { UpdateUserPreferencesDto } from "../dto/user-preferences.dto";
import { ResendVerificationDto, VerifyEmailDto } from "../dto/verify-email.dto";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: UserProfileService,
    private readonly preferencesService: UserPreferencesService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  // ============================================================================
  // USER MANAGEMENT ENDPOINTS
  // ============================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or username already exists',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<any> {
    const user = await this.userService.create(createUserDto);
    
    // Create email verification
    await this.emailVerificationService.createVerification(user.id, user.email);
    
    return {
      message: 'User created successfully. Please check your email for verification.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        status: user.status,
      },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user statistics (Admin only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User statistics retrieved successfully",
  })
  async getStats() {
    return this.userService.getUserStats()
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user retrieved successfully',
  })
  async getCurrentUser(@CurrentUser('id') userId: string) {
    return this.userService.findOne(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User updated successfully",
  })
  async updateCurrentUser(@CurrentUser('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(userId, updateUserDto)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user by ID (Admin only)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User updated successfully",
  })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.remove(id);
  }

  // ============================================================================
  // PASSWORD MANAGEMENT ENDPOINTS
  // ============================================================================

  @Post("me/change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change current user password" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password changed successfully",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Current password is incorrect",
  })
  async changePassword(@CurrentUser('id') userId: string, @Body() changePasswordDto: ChangePasswordDto) {
    await this.userService.changePassword(userId, changePasswordDto)
    return { message: "Password changed successfully" }
  }

  // ============================================================================
  // USER STATUS MANAGEMENT ENDPOINTS
  // ============================================================================

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user status (Admin only)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User status updated successfully",
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: UserStatus; reason?: string },
    @CurrentUser('id') adminId: string,
  ) {
    return this.userService.updateStatus(id, body.status, body.reason, adminId)
  }

  // ============================================================================
  // USER PROFILE ENDPOINTS
  // ============================================================================

  @Post("me/profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create current user profile" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Profile created successfully",
  })
  async createProfile(@CurrentUser('id') userId: string, @Body() createProfileDto: CreateUserProfileDto) {
    return this.profileService.create(userId, createProfileDto)
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
  })
  async getCurrentUserProfile(@CurrentUser('id') userId: string) {
    return this.profileService.findByUserId(userId);
  }

  @Patch("me/profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile updated successfully",
  })
  async updateProfile(@CurrentUser('id') userId: string, @Body() updateProfileDto: UpdateUserProfileDto) {
    return this.profileService.update(userId, updateProfileDto)
  }

  @Get(':id/profile/public')
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public profile retrieved successfully',
  })
  async getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.profileService.getPublicProfile(id);
  }

  @Get("profiles/search")
  @ApiOperation({ summary: "Search user profiles" })
  @ApiQuery({ name: "q", description: "Search query" })
  @ApiQuery({ name: "limit", description: "Limit results", required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profiles found successfully",
  })
  async searchProfiles(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.profileService.searchProfiles(query, limit)
  }

  // ============================================================================
  // USER PREFERENCES ENDPOINTS
  // ============================================================================

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences retrieved successfully',
  })
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.preferencesService.findByUserId(userId);
  }

  @Patch("me/preferences")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user preferences" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Preferences updated successfully",
  })
  async updatePreferences(@CurrentUser('id') userId: string, @Body() updatePreferencesDto: UpdateUserPreferencesDto) {
    return this.preferencesService.update(userId, updatePreferencesDto)
  }

  @Patch("me/preferences/notifications")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update notification preferences" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notification preferences updated successfully",
  })
  async updateNotificationPreferences(
    @CurrentUser('id') userId: string,
    @Body() preferences: Partial<UpdateUserPreferencesDto>,
  ) {
    return this.preferencesService.updateNotificationPreferences(userId, preferences)
  }

  @Patch("me/preferences/privacy")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update privacy preferences" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Privacy preferences updated successfully",
  })
  async updatePrivacyPreferences(
    @CurrentUser('id') userId: string,
    @Body() preferences: Partial<UpdateUserPreferencesDto>,
  ) {
    return this.preferencesService.updatePrivacyPreferences(userId, preferences)
  }

  @Post('me/preferences/reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset preferences to defaults' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences reset successfully',
  })
  async resetPreferences(@CurrentUser('id') userId: string) {
    return this.preferencesService.resetToDefaults(userId);
  }

  // ============================================================================
  // EMAIL VERIFICATION ENDPOINTS
  // ============================================================================

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.emailVerificationService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email is already verified',
  })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.emailVerificationService.resendVerification(resendDto);
  }

  @Get('me/verification-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get email verification history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification history retrieved successfully',
  })
  async getVerificationHistory(@CurrentUser('id') userId: string) {
    return this.emailVerificationService.getVerificationHistory(userId);
  }
}
