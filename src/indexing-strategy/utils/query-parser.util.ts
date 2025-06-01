export class QueryParserUtil {
    /**
     * Extract table names from SQL query
     */
    static extractTableNames(query: string): string[] {
      const tablePattern = /(?:FROM|JOIN|UPDATE|INTO)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
      const matches = query.match(tablePattern);
      
      if (!matches) return [];
      
      return matches.map(match => {
        const table = match.replace(/(?:FROM|JOIN|UPDATE|INTO)\s+/i, '').trim();
        return table.split('.').pop() || table; // Handle schema.table notation
      });
    }
  
    /**
     * Extract WHERE conditions from SQL query
     */
    static extractWhereConditions(query: string): string[] {
      const wherePattern = /WHERE\s+(.*?)(?:\s+(?:ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT|$))/i;
      const match = query.match(wherePattern);
      
      if (!match) return [];
      
      const whereClause = match[1];
      return whereClause
        .split(/\s+(?:AND|OR)\s+/i)
        .map(condition => condition.trim())
        .filter(condition => condition.length > 0);
    }
  
    /**
     * Extract ORDER BY columns from SQL query
     */
    static extractOrderByColumns(query: string): string[] {
      const orderPattern = /ORDER\s+BY\s+(.*?)(?:\s+(?:LIMIT|$))/i;
      const match = query.match(orderPattern);
      
      if (!match) return [];
      
      return match[1]
        .split(',')
        .map(col => col.trim().split(/\s+/)[0]) // Remove ASC/DESC
        .filter(col => col.length > 0);
    }
  
    /**
     * Extract JOIN conditions from SQL query
     */
    static extractJoinConditions(query: string): Array<{table: string, condition: string}> {
      const joinPattern = /JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+ON\s+(.*?)(?:\s+(?:JOIN|WHERE|ORDER|GROUP|LIMIT|$))/gi;
      const joins: Array<{table: string, condition: string}> = [];
      let match;
      
      while ((match = joinPattern.exec(query)) !== null) {
        joins.push({
          table: match[1],
          condition: match[2].trim()
        });
      }
      
      return joins;
    }
  
    /**
     * Determine if query would benefit from an index
     */
    static analyzeIndexPotential(query: string): {
      needsIndex: boolean;
      suggestedColumns: string[];
      reason: string;
    } {
      const tables = this.extractTableNames(query);
      const conditions = this.extractWhereConditions(query);
      const orderColumns = this.extractOrderByColumns(query);
      
      const suggestedColumns = [
        ...this.extractColumnsFromConditions(conditions),
        ...orderColumns
      ];
      
      const needsIndex = suggestedColumns.length > 0 && tables.length > 0;
      
      return {
        needsIndex,
        suggestedColumns: [...new Set(suggestedColumns)], // Remove duplicates
        reason: needsIndex 
          ? `Query filters on ${suggestedColumns.join(', ')} and could benefit from indexing`
          : 'No indexable patterns detected'
      };
    }
  
    private static extractColumnsFromConditions(conditions: string[]): string[] {
      const columns: string[] = [];
      
      conditions.forEach(condition => {
        // Simple pattern to extract column names (left side of comparison operators)
        const columnPattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|!=|<|>|<=|>=|LIKE|IN|IS)/i;
        const match = condition.match(columnPattern);
        
        if (match && match[1]) {
          columns.push(match[1]);
        }
      });
      
      return columns;
    }
  }