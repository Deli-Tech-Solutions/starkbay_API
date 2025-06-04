import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface TranslationEntry {
  key: string;
  value: string | Record<string, string>;
  locale: string;
  namespace?: string;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completionPercentage: number;
}

@Injectable()
export class TranslationManagementService {
  private readonly logger = new Logger(TranslationManagementService.name);
  private readonly translationsPath = join(__dirname, '../translations');

  async getTranslationStats(locale: string): Promise<TranslationStats> {
    try {
      const baseTranslations = await this.loadTranslations('en');
      const targetTranslations = await this.loadTranslations(locale);

      const baseKeys = this.flattenKeys(baseTranslations);
      const targetKeys = this.flattenKeys(targetTranslations);

      const missingKeys = baseKeys.filter(key => !targetKeys.includes(key));
      const translatedKeys = baseKeys.filter(key => targetKeys.includes(key));

      return {
        totalKeys: baseKeys.length,
        translatedKeys: translatedKeys.length,
        missingKeys,
        completionPercentage: Math.round((translatedKeys.length / baseKeys.length) * 100),
      };
    } catch (error) {
      this.logger.error(`Error getting translation stats for ${locale}:`, error);
      throw error;
    }
  }

  async addTranslation(entry: TranslationEntry): Promise<void> {
    try {
      const filePath = join(this.translationsPath, `${entry.locale}.json`);
      const translations = await this.loadTranslations(entry.locale);
      
      this.setNestedValue(translations, entry.key, entry.value);
      
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
      this.logger.log(`Added translation: ${entry.key} for locale ${entry.locale}`);
    } catch (error) {
      this.logger.error(`Error adding translation:`, error);
      throw error;
    }
  }

  async removeTranslation(key: string, locale: string): Promise<void> {
    try {
      const filePath = join(this.translationsPath, `${locale}.json`);
      const translations = await this.loadTranslations(locale);
      
      this.deleteNestedValue(translations, key);
      
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
      this.logger.log(`Removed translation: ${key} for locale ${locale}`);
    } catch (error) {
      this.logger.error(`Error removing translation:`, error);
      throw error;
    }
  }

  async exportTranslations(locale: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const translations = await this.loadTranslations(locale);
      
      if (format === 'csv') {
        return this.convertToCSV(translations);
      }
      
      return JSON.stringify(translations, null, 2);
    } catch (error) {
      this.logger.error(`Error exporting translations for ${locale}:`, error);
      throw error;
    }
  }

  async importTranslations(locale: string, data: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      let translations: Record<string, any>;
      
      if (format === 'csv') {
        translations = this.convertFromCSV(data);
      } else {
        translations = JSON.parse(data);
      }
      
      const filePath = join(this.translationsPath, `${locale}.json`);
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
      
      this.logger.log(`Imported translations for locale ${locale}`);
    } catch (error) {
      this.logger.error(`Error importing translations:`, error);
      throw error;
    }
  }

  private async loadTranslations(locale: string): Promise<Record<string, any>> {
    try {
      const filePath = join(this.translationsPath, `${locale}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  private flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.flattenKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  private setNestedValue(obj: Record<string, any>, key: string, value: any): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private deleteNestedValue(obj: Record<string, any>, key: string): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        return;
      }
      current = current[keys[i]];
    }
    
    delete current[keys[keys.length - 1]];
  }

  private convertToCSV(translations: Record<string, any>): string {
    const flatTranslations = this.flattenTranslations(translations);
    const rows = ['key,value'];
    
    for (const [key, value] of Object.entries(flatTranslations)) {
      const escapedValue = String(value).replace(/"/g, '""');
      rows.push(`"${key}","${escapedValue}"`);
    }
    
    return rows.join('\n');
  }

  private convertFromCSV(csv: string): Record<string, any> {
    const lines = csv.split('\n').slice(1); // Skip header
    const translations = {};
    
    for (const line of lines) {
      const [key, value] = line.split(',').map(field => field.replace(/^"|"$/g, '').replace(/""/g, '"'));
      this.setNestedValue(translations, key, value);
    }
    
    return translations;
  }

  private flattenTranslations(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenTranslations(value, fullKey));
      } else {
        result[fullKey] = String(value);
      }
    }
    
    return result;
  }
}