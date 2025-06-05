import { IsUUID } from 'class-validator';

export class RedeemRewardDto {
  @IsUUID()
  programId: string;

  @IsUUID()
  rewardId: string;
}
