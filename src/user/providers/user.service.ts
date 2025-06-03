import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { User, UserStatus } from "../entities/user.entity"
import { UserStatusHistory } from "../entities/user-status-history.entity"
import { CreateUserDto } from "../dto/create-user.dto"
import { UserQueryDto } from "../dto/user-query.dto"
import { UpdateUserDto } from "../dto/update-user.dto"
import { ChangePasswordDto } from "../dto/change-password.dto"
import * as bcrypt from "bcrypt"

@Injectable()
export class UserService {
  constructor(
    private userRepository: Repository<User>,
    private statusHistoryRepository: Repository<UserStatusHistory>,
    @InjectRepository(User)
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    })

    if (existingEmail) {
      throw new ConflictException("Email already exists")
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    })

    if (existingUsername) {
      throw new ConflictException("Username already exists")
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds)

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    })

    const savedUser = await this.userRepository.save(user)

    // Create initial status history
    await this.createStatusHistory(savedUser.id, null, savedUser.status, "system", "User account created")

    return this.findOne(savedUser.id)
  }

  async findAll(query: UserQueryDto): Promise<{
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const {
      page,
      limit,
      search,
      status,
      role,
      emailVerified,
      twoFactorEnabled,
      createdAfter,
      createdBefore,
      lastLoginAfter,
      sortBy,
      sortOrder,
    } = query

    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.profile", "profile")
      .leftJoinAndSelect("user.preferences", "preferences")

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)",
        { search: `%${search}%` },
      )
    }

    // Filters
    if (status) {
      queryBuilder.andWhere("user.status = :status", { status })
    }

    if (role) {
      queryBuilder.andWhere("user.role = :role", { role })
    }

    if (emailVerified !== undefined) {
      queryBuilder.andWhere("user.emailVerified = :emailVerified", {
        emailVerified,
      })
    }

    if (twoFactorEnabled !== undefined) {
      queryBuilder.andWhere("user.twoFactorEnabled = :twoFactorEnabled", {
        twoFactorEnabled,
      })
    }

    if (createdAfter) {
      queryBuilder.andWhere("user.createdAt >= :createdAfter", {
        createdAfter: new Date(createdAfter),
      })
    }

    if (createdBefore) {
      queryBuilder.andWhere("user.createdAt <= :createdBefore", {
        createdBefore: new Date(createdBefore),
      })
    }

    if (lastLoginAfter) {
      queryBuilder.andWhere("user.lastLoginAt >= :lastLoginAfter", {
        lastLoginAfter: new Date(lastLoginAfter),
      })
    }

    // Sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder)

    // Pagination
    const currentPage = page ?? 1
    const safeLimit = limit ?? 10
    const skip = (currentPage - 1) * safeLimit
    queryBuilder.skip(skip).take(safeLimit)

    const [users, total] = await queryBuilder.getManyAndCount()

    return {
      users,
      total,
      page: currentPage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["profile", "preferences", "statusHistory"],
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return user
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["profile", "preferences"],
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return user
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ["profile", "preferences"],
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id)

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      })

      if (existingEmail) {
        throw new ConflictException("Email already exists")
      }

      // Reset email verification if email is changed
      user.emailVerified = false
      user.emailVerifiedAt = undefined
    }

    // Check username uniqueness if username is being updated
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      })

      if (existingUsername) {
        throw new ConflictException("Username already exists")
      }
    }

    // Track status changes
    if (updateUserDto.status && updateUserDto.status !== user.status) {
      await this.createStatusHistory(
        id,
        user.status,
        updateUserDto.status,
        "admin", // In a real app, get this from the current user context
        "Status updated via API",
      )
    }

    // Update user
    Object.assign(user, updateUserDto)
    return this.userRepository.save(user)
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect")
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds)

    // Update password
    user.password = hashedPassword
    user.passwordResetToken = ""
    user.passwordResetExpires = undefined

    await this.userRepository.save(user)
  }

  async updateStatus(id: string, status: UserStatus, reason?: string, changedBy?: string): Promise<User> {
    const user = await this.findOne(id)
    const previousStatus = user.status

    user.status = status

    // Handle specific status changes
    if (status === UserStatus.SUSPENDED || status === UserStatus.BANNED) {
      user.lockedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    } else if (status === UserStatus.ACTIVE) {
      user.lockedUntil = null
      user.loginAttempts = 0
    }

    await this.userRepository.save(user)

    // Create status history
    await this.createStatusHistory(id, previousStatus, status, changedBy || "system", reason)

    return this.findOne(id)
  }

  async updateLastLogin(id: string, ipAddress?: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      loginAttempts: 0,
    })
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    user.loginAttempts += 1

    // Lock account after 5 failed attempts
    if (user.loginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      user.status = UserStatus.SUSPENDED

      await this.createStatusHistory(
        id,
        user.status,
        UserStatus.SUSPENDED,
        "system",
        "Account locked due to multiple failed login attempts",
      )
    }

    await this.userRepository.save(user)
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id)

    // Soft delete by updating status
    user.status = UserStatus.INACTIVE
    await this.userRepository.save(user)

    await this.createStatusHistory(id, user.status, UserStatus.INACTIVE, "admin", "Account deleted")
  }

  async getUserStats(): Promise<{
    total: number
    active: number
    inactive: number
    suspended: number
    banned: number
    pendingVerification: number
    emailVerified: number
    twoFactorEnabled: number
  }> {
    const [total, active, inactive, suspended, banned, pendingVerification, emailVerified, twoFactorEnabled] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
        this.userRepository.count({ where: { status: UserStatus.INACTIVE } }),
        this.userRepository.count({ where: { status: UserStatus.SUSPENDED } }),
        this.userRepository.count({ where: { status: UserStatus.BANNED } }),
        this.userRepository.count({
          where: { status: UserStatus.PENDING_VERIFICATION },
        }),
        this.userRepository.count({ where: { emailVerified: true } }),
        this.userRepository.count({ where: { twoFactorEnabled: true } }),
      ])

    return {
      total,
      active,
      inactive,
      suspended,
      banned,
      pendingVerification,
      emailVerified,
      twoFactorEnabled,
    }
  }

  private async createStatusHistory(
    userId: string,
    previousStatus: UserStatus | null,
    newStatus: UserStatus,
    changedBy: string,
    reason?: string,
  ): Promise<void> {
    const statusHistory = this.statusHistoryRepository.create({
      userId,
      previousStatus,
      newStatus,
      changedBy,
      reason,
    })

    await this.statusHistoryRepository.save(statusHistory)
  }
}
