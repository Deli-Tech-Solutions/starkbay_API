import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { User } from "./entities/user.entity"
import { UserProfile } from "./entities/user-profile.entity"
import { UserPreferences } from "./entities/user-preferences.entity"
import { EmailVerification } from "./entities/email-verification.entity"
import { UserStatusHistory } from "./entities/user-status-history.entity"
import { UserController } from "./controllers/user.controller"
import { UserService } from "./providers/user.service"
import { UserProfileService } from "./providers/user-profile.service"
import { UserPreferencesService } from "./providers/user-preferences.service"
import { EmailVerificationService } from "./providers/email-verification.service"

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserPreferences, EmailVerification, UserStatusHistory])],
  controllers: [UserController],
  providers: [UserService, UserProfileService, UserPreferencesService, EmailVerificationService],
  exports: [UserService, UserProfileService, UserPreferencesService, EmailVerificationService],
})
export class UserModule {}
