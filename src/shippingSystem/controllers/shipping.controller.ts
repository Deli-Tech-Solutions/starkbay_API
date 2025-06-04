import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { ShippingService } from '../services/shipping.service';
import { ShippingCalculatorService } from '../services/shipping-calculator.service';
import { TrackingService } from '../services/tracking.service';
import { CreateShippingDto } from '../dto/create-shipping.dto';
import { CalculateShippingDto } from '../dto/calculate-shipping.dto';
import { UpdateTrackingDto } from '../dto/update-tracking.dto';
import { ShippingStatus } from '../entities/shipping.entity';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly calculatorService: ShippingCalculatorService,
    private readonly trackingService: TrackingService,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate shipping options and costs' })
  @ApiResponse({ status: 200, description: 'Shipping options calculated successfully' })
  async calculateShipping(@Body() dto: CalculateShippingDto) {
    return this.calculatorService.calculateShippingOptions(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiResponse({ status: 201, description: 'Shipment created successfully' })
  async createShipment(@Body() dto: CreateShippingDto) {
    return this.shippingService.createShipment(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipments' })
  @ApiResponse({ status: 200, description: 'List of all shipments' })
  async findAll() {
    return this.shippingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiResponse({ status: 200, description: 'Shipment found' })
  async findOne(@Param('id') id: string) {
    return this.shippingService.findOne(id);
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track shipment by tracking number' })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number' })
  @ApiResponse({ status: 200, description: 'Tracking information retrieved' })
  async trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.findByTrackingNumber(trackingNumber);
  }

  @Get('track/:trackingNumber/history')
  @ApiOperation({ summary: 'Get tracking history' })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number' })
  @ApiResponse({ status: 200, description: 'Tracking history retrieved' })
  async getTrackingHistory(@Param('trackingNumber') trackingNumber: string) {
    return this.trackingService.getTrackingHistory(trackingNumber);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update shipment status' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiResponse({ status: 200, description: 'Shipment status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ShippingStatus,
  ) {
    return this.shippingService.updateStatus(id, status);
  }

  @Post('track/:trackingNumber/update')
  @ApiOperation({ summary: 'Update tracking information' })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateTracking(
    @Param('trackingNumber') trackingNumber: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    await this.trackingService.updateTracking(trackingNumber, dto);
  }
}
