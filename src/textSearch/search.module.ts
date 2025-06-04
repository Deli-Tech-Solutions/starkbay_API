import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchEntity } from './entities/search.entity';
import { SearchAnalytics } from './entities/search-analytics.entity';
import { Article } from './entities/article.entity';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SearchEntity,
      SearchAnalytics,
      Article,
      Product
    ])
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchAnalyticsService],
  exports: [SearchService]
})
export class SearchModule {}