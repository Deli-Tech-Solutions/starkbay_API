import { Controller, Get, Query, Req, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { SearchService } from './search.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchDto, SearchFacetsDto } from './dto/search.dto';
import { SearchResponse } from './interfaces/search.interface';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly analyticsService: SearchAnalyticsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search' })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  async search(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchDto,
    @Query(new ValidationPipe({ transform: true })) facetsDto: SearchFacetsDto,
    @Req() request: Request
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    
    const results = await this.searchService.search(searchDto, facetsDto);
    
    const responseTime = Date.now() - startTime;
    
    // Log search analytics
    await this.analyticsService.logSearch({
      query: searchDto.query,
      results_count: results.total,
      response_time: responseTime,
      filters_applied: {
        category: searchDto.category,
        tags: searchDto.tags,
        entity_type: searchDto.entity_type
      },
      user_ip: request.ip,
      user_agent: request.get('User-Agent')
    });

    results.query_time = responseTime;
    return results;
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions returned successfully' })
  async getSuggestions(@Query('q') query: string): Promise<string[]> {
    return this.searchService.getSuggestions(query);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get search analytics' })
  @ApiResponse({ status: 200, description: 'Search analytics returned successfully' })
  async getAnalytics(
    @Query('days') days: number = 30,
    @Query('limit') limit: number = 100
  ) {
    return this.analyticsService.getAnalytics(days, limit);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending search queries' })
  @ApiResponse({ status: 200, description: 'Trending queries returned successfully' })
  async getTrendingQueries(@Query('limit') limit: number = 10) {
    return this.analyticsService.getTrendingQueries(limit);
  }
}
