import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { User, UserStatus } from "./user.entity"

@Entity("user_status_history")
@Index(["userId"])
@Index(["status"])
@Index(["createdAt"])
export class UserStatusHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "user_id" })
  userId: string

  @Column({
    type: "enum",
    enum: UserStatus,
    name: "previous_status",
    nullable: true,
  })
  previousStatus: UserStatus

  @Column({
    type: "enum",
    enum: UserStatus,
    name: "new_status",
  })
  newStatus: UserStatus

  @Column({ name: "changed_by", nullable: true })
  changedBy: string

  @Column({ type: "text", nullable: true })
  reason: string

  @Column({ name: "ip_address", nullable: true })
  ipAddress: string

  @Column({ name: "user_agent", nullable: true })
  userAgent: string

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>

  @ManyToOne(
    () => User,
    (user) => user.statusHistory,
  )
  @JoinColumn({ name: "user_id" })
  user: User

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
