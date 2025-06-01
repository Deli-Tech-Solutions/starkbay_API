import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @ApiOperation({ summary: 'Create new content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  async create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all content with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Content list retrieved successfully',
  })
  async findAll(@Query() query: ContentQueryDto) {
    return this.contentService.findAll(query);
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published content only' })
  @ApiResponse({
    status: 200,
    description: 'Published content retrieved successfully',
  })
  async findPublished(@Query() query: ContentQueryDto) {
    return this.contentService.getPublishedContent(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all content categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getCategories() {
    return this.contentService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(
    @Body() body: { name: string; description?: string; parentId?: string },
  ) {
    return this.contentService.createCategory(
      body.name,
      body.description,
      body.parentId,
    );
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all content tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getTags() {
    return this.contentService.getTags();
  }

  @Get('tags/popular')
  @ApiOperation({ summary: 'Get popular tags' })
  @ApiResponse({
    status: 200,
    description: 'Popular tags retrieved successfully',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularTags(@Query('limit') limit?: number) {
    return this.contentService.getPopularTags(limit);
  }

  @Post('tags')
  @ApiOperation({ summary: 'Create new tag' })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  async createTag(
    @Body() body: { name: string; description?: string; color?: string },
  ) {
    return this.contentService.createTag(
      body.name,
      body.description,
      body.color,
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get content by slug' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  async findBySlug(@Param('slug') slug: string) {
    return this.contentService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update content' })
  @ApiResponse({ status: 200, description: 'Content updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete content' })
  @ApiResponse({ status: 200, description: 'Content deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.contentService.remove(id);
    return { message: 'Content deleted successfully' };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish content' })
  @ApiResponse({ status: 200, description: 'Content published successfully' })
  async publish(@Param('id') id: string) {
    return this.contentService.publish(id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish content' })
  @ApiResponse({ status: 200, description: 'Content unpublished successfully' })
  async unpublish(@Param('id') id: string) {
    return this.contentService.unpublish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive content' })
  @ApiResponse({ status: 200, description: 'Content archived successfully' })
  async archive(@Param('id') id: string) {
    return this.contentService.archive(id);
  }
}
