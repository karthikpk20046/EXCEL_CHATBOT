export interface DataColumn {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date';
  values: any[];
}

export interface DataSet {
  columns: DataColumn[];
  rows: Record<string, any>[];
  fileName: string;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chart?: ChartData;
  table?: TableData;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
}

export interface TableData {
  headers: string[];
  rows: any[][];
  title: string;
}

export interface QueryResult {
  type: 'text' | 'chart' | 'table';
  content: string;
  chart?: ChartData;
  table?: TableData;
}