import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { LoyaltyProgram } from './entities/loyalty-program.entity';
import { PointsTransaction, PointsType } from './entities/points.entity';
import { LoyaltyTier } from './entities/loyalty-tier.entity';
import { Reward } from './entities/reward.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { User } from '../users/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyProgram)
    private readonly programRepo: Repository<LoyaltyProgram>,

    @InjectRepository(PointsTransaction)
    private readonly transactionRepo: Repository<PointsTransaction>,

    @InjectRepository(LoyaltyTier)
    private readonly tierRepo: Repository<LoyaltyTier>,

    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Earn or redeem points for a user.
   */
  async createTransaction(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<PointsTransaction> {
    const { programId, type, points, metadata } = dto;
    const user = await this.userRepo.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const program = await this.programRepo.findOne(programId, {
      relations: ['tiers'],
    });
    if (!program) {
      throw new NotFoundException('Loyalty program not found');
    }

    // Calculate expiration date from now
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + program.pointsExpirationDays,
    );

    // If redeeming, check available balance
    if (type === PointsType.REDEEM) {
      const balance = await this.calculateUserBalance(userId, programId);
      if (balance < points) {
        throw new BadRequestException('Insufficient points to redeem');
      }
    }

    const tx = this.transactionRepo.create({
      user,
      program,
      type,
      points,
      metadata,
      expirationDate,
    });
    const savedTx = await this.transactionRepo.save(tx);

    // After earning or redeeming, send notifications and check tier upgrade
    if (type === PointsType.EARN) {
      await this.checkAndUpgradeTier(user, program);
      this.notificationService.sendPointsEarnedNotification(
        user.id,
        points,
        balance: await this.calculateUserBalance(userId, programId),
      );
    } else if (type === PointsType.REDEEM) {
      this.notificationService.sendPointsRedeemedNotification(
        user.id,
        points,
      );
    }

    return savedTx;
  }

  /**
   * Calculate current points balance (excluding expired or redeemed).
   */
  async calculateUserBalance(
    userId: string,
    programId: string,
  ): Promise<number> {
    // Sum all earned where expirationDate > now
    const now = new Date();
    const earned = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.points)', 'sum')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.programId = :programId', { programId })
      .andWhere('tx.type = :type', { type: PointsType.EARN })
      .andWhere('tx.expirationDate > :now', { now })
      .getRawOne();

    const redeemed = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.points)', 'sum')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.programId = :programId', { programId })
      .andWhere('tx.type = :type', { type: PointsType.REDEEM })
      .getRawOne();

    const expired = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.points)', 'sum')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.programId = :programId', { programId })
      .andWhere('tx.type = :type', { type: PointsType.EXPIRE })
      .getRawOne();

    const totalEarned = parseInt(earned.sum) || 0;
    const totalRedeemed = parseInt(redeemed.sum) || 0;
    const totalExpired = parseInt(expired.sum) || 0;

    return totalEarned - totalRedeemed - totalExpired;
  }

  /**
   * Check if user qualifies for a new tier, and upgrade if so.
   */
  private async checkAndUpgradeTier(
    user: User,
    program: LoyaltyProgram,
  ): Promise<void> {
    const balance = await this.calculateUserBalance(user.id, program.id);
    const tiers = await this.tierRepo.find({
      where: { program: { id: program.id } },
      order: { minPoints: 'ASC' },
    });

    // Determine highest tier that balance qualifies
    let highestTier: LoyaltyTier = null;
    for (const tier of tiers) {
      if (balance >= tier.minPoints) {
        highestTier = tier;
      } else {
        break;
      }
    }

    if (!highestTier) return; // no tier matches

    // Compare with user's current tier
    if (
      !user.loyaltyTier ||
      user.loyaltyTier.minPoints < highestTier.minPoints
    ) {
      user.loyaltyTier = highestTier;
      await this.userRepo.save(user);

      // Send tier upgrade notification
      this.notificationService.sendTierUpgradeNotification(
        user.id,
        highestTier.name,
      );
    }
  }

  /**
   * Redeem a reward for the user.
   */
  async redeemReward(
    userId: string,
    dto: RedeemRewardDto,
  ): Promise<{ success: boolean; message: string }> {
    const { programId, rewardId } = dto;
    const user = await this.userRepo.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const program = await this.programRepo.findOne(programId);
    if (!program) {
      throw new NotFoundException('Loyalty program not found');
    }

    const reward = await this.rewardRepo.findOne(rewardId, {
      relations: ['program'],
    });
    if (!reward || reward.program.id !== program.id) {
      throw new NotFoundException('Reward not found in this program');
    }

    const balance = await this.calculateUserBalance(userId, programId);
    if (balance < reward.pointsCost) {
      throw new BadRequestException('Insufficient points to redeem this reward');
    }

    if (reward.stock <= 0) {
      throw new BadRequestException('Reward is out of stock');
    }

    // Deduct points
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + program.pointsExpirationDays,
    );

    const tx = this.transactionRepo.create({
      user,
      program,
      type: PointsType.REDEEM,
      points: reward.pointsCost,
      metadata: { rewardId },
      expirationDate,
    });
    await this.transactionRepo.save(tx);

    // Decrement stock
    reward.stock -= 1;
    await this.rewardRepo.save(reward);

    // Send notification
    this.notificationService.sendRewardRedemptionNotification(
      user.id,
      reward.name,
    );

    return { success: true, message: 'Reward redeemed successfully' };
  }

  /**
   * List all rewards in a program.
   */
  async listRewards(programId: string): Promise<Reward[]> {
    return this.rewardRepo.find({
      where: { program: { id: programId } },
      order: { pointsCost: 'ASC' },
    });
  }

  /**
   * Calculate basic analytics: total points earned, redeemed, active users, etc.
   */
  async getAnalytics(programId: string): Promise<any> {
    const totalEarned = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.points)', 'sum')
      .where('tx.programId = :programId', { programId })
      .andWhere('tx.type = :type', { type: PointsType.EARN })
      .getRawOne();

    const totalRedeemed = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.points)', 'sum')
      .where('tx.programId = :programId', { programId })
      .andWhere('tx.type = :type', { type: PointsType.REDEEM })
      .getRawOne();

    const activeUsers = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('COUNT(DISTINCT tx.userId)', 'count')
      .where('tx.programId = :programId', { programId })
      .getRawOne();

    return {
      totalEarned: parseInt(totalEarned.sum) || 0,
      totalRedeemed: parseInt(totalRedeemed.sum) || 0,
      activeUsers: parseInt(activeUsers.count) || 0,
    };
  }

  /**
   * Cron job that runs daily at midnight to expire points.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Africa/Lagos' })
  async expirePoints() {
    const now = new Date();
    this.logger.log('Running points expiration job');

    // Find all earned transactions that have expiredDate <= now and not yet expiredLogged
    const toExpire = await this.transactionRepo.find({
      where: {
        type: PointsType.EARN,
        expirationDate: LessThan(now),
      },
      relations: ['user', 'program'],
    });

    for (const tx of toExpire) {
      // Check if already logged as EXPIRE
      const existingExpire = await this.transactionRepo.findOne({
        where: {
          user: { id: tx.user.id },
          program: { id: tx.program.id },
          type: PointsType.EXPIRE,
          metadata: JSON.stringify({ originalTxId: tx.id }),
        },
      });
      if (existingExpire) continue;

      // Create an expire transaction
      const expireTx = this.transactionRepo.create({
        user: tx.user,
        program: tx.program,
        type: PointsType.EXPIRE,
        points: tx.points,
        metadata: { originalTxId: tx.id },
        expirationDate: now, // expiration for expire entries can be now
      });
      await this.transactionRepo.save(expireTx);

      // Notify user about expiration
      this.notificationService.sendPointsExpiredNotification(
        tx.user.id,
        tx.points,
      );
    }
  }
}
