import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Return } from '../../entities/return.entity';
import { MailService } from '../mail/services/mail.service';

@Injectable()
export class ReturnNotificationsService implements OnModuleInit {
  constructor(
    private eventEmitter: EventEmitter2,
    private mailService: MailService,
  ) {}

  onModuleInit() {
    this.eventEmitter.on('return.status.changed', (returnRequest: Return) => {
      this.handleStatusChange(returnRequest);
    });
  }

  private async handleStatusChange(returnRequest: Return) {
    const customerEmail = returnRequest.customer.email;
    let subject = '';
    let template = '';
    let context = {};

    switch (returnRequest.status) {
      case ReturnStatus.APPROVED:
        subject = 'Your return request has been approved';
        template = 'return-approved';
        context = { returnId: returnRequest.id };
        break;
      case ReturnStatus.REJECTED:
        subject = 'Your return request has been rejected';
        template = 'return-rejected';
        context = { returnId: returnRequest.id, reason: returnRequest.comment };
        break;
      case ReturnStatus.REFUNDED:
        subject = 'Your refund has been processed';
        template = 'return-refunded';
        context = { returnId: returnRequest.id, amount: returnRequest.refundAmount };
        break;
    }

    if (subject && template) {
      await this.mailService.sendMail({
        to: customerEmail,
        subject,
        template,
        context,
      });
    }
  }
}