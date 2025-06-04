import { Module } from '@nestjs/common';
import { PaginationService } from './services/pagination.service';

@Module({
  providers: [PaginationService],
  exports: [PaginationService],
})
export class SortingSystemModule {}

// sortingSystem/examples/user.controller.ts
import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationService } from '../services/pagination.service';
import { PaginationDto, CursorPaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
import { Pagination, GetBaseUrl } from '../decorators/pagination.decorator';
import { PaginationPipe } from '../pipes/pagination.pipe';
import { PaginationInterceptor } from '../interceptors/pagination.interceptor';
import { PaginationExceptionFilter } from '../filters/pagination-exception.filter';
import { PaginationOptions } from '../interfaces/pagination.interface';

// Example User entity (you would have this in your entities)
class User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags('Users')
@Controller('users')
@UseInterceptors(PaginationInterceptor)
@UseFilters(PaginationExceptionFilter)
export class UserController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly paginationService: PaginationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated users with offset-based pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved users',
    type: PaginatedResponseDto,
  })
  @UsePipes(new PaginationPipe())
  async getUsers(
    @Query() paginationDto: PaginationDto,
    @Pagination() pagination: PaginationOptions,
    @GetBaseUrl() baseUrl: string,
  ) {
    return this.paginationService.paginateRepository(
      this.userRepository,
      pagination,
      baseUrl,
      [], // relations
      ['name', 'email'], // searchable fields
    );
  }

  @Get('cursor')
  @ApiOperation({ summary: 'Get paginated users with cursor-based pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved users',
  })
  @UsePipes(new PaginationPipe())
  async getUsersWithCursor(
    @Query() paginationDto: CursorPaginationDto,
    @Pagination() pagination: PaginationOptions,
    @GetBaseUrl() baseUrl: string,
  ) {
    return this.paginationService.paginateRepositoryWithCursor(
      this.userRepository,
      pagination,
      baseUrl,
      'id', // cursor field
      [], // relations
      ['name', 'email'], // searchable fields
    );
  }
}
