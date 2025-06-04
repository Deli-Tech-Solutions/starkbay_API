// productEntity/services/product.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { slugify } from '../utils/slug.util';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Generate slug if not provided
    let slug = createProductDto.slug || slugify(createProductDto.name);
    
    // Ensure slug is unique
    slug = await this.ensureUniqueSlug(slug);

    // Check SKU uniqueness if provided
    if (createProductDto.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: createProductDto.sku },
      });
      if (existingProduct) {
        throw new ConflictException('SKU already exists');
      }
    }

    const product = this.productRepository.create({
      ...createProductDto,
      slug,
    });

    return this.productRepository.save(product);
  }

  async findAll(query: ProductQueryDto) {
    const {
      search,
      status,
      category,
      currency,
      minPrice,
      maxPrice,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filters
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (currency) {
      queryBuilder.andWhere('product.currency = :currency', { currency });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured });
    }

    // Sorting
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { slug } });
    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }
    
    // Increment view count
    await this.productRepository.increment({ id: product.id }, 'viewCount', 1);
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Handle slug update
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const newSlug = updateProductDto.slug || slugify(updateProductDto.name);
      if (newSlug !== product.slug) {
        updateProductDto.slug = await this.ensureUniqueSlug(newSlug, id);
      }
    }

    // Check SKU uniqueness if being updated
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });
      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException('SKU already exists');
      }
    }

    await this.productRepository.update(id, updateProductDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    const product = await this.findOne(id);
    await this.productRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async addImage(id: string, imageUrl: string): Promise<Product> {
    const product = await this.findOne(id);
    const images = product.images || [];
    images.push(imageUrl);
    
    await this.productRepository.update(id, { 
      images,
      featuredImage: product.featuredImage || imageUrl,
    });
    
    return this.findOne(id);
  }

  async removeImage(id: string, imageUrl: string): Promise<Product> {
    const product = await this.findOne(id);
    const images = (product.images || []).filter(img => img !== imageUrl);
    
    const updateData: any = { images };
    if (product.featuredImage === imageUrl) {
      updateData.featuredImage = images[0] || null;
    }
    
    await this.productRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateInventory(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    
    if (!product.trackQuantity) {
      throw new BadRequestException('Inventory tracking is disabled for this product');
    }
    
    await this.productRepository.update(id, { quantity });
    return this.findOne(id);
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const whereCondition: FindOptionsWhere<Product> = { slug };
      
      const existingProduct = await this.productRepository.findOne({
        where: whereCondition,
      });

      if (!existingProduct || (excludeId && existingProduct.id === excludeId)) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return this.productRepository.find({
      where: { 
        isFeatured: true, 
        status: ProductStatus.ACTIVE 
      },
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async getRelatedProducts(productId: string, limit: number = 5): Promise<Product[]> {
    const product = await this.findOne(productId);
    
    return this.productRepository.find({
      where: {
        category: product.category,
        status: ProductStatus.ACTIVE,
      },
      take: limit,
      order: { viewCount: 'DESC' },
    });
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.trackQuantity = true')
      .andWhere('product.quantity <= product.lowStockThreshold')
      .andWhere('product.lowStockThreshold IS NOT NULL')
      .getMany();
  }
}
