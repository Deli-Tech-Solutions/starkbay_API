import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { EmailService, EmailOptions } from './email.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 201, description: 'Email queued successfully' })
  async sendEmail(@Body() emailOptions: EmailOptions) {
    return this.emailService.sendEmail(emailOptions);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create or update an email template' })
  @ApiResponse({ status: 201, description: 'Template saved successfully' })
  async saveTemplate(
    @Body() data: { name: string; content: string },
  ) {
    return this.emailService.saveTemplate(data.name, data.content);
  }

  @Get('templates/:name')
  @ApiOperation({ summary: 'Get an email template' })
  @ApiResponse({ status: 200, description: 'Template content' })
  async getTemplate(@Param('name') name: string) {
    return this.emailService.getTemplate(name);
  }

  @Delete('templates/:name')
  @ApiOperation({ summary: 'Delete an email template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('name') name: string) {
    return this.emailService.deleteTemplate(name);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Send email verification' })
  @ApiResponse({ status: 201, description: 'Verification email sent' })
  async sendVerificationEmail(
    @Body() data: { email: string; token: string },
  ) {
    return this.emailService.verifyEmail(data.email, data.token);
  }
} 