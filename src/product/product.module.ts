import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { VariantAttribute } from './entities/variant-attribute.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { VariantInventory } from './entities/variant-inventory.entity';
import { VariantInventoryLocation } from './entities/variant-inventory-location.entity';
import { VariantImage } from './entities/variant-image.entity';
import { VariantService } from './services/variant.service';
import { VariantController } from './controllers/variant.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      VariantAttribute,
      VariantAttributeValue,
      VariantInventory,
      VariantInventoryLocation,
      VariantImage,
    ]),
  ],
  controllers: [VariantController],
  providers: [VariantService],
  exports: [VariantService, TypeOrmModule],
})
export class ProductModule {} 