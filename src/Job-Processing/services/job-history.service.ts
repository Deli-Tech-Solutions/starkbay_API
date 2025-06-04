import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { JobHistory, JobStatus, JobPriority } from '../entities/job-history.entity';

@Injectable()
export class JobHistoryService {
  private readonly logger = new Logger(JobHistoryService.name);

  constructor(
    @InjectRepository(JobHistory)
    private jobHistoryRepository: Repository<JobHistory>,
  ) {}

  async createJobHistory(data: Partial<JobHistory>): Promise<JobHistory> {
    const jobHistory = this.jobHistoryRepository.create({
      ...data,
      status: JobStatus.WAITING,
    });
    return this.jobHistoryRepository.save(jobHistory);
  }

  async updateJobHistory(jobId: string, updates: Partial<JobHistory>) {
    await this.jobHistoryRepository.update({ jobId }, updates);
  }

  async getJobHistory(filters: {
    status?: JobStatus[];
    jobType?: string[];
    priority?: JobPriority[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const query = this.jobHistoryRepository.createQueryBuilder('job');

    if (filters.status?.length) {
      query.andWhere('job.status IN (:...statuses)', { statuses: filters.status });
    }

    if (filters.jobType?.length) {
      query.andWhere('job.jobType IN (:...jobTypes)', { jobTypes: filters.jobType });
    }

    if (filters.priority?.length) {
      query.andWhere('job.priority IN (:...priorities)', { priorities: filters.priority });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('job.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query.orderBy('job.createdAt', 'DESC');

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const [jobs, total] = await query.getManyAndCount();
    return { jobs, total };
  }

  async getJobStatistics(timeRange: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const stats = await this.jobHistoryRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('job.jobType', 'jobType')
      .where('job.createdAt >= :startDate', { startDate })
      .groupBy('job.status, job.jobType')
      .getRawMany();

    return stats;
  }

  async getAverageProcessingTime(jobType?: string) {
    const query = this.jobHistoryRepository
      .createQueryBuilder('job')
      .select('AVG(job.processingTime)', 'averageTime')
      .where('job.processingTime IS NOT NULL');

    if (jobType) {
      query.andWhere('job.jobType = :jobType', { jobType });
    }

    const result = await query.getRawOne();
    return result?.averageTime || 0;
  }

  async cleanupOldHistory(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.jobHistoryRepository.delete({
      createdAt: Between(new Date(0), cutoffDate),
      status: In([JobStatus.COMPLETED, JobStatus.FAILED]),
    });

    this.logger.log(`Cleaned up ${result.affected} old job history records`);
    return result.affected;
  }
}