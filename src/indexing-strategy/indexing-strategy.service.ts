import { Injectable } from '@nestjs/common';
import { CreateIndexingStrategyDto } from './dto/create-indexing-strategy.dto';
import { UpdateIndexingStrategyDto } from './dto/update-indexing-strategy.dto';

@Injectable()
export class IndexingStrategyService {
  create(createIndexingStrategyDto: CreateIndexingStrategyDto) {
    return 'This action adds a new indexingStrategy';
  }

  findAll() {
    return `This action returns all indexingStrategy`;
  }

  findOne(id: number) {
    return `This action returns a #${id} indexingStrategy`;
  }

  update(id: number, updateIndexingStrategyDto: UpdateIndexingStrategyDto) {
    return `This action updates a #${id} indexingStrategy`;
  }

  remove(id: number) {
    return `This action removes a #${id} indexingStrategy`;
  }
}
