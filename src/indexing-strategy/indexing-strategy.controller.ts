import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IndexingStrategyService } from './indexing-strategy.service';
import { CreateIndexingStrategyDto } from './dto/create-indexing-strategy.dto';
import { UpdateIndexingStrategyDto } from './dto/update-indexing-strategy.dto';

@Controller('indexing-strategy')
export class IndexingStrategyController {
  constructor(private readonly indexingStrategyService: IndexingStrategyService) {}

  @Post()
  create(@Body() createIndexingStrategyDto: CreateIndexingStrategyDto) {
    return this.indexingStrategyService.create(createIndexingStrategyDto);
  }

  @Get()
  findAll() {
    return this.indexingStrategyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.indexingStrategyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIndexingStrategyDto: UpdateIndexingStrategyDto) {
    return this.indexingStrategyService.update(+id, updateIndexingStrategyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.indexingStrategyService.remove(+id);
  }
}
