import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./user.entity"

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
}

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "user_id" })
  userId: string

  @Column({ type: "text", nullable: true })
  bio: string

  @Column({ nullable: true })
  avatar: string

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth: Date

  @Column({
    type: "enum",
    enum: Gender,
    nullable: true,
  })
  gender: Gender

  @Column({ name: "phone_number", nullable: true })
  phoneNumber: string

  @Column({ name: "phone_verified", default: false })
  phoneVerified: boolean

  @Column({ nullable: true })
  website: string

  @Column({ nullable: true })
  company: string

  @Column({ name: "job_title", nullable: true })
  jobTitle: string

  @Column({ nullable: true })
  location: string

  @Column({ nullable: true })
  timezone: string

  @Column({ nullable: true })
  language: string

  @Column({ type: "json", nullable: true })
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }

  @Column({ type: "json", nullable: true })
  socialLinks: {
    twitter?: string
    linkedin?: string
    github?: string
    facebook?: string
    instagram?: string
  }

  @Column({ name: "profile_visibility", default: "public" })
  profileVisibility: "public" | "private" | "friends"

  @Column({ name: "show_email", default: false })
  showEmail: boolean

  @Column({ name: "show_phone", default: false })
  showPhone: boolean

  @OneToOne(
    () => User,
    (user) => user.profile,
  )
  @JoinColumn({ name: "user_id" })
  user: User

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  // Virtual properties
  get age(): number | null {
    if (!this.dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(this.dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }
}
