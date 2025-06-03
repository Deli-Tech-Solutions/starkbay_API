import { Injectable } from '@nestjs/common';
import { CreateInventoryAlertDto } from './dto/create-inventory-alert.dto';
import { UpdateInventoryAlertDto } from './dto/update-inventory-alert.dto';

@Injectable()
export class InventoryAlertService {
  create(createInventoryAlertDto: CreateInventoryAlertDto) {
    return 'This action adds a new inventoryAlert';
  }

  findAll() {
    return `This action returns all inventoryAlert`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventoryAlert`;
  }

  update(id: number, updateInventoryAlertDto: UpdateInventoryAlertDto) {
    return `This action updates a #${id} inventoryAlert`;
  }

  remove(id: number) {
    return `This action removes a #${id} inventoryAlert`;
  }
}
