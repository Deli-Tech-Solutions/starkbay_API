import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService, AnalyticsEvent } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(@Body() event: AnalyticsEvent) {
    return this.analyticsService.trackEvent(event);
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get analytics for specific content' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getContentAnalytics(
    @Param('contentId') contentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getContentAnalytics(contentId, start, end);
  }

  @Get('top-content')
  @ApiOperation({ summary: 'Get top performing content' })
  @ApiResponse({
    status: 200,
    description: 'Top content retrieved successfully',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopContent(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getTopContent(start, end, limit);
  }

  @Get('event-stats')
  @ApiOperation({ summary: 'Get event type statistics' })
  @ApiResponse({
    status: 200,
    description: 'Event stats retrieved successfully',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getEventTypeStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getEventTypeStats(start, end);
  }

  @Get('daily-stats')
  @ApiOperation({ summary: 'Get daily analytics statistics' })
  @ApiResponse({
    status: 200,
    description: 'Daily stats retrieved successfully',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getDailyStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getDailyStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('performance/:contentId')
  @ApiOperation({ summary: 'Get comprehensive content performance' })
  @ApiResponse({
    status: 200,
    description: 'Performance data retrieved successfully',
  })
  async getContentPerformance(@Param('contentId') contentId: string) {
    return this.analyticsService.getContentPerformance(contentId);
  }
}
