import { IsOptional, IsBoolean, IsEnum, IsString, IsInt, Min, Max, IsArray, IsObject } from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { Theme, Language } from "../entities/user-preferences.entity"

export class UpdateUserPreferencesDto {
  // Notification Preferences
  @ApiPropertyOptional({ description: "Enable email notifications" })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean

  @ApiPropertyOptional({ description: "Enable push notifications" })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean

  @ApiPropertyOptional({ description: "Enable SMS notifications" })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean

  @ApiPropertyOptional({ description: "Enable marketing emails" })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean

  @ApiPropertyOptional({ description: "Subscribe to newsletter" })
  @IsOptional()
  @IsBoolean()
  newsletterSubscription?: boolean

  @ApiPropertyOptional({ description: "Enable order update notifications" })
  @IsOptional()
  @IsBoolean()
  orderUpdates?: boolean

  @ApiPropertyOptional({ description: "Enable security alert notifications" })
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean

  @ApiPropertyOptional({ description: "Enable product recommendation notifications" })
  @IsOptional()
  @IsBoolean()
  productRecommendations?: boolean

  @ApiPropertyOptional({ description: "Enable review reminder notifications" })
  @IsOptional()
  @IsBoolean()
  reviewReminders?: boolean

  @ApiPropertyOptional({ description: "Enable wishlist notifications" })
  @IsOptional()
  @IsBoolean()
  wishlistNotifications?: boolean

  // UI/UX Preferences
  @ApiPropertyOptional({ description: "Theme preference", enum: Theme })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme

  @ApiPropertyOptional({ description: "Language preference", enum: Language })
  @IsOptional()
  @IsEnum(Language)
  language?: Language

  @ApiPropertyOptional({ description: "Timezone", example: "America/New_York" })
  @IsOptional()
  @IsString()
  timezone?: string

  @ApiPropertyOptional({ description: "Date format", example: "MM/DD/YYYY" })
  @IsOptional()
  @IsString()
  dateFormat?: string

  @ApiPropertyOptional({ description: "Time format", enum: ["12h", "24h"] })
  @IsOptional()
  @IsEnum(["12h", "24h"])
  timeFormat?: "12h" | "24h"

  @ApiPropertyOptional({ description: "Currency code", example: "USD" })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiPropertyOptional({ description: "Items per page", minimum: 10, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  itemsPerPage?: number

  // Privacy Preferences
  @ApiPropertyOptional({ description: "Make profile public" })
  @IsOptional()
  @IsBoolean()
  profilePublic?: boolean

  @ApiPropertyOptional({ description: "Show online status" })
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean

  @ApiPropertyOptional({ description: "Allow friend requests" })
  @IsOptional()
  @IsBoolean()
  allowFriendRequests?: boolean

  @ApiPropertyOptional({ description: "Show purchase history" })
  @IsOptional()
  @IsBoolean()
  showPurchaseHistory?: boolean

  @ApiPropertyOptional({ description: "Show wishlist" })
  @IsOptional()
  @IsBoolean()
  showWishlist?: boolean

  @ApiPropertyOptional({ description: "Show reviews" })
  @IsOptional()
  @IsBoolean()
  showReviews?: boolean

  // Shopping Preferences
  @ApiPropertyOptional({ description: "Default shipping address ID" })
  @IsOptional()
  @IsString()
  defaultShippingAddressId?: string

  @ApiPropertyOptional({ description: "Default billing address ID" })
  @IsOptional()
  @IsString()
  defaultBillingAddressId?: string

  @ApiPropertyOptional({ description: "Default payment method ID" })
  @IsOptional()
  @IsString()
  defaultPaymentMethodId?: string

  @ApiPropertyOptional({ description: "Save payment methods" })
  @IsOptional()
  @IsBoolean()
  savePaymentMethods?: boolean

  @ApiPropertyOptional({ description: "Auto-apply coupons" })
  @IsOptional()
  @IsBoolean()
  autoApplyCoupons?: boolean

  @ApiPropertyOptional({ description: "Enable price alerts" })
  @IsOptional()
  @IsBoolean()
  priceAlerts?: boolean

  @ApiPropertyOptional({ description: "Enable stock alerts" })
  @IsOptional()
  @IsBoolean()
  stockAlerts?: boolean

  // Content Preferences
  @ApiPropertyOptional({ description: "User interests", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[]

  @ApiPropertyOptional({ description: "Favorite categories", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteCategories?: string[]

  @ApiPropertyOptional({ description: "Favorite brands", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteBrands?: string[]

  @ApiPropertyOptional({ description: "Blocked categories", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedCategories?: string[]

  @ApiPropertyOptional({ description: "Blocked brands", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedBrands?: string[]

  @ApiPropertyOptional({ description: "Custom preferences" })
  @IsOptional()
  @IsObject()
  customPreferences?: Record<string, any>
}
