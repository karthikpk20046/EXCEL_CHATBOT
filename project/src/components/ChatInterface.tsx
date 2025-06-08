import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, FileText } from 'lucide-react';
import { Message, DataSet } from '../types';
import { QueryProcessor } from '../utils/queryProcessor';
import { ChartDisplay } from './ChartDisplay';
import { TableDisplay } from './TableDisplay';

interface ChatInterfaceProps {
  dataset: DataSet;
  onReset: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ dataset, onReset }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I've analyzed your Excel file "${dataset.fileName}". I found ${dataset.rows.length} rows and ${dataset.columns.length} columns. You can ask me questions about your data in natural language. For example:

• "What is the average income?"
• "How many customers are under 30?"
• "Show a bar chart of sales by region"
• "Compare revenue by department"

What would you like to know about your data?`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryProcessor = useRef(new QueryProcessor(dataset));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await queryProcessor.current.processQuery(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.content,
        timestamp: new Date(),
        chart: result.chart,
        table: result.table
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your query. Please try rephrasing your question or ask about a different aspect of your data.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{dataset.fileName}</h2>
              <p className="text-sm text-gray-500">{dataset.rows.length} rows, {dataset.columns.length} columns</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Upload New File
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-4xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className={`max-w-3xl ${message.type === 'user' ? 'mr-3' : 'ml-3'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                
                {message.chart && (
                  <div className="mt-3">
                    <ChartDisplay chart={message.chart} />
                  </div>
                )}
                
                {message.table && (
                  <div className="mt-3">
                    <TableDisplay table={message.table} />
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-right text-gray-400' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about your data..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Try asking: "Show me a chart", "What's the average?", "How many records?", "Compare by category"
        </div>
      </div>
    </div>
  );
};