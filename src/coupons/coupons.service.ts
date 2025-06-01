import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Coupon, CouponStatus } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.couponRepository.create(createCouponDto);
    return await this.couponRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return await this.couponRepository.find();
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }
    return coupon;
  }

  async validateCoupon(
    code: string,
    userId: string,
    orderAmount: number,
  ): Promise<{
    isValid: boolean;
    message: string;
    discountAmount: number;
  }> {
    const coupon = await this.findByCode(code);
    const now = new Date();

    // Check if coupon is active
    if (coupon.status !== CouponStatus.ACTIVE) {
      return {
        isValid: false,
        message: 'Coupon is not active',
        discountAmount: 0,
      };
    }

    // Check date validity
    if (now < coupon.startDate || now > coupon.endDate) {
      return {
        isValid: false,
        message: 'Coupon has expired or not yet active',
        discountAmount: 0,
      };
    }

    // Check usage limit
    if (coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        message: 'Coupon usage limit reached',
        discountAmount: 0,
      };
    }

    // Check minimum purchase amount
    if (
      coupon.minimumPurchaseAmount &&
      orderAmount < coupon.minimumPurchaseAmount
    ) {
      return {
        isValid: false,
        message: `Minimum purchase amount of ${coupon.minimumPurchaseAmount} required`,
        discountAmount: 0,
      };
    }

    // Check if user has already used this coupon
    if (coupon.isSingleUse) {
      const existingUsage = await this.couponUsageRepository.findOne({
        where: { couponId: coupon.id, userId },
      });
      if (existingUsage) {
        return {
          isValid: false,
          message: 'Coupon has already been used by this user',
          discountAmount: 0,
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Apply maximum discount limit if set
    if (
      coupon.maximumDiscountAmount &&
      discountAmount > coupon.maximumDiscountAmount
    ) {
      discountAmount = coupon.maximumDiscountAmount;
    }

    return {
      isValid: true,
      message: 'Coupon is valid',
      discountAmount,
    };
  }

  async applyCoupon(
    code: string,
    userId: string,
    orderId: string,
    orderAmount: number,
  ): Promise<CouponUsage> {
    const validation = await this.validateCoupon(code, userId, orderAmount);

    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    const coupon = await this.findByCode(code);
    const finalAmount = orderAmount - validation.discountAmount;

    // Create usage record
    const usage = this.couponUsageRepository.create({
      couponId: coupon.id,
      userId,
      orderId,
      originalAmount: orderAmount,
      discountAmount: validation.discountAmount,
      finalAmount,
    });

    // Update coupon usage count
    coupon.usageCount += 1;
    if (coupon.usageCount >= coupon.usageLimit) {
      coupon.status = CouponStatus.INACTIVE;
    }
    await this.couponRepository.save(coupon);

    return await this.couponUsageRepository.save(usage);
  }

  async getCouponAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalCoupons: number;
    totalUsage: number;
    totalDiscount: number;
    averageDiscount: number;
  }> {
    const usages = await this.couponUsageRepository.find({
      where: {
        usedAt: Between(startDate, endDate),
      },
    });

    const totalUsage = usages.length;
    const totalDiscount = usages.reduce(
      (sum, usage) => sum + usage.discountAmount,
      0,
    );
    const averageDiscount = totalUsage > 0 ? totalDiscount / totalUsage : 0;

    const totalCoupons = await this.couponRepository.count();

    return {
      totalCoupons,
      totalUsage,
      totalDiscount,
      averageDiscount,
    };
  }
}
