import { Test, TestingModule } from '@nestjs/testing';
import { IndexingStrategyController } from './indexing-strategy.controller';
import { IndexingStrategyService } from './indexing-strategy.service';

describe('IndexingStrategyController', () => {
  let controller: IndexingStrategyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexingStrategyController],
      providers: [IndexingStrategyService],
    }).compile();

    controller = module.get<IndexingStrategyController>(IndexingStrategyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
