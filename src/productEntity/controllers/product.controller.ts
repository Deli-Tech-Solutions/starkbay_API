// productEntity/controllers/product.controller.ts
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
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { Product, ProductStatus } from '../entities/product.entity';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Product created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'SKU already exists' })
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Products retrieved successfully' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Featured products retrieved successfully' })
  getFeaturedProducts(@Query('limit') limit?: number): Promise<Product[]> {
    return this.productService.getFeaturedProducts(limit);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Low stock products retrieved successfully' })
  getLowStockProducts(): Promise<Product[]> {
    return this.productService.getLowStockProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string): Promise<Product> {
    return this.productService.findBySlug(slug);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Related products retrieved successfully' })
  getRelatedProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ): Promise<Product[]> {
    return this.productService.getRelatedProducts(id, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'SKU already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update product status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product status updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ProductStatus,
  ): Promise<Product> {
    return this.productService.updateStatus(id, status);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add image to product' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image added successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('imageUrl') imageUrl: string,
  ): Promise<Product> {
    return this.productService.addImage(id, imageUrl);
  }

  @Delete(':id/images')
  @ApiOperation({ summary: 'Remove image from product' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('imageUrl') imageUrl: string,
  ): Promise<Product> {
    return this.productService.removeImage(id, imageUrl);
  }

  @Patch(':id/inventory')
  @ApiOperation({ summary: 'Update product inventory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inventory updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Inventory tracking disabled' })
  updateInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ): Promise<Product> {
    return this.productService.updateInventory(id, quantity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Product deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productService.remove(id);
  }
}