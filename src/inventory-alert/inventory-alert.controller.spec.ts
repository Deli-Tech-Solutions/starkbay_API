import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAlertController } from './inventory-alert.controller';
import { InventoryAlertService } from './inventory-alert.service';

describe('InventoryAlertController', () => {
  let controller: InventoryAlertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryAlertController],
      providers: [InventoryAlertService],
    }).compile();

    controller = module.get<InventoryAlertController>(InventoryAlertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
