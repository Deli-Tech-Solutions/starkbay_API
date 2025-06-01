import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class DateRangeDto {
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;
}

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Get('validate/:code')
  validateCoupon(
    @Param('code') code: string,
    @Query('userId') userId: string,
    @Query('orderAmount') orderAmount: number,
  ) {
    return this.couponsService.validateCoupon(code, userId, orderAmount);
  }

  @Post('apply/:code')
  applyCoupon(
    @Param('code') code: string,
    @Body() body: { userId: string; orderId: string; orderAmount: number },
  ) {
    return this.couponsService.applyCoupon(
      code,
      body.userId,
      body.orderId,
      body.orderAmount,
    );
  }

  @Get('analytics')
  getAnalytics(@Query() dateRange: DateRangeDto) {
    return this.couponsService.getCouponAnalytics(
      dateRange.startDate,
      dateRange.endDate,
    );
  }
}
