import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AddressService } from '../services/address.service';

@Injectable()
export class AddressOwnershipGuard implements CanActivate {
  constructor(private readonly addressService: AddressService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const addressId = request.params?.id;

    if (!userId || !addressId) {
      throw new ForbiddenException('Access denied');
    }

    try {
      await this.addressService.findOne(userId, addressId);
      return true;
    } catch (error) {
      throw new ForbiddenException('You do not own this address');
    }
  }
}
