import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
  import { CategoriesService, CategoryTree, CategoryBreadcrumb } from './categories.service';
  import { CreateCategoryDto } from './dto/create-category.dto';
  import { UpdateCategoryDto } from './dto/update-category.dto';
  import { CategoryQueryDto } from './dto/category-query.dto';
  import { Category } from './entities/category.entity';
  
  @ApiTags('Categories')
  @Controller('categories')
  export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new category' })
    @ApiResponse({ status: 201, description: 'Category created successfully', type: Category })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'Parent category not found' })
    @ApiResponse({ status: 409, description: 'Category slug already exists' })
    create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
      return this.categoriesService.create(createCategoryDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    @ApiResponse({ status: 200, description: 'Categories retrieved successfully', type: [Category] })
    findAll(@Query() query: CategoryQueryDto): Promise<Category[]> {
      return this.categoriesService.findAll(query);
    }
  
    @Get('tree')
    @ApiOperation({ summary: 'Get category tree structure' })
    @ApiQuery({ name: 'parentId', required: false, description: 'Parent category ID' })
    @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
    @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
    getCategoryTree(
      @Query('parentId') parentId?: string,
      @Query('status') status?: 'active' | 'inactive',
    ): Promise<CategoryTree[]> {
      return this.categoriesService.getCategoryTree(parentId, status);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiQuery({ name: 'includeChildren', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Category retrieved successfully', type: Category })
    @ApiResponse({ status: 404, description: 'Category not found' })
    findOne(
      @Param('id', ParseUUIDPipe) id: string,
      @Query('includeChildren') includeChildren?: boolean,
    ): Promise<Category> {
      return this.categoriesService.findOne(id, includeChildren);
    }
  
    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get category by slug' })
    @ApiParam({ name: 'slug', description: 'Category slug' })
    @ApiQuery({ name: 'includeChildren', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Category retrieved successfully', type: Category })
    @ApiResponse({ status: 404, description: 'Category not found' })
    findBySlug(
      @Param('slug') slug: string,
      @Query('includeChildren') includeChildren?: boolean,
    ): Promise<Category> {
      return this.categoriesService.findBySlug(slug, includeChildren);
    }
  
    @Get(':id/breadcrumbs')
    @ApiOperation({ summary: 'Get category breadcrumbs' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Breadcrumbs retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    getBreadcrumbs(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryBreadcrumb[]> {
      return this.categoriesService.getBreadcrumbs(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category updated successfully', type: Category })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<Category> {
      return this.categoriesService.update(id, updateCategoryDto);
    }
  
    @Patch(':id/status')
    @ApiOperation({ summary: 'Update category status' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category status updated successfully', type: Category })
    @ApiResponse({ status: 404, description: 'Category not found' })
    updateStatus(
      @Param('id', ParseUUIDPipe) id: string,
      @Body('status') status: 'active' | 'inactive',
    ): Promise<Category> {
      return this.categoriesService.updateStatus(id, status);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 204, description: 'Category deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete category with children' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
      return this.categoriesService.remove(id);
    }
  }
  