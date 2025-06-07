import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDate, Min, Max, Length } from 'class-validator';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsString()
  @Length(3, 50, { message: 'Coupon code must be between 3 and 50 characters' })
  code: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType, { message: 'Discount type must be either PERCENTAGE or FIXED_AMOUNT' })
  discountType: DiscountType;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Discount value must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Discount value must be greater than or equal to 0' })
  @Max(100, { message: 'Percentage discount cannot exceed 100%' })
  discountValue: number;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  @IsEnum(CouponStatus, { message: 'Status must be ACTIVE, INACTIVE, or EXPIRED' })
  status: CouponStatus;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description cannot exceed 500 characters' })
  description: string;

  @Column({ default: 1 })
  @IsNumber({}, { message: 'Usage limit must be a valid number' })
  @Min(1, { message: 'Usage limit must be at least 1' })
  usageLimit: number;

  @Column({ default: 0 })
  @IsNumber({}, { message: 'Usage count must be a valid number' })
  @Min(0, { message: 'Usage count cannot be negative' })
  usageCount: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Minimum purchase amount must be a valid number' })
  @Min(0, { message: 'Minimum purchase amount must be greater than or equal to 0' })
  minimumPurchaseAmount: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Maximum discount amount must be a valid number' })
  @Min(0, { message: 'Maximum discount amount must be greater than or equal to 0' })
  maximumDiscountAmount: number;

  @Column({ type: 'timestamp' })
  @IsDate({ message: 'Start date must be a valid date' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate({ message: 'End date must be a valid date' })
  endDate: Date;

  @Column({ default: false })
  @IsBoolean({ message: 'First time user only must be a boolean value' })
  isFirstTimeUserOnly: boolean;

  @Column({ default: false })
  @IsBoolean({ message: 'Single use must be a boolean value' })
  isSingleUse: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 