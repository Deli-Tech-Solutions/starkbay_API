import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { UserProfile } from "../entities/user-profile.entity"
import { User } from "../entities/user.entity"
import { CreateUserProfileDto, UpdateUserProfileDto } from "../dto/user-profile.dto"

@Injectable()
export class UserProfileService {
  constructor(
    private profileRepository: Repository<UserProfile>,
    private userRepository: Repository<User>,
  ) {}

  async create(userId: string, createProfileDto: CreateUserProfileDto): Promise<UserProfile> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Check if profile already exists
    const existingProfile = await this.profileRepository.findOne({
      where: { userId },
    })

    if (existingProfile) {
      throw new ForbiddenException("User profile already exists")
    }

    const profile = this.profileRepository.create({
      userId,
      ...createProfileDto,
    })

    return this.profileRepository.save(profile)
  }

  async findByUserId(userId: string): Promise<UserProfile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ["user"],
    })

    if (!profile) {
      throw new NotFoundException("User profile not found")
    }

    return profile
  }

  async update(userId: string, updateProfileDto: UpdateUserProfileDto): Promise<UserProfile> {
    const profile = await this.findByUserId(userId)

    Object.assign(profile, updateProfileDto)
    return this.profileRepository.save(profile)
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserProfile> {
    const profile = await this.findByUserId(userId)
    profile.avatar = avatarUrl
    return this.profileRepository.save(profile)
  }

  async verifyPhone(userId: string): Promise<UserProfile> {
    const profile = await this.findByUserId(userId)
    profile.phoneVerified = true
    return this.profileRepository.save(profile)
  }

  async getPublicProfile(userId: string): Promise<Partial<UserProfile>> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ["user"],
    })

    if (!profile) {
      throw new NotFoundException("User profile not found")
    }

    // Return only public information based on privacy settings
    const publicProfile: Partial<UserProfile> = {
      bio: profile.bio,
      avatar: profile.avatar,
      company: profile.company,
      jobTitle: profile.jobTitle,
      location: profile.location,
      website: profile.website,
      socialLinks: profile.socialLinks,
    }

    // Add conditional fields based on privacy settings
    if (profile.profileVisibility === "public") {
      if (profile.showEmail) {
        publicProfile["email"] = profile.user.email
      }
      if (profile.showPhone) {
        publicProfile["phoneNumber"] = profile.phoneNumber
      }
    }

    return publicProfile
  }

  async searchProfiles(query: string, limit = 10): Promise<UserProfile[]> {
    return this.profileRepository
      .createQueryBuilder("profile")
      .leftJoinAndSelect("profile.user", "user")
      .where("profile.profileVisibility = :visibility", { visibility: "public" })
      .andWhere(
        "(user.firstName ILIKE :query OR user.lastName ILIKE :query OR profile.bio ILIKE :query OR profile.company ILIKE :query)",
        { query: `%${query}%` },
      )
      .limit(limit)
      .getMany()
  }

  async remove(userId: string): Promise<void> {
    const profile = await this.findByUserId(userId)
    await this.profileRepository.remove(profile)
  }
}
