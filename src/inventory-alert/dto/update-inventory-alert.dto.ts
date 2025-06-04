import { PartialType } from '@nestjs/swagger';
import { CreateInventoryAlertDto } from './create-inventory-alert.dto';

export class UpdateInventoryAlertDto extends PartialType(CreateInventoryAlertDto) {}
