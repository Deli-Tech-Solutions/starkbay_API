import { Test, TestingModule } from '@nestjs/testing';
import { IndexingStrategyService } from './indexing-strategy.service';

describe('IndexingStrategyService', () => {
  let service: IndexingStrategyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndexingStrategyService],
    }).compile();

    service = module.get<IndexingStrategyService>(IndexingStrategyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
