import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InventoryAlertService } from './inventory-alert.service';
import { CreateInventoryAlertDto } from './dto/create-inventory-alert.dto';
import { UpdateInventoryAlertDto } from './dto/update-inventory-alert.dto';

@Controller('inventory-alert')
export class InventoryAlertController {
  constructor(private readonly inventoryAlertService: InventoryAlertService) {}

  @Post()
  create(@Body() createInventoryAlertDto: CreateInventoryAlertDto) {
    return this.inventoryAlertService.create(createInventoryAlertDto);
  }

  @Get()
  findAll() {
    return this.inventoryAlertService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryAlertService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInventoryAlertDto: UpdateInventoryAlertDto) {
    return this.inventoryAlertService.update(+id, updateInventoryAlertDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryAlertService.remove(+id);
  }
}
