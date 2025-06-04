import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressService } from './services/address.service';
import { AddressValidationService } from './services/address-validation.service';
import { MockGeocodingService } from './services/geocoding.service';
import { AddressController } from './controllers/address.controller';
import { Address } from './entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address])],
  controllers: [AddressController],
  providers: [
    AddressService,
    AddressValidationService,
    {
      provide: 'GeocodingService',
      useClass: MockGeocodingService,
    },
    // For production geocoding:
    {
      provide: 'GeocodingService',
      useClass: GoogleGeocodingService,
    },
    {
      provide: 'GOOGLE_MAPS_API_KEY',
      useValue: process.env.GOOGLE_MAPS_API_KEY,
    },
  ],
  exports: [AddressService],
})
export class AddressModule {}

