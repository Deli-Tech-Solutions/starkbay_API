import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { AddressService } from '../services/address.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { AddressQueryDto } from '../dto/address-query.dto';
import { AddressType } from '../entities/address.entity';

// Assuming you have an auth guard
// @UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  async create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    // In a real app, extract userId from JWT token
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.create(userId, createAddressDto);
  }

  @Get()
  async findAll(@Request() req, @Query() query: AddressQueryDto) {
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.findAll(userId, query);
  }

  @Get('book')
  async getAddressBook(@Request() req) {
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.getAddressBook(userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto
  ) {
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.update(userId, id, updateAddressDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.remove(userId, id);
  }

  @Patch(':id/default/:type')
  async setDefault(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('type') type: AddressType
  ) {
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.setDefault(userId, id, type);
  }

  @Post('bulk-import')
  async bulkImport(@Request() req, @Body() addresses: CreateAddressDto[]) {
    const userId = req.user?.id || 'mock-user-id';
    return this.addressService.bulkImport(userId, addresses);
  }
}
