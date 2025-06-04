import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from "typeorm"
import { Review } from "../../review/entities/review.entity"
import { ReviewVote } from "../../review/entities/review-vote.entity"
import { UserProfile } from "./user-profile.entity"
import { UserPreferences } from "./user-preferences.entity"
import { EmailVerification } from "./email-verification.entity"
import { UserStatusHistory } from "./user-status-history.entity"

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  BANNED = "banned",
  PENDING_VERIFICATION = "pending_verification",
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
  SUPER_ADMIN = "super_admin",
}

@Entity("users")
@Index(["email"])
@Index(["username"])
@Index(["status"])
@Index(["role"])
@Index(["createdAt"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ unique: true, length: 100 })
  username: string

  @Column({ length: 255 })
  password: string

  @Column({ name: "first_name", length: 100 })
  firstName: string

  @Column({ name: "last_name", length: 100 })
  lastName: string

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole

  @Column({ name: "email_verified", default: false })
  emailVerified: boolean

  @Column({ name: "email_verified_at", type: "timestamp", nullable: true })
  emailVerifiedAt: Date

  @Column({ name: "last_login_at", type: "timestamp", nullable: true })
  lastLoginAt: Date

  @Column({ name: "last_login_ip", nullable: true })
  lastLoginIp: string

  @Column({ name: "login_attempts", default: 0 })
  loginAttempts: number

  @Column({ name: "locked_until", type: "timestamp", nullable: true })
  lockedUntil: Date

  @Column({ name: "password_reset_token", nullable: true })
  passwordResetToken: string

  @Column({ name: "password_reset_expires", type: "timestamp", nullable: true })
  passwordResetExpires: Date

  @Column({ name: "two_factor_enabled", default: false })
  twoFactorEnabled: boolean

  @Column({ name: "two_factor_secret", nullable: true })
  twoFactorSecret: string

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>

  @OneToOne(
    () => UserProfile,
    (profile) => profile.user,
    { cascade: true },
  )
  profile: UserProfile

  @OneToOne(
    () => UserPreferences,
    (preferences) => preferences.user,
    {
      cascade: true,
    },
  )
  preferences: UserPreferences

  @OneToMany(
    () => EmailVerification,
    (verification) => verification.user,
  )
  emailVerifications: EmailVerification[]

  @OneToMany(
    () => UserStatusHistory,
    (history) => history.user,
  )
  statusHistory: UserStatusHistory[]

  @OneToMany(
    () => Review,
    (review) => review.user,
  )
  reviews: Review[]

  @OneToMany(
    () => ReviewVote,
    (vote) => vote.user,
  )
  reviewVotes: ReviewVote[]

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE
  }

  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date()
  }

  get canLogin(): boolean {
    return this.emailVerified && this.isActive && !this.isLocked && this.status !== UserStatus.BANNED
  }
}
