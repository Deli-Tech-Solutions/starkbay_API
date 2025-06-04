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

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
  AUTO = "auto",
}

export enum Language {
  EN = "en",
  ES = "es",
  FR = "fr",
  DE = "de",
  IT = "it",
  PT = "pt",
  RU = "ru",
  ZH = "zh",
  JA = "ja",
  KO = "ko",
}

@Entity("user_preferences")
export class UserPreferences {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "user_id" })
  userId: string

  // Notification Preferences
  @Column({ name: "email_notifications", default: true })
  emailNotifications: boolean

  @Column({ name: "push_notifications", default: true })
  pushNotifications: boolean

  @Column({ name: "sms_notifications", default: false })
  smsNotifications: boolean

  @Column({ name: "marketing_emails", default: false })
  marketingEmails: boolean

  @Column({ name: "newsletter_subscription", default: false })
  newsletterSubscription: boolean

  @Column({ name: "order_updates", default: true })
  orderUpdates: boolean

  @Column({ name: "security_alerts", default: true })
  securityAlerts: boolean

  @Column({ name: "product_recommendations", default: true })
  productRecommendations: boolean

  @Column({ name: "review_reminders", default: true })
  reviewReminders: boolean

  @Column({ name: "wishlist_notifications", default: true })
  wishlistNotifications: boolean

  // UI/UX Preferences
  @Column({
    type: "enum",
    enum: Theme,
    default: Theme.AUTO,
  })
  theme: Theme

  @Column({
    type: "enum",
    enum: Language,
    default: Language.EN,
  })
  language: Language

  @Column({ default: "UTC" })
  timezone: string

  @Column({ name: "date_format", default: "MM/DD/YYYY" })
  dateFormat: string

  @Column({ name: "time_format", default: "12h" })
  timeFormat: "12h" | "24h"

  @Column({ default: "USD" })
  currency: string

  @Column({ name: "items_per_page", default: 20 })
  itemsPerPage: number

  // Privacy Preferences
  @Column({ name: "profile_public", default: true })
  profilePublic: boolean

  @Column({ name: "show_online_status", default: true })
  showOnlineStatus: boolean

  @Column({ name: "allow_friend_requests", default: true })
  allowFriendRequests: boolean

  @Column({ name: "show_purchase_history", default: false })
  showPurchaseHistory: boolean

  @Column({ name: "show_wishlist", default: true })
  showWishlist: boolean

  @Column({ name: "show_reviews", default: true })
  showReviews: boolean

  // Shopping Preferences
  @Column({ name: "default_shipping_address_id", nullable: true })
  defaultShippingAddressId: string

  @Column({ name: "default_billing_address_id", nullable: true })
  defaultBillingAddressId: string

  @Column({ name: "default_payment_method_id", nullable: true })
  defaultPaymentMethodId: string

  @Column({ name: "save_payment_methods", default: false })
  savePaymentMethods: boolean

  @Column({ name: "auto_apply_coupons", default: true })
  autoApplyCoupons: boolean

  @Column({ name: "price_alerts", default: false })
  priceAlerts: boolean

  @Column({ name: "stock_alerts", default: false })
  stockAlerts: boolean

  // Content Preferences
  @Column({ type: "simple-array", nullable: true })
  interests: string[]

  @Column({ type: "simple-array", nullable: true })
  favoriteCategories: string[]

  @Column({ type: "simple-array", nullable: true })
  favoriteBrands: string[]

  @Column({ type: "simple-array", nullable: true })
  blockedCategories: string[]

  @Column({ type: "simple-array", nullable: true })
  blockedBrands: string[]

  // Custom preferences (flexible JSON field)
  @Column({ type: "json", nullable: true })
  customPreferences: Record<string, any>

  @OneToOne(
    () => User,
    (user) => user.preferences,
  )
  @JoinColumn({ name: "user_id" })
  user: User

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date
}
