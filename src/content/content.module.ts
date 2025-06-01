import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Content } from './entities/content.entity';
import { ContentCategory } from './entities/content-category.entity';
import { ContentTag } from './entities/content-tag.entity';
import { ContentAnalytics } from './entities/content-analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Content,
      ContentCategory,
      ContentTag,
      ContentAnalytics,
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService, TypeOrmModule],
})
export class ContentModule {}
