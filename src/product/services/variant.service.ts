import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';
import { VariantAttribute } from '../entities/variant-attribute.entity';
import { VariantAttributeValue } from '../entities/variant-attribute-value.entity';
import { VariantInventory } from '../entities/variant-inventory.entity';
import { VariantImage } from '../entities/variant-image.entity';
import { Product } from '../product.entity';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { UpdateVariantDto } from '../dto/update-variant.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';

@Injectable()
export class VariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(VariantAttribute)
    private attributeRepository: Repository<VariantAttribute>,
    @InjectRepository(VariantAttributeValue)
    private attributeValueRepository: Repository<VariantAttributeValue>,
    @InjectRepository(VariantInventory)
    private inventoryRepository: Repository<VariantInventory>,
    @InjectRepository(VariantImage)
    private imageRepository: Repository<VariantImage>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async createVariant(createVariantDto: CreateVariantDto): Promise<ProductVariant> {
    const { productId, attributeValues, inventory, images, ...variantData } = createVariantDto;

    // Verify product exists
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Generate SKU if not provided
    if (!variantData.sku) {
      variantData.sku = await this.generateSKU(product, attributeValues);
    }

    // Validate SKU uniqueness
    await this.validateSKUUniqueness(variantData.sku);

    // Create variant
    const variant = this.variantRepository.create({
      ...variantData,
      product,
      productId,
    });

    const savedVariant = await this.variantRepository.save(variant);

    // Create attribute values
    if (attributeValues && attributeValues.length > 0) {
      await this.createAttributeValues(savedVariant.id, attributeValues);
    }

    // Create inventory record
    if (inventory) {
      await this.createVariantInventory(savedVariant.id, inventory);
    }

    // Create images
    if (images && images.length > 0) {
      await this.createVariantImages(savedVariant.id, images);
    }

    // Update product hasVariants flag
    await this.updateProductVariantFlag(productId);

    return this.findOne(savedVariant.id);
  }

  async findAll(productId?: string): Promise<ProductVariant[]> {
    const query = this.variantRepository.createQueryBuilder('variant')
      .leftJoinAndSelect('variant.attributeValues', 'attributeValues')
      .leftJoinAndSelect('attributeValues.attribute', 'attribute')
      .leftJoinAndSelect('variant.inventory', 'inventory')
      .leftJoinAndSelect('variant.images', 'images')
      .leftJoinAndSelect('variant.product', 'product');

    if (productId) {
      query.where('variant.productId = :productId', { productId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: [
        'attributeValues',
        'attributeValues.attribute',
        'inventory',
        'images',
        'product',
      ],
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return variant;
  }

  async update(id: string, updateVariantDto: UpdateVariantDto): Promise<ProductVariant> {
    const variant = await this.findOne(id);

    // If SKU is being updated, validate uniqueness
    if (updateVariantDto.sku && updateVariantDto.sku !== variant.sku) {
      await this.validateSKUUniqueness(updateVariantDto.sku);
    }

    // Update variant
    Object.assign(variant, updateVariantDto);
    await this.variantRepository.save(variant);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const variant = await this.findOne(id);
    await this.variantRepository.remove(variant);

    // Update product hasVariants flag
    await this.updateProductVariantFlag(variant.productId);
  }

  async createAttribute(createAttributeDto: CreateAttributeDto): Promise<VariantAttribute> {
    const attribute = this.attributeRepository.create(createAttributeDto);
    return this.attributeRepository.save(attribute);
  }

  async findAllAttributes(): Promise<VariantAttribute[]> {
    return this.attributeRepository.find({
      where: { isActive: true },
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  async findAttribute(id: string): Promise<VariantAttribute> {
    const attribute = await this.attributeRepository.findOne({ where: { id } });
    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }
    return attribute;
  }

  async updateAttribute(id: string, updateData: Partial<VariantAttribute>): Promise<VariantAttribute> {
    const attribute = await this.findAttribute(id);
    Object.assign(attribute, updateData);
    return this.attributeRepository.save(attribute);
  }

  async removeAttribute(id: string): Promise<void> {
    const attribute = await this.findAttribute(id);
    await this.attributeRepository.remove(attribute);
  }

  async checkVariantAvailability(variantId: string): Promise<{
    isAvailable: boolean;
    quantityAvailable: number;
    status: string;
  }> {
    const variant = await this.findOne(variantId);
    const inventory = variant.inventory[0]; // Assuming single inventory record per variant

    if (!inventory || !variant.trackInventory) {
      return {
        isAvailable: true,
        quantityAvailable: Infinity,
        status: 'unlimited',
      };
    }

    return {
      isAvailable: inventory.isInStock,
      quantityAvailable: inventory.quantityAvailable,
      status: inventory.status,
    };
  }

  private async generateSKU(product: Product, attributeValues?: any[]): Promise<string> {
    const baseCode = product.sku || product.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    
    let attributeCode = '';
    if (attributeValues && attributeValues.length > 0) {
      // Create a short code from attribute values
      attributeCode = attributeValues
        .map(av => av.value.substring(0, 2).toUpperCase())
        .join('');
    }

    const sku = `${baseCode}-${attributeCode}-${timestamp}`;
    
    // Ensure uniqueness
    const existing = await this.variantRepository.findOne({ where: { sku } });
    if (existing) {
      return this.generateSKU(product, attributeValues); // Retry with new timestamp
    }

    return sku;
  }

  private async validateSKUUniqueness(sku: string): Promise<void> {
    const existing = await this.variantRepository.findOne({ where: { sku } });
    if (existing) {
      throw new BadRequestException('SKU already exists');
    }
  }

  private async createAttributeValues(variantId: string, attributeValues: any[]): Promise<void> {
    for (const attrValue of attributeValues) {
      const attributeValueEntity = this.attributeValueRepository.create({
        ...attrValue,
        variantId,
      });
      await this.attributeValueRepository.save(attributeValueEntity);
    }
  }

  private async createVariantInventory(variantId: string, inventoryData: any): Promise<void> {
    const inventory = this.inventoryRepository.create({
      ...inventoryData,
      variantId,
    });
    await this.inventoryRepository.save(inventory);
  }

  private async createVariantImages(variantId: string, images: any[]): Promise<void> {
    for (const imageData of images) {
      const image = this.imageRepository.create({
        ...imageData,
        variantId,
      });
      await this.imageRepository.save(image);
    }
  }

  private async updateProductVariantFlag(productId: string): Promise<void> {
    const variantCount = await this.variantRepository.count({
      where: { productId, isActive: true },
    });

    await this.productRepository.update(productId, {
      hasVariants: variantCount > 0,
    });
  }
} 