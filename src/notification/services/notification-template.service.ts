import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';

@Injectable()
export class NotificationTemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
  ) {}

  async render(templateId: string, variables: Record<string, any>): Promise<{
    subject: string;
    content: string;
  }> {
    const template = await this.templateRepository.findOne({
      where: { templateId, active: true }
    });

    if (!template) {
      throw new NotFoundException(`Template not found: ${templateId}`);
    }

    const subject = this.processTemplate(template.subject, variables);
    const content = this.processTemplate(template.content, variables);

    return { subject, content };
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  async createTemplate(templateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const template = this.templateRepository.create(templateData);
    return this.templateRepository.save(template);
  }

  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({
      where: { templateId }
    });

    if (!template) {
      throw new NotFoundException(`Template not found: ${templateId}`);
    }

    Object.assign(template, updates);
    return this.templateRepository.save(template);
  }

  async getAllTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepository.find({
      where: { active: true }
    });
  }
}
