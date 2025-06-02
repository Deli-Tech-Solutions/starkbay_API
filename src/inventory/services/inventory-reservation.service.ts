import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { InventoryReservation } from '../entities/inventory-reservation.entity';
import { ReserveInventoryDto } from '../dto/reserve-inventory.dto';
import { Order } from '../../orders/entities/order.entity';
import { InventoryService } from './inventory.service';

@Injectable()
export class InventoryReservationService {
  constructor(
    @InjectRepository(InventoryReservation)
    private reservationRepository: Repository<InventoryReservation>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private inventoryService: InventoryService,
  ) {}

  async reserveInventory(
    productId: string,
    reserveInventoryDto: ReserveInventoryDto,
    order?: Order,
  ): Promise<InventoryReservation> {
    const { quantity, expiresAt } = reserveInventoryDto;
    const inventory = await this.inventoryService.getInventory(productId);

    // Check available quantity
    
    const available = await this.inventoryService.getAvailableQuantity(productId);
    if (available < quantity) {
      throw new Error('Insufficient inventory available');
    }

    // Create reservation

    const reservation = this.reservationRepository.create({
      inventory,
      order,
      quantity,
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
    });

    // Update reserved quantity

    inventory.quantityReserved += quantity;
    await this.inventoryRepository.save(inventory);

    return this.reservationRepository.save(reservation);
  }

  async releaseReservation(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['inventory'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.isReleased) {
      return;
    }

    // Update inventory

    const inventory = reservation.inventory;
    inventory.quantityReserved -= reservation.quantity;
    await this.inventoryRepository.save(inventory);

    // Mark reservation as released

    reservation.isReleased = true;
    await this.reservationRepository.save(reservation);
  }

  async commitReservation(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['inventory'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.isReleased) {
      throw new Error('Cannot commit a released reservation');
    }

    // Adjust inventory (reduce on-hand quantity)

    const inventory = reservation.inventory;
    inventory.quantityOnHand -= reservation.quantity;
    inventory.quantityReserved -= reservation.quantity;
    await this.inventoryRepository.save(inventory);

    // Mark reservation as released

    reservation.isReleased = true;
    await this.reservationRepository.save(reservation);
  }

  async getActiveReservations(productId: string): Promise<InventoryReservation[]> {
    return this.reservationRepository.find({
      where: {
        inventory: { product: { id: productId } },
        isReleased: false,
        expiresAt: { $gt: new Date() },
      },
      relations: ['order'],
    });
  }
}