import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { randomBytes } from "crypto"
import { EmailVerification, VerificationStatus, VerificationType } from "../entities/email-verification.entity"
import { User, UserStatus } from "../entities/user.entity"
import { ResendVerificationDto, VerifyEmailDto } from "../dto/verify-email.dto"

@Injectable()
export class EmailVerificationService {
  private verificationRepository: Repository<EmailVerification>
  private userRepository: Repository<User>

  constructor(
    @InjectRepository(EmailVerification)
    verificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    userRepository: Repository<User>,
  ) {
    this.verificationRepository = verificationRepository
    this.userRepository = userRepository
  }

  async createVerification(
    userId: string,
    email: string,
    type: VerificationType = VerificationType.EMAIL_VERIFICATION,
    expirationHours = 24,
  ): Promise<EmailVerification> {
    // Generate secure token
    const token = this.generateVerificationToken()

    // Set expiration date
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expirationHours)

    // Invalidate any existing pending verifications for this user and type
    await this.verificationRepository.update(
      {
        userId,
        type,
        status: VerificationStatus.PENDING,
      },
      {
        status: VerificationStatus.EXPIRED,
      },
    )

    // Create new verification
    const verification = this.verificationRepository.create({
      userId,
      email,
      token,
      type,
      expiresAt,
      status: VerificationStatus.PENDING,
    })

    const savedVerification = await this.verificationRepository.save(verification)

    // Send verification email (in a real app, this would be handled by an email service)
    await this.sendVerificationEmail(email, token, type)

    return savedVerification
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{
    success: boolean
    message: string
    user?: User
  }> {
    const { token, email } = verifyEmailDto

    // Find verification record
    const verification = await this.verificationRepository.findOne({
      where: { token },
      relations: ["user"],
    })

    if (!verification) {
      throw new NotFoundException("Invalid verification token")
    }

    // Check if email matches (if provided)
    if (email && verification.email !== email) {
      throw new BadRequestException("Email does not match verification token")
    }

    // Check if verification is valid
    if (!verification.isValid) {
      if (verification.isExpired) {
        throw new BadRequestException("Verification token has expired")
      }
      if (verification.attempts >= verification.maxAttempts) {
        throw new BadRequestException("Maximum verification attempts exceeded")
      }
      if (verification.status !== VerificationStatus.PENDING) {
        throw new BadRequestException("Verification token is no longer valid")
      }
    }

    // Increment attempts
    verification.attempts += 1

    try {
      // Update verification status
      verification.status = VerificationStatus.VERIFIED
      verification.verifiedAt = new Date()
      await this.verificationRepository.save(verification)

      // Update user based on verification type
      const user = verification.user

      switch (verification.type) {
        case VerificationType.EMAIL_VERIFICATION:
          user.emailVerified = true
          user.emailVerifiedAt = new Date()
          if (user.status === UserStatus.PENDING_VERIFICATION) {
            user.status = UserStatus.ACTIVE
          }
          break

        case VerificationType.EMAIL_CHANGE:
          user.email = verification.email
          user.emailVerified = true
          user.emailVerifiedAt = new Date()
          break
      }

      await this.userRepository.save(user)

      return {
        success: true,
        message: "Email verified successfully",
        user,
      }
    } catch (error) {
      // Update verification status on failure
      verification.status = VerificationStatus.FAILED
      await this.verificationRepository.save(verification)

      throw new BadRequestException("Email verification failed")
    }
  }

  async resendVerification(resendDto: ResendVerificationDto): Promise<{
    success: boolean
    message: string
  }> {
    const { email } = resendDto

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Check if email is already verified
    if (user.emailVerified) {
      throw new ConflictException("Email is already verified")
    }

    // Check for recent verification attempts
    const recentVerification = await this.verificationRepository.findOne({
      where: {
        userId: user.id,
        type: VerificationType.EMAIL_VERIFICATION,
        status: VerificationStatus.PENDING,
      },
      order: { createdAt: "DESC" },
    })

    if (recentVerification && !recentVerification.isExpired) {
      const timeLeft = Math.ceil((recentVerification.expiresAt.getTime() - Date.now()) / (1000 * 60))
      throw new BadRequestException(
        `A verification email was already sent. Please wait ${timeLeft} minutes before requesting another.`,
      )
    }

    // Create new verification
    await this.createVerification(user.id, email)

    return {
      success: true,
      message: "Verification email sent successfully",
    }
  }

  async createPasswordResetVerification(email: string): Promise<EmailVerification> {
    const user = await this.userRepository.findOne({ where: { email } })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return this.createVerification(
      user.id,
      email,
      VerificationType.PASSWORD_RESET,
      2, // 2 hours expiration for password reset
    )
  }

  async verifyPasswordReset(token: string): Promise<User> {
    const verification = await this.verificationRepository.findOne({
      where: {
        token,
        type: VerificationType.PASSWORD_RESET,
        status: VerificationStatus.PENDING,
      },
      relations: ["user"],
    })

    if (!verification || !verification.isValid) {
      throw new BadRequestException("Invalid or expired password reset token")
    }

    // Mark verification as used
    verification.status = VerificationStatus.VERIFIED
    verification.verifiedAt = new Date()
    await this.verificationRepository.save(verification)

    return verification.user
  }

  async getVerificationHistory(userId: string): Promise<EmailVerification[]> {
    return this.verificationRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    })
  }

  async cleanupExpiredVerifications(): Promise<void> {
    await this.verificationRepository.update(
      {
        status: VerificationStatus.PENDING,
        expiresAt: new Date(),
      },
      {
        status: VerificationStatus.EXPIRED,
      },
    )
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString("hex")
  }

  private async sendVerificationEmail(email: string, token: string, type: VerificationType): Promise<void> {
    // In a real application, this would integrate with an email service
    // like SendGrid, AWS SES, or similar
    console.log(`Sending ${type} email to ${email} with token: ${token}`)

    // Example email content based on type
    const emailContent = this.getEmailContent(type, token)
    console.log("Email content:", emailContent)
  }

  private getEmailContent(
    type: VerificationType,
    token: string,
  ): {
    subject: string
    body: string
  } {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000"

    switch (type) {
      case VerificationType.EMAIL_VERIFICATION:
        return {
          subject: "Verify Your Email Address",
          body: `
            Please click the following link to verify your email address:
            ${baseUrl}/verify-email?token=${token}
            
            This link will expire in 24 hours.
          `,
        }

      case VerificationType.EMAIL_CHANGE:
        return {
          subject: "Confirm Email Address Change",
          body: `
            Please click the following link to confirm your new email address:
            ${baseUrl}/verify-email-change?token=${token}
            
            This link will expire in 24 hours.
          `,
        }

      case VerificationType.PASSWORD_RESET:
        return {
          subject: "Reset Your Password",
          body: `
            Please click the following link to reset your password:
            ${baseUrl}/reset-password?token=${token}
            
            This link will expire in 2 hours.
          `,
        }

      default:
        return {
          subject: "Email Verification",
          body: `Your verification token is: ${token}`,
        }
    }
  }
}
