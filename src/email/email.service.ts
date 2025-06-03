import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { join } from 'path';
import * as fs from 'fs/promises';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: any;
  text?: string;
  html?: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async sendEmail(options: EmailOptions) {
    try {
      // Add to queue for processing
      await this.emailQueue.add('send-email', options, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });

      return { success: true, message: 'Email queued successfully' };
    } catch (error) {
      this.logger.error(`Failed to queue email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendEmailImmediate(options: EmailOptions) {
    try {
      const result = await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyEmail(email: string, token: string) {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email',
      template: 'email-verification',
      context: {
        verificationLink,
        username: email.split('@')[0],
      },
    });
  }

  async saveTemplate(name: string, content: string) {
    const templatePath = join(__dirname, 'templates', `${name}.hbs`);
    await fs.writeFile(templatePath, content);
    return { success: true, message: 'Template saved successfully' };
  }

  async getTemplate(name: string) {
    const templatePath = join(__dirname, 'templates', `${name}.hbs`);
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      this.logger.error(`Template not found: ${name}`);
      throw error;
    }
  }

  async deleteTemplate(name: string) {
    const templatePath = join(__dirname, 'templates', `${name}.hbs`);
    await fs.unlink(templatePath);
    return { success: true, message: 'Template deleted successfully' };
  }
} 