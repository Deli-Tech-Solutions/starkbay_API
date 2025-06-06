import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorService } from './vendor.service';
import { ProductService } from './product.service';
import { VendorController } from './vendor.controller';
import { ProductController } from './product.controller';
import { Vendor } from './entities/vendor.entity';
import { Product } from './entities/product.entity';
import { VendorCommission } from './entities/vendor-commission.entity';
import { VendorPerformance } from './entities/vendor-performance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      Product,
      VendorCommission,
      VendorPerformance,
    ]),
  ],
  controllers: [VendorController, ProductController],
  providers: [VendorService, ProductService],
  exports: [VendorService, ProductService],
})
export class VendorModule {}

