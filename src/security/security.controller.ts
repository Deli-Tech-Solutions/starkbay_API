import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityService } from './services/security.service';
import { CsrfProtectionService } from './services/csrf-protection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('security')
@Controller('security')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(
    private securityService: SecurityService,
    private csrfService: CsrfProtectionService
  ) {}

  @Get('scan')
  @ApiOperation({ summary: 'Run security dependency scan' })
  @ApiResponse({ status: 200, description: 'Security scan results' })
  async scanDependencies() {
    return await this.securityService.scanDependencies();
  }

  @Get('report')
  @ApiOperation({ summary: 'Generate security report' })
  @ApiResponse({ status: 200, description: 'Security report generated' })
  async generateReport() {
    const report = await this.securityService.generateSecurityReport();
    return {
      report,
      generatedAt: new Date().toISOString(),
    };
  }

  @Post('validate-input')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate input for security threats' })
  @ApiResponse({ status: 200, description: 'Input validation result' })
  validateInput(@Body() body: { input: string }) {
    return this.securityService.validateInput(body.input);
  }

  @Get('csrf-token')
  @ApiOperation({ summary: 'Get CSRF token' })
  @ApiResponse({ status: 200, description: 'CSRF token generated' })
  getCsrfToken() {
    const token = this.csrfService.generateToken();
    return {
      token,
      headerName: 'x-csrf-token',
      expiresIn: '1h',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Security system health check' })
  @ApiResponse({ status: 200, description: 'Security system status' })
  async healthCheck() {
    try {
      // Basic health check - could be expanded with more detailed checks
      const scanResult = await this.securityService.scanDependencies();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          dependencyScanning: 'operational',
          csrfProtection: 'operational',
          inputValidation: 'operational',
          securityLogging: 'operational',
        },
        summary: {
          totalPackages: scanResult.totalPackages,
          vulnerabilities: scanResult.vulnerabilityCount,
          criticalVulnerabilities: scanResult.severity.critical,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
} 