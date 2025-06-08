import React from 'react';
import { TableData } from '../types';

interface TableDisplayProps {
  table: TableData;
}

export const TableDisplay: React.FC<TableDisplayProps> = ({ table }) => {
  const { headers, rows, title } = table;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                  >
                    {cell !== null && cell !== undefined ? String(cell) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {rows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No data to display
        </div>
      )}
    </div>
  );
};