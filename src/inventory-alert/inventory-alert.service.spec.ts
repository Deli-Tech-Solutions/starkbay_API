import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAlertService } from './inventory-alert.service';

describe('InventoryAlertService', () => {
  let service: InventoryAlertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryAlertService],
    }).compile();

    service = module.get<InventoryAlertService>(InventoryAlertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
