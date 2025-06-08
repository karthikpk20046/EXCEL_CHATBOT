import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-blue-400 hover:bg-gray-50' : ''}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isDragReject ? (
            <AlertCircle className="w-12 h-12 text-red-400" />
          ) : (
            <div className="relative">
              <FileSpreadsheet className="w-12 h-12 text-gray-400" />
              <Upload className="w-6 h-6 text-blue-500 absolute -top-1 -right-1" />
            </div>
          )}
          
          <div className="space-y-2">
            {isDragReject ? (
              <p className="text-red-600 font-medium">
                Please upload a valid Excel file (.xlsx or .xls)
              </p>
            ) : isDragActive ? (
              <p className="text-blue-600 font-medium">
                Drop your Excel file here...
              </p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  {isLoading ? 'Processing your file...' : 'Upload your Excel file'}
                </p>
                <p className="text-gray-500 text-sm">
                  Drag and drop your .xlsx file here, or click to browse
                </p>
              </>
            )}
          </div>
          
          {!isDragActive && !isLoading && (
            <button
              type="button"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Choose File
            </button>
          )}
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-600 font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Supports Excel files up to 500 rows and 20 columns</p>
        <p>File size limit: 10MB</p>
      </div>
    </div>
  );
};