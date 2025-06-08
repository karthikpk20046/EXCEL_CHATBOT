import React, { useState } from 'react';
import { Brain, Sparkles, BarChart3 } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ChatInterface } from './components/ChatInterface';
import { ExcelProcessor } from './utils/excelProcessor';
import { DataSet } from './types';

function App() {
  const [dataset, setDataset] = useState<DataSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const processedData = await ExcelProcessor.processFile(file);
      setDataset(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDataset(null);
    setError(null);
  };

  if (dataset) {
    return (
      <div className="h-screen">
        <ChatInterface dataset={dataset} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="text-center pt-16 pb-12">
        <div className="inline-flex items-center space-x-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ExcelChat AI
            </h1>
            <p className="text-gray-600 text-lg">Natural Language Excel Insights</p>
          </div>
        </div>
        
        <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Transform your Excel data into actionable insights through natural language conversations. 
          Upload your spreadsheet and start asking questions in plain English.
        </p>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Analysis</h3>
            <p className="text-gray-600 text-sm">
              Automatically understand your data structure and provide intelligent insights
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Natural Language</h3>
            <p className="text-gray-600 text-sm">
              Ask questions in plain English - no complex formulas or queries needed
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Insights</h3>
            <p className="text-gray-600 text-sm">
              Generate beautiful charts and tables automatically based on your queries
            </p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-600 text-sm mt-1">
              Please check your file format and try again.
            </p>
          </div>
        )}
      </div>

      {/* Example Queries */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Example Questions You Can Ask
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                📊 Statistical Analysis
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>"What is the average income?"</li>
                <li>"Show me the maximum sales value"</li>
                <li>"What's the total revenue?"</li>
                <li>"Calculate the median age"</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                🔍 Filtering & Counting
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>"How many customers are under 30?"</li>
                <li>"Count active users"</li>
                <li>"Show records where status is complete"</li>
                <li>"Filter by high priority items"</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                📈 Visualizations
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>"Show a bar chart of sales by region"</li>
                <li>"Create a pie chart of categories"</li>
                <li>"Plot revenue over time"</li>
                <li>"Display age distribution"</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                🔄 Comparisons
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>"Compare performance by department"</li>
                <li>"Show average salary by gender"</li>
                <li>"Group expenses by category"</li>
                <li>"Analyze trends by month"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>Upload your Excel file to get started with AI-powered data analysis</p>
      </footer>
    </div>
  );
}

export default App;