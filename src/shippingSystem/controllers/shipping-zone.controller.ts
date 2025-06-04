import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam 
} from '@nestjs/swagger';
import { ShippingZoneService } from '../services/shipping-zone.service';
import { CreateShippingZoneDto, UpdateShippingZoneDto } from '../dto/shipping-zone.dto';

@ApiTags('shipping-zones')
@Controller('shipping-zones')
export class ShippingZoneController {
  constructor(private readonly shippingZoneService: ShippingZoneService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipping zone' })
  @ApiResponse({ status: 201, description: 'Shipping zone created successfully' })
  async create(@Body() dto: CreateShippingZoneDto) {
    return this.shippingZoneService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipping zones' })
  @ApiResponse({ status: 200, description: 'List of all shipping zones' })
  async findAll() {
    return this.shippingZoneService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping zone by ID' })
  @ApiParam({ name: 'id', description: 'Shipping zone ID' })
  @ApiResponse({ status: 200, description: 'Shipping zone found' })
  async findOne(@Param('id') id: string) {
    return this.shippingZoneService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping zone' })
  @ApiParam({ name: 'id', description: 'Shipping zone ID' })
  @ApiResponse({ status: 200, description: 'Shipping zone updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.shippingZoneService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipping zone' })
  @ApiParam({ name: 'id', description: 'Shipping zone ID' })
  @ApiResponse({ status: 204, description: 'Shipping zone deleted' })
  async remove(@Param('id') id: string) {
    return this.shippingZoneService.remove(id);
  }
}
