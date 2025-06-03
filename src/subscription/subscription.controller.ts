import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(id, dto);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.subscriptionService.pause(id);
  }

  @Patch(':id/resume')
  resume(@Param('id') id: string) {
    return this.subscriptionService.resume(id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.subscriptionService.findById(id);
  }
}
