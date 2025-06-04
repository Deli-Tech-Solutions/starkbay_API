import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from '../config/security.config';
import * as fs from 'fs';
import * as path from 'path';

export interface SecurityScanResult {
  vulnerablePackages: VulnerablePackage[];
  totalPackages: number;
  vulnerabilityCount: number;
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastScan: Date;
}

export interface VulnerablePackage {
  name: string;
  version: string;
  vulnerability: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private securityConfig: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.securityConfig = this.configService.get<SecurityConfig>('security');
  }

  async scanDependencies(): Promise<SecurityScanResult> {
    this.logger.log('Starting security dependency scan...');
    
    try {
      const packageLockPath = path.join(process.cwd(), 'package-lock.json');
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (!fs.existsSync(packageLockPath) || !fs.existsSync(packageJsonPath)) {
        throw new Error('Package files not found');
      }

      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const vulnerablePackages = await this.checkVulnerabilities(packageLock, packageJson);
      
      const result: SecurityScanResult = {
        vulnerablePackages,
        totalPackages: this.countTotalPackages(packageLock),
        vulnerabilityCount: vulnerablePackages.length,
        severity: this.categorizeVulnerabilities(vulnerablePackages),
        lastScan: new Date(),
      };

      this.logger.log(`Security scan completed. Found ${result.vulnerabilityCount} vulnerabilities`);
      
      if (result.severity.critical > 0 || result.severity.high > 0) {
        this.logger.warn(`HIGH PRIORITY: Found ${result.severity.critical} critical and ${result.severity.high} high severity vulnerabilities`);
      }

      return result;
    } catch (error) {
      this.logger.error('Security scan failed:', error);
      throw error;
    }
  }

  private async checkVulnerabilities(packageLock: any, packageJson: any): Promise<VulnerablePackage[]> {
    const vulnerablePackages: VulnerablePackage[] = [];
    
    // Known vulnerable packages (in a real implementation, this would connect to vulnerability databases)
    const knownVulnerabilities = this.getKnownVulnerabilities();
    
    // Check dependencies
    const allDependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {},
    };

    for (const [packageName, version] of Object.entries(allDependencies)) {
      const vulnerability = knownVulnerabilities.find(vuln => 
        vuln.name === packageName && this.isVersionVulnerable(version as string, vuln.affectedVersions)
      );

      if (vulnerability) {
        vulnerablePackages.push({
          name: packageName,
          version: version as string,
          vulnerability: vulnerability.id,
          severity: vulnerability.severity,
          description: vulnerability.description,
          recommendation: vulnerability.recommendation,
        });
      }
    }

    return vulnerablePackages;
  }

  private getKnownVulnerabilities() {
    // In a real implementation, this would fetch from CVE databases, npm audit, etc.
    return [
      {
        name: 'lodash',
        id: 'CVE-2021-23337',
        affectedVersions: ['<4.17.21'],
        severity: 'high' as const,
        description: 'Command injection vulnerability in lodash',
        recommendation: 'Update to version 4.17.21 or higher',
      },
      {
        name: 'express',
        id: 'CVE-2022-24999',
        affectedVersions: ['<4.18.2'],
        severity: 'medium' as const,
        description: 'Open redirect vulnerability in express',
        recommendation: 'Update to version 4.18.2 or higher',
      },
      // Add more known vulnerabilities as needed
    ];
  }

  private isVersionVulnerable(currentVersion: string, affectedVersions: string[]): boolean {
    // Simplified version comparison (in production, use a proper semver library)
    for (const range of affectedVersions) {
      if (range.startsWith('<')) {
        const minVersion = range.substring(1);
        // Simple string comparison - in production use proper semver comparison
        if (currentVersion < minVersion) {
          return true;
        }
      }
    }
    return false;
  }

  private countTotalPackages(packageLock: any): number {
    let count = 0;
    
    function countRecursive(deps: any) {
      if (deps) {
        count += Object.keys(deps).length;
        for (const dep of Object.values(deps)) {
          if ((dep as any).dependencies) {
            countRecursive((dep as any).dependencies);
          }
        }
      }
    }

    countRecursive(packageLock.dependencies);
    return count;
  }

  private categorizeVulnerabilities(vulnerablePackages: VulnerablePackage[]) {
    const categories = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    vulnerablePackages.forEach(pkg => {
      categories[pkg.severity]++;
    });

    return categories;
  }

  // Utility method to validate input against common attack patterns
  validateInput(input: string): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    if (!input) {
      return { isValid: true, violations: [] };
    }

    // Check length
    if (input.length > this.securityConfig.inputValidation.maxInputLength) {
      violations.push('Input exceeds maximum length');
    }

    // Check for SQL injection patterns
    for (const pattern of this.securityConfig.inputValidation.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        violations.push('Potential SQL injection detected');
        break;
      }
    }

    // Check for XSS patterns
    for (const pattern of this.securityConfig.inputValidation.xssPatterns) {
      if (pattern.test(input)) {
        violations.push('Potential XSS detected');
        break;
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  // Method to generate security report
  generateSecurityReport(): Promise<string> {
    return new Promise(async (resolve) => {
      const scanResult = await this.scanDependencies();
      
      const report = `
Security Report - ${new Date().toISOString()}
=====================================

Dependency Scan Results:
- Total Packages: ${scanResult.totalPackages}
- Vulnerabilities Found: ${scanResult.vulnerabilityCount}

Severity Breakdown:
- Critical: ${scanResult.severity.critical}
- High: ${scanResult.severity.high}
- Medium: ${scanResult.severity.medium}
- Low: ${scanResult.severity.low}

${scanResult.vulnerablePackages.length > 0 ? 'Vulnerable Packages:\n' + 
  scanResult.vulnerablePackages.map(pkg => 
    `- ${pkg.name}@${pkg.version}: ${pkg.vulnerability} (${pkg.severity})\n  ${pkg.description}\n  Recommendation: ${pkg.recommendation}`
  ).join('\n\n') : 'No vulnerabilities found.'}

Security Configuration:
- CSRF Protection: ${this.securityConfig.csrf.enabled ? 'Enabled' : 'Disabled'}
- XSS Protection: ${this.securityConfig.headers.xssProtection ? 'Enabled' : 'Disabled'}
- Security Logging: ${this.securityConfig.logging.logSecurityEvents ? 'Enabled' : 'Disabled'}
- Rate Limiting: Configured for authenticated users

Recommendations:
${scanResult.severity.critical > 0 ? '⚠️  URGENT: Address critical vulnerabilities immediately' : ''}
${scanResult.severity.high > 0 ? '⚠️  HIGH: Address high severity vulnerabilities soon' : ''}
${scanResult.vulnerabilityCount === 0 ? '✅ No immediate security concerns found' : ''}
- Regularly update dependencies
- Monitor security advisories
- Review security logs periodically
      `;

      resolve(report.trim());
    });
  }
} 