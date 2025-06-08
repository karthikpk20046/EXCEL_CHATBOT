import { DataSet, QueryResult, ChartData, TableData } from '../types';

export class QueryProcessor {
  private dataset: DataSet;
  
  constructor(dataset: DataSet) {
    this.dataset = dataset;
  }
  
  async processQuery(query: string): Promise<QueryResult> {
    const lowerQuery = query.toLowerCase();
    
    // Statistical queries
    if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
      return this.handleAverageQuery(query);
    }
    
    if (lowerQuery.includes('count') || lowerQuery.includes('how many')) {
      return this.handleCountQuery(query);
    }
    
    if (lowerQuery.includes('maximum') || lowerQuery.includes('max') || lowerQuery.includes('highest')) {
      return this.handleMaxQuery(query);
    }
    
    if (lowerQuery.includes('minimum') || lowerQuery.includes('min') || lowerQuery.includes('lowest')) {
      return this.handleMinQuery(query);
    }
    
    // Chart queries
    if (lowerQuery.includes('chart') || lowerQuery.includes('graph') || lowerQuery.includes('plot') || lowerQuery.includes('show')) {
      return this.handleChartQuery(query);
    }
    
    // Comparison queries
    if (lowerQuery.includes('compare') || lowerQuery.includes('by')) {
      return this.handleComparisonQuery(query);
    }
    
    // Filter queries
    if (lowerQuery.includes('where') || lowerQuery.includes('filter')) {
      return this.handleFilterQuery(query);
    }
    
    // Default: show data summary
    return this.handleSummaryQuery();
  }
  
  private handleAverageQuery(query: string): QueryResult {
    const numericColumns = this.dataset.columns.filter(col => col.type === 'number');
    
    if (numericColumns.length === 0) {
      return {
        type: 'text',
        content: 'No numeric columns found for calculating averages.'
      };
    }
    
    // Try to find the specific column mentioned in the query
    const mentionedColumn = numericColumns.find(col => 
      query.toLowerCase().includes(col.name.toLowerCase())
    );
    
    if (mentionedColumn) {
      const values = mentionedColumn.values.map(v => Number(v)).filter(v => !isNaN(v));
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      
      return {
        type: 'text',
        content: `The average ${mentionedColumn.name} is ${average.toFixed(2)}.`
      };
    }
    
    // Show averages for all numeric columns
    const averages = numericColumns.map(col => {
      const values = col.values.map(v => Number(v)).filter(v => !isNaN(v));
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return `${col.name}: ${avg.toFixed(2)}`;
    });
    
    return {
      type: 'text',
      content: `Average values:\n${averages.join('\n')}`
    };
  }
  
  private handleCountQuery(query: string): QueryResult {
    const totalRows = this.dataset.rows.length;
    
    // Check for specific conditions
    const conditions = this.extractConditions(query);
    if (conditions.length > 0) {
      const filteredRows = this.applyFilters(conditions);
      return {
        type: 'text',
        content: `Found ${filteredRows.length} rows matching your criteria out of ${totalRows} total rows.`
      };
    }
    
    return {
      type: 'text',
      content: `Total number of records: ${totalRows}`
    };
  }
  
  private handleMaxQuery(query: string): QueryResult {
    const numericColumns = this.dataset.columns.filter(col => col.type === 'number');
    
    const mentionedColumn = numericColumns.find(col => 
      query.toLowerCase().includes(col.name.toLowerCase())
    );
    
    if (mentionedColumn) {
      const values = mentionedColumn.values.map(v => Number(v)).filter(v => !isNaN(v));
      const max = Math.max(...values);
      
      return {
        type: 'text',
        content: `The maximum ${mentionedColumn.name} is ${max}.`
      };
    }
    
    return {
      type: 'text',
      content: 'Please specify which column you want to find the maximum for.'
    };
  }
  
  private handleMinQuery(query: string): QueryResult {
    const numericColumns = this.dataset.columns.filter(col => col.type === 'number');
    
    const mentionedColumn = numericColumns.find(col => 
      query.toLowerCase().includes(col.name.toLowerCase())
    );
    
    if (mentionedColumn) {
      const values = mentionedColumn.values.map(v => Number(v)).filter(v => !isNaN(v));
      const min = Math.min(...values);
      
      return {
        type: 'text',
        content: `The minimum ${mentionedColumn.name} is ${min}.`
      };
    }
    
    return {
      type: 'text',
      content: 'Please specify which column you want to find the minimum for.'
    };
  }
  
  private handleChartQuery(query: string): QueryResult {
    const lowerQuery = query.toLowerCase();
    
    // Determine chart type
    let chartType: 'bar' | 'line' | 'pie' | 'area' = 'bar';
    if (lowerQuery.includes('line')) chartType = 'line';
    else if (lowerQuery.includes('pie')) chartType = 'pie';
    else if (lowerQuery.includes('area')) chartType = 'area';
    
    // Find columns mentioned in query
    const xColumn = this.dataset.columns.find(col => 
      query.toLowerCase().includes(col.name.toLowerCase())
    );
    
    if (!xColumn) {
      // Default: show distribution of first categorical column
      const categoricalCol = this.dataset.columns.find(col => col.type === 'string');
      if (categoricalCol) {
        return this.createDistributionChart(categoricalCol.name, chartType);
      }
    }
    
    if (xColumn && xColumn.type === 'string') {
      return this.createDistributionChart(xColumn.name, chartType);
    }
    
    // For numeric columns, create a histogram-like chart
    if (xColumn && xColumn.type === 'number') {
      return this.createNumericChart(xColumn.name, chartType);
    }
    
    return {
      type: 'text',
      content: 'Unable to determine what to chart. Please specify a column name.'
    };
  }
  
  private handleComparisonQuery(query: string): QueryResult {
    const words = query.toLowerCase().split(' ');
    const byIndex = words.indexOf('by');
    
    if (byIndex === -1) {
      return {
        type: 'text',
        content: 'Please specify what you want to compare and by which column.'
      };
    }
    
    const groupByColumn = this.dataset.columns.find(col => 
      words.slice(byIndex + 1).some(word => col.name.toLowerCase().includes(word))
    );
    
    if (!groupByColumn) {
      return {
        type: 'text',
        content: 'Could not identify the column to group by.'
      };
    }
    
    return this.createGroupedAnalysis(groupByColumn.name);
  }
  
  private handleFilterQuery(query: string): QueryResult {
    const conditions = this.extractConditions(query);
    const filteredRows = this.applyFilters(conditions);
    
    if (filteredRows.length === 0) {
      return {
        type: 'text',
        content: 'No records match your filter criteria.'
      };
    }
    
    // Create a table with the filtered results
    const headers = this.dataset.columns.map(col => col.name);
    const rows = filteredRows.slice(0, 10).map(row => 
      headers.map(header => row[header] || '')
    );
    
    return {
      type: 'table',
      content: `Found ${filteredRows.length} matching records:`,
      table: {
        headers,
        rows,
        title: 'Filtered Results'
      }
    };
  }
  
  private handleSummaryQuery(): QueryResult {
    const summary = this.dataset.columns.map(col => {
      if (col.type === 'number') {
        const values = col.values.map(v => Number(v)).filter(v => !isNaN(v));
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        return `${col.name}: Average ${avg.toFixed(2)}, Range ${min}-${max}`;
      } else {
        const uniqueCount = [...new Set(col.values)].length;
        return `${col.name}: ${uniqueCount} unique values`;
      }
    });
    
    return {
      type: 'text',
      content: `Data Summary for ${this.dataset.fileName}:\n\n${summary.join('\n')}`
    };
  }
  
  private createDistributionChart(columnName: string, chartType: 'bar' | 'line' | 'pie' | 'area'): QueryResult {
    const column = this.dataset.columns.find(col => col.name === columnName);
    if (!column) {
      return {
        type: 'text',
        content: `Column ${columnName} not found.`
      };
    }
    
    // Count occurrences
    const counts: Record<string, number> = {};
    column.values.forEach(value => {
      const key = String(value || 'Unknown');
      counts[key] = (counts[key] || 0) + 1;
    });
    
    const data = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      value: count // for pie charts
    }));
    
    return {
      type: 'chart',
      content: `Distribution of ${columnName}:`,
      chart: {
        type: chartType,
        data,
        xKey: 'name',
        yKey: 'count',
        title: `${columnName} Distribution`
      }
    };
  }
  
  private createNumericChart(columnName: string, chartType: 'bar' | 'line' | 'pie' | 'area'): QueryResult {
    const column = this.dataset.columns.find(col => col.name === columnName);
    if (!column) {
      return {
        type: 'text',
        content: `Column ${columnName} not found.`
      };
    }
    
    const values = column.values.map(v => Number(v)).filter(v => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 10;
    const binSize = (max - min) / binCount;
    
    const bins: Record<string, number> = {};
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      const binStart = min + binIndex * binSize;
      const binEnd = binStart + binSize;
      const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
      bins[binLabel] = (bins[binLabel] || 0) + 1;
    });
    
    const data = Object.entries(bins).map(([range, count]) => ({
      name: range,
      count,
      value: count
    }));
    
    return {
      type: 'chart',
      content: `Distribution of ${columnName}:`,
      chart: {
        type: chartType,
        data,
        xKey: 'name',
        yKey: 'count',
        title: `${columnName} Distribution`
      }
    };
  }
  
  private createGroupedAnalysis(groupByColumn: string): QueryResult {
    const column = this.dataset.columns.find(col => col.name === groupByColumn);
    if (!column) {
      return {
        type: 'text',
        content: `Column ${groupByColumn} not found.`
      };
    }
    
    // Group rows by the specified column
    const groups: Record<string, any[]> = {};
    this.dataset.rows.forEach(row => {
      const key = String(row[groupByColumn] || 'Unknown');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    
    // Find a numeric column to aggregate
    const numericColumn = this.dataset.columns.find(col => 
      col.type === 'number' && col.name !== groupByColumn
    );
    
    if (numericColumn) {
      const data = Object.entries(groups).map(([group, rows]) => {
        const values = rows.map(row => Number(row[numericColumn.name])).filter(v => !isNaN(v));
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return {
          name: group,
          count: rows.length,
          average: avg,
          value: avg
        };
      });
      
      return {
        type: 'chart',
        content: `Analysis by ${groupByColumn}:`,
        chart: {
          type: 'bar',
          data,
          xKey: 'name',
          yKey: 'average',
          title: `Average ${numericColumn.name} by ${groupByColumn}`
        }
      };
    }
    
    // If no numeric column, show counts
    const data = Object.entries(groups).map(([group, rows]) => ({
      name: group,
      count: rows.length,
      value: rows.length
    }));
    
    return {
      type: 'chart',
      content: `Count by ${groupByColumn}:`,
      chart: {
        type: 'bar',
        data,
        xKey: 'name',
        yKey: 'count',
        title: `Count by ${groupByColumn}`
      }
    };
  }
  
  private extractConditions(query: string): Array<{column: string, operator: string, value: any}> {
    // Simple condition extraction - can be enhanced
    const conditions: Array<{column: string, operator: string, value: any}> = [];
    
    // Look for patterns like "age > 30", "status = active", etc.
    const patterns = [
      /(\w+)\s*(>|<|=|>=|<=)\s*(\w+)/g,
      /(\w+)\s+is\s+(\w+)/g,
      /(\w+)\s+equals?\s+(\w+)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(query.toLowerCase())) !== null) {
        const [, column, operator, value] = match;
        
        // Find matching column
        const matchingColumn = this.dataset.columns.find(col => 
          col.name.toLowerCase().includes(column) || column.includes(col.name.toLowerCase())
        );
        
        if (matchingColumn) {
          conditions.push({
            column: matchingColumn.name,
            operator: operator || '=',
            value: matchingColumn.type === 'number' ? Number(value) : value
          });
        }
      }
    });
    
    return conditions;
  }
  
  private applyFilters(conditions: Array<{column: string, operator: string, value: any}>): any[] {
    return this.dataset.rows.filter(row => {
      return conditions.every(condition => {
        const cellValue = row[condition.column];
        const filterValue = condition.value;
        
        switch (condition.operator) {
          case '>':
            return Number(cellValue) > Number(filterValue);
          case '<':
            return Number(cellValue) < Number(filterValue);
          case '>=':
            return Number(cellValue) >= Number(filterValue);
          case '<=':
            return Number(cellValue) <= Number(filterValue);
          case '=':
          default:
            return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
        }
      });
    });
  }
}