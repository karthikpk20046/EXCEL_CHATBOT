import * as XLSX from 'xlsx';
import { DataSet, DataColumn } from '../types';

export class ExcelProcessor {
  static async processFile(file: File): Promise<DataSet> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            throw new Error('Empty Excel file');
          }
          
          // Extract headers and data
          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1);
          
          // Process columns and infer types
          const columns = this.inferColumnTypes(headers, dataRows);
          
          // Create structured rows
          const rows = dataRows.map(row => {
            const rowObj: Record<string, any> = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index] || null;
            });
            return rowObj;
          });
          
          resolve({
            columns,
            rows,
            fileName: file.name
          });
        } catch (error) {
          reject(new Error(`Failed to process Excel file: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  private static inferColumnTypes(headers: string[], rows: any[][]): DataColumn[] {
    return headers.map((header, colIndex) => {
      const values = rows.map(row => row[colIndex]).filter(val => val != null);
      const type = this.inferType(values);
      
      return {
        name: header,
        type,
        values
      };
    });
  }
  
  private static inferType(values: any[]): 'number' | 'string' | 'boolean' | 'date' {
    if (values.length === 0) return 'string';
    
    // Check for numbers
    const numericValues = values.filter(val => !isNaN(Number(val)) && val !== '');
    if (numericValues.length > values.length * 0.8) {
      return 'number';
    }
    
    // Check for booleans
    const booleanValues = values.filter(val => 
      typeof val === 'boolean' || 
      (typeof val === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(val.toLowerCase()))
    );
    if (booleanValues.length > values.length * 0.8) {
      return 'boolean';
    }
    
    // Check for dates
    const dateValues = values.filter(val => !isNaN(Date.parse(val)));
    if (dateValues.length > values.length * 0.8) {
      return 'date';
    }
    
    return 'string';
  }
  
  static getDataSummary(dataset: DataSet): string {
    const { columns, rows } = dataset;
    const numRows = rows.length;
    const numCols = columns.length;
    
    const columnSummary = columns.map(col => {
      const type = col.type;
      const name = col.name;
      
      if (type === 'number') {
        const numValues = col.values.map(v => Number(v)).filter(v => !isNaN(v));
        const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length;
        const min = Math.min(...numValues);
        const max = Math.max(...numValues);
        return `${name} (${type}): avg=${avg.toFixed(2)}, min=${min}, max=${max}`;
      } else {
        const uniqueValues = [...new Set(col.values)].length;
        return `${name} (${type}): ${uniqueValues} unique values`;
      }
    }).join('\n');
    
    return `Dataset Summary:
- Rows: ${numRows}
- Columns: ${numCols}
- Column Details:
${columnSummary}`;
  }
}