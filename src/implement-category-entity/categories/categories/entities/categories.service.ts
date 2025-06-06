import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, TreeRepository } from 'typeorm';
  import { Category } from './entities/category.entity';
  import { CreateCategoryDto } from './dto/create-category.dto';
  import { UpdateCategoryDto } from './dto/update-category.dto';
  import { CategoryQueryDto } from './dto/category-query.dto';
  
  export interface CategoryTree extends Category {
    children?: CategoryTree[];
  }
  
  export interface CategoryBreadcrumb {
    id: string;
    name: string;
    slug: string;
  }
  
  @Injectable()
  export class CategoriesService {
    constructor(
      @InjectRepository(Category)
      private readonly categoryRepository: Repository<Category>,
    ) {}
  
    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
      const { parentId, slug, name, ...rest } = createCategoryDto;
  
      // Validate parent exists if provided
      let parent: Category | null = null;
      if (parentId) {
        parent = await this.categoryRepository.findOne({
          where: { id: parentId },
        });
        if (!parent) {
          throw new NotFoundException(`Parent category with ID ${parentId} not found`);
        }
      }
  
      // Generate unique slug
      const finalSlug = slug || this.generateSlug(name);
      await this.validateUniqueSlug(finalSlug);
  
      // Calculate level and path
      const level = parent ? parent.level + 1 : 0;
      const path = parent ? `${parent.path}/${finalSlug}` : finalSlug;
  
      const category = this.categoryRepository.create({
        ...rest,
        name,
        slug: finalSlug,
        parentId,
        level,
        path,
      });
  
      return this.categoryRepository.save(category);
    }
  
    async findAll(query: CategoryQueryDto = {}): Promise<Category[]> {
      const { parentId, status, includeChildren, maxDepth } = query;
  
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .orderBy('category.sortOrder', 'ASC')
        .addOrderBy('category.name', 'ASC');
  
      if (parentId !== undefined) {
        if (parentId === null || parentId === '') {
          queryBuilder.where('category.parentId IS NULL');
        } else {
          queryBuilder.where('category.parentId = :parentId', { parentId });
        }
      }
  
      if (status) {
        queryBuilder.andWhere('category.status = :status', { status });
      }
  
      if (includeChildren) {
        queryBuilder.leftJoinAndSelect('category.children', 'children');
        if (maxDepth && maxDepth > 1) {
          // Recursively load children up to maxDepth
          for (let i = 2; i <= maxDepth; i++) {
            const alias = `children${'_child'.repeat(i - 1)}`;
            const parentAlias = i === 2 ? 'children' : `children${'_child'.repeat(i - 2)}`;
            queryBuilder.leftJoinAndSelect(`${parentAlias}.children`, alias);
          }
        }
      }
  
      return queryBuilder.getMany();
    }
  
    async findOne(id: string, includeChildren = false): Promise<Category> {
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .where('category.id = :id', { id });
  
      if (includeChildren) {
        queryBuilder.leftJoinAndSelect('category.children', 'children');
      }
  
      const category = await queryBuilder.getOne();
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
  
      return category;
    }
  
    async findBySlug(slug: string, includeChildren = false): Promise<Category> {
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .where('category.slug = :slug', { slug });
  
      if (includeChildren) {
        queryBuilder.leftJoinAndSelect('category.children', 'children');
      }
  
      const category = await queryBuilder.getOne();
      if (!category) {
        throw new NotFoundException(`Category with slug ${slug} not found`);
      }
  
      return category;
    }
  
    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
      const category = await this.findOne(id);
      const { parentId, slug, name, ...rest } = updateCategoryDto;
  
      // Validate parent if provided and different
      if (parentId !== undefined && parentId !== category.parentId) {
        if (parentId === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }
  
        if (parentId) {
          const parent = await this.categoryRepository.findOne({
            where: { id: parentId },
          });
          if (!parent) {
            throw new NotFoundException(`Parent category with ID ${parentId} not found`);
          }
  
          // Check for circular reference
          if (await this.wouldCreateCircularReference(id, parentId)) {
            throw new BadRequestException('Cannot create circular reference');
          }
        }
      }
  
      // Handle slug update
      if (slug && slug !== category.slug) {
        await this.validateUniqueSlug(slug, id);
      } else if (name && name !== category.name && !slug) {
        const newSlug = this.generateSlug(name);
        if (newSlug !== category.slug) {
          await this.validateUniqueSlug(newSlug, id);
          updateCategoryDto.slug = newSlug;
        }
      }
  
      Object.assign(category, rest);
      if (name) category.name = name;
      if (updateCategoryDto.slug) category.slug = updateCategoryDto.slug;
      if (parentId !== undefined) category.parentId = parentId || null;
  
      // Recalculate level and path if parent changed
      if (parentId !== undefined && parentId !== category.parentId) {
        await this.updateCategoryHierarchy(category);
      }
  
      return this.categoryRepository.save(category);
    }
  
    async remove(id: string): Promise<void> {
      const category = await this.findOne(id);
      
      // Check if category has children
      const childrenCount = await this.categoryRepository.count({
        where: { parentId: id },
      });
  
      if (childrenCount > 0) {
        throw new BadRequestException(
          'Cannot delete category with children. Move or delete children first.',
        );
      }
  
      await this.categoryRepository.remove(category);
    }
  
    async getCategoryTree(parentId?: string, status?: 'active' | 'inactive'): Promise<CategoryTree[]> {
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .orderBy('category.sortOrder', 'ASC')
        .addOrderBy('category.name', 'ASC');
  
      if (parentId) {
        queryBuilder.where('category.parentId = :parentId', { parentId });
      } else {
        queryBuilder.where('category.parentId IS NULL');
      }
  
      if (status) {
        queryBuilder.andWhere('category.status = :status', { status });
      }
  
      const categories = await queryBuilder.getMany();
  
      // Recursively load children
      const result: CategoryTree[] = [];
      for (const category of categories) {
        const categoryWithChildren: CategoryTree = {
          ...category,
          children: await this.getCategoryTree(category.id, status),
        };
        result.push(categoryWithChildren);
      }
  
      return result;
    }
  
    async getBreadcrumbs(categoryId: string): Promise<CategoryBreadcrumb[]> {
      const category = await this.findOne(categoryId);
      const breadcrumbs: CategoryBreadcrumb[] = [];
  
      let current = category;
      while (current) {
        breadcrumbs.unshift({
          id: current.id,
          name: current.name,
          slug: current.slug,
        });
  
        if (current.parentId) {
          current = await this.categoryRepository.findOne({
            where: { id: current.parentId },
          });
        } else {
          current = null;
        }
      }
  
      return breadcrumbs;
    }
  
    async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Category> {
      const category = await this.findOne(id);
      category.status = status;
      return this.categoryRepository.save(category);
    }
  
    private generateSlug(name: string): string {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  
    private async validateUniqueSlug(slug: string, excludeId?: string): Promise<void> {
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .where('category.slug = :slug', { slug });
  
      if (excludeId) {
        queryBuilder.andWhere('category.id != :excludeId', { excludeId });
      }
  
      const existing = await queryBuilder.getOne();
      if (existing) {
        throw new ConflictException(`Category with slug '${slug}' already exists`);
      }
    }
  
    private async wouldCreateCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
      let currentParentId = newParentId;
      
      while (currentParentId) {
        if (currentParentId === categoryId) {
          return true;
        }
        
        const parent = await this.categoryRepository.findOne({
          where: { id: currentParentId },
          select: ['parentId'],
        });
        
        currentParentId = parent?.parentId;
      }
      
      return false;
    }
  
    private async updateCategoryHierarchy(category: Category): Promise<void> {
      // Recalculate level and path
      if (category.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: category.parentId },
        });
        category.level = parent.level + 1;
        category.path = `${parent.path}/${category.slug}`;
      } else {
        category.level = 0;
        category.path = category.slug;
      }
  
      // Update all descendants
      const descendants = await this.categoryRepository.find({
        where: { path: Like(`${category.path}/%`) },
      });
  
      for (const descendant of descendants) {
        // Recalculate descendant path and level
        const pathParts = descendant.path.split('/');
        const categoryIndex = pathParts.findIndex(part => part === category.slug);
        if (categoryIndex !== -1) {
          pathParts[categoryIndex] = category.slug;
          descendant.path = pathParts.join('/');
          descendant.level = pathParts.length - 1;
        }
      }
  
      if (descendants.length > 0) {
        await this.categoryRepository.save(descendants);
      }
    }
  }
  