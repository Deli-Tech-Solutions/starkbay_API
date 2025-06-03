import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { User } from "./user.entity"

export enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  EXPIRED = "expired",
  FAILED = "failed",
}

export enum VerificationType {
  EMAIL_VERIFICATION = "email_verification",
  EMAIL_CHANGE = "email_change",
  PASSWORD_RESET = "password_reset",
}

@Entity("email_verifications")
@Index(["token"])
@Index(["email"])
@Index(["status"])
@Index(["expiresAt"])
export class EmailVerification {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "user_id" })
  userId: string

  @Column({ length: 255 })
  email: string

  @Column({ unique: true })
  token: string

  @Column({
    type: "enum",
    enum: VerificationType,
    default: VerificationType.EMAIL_VERIFICATION,
  })
  type: VerificationType

  @Column({
    type: "enum",
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date

  @Column({ name: "verified_at", type: "timestamp", nullable: true })
  verifiedAt: Date

  @Column({ name: "attempts", default: 0 })
  attempts: number

  @Column({ name: "max_attempts", default: 3 })
  maxAttempts: number

  @Column({ name: "ip_address", nullable: true })
  ipAddress: string

  @Column({ name: "user_agent", nullable: true })
  userAgent: string

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>

  @ManyToOne(
    () => User,
    (user) => user.emailVerifications,
  )
  @JoinColumn({ name: "user_id" })
  user: User

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  // Virtual properties
  get isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  get isValid(): boolean {
    return this.status === VerificationStatus.PENDING && !this.isExpired && this.attempts < this.maxAttempts
  }
}
