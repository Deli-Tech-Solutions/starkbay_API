import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VariantService } from '../services/variant.service';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { UpdateVariantDto } from '../dto/update-variant.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';

@ApiTags('Product Variants')
@Controller('variants')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product variant' })
  @ApiResponse({ status: 201, description: 'Variant created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async create(@Body() createVariantDto: CreateVariantDto) {
    return this.variantService.createVariant(createVariantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all variants' })
  @ApiQuery({ name: 'productId', required: false, description: 'Filter by product ID' })
  @ApiResponse({ status: 200, description: 'Variants retrieved successfully' })
  async findAll(@Query('productId') productId?: string) {
    return this.variantService.findAll(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a variant by ID' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({ status: 200, description: 'Variant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async findOne(@Param('id') id: string) {
    return this.variantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a variant' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({ status: 200, description: 'Variant updated successfully' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async update(@Param('id') id: string, @Body() updateVariantDto: UpdateVariantDto) {
    return this.variantService.update(id, updateVariantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a variant' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({ status: 204, description: 'Variant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.variantService.remove(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check variant availability' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async checkAvailability(@Param('id') id: string) {
    return this.variantService.checkVariantAvailability(id);
  }

  // Attribute management endpoints
  @Post('attributes')
  @ApiOperation({ summary: 'Create a new variant attribute' })
  @ApiResponse({ status: 201, description: 'Attribute created successfully' })
  async createAttribute(@Body() createAttributeDto: CreateAttributeDto) {
    return this.variantService.createAttribute(createAttributeDto);
  }

  @Get('attributes')
  @ApiOperation({ summary: 'Get all variant attributes' })
  @ApiResponse({ status: 200, description: 'Attributes retrieved successfully' })
  async findAllAttributes() {
    return this.variantService.findAllAttributes();
  }

  @Get('attributes/:id')
  @ApiOperation({ summary: 'Get an attribute by ID' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  async findAttribute(@Param('id') id: string) {
    return this.variantService.findAttribute(id);
  }

  @Patch('attributes/:id')
  @ApiOperation({ summary: 'Update an attribute' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute updated successfully' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  async updateAttribute(@Param('id') id: string, @Body() updateData: any) {
    return this.variantService.updateAttribute(id, updateData);
  }

  @Delete('attributes/:id')
  @ApiOperation({ summary: 'Delete an attribute' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 204, description: 'Attribute deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAttribute(@Param('id') id: string) {
    return this.variantService.removeAttribute(id);
  }
} 