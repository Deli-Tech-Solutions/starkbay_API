import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from '../entities/return.entity';
import { CreateReturnDto } from '../dto/create-return.dto';
import { UpdateReturnDto } from '../dto/update-return.dto';
import { ReturnStatus } from '../enums/return-status.enum';
import { OrdersService } from '../../orders/services/orders.service';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class ReturnService {
  constructor(
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
    private ordersService: OrdersService,
    private usersService: UsersService,
  ) {}

  async createReturn(createReturnDto: CreateReturnDto, userId: string): Promise<Return> {
    const order = await this.ordersService.findOne(createReturnDto.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const returnRequest = this.returnRepository.create({
      ...createReturnDto,
      order,
      customer: user,
      status: ReturnStatus.REQUESTED,
    });

    return this.returnRepository.save(returnRequest);
  }

  async findAllReturns(userId?: string): Promise<Return[]> {
    if (userId) {
      return this.returnRepository.find({
        where: { customer: { id: userId } },
        relations: ['order', 'items'],
      });
    }
    return this.returnRepository.find({ relations: ['order', 'items', 'customer'] });
  }

  async findReturnById(id: string, userId?: string): Promise<Return> {
    const where = userId ? { id, customer: { id: userId } } : { id };
    const returnRequest = await this.returnRepository.findOne({
      where,
      relations: ['order', 'items', 'customer'],
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return returnRequest;
  }

  async updateReturnStatus(id: string, status: ReturnStatus, adminId: string): Promise<Return> {
    const returnRequest = await this.findReturnById(id);
    
    if (!this.isValidStatusTransition(returnRequest.status, status)) {
      throw new Error('Invalid status transition');
    }

    returnRequest.status = status;
    returnRequest.processedAt = new Date();
    
    return this.returnRepository.save(returnRequest);
  }

  private isValidStatusTransition(currentStatus: ReturnStatus, newStatus: ReturnStatus): boolean {
    const validTransitions = {
      [ReturnStatus.REQUESTED]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.CANCELLED],
      [ReturnStatus.APPROVED]: [ReturnStatus.RECEIVED, ReturnStatus.CANCELLED],
      [ReturnStatus.RECEIVED]: [ReturnStatus.PROCESSING_REFUND],
      [ReturnStatus.PROCESSING_REFUND]: [ReturnStatus.REFUNDED],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  async cancelReturn(id: string, userId: string): Promise<Return> {
    const returnRequest = await this.findReturnById(id, userId);
    
    if (returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new Error('Only requested returns can be cancelled');
    }

    returnRequest.status = ReturnStatus.CANCELLED;
    return this.returnRepository.save(returnRequest);
  }
}