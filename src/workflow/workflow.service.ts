import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentApproval } from './entities/content-approval.entity';
import { Content } from '../content/entities/content.entity';
import { CreateApprovalDto, UpdateApprovalDto } from './dto/approval.dto';
import { ApprovalStatus, ContentStatus } from '../content/enums/content.enums';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(ContentApproval)
    private approvalRepository: Repository<ContentApproval>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async submitForApproval(
    contentId: string,
    submitterId: string,
  ): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.status !== ContentStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft content can be submitted for approval',
      );
    }

    // Update content status
    content.status = ContentStatus.PENDING_APPROVAL;
    await this.contentRepository.save(content);

    return content;
  }

  async createApproval(
    createApprovalDto: CreateApprovalDto,
  ): Promise<ContentApproval> {
    const { contentId } = createApprovalDto;

    // Verify content exists and is pending approval
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.status !== ContentStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Content is not pending approval');
    }

    // Check if approval already exists for this reviewer
    const existingApproval = await this.approvalRepository.findOne({
      where: {
        contentId,
        reviewerId: createApprovalDto.reviewerId,
      },
    });

    if (existingApproval) {
      throw new BadRequestException(
        'Approval already exists for this reviewer',
      );
    }

    const approval = this.approvalRepository.create(createApprovalDto);
    return this.approvalRepository.save(approval);
  }

  async updateApproval(
    id: string,
    updateApprovalDto: UpdateApprovalDto,
  ): Promise<ContentApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id },
      relations: ['content'],
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval has already been processed');
    }

    // Update approval
    Object.assign(approval, updateApprovalDto);
    approval.reviewedAt = new Date();

    const savedApproval = await this.approvalRepository.save(approval);

    // Update content status based on approval
    await this.updateContentStatus(approval.contentId);

    return savedApproval;
  }

  private async updateContentStatus(contentId: string): Promise<void> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['approvals'],
    });

    if (!content) return;

    const approvals = content.approvals;
    const hasRejection = approvals.some(
      (a) => a.status === ApprovalStatus.REJECTED,
    );
    const hasApproval = approvals.some(
      (a) => a.status === ApprovalStatus.APPROVED,
    );

    if (hasRejection) {
      content.status = ContentStatus.REJECTED;
    } else if (hasApproval) {
      content.status = ContentStatus.APPROVED;
      content.approvedAt = new Date();
      content.approvedBy = approvals.find(
        (a) => a.status === ApprovalStatus.APPROVED,
      )?.reviewerId;
    }

    await this.contentRepository.save(content);
  }

  async getApprovals(contentId?: string, reviewerId?: string) {
    const query = this.approvalRepository
      .createQueryBuilder('approval')
      .leftJoinAndSelect('approval.content', 'content');

    if (contentId) {
      query.andWhere('approval.contentId = :contentId', { contentId });
    }

    if (reviewerId) {
      query.andWhere('approval.reviewerId = :reviewerId', { reviewerId });
    }

    return query.getMany();
  }

  async getPendingApprovals(reviewerId?: string) {
    const query = this.approvalRepository
      .createQueryBuilder('approval')
      .leftJoinAndSelect('approval.content', 'content')
      .where('approval.status = :status', { status: ApprovalStatus.PENDING });

    if (reviewerId) {
      query.andWhere('approval.reviewerId = :reviewerId', { reviewerId });
    }

    return query.getMany();
  }

  async getApprovalHistory(contentId: string) {
    return this.approvalRepository.find({
      where: { contentId },
      order: { createdAt: 'DESC' },
    });
  }
}
