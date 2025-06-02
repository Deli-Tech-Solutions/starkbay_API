import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailOptions } from './email.service';

@Processor('email')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailOptions>) {
    this.logger.debug(`Processing email job ${job.id}`);
    
    try {
      const result = await this.mailerService.sendMail({
        to: job.data.to,
        subject: job.data.subject,
        template: job.data.template,
        context: job.data.context,
        text: job.data.text,
        html: job.data.html,
        attachments: job.data.attachments,
      });

      this.logger.debug(`Email sent successfully: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process email job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
} 