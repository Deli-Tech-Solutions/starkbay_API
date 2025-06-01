import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueryAnalysisService, QueryPattern, IndexSuggestion } from './query-analysis.service';

@Injectable()
export class IndexSuggestionService {
  private readonly logger = new Logger(IndexSuggestionService.name);

  constructor(
    private dataSource: DataSource,
    private queryAnalysisService: QueryAnalysisService
  ) {}

  /**
   * Generate automated index suggestions based on query patterns
   */
  @Cron(CronExpression.EVERY_WEEK)
  async generateIndexSuggestions(): Promise<void> {
    this.logger.log('Analyzing query patterns for index suggestions...');

    const queryPatterns = await this.queryAnalysisService.analyzeQueryPatterns();
    const suggestions = await this.analyzePatternsForIndexes(queryPatterns);

    this.logger.log(`Generated ${suggestions.length} index suggestions`);
    
    suggestions.forEach(suggestion => {
      this.logger.log(`[${suggestion.priority}] ${suggestion.table}: ${suggestion.reason}`);
      if (suggestion.suggestedIndex) {
        this.logger.log(`  Suggested: ${suggestion.suggestedIndex}`);
      }
    });
  }

  private async analyzePatternsForIndexes(patterns: QueryPattern[]): Promise<IndexSuggestion[]> {
    const suggestions: IndexSuggestion[] = [];

    for (const pattern of patterns) {
      // Analyze WHERE clauses
      const whereMatches = pattern.query.match(/WHERE\s+([^ORDER|GROUP|LIMIT]+)/gi);
      if (whereMatches) {
        const conditions = this.extractConditions(whereMatches[0]);
        suggestions.push(...this.suggestIndexesForConditions(conditions));
      }

      // Analyze ORDER BY clauses
      const orderMatches = pattern.query.match(/ORDER\s+BY\s+([^LIMIT]+)/gi);
      if (orderMatches) {
        const orderColumns = this.extractOrderColumns(orderMatches[0]);
        suggestions.push(...this.suggestIndexesForOrdering(orderColumns));
      }

      // Analyze JOIN conditions
      const joinMatches = pattern.query.match(/JOIN\s+\w+\s+ON\s+([^WHERE|ORDER|GROUP]+)/gi);
      if (joinMatches) {
        joinMatches.forEach(join => {
          const joinConditions = this.extractJoinConditions(join);
          suggestions.push(...this.suggestIndexesForJoins(joinConditions));
        });
      }
    }

    return this.dedupeSuggestions(suggestions);
  }

  private extractConditions(whereClause: string): string[] {
    return whereClause
      .replace(/WHERE\s+/i, '')
      .split(/\s+AND\s+|\s+OR\s+/i)
      .map(condition => condition.trim());
  }

  private extractOrderColumns(orderClause: string): string[] {
    return orderClause
      .replace(/ORDER\s+BY\s+/i, '')
      .split(',')
      .map(col => col.trim());
  }

  private extractJoinConditions(joinClause: string): string[] {
    return joinClause
      .replace(/JOIN\s+\w+\s+ON\s+/i, '')
      .split(/\s+AND\s+/i)
      .map(condition => condition.trim());
  }

  private suggestIndexesForConditions(conditions: string[]): IndexSuggestion[] {
    // Implementation for condition-based index suggestions
    return [];
  }

  private suggestIndexesForOrdering(orderColumns: string[]): IndexSuggestion[] {
    // Implementation for ordering-based index suggestions
    return [];
  }

  private suggestIndexesForJoins(joinConditions: string[]): IndexSuggestion[] {
    // Implementation for join-based index suggestions
    return [];
  }

  private dedupeSuggestions(suggestions: IndexSuggestion[]): IndexSuggestion[] {
    const seen = new Set();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.table}-${suggestion.type}-${suggestion.columns?.join(',')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}