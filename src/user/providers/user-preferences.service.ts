import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { User } from "../entities/user.entity"
import { UserPreferences } from "../entities/user-preferences.entity"
import { UpdateUserPreferencesDto } from "../dto/user-preferences.dto"

@Injectable()
export class UserPreferencesService {
  private preferencesRepository: Repository<UserPreferences>
  private userRepository: Repository<User>

  constructor(
    @InjectRepository(UserPreferences)
    preferencesRepository: Repository<UserPreferences>,
    @InjectRepository(User)
    userRepository: Repository<User>,
  ) {
    this.preferencesRepository = preferencesRepository
    this.userRepository = userRepository
  }

  async createDefault(userId: string): Promise<UserPreferences> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    // Create default preferences
    const preferences = this.preferencesRepository.create({
      userId,
      // All default values are set in the entity
    })

    return this.preferencesRepository.save(preferences)
  }

  async findByUserId(userId: string): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
      relations: ["user"],
    })

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await this.createDefault(userId)
    }

    return preferences
  }

  async update(userId: string, updatePreferencesDto: UpdateUserPreferencesDto): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId)

    Object.assign(preferences, updatePreferencesDto)
    return this.preferencesRepository.save(preferences)
  }

  async updateNotificationPreferences(
    userId: string,
    notificationPreferences: Partial<UpdateUserPreferencesDto>,
  ): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId)

    // Update only notification-related preferences
    const notificationFields = [
      "emailNotifications",
      "pushNotifications",
      "smsNotifications",
      "marketingEmails",
      "newsletterSubscription",
      "orderUpdates",
      "securityAlerts",
      "productRecommendations",
      "reviewReminders",
      "wishlistNotifications",
    ]

    notificationFields.forEach((field) => {
      if (notificationPreferences[field] !== undefined) {
        preferences[field] = notificationPreferences[field]
      }
    })

    return this.preferencesRepository.save(preferences)
  }

  async updatePrivacyPreferences(
    userId: string,
    privacyPreferences: Partial<UpdateUserPreferencesDto>,
  ): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId)

    // Update only privacy-related preferences
    const privacyFields = [
      "profilePublic",
      "showOnlineStatus",
      "allowFriendRequests",
      "showPurchaseHistory",
      "showWishlist",
      "showReviews",
    ]

    privacyFields.forEach((field) => {
      if (privacyPreferences[field] !== undefined) {
        preferences[field] = privacyPreferences[field]
      }
    })

    return this.preferencesRepository.save(preferences)
  }

  async updateShoppingPreferences(
    userId: string,
    shoppingPreferences: Partial<UpdateUserPreferencesDto>,
  ): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId)

    // Update only shopping-related preferences
    const shoppingFields = [
      "defaultShippingAddressId",
      "defaultBillingAddressId",
      "defaultPaymentMethodId",
      "savePaymentMethods",
      "autoApplyCoupons",
      "priceAlerts",
      "stockAlerts",
    ]

    shoppingFields.forEach((field) => {
      if (shoppingPreferences[field] !== undefined) {
        preferences[field] = shoppingPreferences[field]
      }
    })

    return this.preferencesRepository.save(preferences)
  }

  async updateContentPreferences(
    userId: string,
    contentPreferences: Partial<UpdateUserPreferencesDto>,
  ): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId)

    // Update only content-related preferences
    const contentFields = ["interests", "favoriteCategories", "favoriteBrands", "blockedCategories", "blockedBrands"]

    contentFields.forEach((field) => {
      if (contentPreferences[field] !== undefined) {
        preferences[field] = contentPreferences[field]
      }
    })

    return this.preferencesRepository.save(preferences)
  }

  async resetToDefaults(userId: string): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId)

    // Remove existing preferences
    await this.preferencesRepository.remove(preferences)

    // Create new default preferences
    return this.createDefault(userId)
  }

  async exportPreferences(userId: string): Promise<UserPreferences> {
    return this.findByUserId(userId)
  }

  async importPreferences(userId: string, preferencesData: Partial<UserPreferences>): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId)

    // Remove sensitive fields that shouldn't be imported
    const { id, userId: importedUserId, user, createdAt, updatedAt, ...importData } = preferencesData

    Object.assign(preferences, importData)
    return this.preferencesRepository.save(preferences)
  }
}
