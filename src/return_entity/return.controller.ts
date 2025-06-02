import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ReturnService } from '../services/return.service';
import { CreateReturnDto } from '../dto/create-return.dto';
import { UpdateReturnDto } from '../dto/update-return.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../users/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  @Post()
  async create(@Body() createReturnDto: CreateReturnDto, @CurrentUser() user: User) {
    return this.returnService.createReturn(createReturnDto, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.returnService.findAllReturns(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.returnService.findReturnById(id, user.id);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.returnService.cancelReturn(id, user.id);
  }
}