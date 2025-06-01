import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Content } from './entities/content.entity';
import { ContentCategory } from './entities/content-category.entity';
import { ContentTag } from './entities/content-tag.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';
import { ContentStatus } from './enums/content.enums';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(ContentCategory)
    private categoryRepository: Repository<ContentCategory>,
    @InjectRepository(ContentTag)
    private tagRepository: Repository<ContentTag>,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const { tagIds, categoryId, ...contentData } = createContentDto;

    // Generate slug if not provided
    if (!contentData.slug) {
      contentData.slug = this.generateSlug(contentData.title);
    }

    // Check slug uniqueness
    const existingContent = await this.contentRepository.findOne({
      where: { slug: contentData.slug },
    });

    if (existingContent) {
      throw new ConflictException('Content with this slug already exists');
    }

    // Create content instance
    const content = this.contentRepository.create(contentData);

    // Set category if provided
    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      content.category = category;
    }

    // Set tags if provided
    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepository.findBy({
        id: In(tagIds),
      });
      content.tags = tags;
    }

    return this.contentRepository.save(content);
  }

  async findAll(query: ContentQueryDto) {
    const {
      page,
      limit,
      search,
      type,
      status,
      priority,
      categoryId,
      tagIds,
      authorId,
      publishedAfter,
      publishedBefore,
      sortBy,
      sortOrder,
    } = query;

    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.category', 'category')
      .leftJoinAndSelect('content.tags', 'tags');

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(content.title ILIKE :search OR content.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filters
    if (type) {
      queryBuilder.andWhere('content.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('content.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('content.priority = :priority', { priority });
    }

    if (categoryId) {
      queryBuilder.andWhere('content.categoryId = :categoryId', { categoryId });
    }

    if (tagIds && tagIds.length > 0) {
      queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds });
    }

    if (authorId) {
      queryBuilder.andWhere('content.authorId = :authorId', { authorId });
    }

    if (publishedAfter) {
      queryBuilder.andWhere('content.publishedAt >= :publishedAfter', {
        publishedAfter,
      });
    }

    if (publishedBefore) {
      queryBuilder.andWhere('content.publishedAt <= :publishedBefore', {
        publishedBefore,
      });
    }

    // Sorting
    queryBuilder.orderBy(`content.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'analytics', 'approvals'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async findBySlug(slug: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { slug },
      relations: ['category', 'tags'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async update(
    id: string,
    updateContentDto: UpdateContentDto,
  ): Promise<Content> {
    const content = await this.findOne(id);
    const { tagIds, categoryId, ...updateData } = updateContentDto;

    // Update slug if title changed
    if (updateData.title && updateData.title !== content.title) {
      updateData.slug = this.generateSlug(updateData.title);

      // Check slug uniqueness
      const existingContent = await this.contentRepository.findOne({
        where: { slug: updateData.slug },
      });

      if (existingContent && existingContent.id !== id) {
        throw new ConflictException('Content with this slug already exists');
      }
    }

    // Update basic fields
    Object.assign(content, updateData);

    // Update category if provided
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: categoryId },
        });
        if (!category) {
          throw new NotFoundException('Category not found');
        }
        content.category = category;
      } else {
        content.category = null;
      }
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      if (tagIds && tagIds.length > 0) {
        const tags = await this.tagRepository.findBy({
          id: In(tagIds),
        });
        content.tags = tags;
      } else {
        content.tags = [];
      }
    }

    return this.contentRepository.save(content);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentRepository.remove(content);
  }

  async publish(id: string): Promise<Content> {
    const content = await this.findOne(id);

    if (content.status !== ContentStatus.APPROVED) {
      throw new BadRequestException(
        'Content must be approved before publishing',
      );
    }

    content.status = ContentStatus.PUBLISHED;
    content.publishedAt = new Date();

    return this.contentRepository.save(content);
  }

  async unpublish(id: string): Promise<Content> {
    const content = await this.findOne(id);
    content.status = ContentStatus.DRAFT;
    content.publishedAt = null;

    return this.contentRepository.save(content);
  }

  async archive(id: string): Promise<Content> {
    const content = await this.findOne(id);
    content.status = ContentStatus.ARCHIVED;

    return this.contentRepository.save(content);
  }

  async getPublishedContent(query: ContentQueryDto) {
    const publishedQuery = {
      ...query,
      status: ContentStatus.PUBLISHED,
    };

    const result = await this.findAll(publishedQuery);

    // Filter out expired content
    result.items = result.items.filter((content) => !content.isExpired);

    return result;
  }

  // Scheduled task to auto-publish content
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPublishing() {
    const scheduledContent = await this.contentRepository.find({
      where: {
        status: ContentStatus.APPROVED,
        scheduledAt: Like(`%${new Date().toISOString().split('T')[0]}%`),
      },
    });

    for (const content of scheduledContent) {
      if (content.scheduledAt && content.scheduledAt <= new Date()) {
        content.status = ContentStatus.PUBLISHED;
        content.publishedAt = new Date();
        await this.contentRepository.save(content);
      }
    }
  }

  // Scheduled task to auto-expire content
  @Cron(CronExpression.EVERY_HOUR)
  async handleContentExpiration() {
    const expiredContent = await this.contentRepository.find({
      where: {
        status: ContentStatus.PUBLISHED,
      },
    });

    for (const content of expiredContent) {
      if (content.isExpired) {
        content.status = ContentStatus.ARCHIVED;
        await this.contentRepository.save(content);
      }
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Category management
  async createCategory(name: string, description?: string, parentId?: string) {
    const slug = this.generateSlug(name);

    const category = this.categoryRepository.create({
      name,
      slug,
      description,
    });

    if (parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }

  async getCategories() {
    return this.categoryRepository.findTrees();
  }

  // Tag management
  async createTag(name: string, description?: string, color?: string) {
    const slug = this.generateSlug(name);

    const tag = this.tagRepository.create({
      name,
      slug,
      description,
      color,
    });

    return this.tagRepository.save(tag);
  }

  async getTags() {
    return this.tagRepository.find({
      order: { usageCount: 'DESC' },
    });
  }

  async getPopularTags(limit: number = 10) {
    return this.tagRepository.find({
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }
}
