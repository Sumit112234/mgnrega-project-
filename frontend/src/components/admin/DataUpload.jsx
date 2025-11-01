import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, XCircle, FileText } from 'lucide-react';
import api from '../../services/api';

const DataUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);
    try {
      const response = await api.uploadData(file);
      setResult({ 
        success: true, 
        message: 'Upload successful!', 
        data: response 
      });
      setFile(null);
      document.getElementById('file-upload').value = '';
    } catch (error) {
      setResult({ 
        success: false, 
        message: error.message || 'Upload failed' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:border-blue-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="mx-auto text-gray-400 mb-4" size={48} />
        <input
          type="file"
          onChange={handleFileChange}
          accept=".csv,.xlsx,.json"
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
        >
          Click to upload or drag and drop
        </label>
        <p className="text-sm text-gray-500 mt-2">
          CSV, XLSX, or JSON files
        </p>
        
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-2 text-gray-700"
          >
            <FileText size={20} />
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-gray-500">
              ({(file.size / 1024).toFixed(2)} KB)
            </span>
          </motion.div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {uploading ? 'Uploading...' : 'Upload Data'}
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {result.success ? <CheckCircle size={20} className="flex-shrink-0 mt-0.5" /> : <XCircle size={20} className="flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="font-medium">{result.message}</p>
            {result.data && (
              <p className="text-sm mt-1 opacity-80">
                {JSON.stringify(result.data).substring(0, 100)}...
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DataUpload;
