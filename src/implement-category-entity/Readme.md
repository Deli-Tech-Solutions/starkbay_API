# NestJS Hierarchical Category System

## Overview
This system provides a complete hierarchical category management solution for e-commerce applications with unlimited nesting levels, SEO-friendly slugs, and efficient tree operations.

## Features
- ✅ Unlimited hierarchy levels with self-referencing relationships
- ✅ Automatic slug generation for SEO optimization
- ✅ Category status management (active/inactive)
- ✅ Materialized path for efficient tree queries
- ✅ Breadcrumb generation
- ✅ Tree integrity validation
- ✅ Circular reference prevention
- ✅ Soft delete protection for categories with children

## API Endpoints

### Category CRUD
- `POST /categories` - Create new category
- `GET /categories` - List categories with filtering
- `GET /categories/:id` - Get category by ID
- `GET /categories/slug/:slug` - Get category by slug
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Tree Operations
- `GET /categories/tree` - Get full category tree
- `GET /categories/:id/breadcrumbs` - Get category breadcrumbs
- `PATCH /categories/:id/status` - Update category status

## Query Parameters
- `parentId` - Filter by parent category
- `status` - Filter by active/inactive status
- `includeChildren` - Include child categories
- `maxDepth` - Limit tree depth

## Database Schema
The category table uses:
- UUID primary keys for better performance
- Materialized path for efficient tree queries
- Indexed columns for fast lookups
- Self-referencing foreign key with cascade delete
- Unique slug constraint for SEO

## Performance Optimizations
- Materialized path pattern for fast tree queries
- Strategic database indexes
- Efficient breadcrumb calculation
- Tree structure validation

## Usage Examples

### Create Root Category
```typescript
const rootCategory = await categoriesService.create({
  name: 'Electronics',
  description: 'Electronic devices and accessories'
});
```

### Create Subcategory
```typescript
const subcategory = await categoriesService.create({
  name: 'Smartphones',
  parentId: rootCategory.id,
  description: 'Mobile phones and accessories'
});
```

### Get Category Tree
```typescript
const tree = await categoriesService.getCategoryTree();
```

### Get Breadcrumbs
```typescript
const breadcrumbs = await categoriesService.getBreadcrumbs(categoryId);
```

## Installation
1. Add to your NestJS app module imports: `CategoriesModule`
2. Run the database migration
3. The system is ready to use!

## Error Handling
- Validates parent category existence
- Prevents circular references
- Ensures unique slugs
- Protects against deleting categories with children
- Comprehensive error messages with appropriate HTTP status codes
*/