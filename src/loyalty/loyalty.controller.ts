import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('loyalty')
@UseGuards(AuthGuard('jwt')) // assuming JWT auth
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('transaction')
  async createTransaction(@Req() req, @Body() dto: CreateTransactionDto) {
    const userId = req.user.id;
    const tx = await this.loyaltyService.createTransaction(userId, dto);
    return tx;
  }

  @Post('redeem')
  async redeemReward(@Req() req, @Body() dto: RedeemRewardDto) {
    const userId = req.user.id;
    return this.loyaltyService.redeemReward(userId, dto);
  }

  @Get('rewards/:programId')
  async listRewards(@Param('programId') programId: string) {
    return this.loyaltyService.listRewards(programId);
  }

  @Get('tier/:programId')
  async getUserTier(@Req() req, @Param('programId') programId: string) {
    const userId = req.user.id;
    // Retrieve current balance, then figure out tier
    const program = await this.loyaltyService.programRepo.findOne(programId, {
      relations: ['tiers'],
    });
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    const balance = await this.loyaltyService.calculateUserBalance(
      userId,
      programId,
    );
    const tiers = await this.loyaltyService.tierRepo.find({
      where: { program: { id: programId } },
      order: { minPoints: 'ASC' },
    });
    let currentTier = null;
    for (const tier of tiers) {
      if (balance >= tier.minPoints) {
        currentTier = tier;
      } else {
        break;
      }
    }
    return { tier: currentTier, balance };
  }

  @Get('analytics/:programId')
  async getAnalytics(@Param('programId') programId: string) {
    return this.loyaltyService.getAnalytics(programId);
  }
}
