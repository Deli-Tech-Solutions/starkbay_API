import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchEntity } from './entities/search.entity';
import { Article } from './entities/article.entity';
import { Product } from './entities/product.entity';
import { SearchDto, SearchFacetsDto } from './dto/search.dto';
import { SearchResponse, SearchResult, SearchFacets } from './interfaces/search.interface';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(SearchEntity)
    private searchRepository: Repository<SearchEntity>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) {}

  async search(searchDto: SearchDto, facetsDto: SearchFacetsDto): Promise<SearchResponse> {
    const { query, page, limit, entity_type } = searchDto;
    const offset = (page - 1) * limit;

    let results: SearchResult[] = [];
    let total = 0;
    let facets: SearchFacets | undefined;

    if (entity_type === 'all' || entity_type === 'articles') {
      const articleResults = await this.searchArticles(searchDto, offset, limit);
      results.push(...articleResults.results);
      total += articleResults.total;
    }

    if (entity_type === 'all' || entity_type === 'products') {
      const productResults = await this.searchProducts(searchDto, offset, limit);
      results.push(...productResults.results);
      total += productResults.total;
    }

    if (entity_type === 'all') {
      const searchResults = await this.searchGeneral(searchDto, offset, limit);
      results.push(...searchResults.results);
      total += searchResults.total;
    }

    // Sort results by relevance if multiple entity types
    if (entity_type === 'all') {
      results.sort((a, b) => b.rank - a.rank);
      results = results.slice(0, limit);
    }

    // Get facets if requested
    if (facetsDto.include_categories || facetsDto.include_tags) {
      facets = await this.getFacets(query, facetsDto);
    }

    // Get suggestions
    const suggestions = await this.getSuggestions(query);

    return {
      results,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      facets,
      query_time: 0, // Will be set in controller
      suggestions: suggestions.slice(0, 5)
    };
  }

  private async searchArticles(searchDto: SearchDto, offset: number, limit: number) {
    const { query, category, tags, sort_by, sort_order, highlight } = searchDto;
    
    let queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .select([
        'article.id',
        'article.title', 
        'article.content',
        'article.author',
        'article.tags',
        'article.views',
        'article.published_at',
        `ts_rank(article.search_vector, plainto_tsquery('english', :query)) as rank`
      ])
      .where(`article.search_vector @@ plainto_tsquery('english', :query)`)
      .setParameter('query', query);

    if (category) {
      queryBuilder = queryBuilder.andWhere('article.author = :category', { category });
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.andWhere('article.tags && :tags', { tags });
    }

    // Apply sorting
    switch (sort_by) {
      case 'date':
        queryBuilder = queryBuilder.orderBy('article.published_at', sort_order === 'asc' ? 'ASC' : 'DESC');
        break;
      case 'views':
        queryBuilder = queryBuilder.orderBy('article.views', sort_order === 'asc' ? 'ASC' : 'DESC');
        break;
      default:
        queryBuilder = queryBuilder.orderBy('rank', 'DESC');
    }

    const [articles, total] = await Promise.all([
      queryBuilder.offset(offset).limit(limit).getRawMany(),
      queryBuilder.getCount()
    ]);

    const results: SearchResult[] = articles.map(article => ({
      id: article.article_id,
      title: article.article_title,
      content: this.truncateContent(article.article_content),
      category: article.article_author,
      tags: article.article_tags,
      rank: parseFloat(article.rank),
      highlighted_title: highlight ? this.highlightText(article.article_title, query) : undefined,
      highlighted_content: highlight ? this.highlightText(article.article_content, query) : undefined,
      entity_type: 'article',
      metadata: {
        author: article.article_author,
        views: article.article_views,
        published_at: article.article_published_at
      }
    }));

    return { results, total };
  }

  private async searchProducts(searchDto: SearchDto, offset: number, limit: number) {
    const { query, category, sort_by, sort_order, highlight } = searchDto;
    
    let queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.description',
        'product.category',
        'product.brand',
        'product.price',
        'product.features',
        'product.rating',
        'product.in_stock',
        `ts_rank(product.search_vector, plainto_tsquery('english', :query)) as rank`
      ])
      .where(`product.search_vector @@ plainto_tsquery('english', :query)`)
      .andWhere('product.in_stock = true')
      .setParameter('query', query);

    if (category) {
      queryBuilder = queryBuilder.andWhere('product.category = :category', { category });
    }

    // Apply sorting
    switch (sort_by) {
      case 'rating':
        queryBuilder = queryBuilder.orderBy('product.rating', sort_order === 'asc' ? 'ASC' : 'DESC');
        break;
      default:
        queryBuilder = queryBuilder.orderBy('rank', 'DESC');
    }

    const [products, total] = await Promise.all([
      queryBuilder.offset(offset).limit(limit).getRawMany(),
      queryBuilder.getCount()
    ]);

    const results: SearchResult[] = products.map(product => ({
      id: product.product_id,
      title: product.product_name,
      content: this.truncateContent(product.product_description),
      category: product.product_category,
      tags: product.product_features,
      rank: parseFloat(product.rank),
      highlighted_title: highlight ? this.highlightText(product.product_name, query) : undefined,
      highlighted_content: highlight ? this.highlightText(product.product_description, query) : undefined,
      entity_type: 'product',
      metadata: {
        brand: product.product_brand,
        price: product.product_price,
        rating: product.product_rating,
        in_stock: product.product_in_stock
      }
    }));

    return { results, total };
  }

  private async searchGeneral(searchDto: SearchDto, offset: number, limit: number) {
    const { query, category, tags, sort_by, sort_order, highlight } = searchDto;
    
    let queryBuilder = this.searchRepository
      .createQueryBuilder('search')
      .select([
        'search.id',
        'search.title',
        'search.content',
        'search.category',
        'search.tags',
        'search.view_count',
        `ts_rank(search.search_vector, plainto_tsquery('english', :query)) as rank`
      ])
      .where(`search.search_vector @@ plainto_tsquery('english', :query)`)
      .andWhere('search.is_active = true')
      .setParameter('query', query);

    if (category) {
      queryBuilder = queryBuilder.andWhere('search.category = :category', { category });
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.andWhere('search.tags && :tags', { tags });
    }

    // Apply sorting
    switch (sort_by) {
      case 'views':
        queryBuilder = queryBuilder.orderBy('search.view_count', sort_order === 'asc' ? 'ASC' : 'DESC');
        break;
      default:
        queryBuilder = queryBuilder.orderBy('rank', 'DESC');
    }

    const [searches, total] = await Promise.all([
      queryBuilder.offset(offset).limit(limit).getRawMany(),
      queryBuilder.getCount()
    ]);

    const results: SearchResult[] = searches.map(search => ({
      id: search.search_id,
      title: search.search_title,
      content: this.truncateContent(search.search_content),
      category: search.search_category,
      tags: search.search_tags,
      rank: parseFloat(search.rank),
      highlighted_title: highlight ? this.highlightText(search.search_title, query) : undefined,
      highlighted_content: highlight ? this.highlightText(search.search_content, query) : undefined,
      entity_type: 'general',
      metadata: {
        view_count: search.search_view_count
      }
    }));

    return { results, total };
  }

  private async getFacets(query: string, facetsDto: SearchFacetsDto): Promise<SearchFacets> {
    const facets: SearchFacets = {
      categories: [],
      tags: []
    };

    if (facetsDto.include_categories) {
      const categoryFacets = await this.searchRepository
        .createQueryBuilder('search')
        .select('search.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where(`search.search_vector @@ plainto_tsquery('english', :query)`)
        .andWhere('search.is_active = true')
        .setParameter('query', query)
        .groupBy('search.category')
        .orderBy('count', 'DESC')
        .limit(facetsDto.max_facets)
        .getRawMany();

      facets.categories = categoryFacets.map(f => ({
        value: f.category,
        count: parseInt(f.count)
      }));
    }

    if (facetsDto.include_tags) {
      // Get tag facets using unnest for array fields
      const tagFacets = await this.searchRepository
        .createQueryBuilder()
        .select('unnest(search.tags)', 'tag')
        .addSelect('COUNT(*)', 'count')
        .from(SearchEntity, 'search')
        .where(`search.search_vector @@ plainto_tsquery('english', :query)`)
        .andWhere('search.is_active = true')
        .setParameter('query', query)
        .groupBy('tag')
        .orderBy('count', 'DESC')
        .limit(facetsDto.max_facets)
        .getRawMany();

      facets.tags = tagFacets.map(f => ({
        value: f.tag,
        count: parseInt(f.count)
      }));
    }

    return facets;
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const suggestions = await this.searchRepository
      .createQueryBuilder('search')
      .select('DISTINCT search.title')
      .where('search.title ILIKE :query')
      .andWhere('search.is_active = true')
      .setParameter('query', `%${query}%`)
      .orderBy('search.view_count', 'DESC')
      .limit(10)
      .getRawMany();

    return suggestions.map(s => s.search_title);
  }

  private highlightText(text: string, query: string): string {
    if (!text || !query) return text;
    
    const words = query.split(' ').filter(word => word.length > 2);
    let highlightedText = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }

  private truncateContent(content: string, maxLength: number = 200): string {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}
