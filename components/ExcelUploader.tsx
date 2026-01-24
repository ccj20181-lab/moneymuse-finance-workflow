import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { parseExcelFile, isValidExcelFile, ParseResult } from '../lib/excel';

interface ExcelUploaderProps {
  onUploadComplete: (result: ParseResult) => void;
  isLoading?: boolean;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onUploadComplete, isLoading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!isValidExcelFile(file)) {
      setParseResult({
        success: false,
        notes: [],
        errors: ['请上传有效的 Excel 文件 (.xlsx, .xls, .csv)'],
        totalRows: 0,
        parsedRows: 0,
      });
      return;
    }

    setFileName(file.name);
    setParsing(true);
    setParseResult(null);

    try {
      const result = await parseExcelFile(file);
      setParseResult(result);

      if (result.success) {
        onUploadComplete(result);
      }
    } catch (err) {
      setParseResult({
        success: false,
        notes: [],
        errors: ['文件解析失败，请检查文件格式'],
        totalRows: 0,
        parsedRows: 0,
      });
    } finally {
      setParsing(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearResult = () => {
    setParseResult(null);
    setFileName('');
  };

  const isProcessing = parsing || isLoading;

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-gray-200 bg-gray-50/50 hover:border-brand-300 hover:bg-brand-50/30'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-gray-600 font-medium">正在解析文件...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDragging ? 'bg-brand-100' : 'bg-gray-100'}`}>
              <Upload className={`w-7 h-7 ${isDragging ? 'text-brand-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-gray-700 font-bold mb-1">拖拽 Excel 文件到此处</p>
              <p className="text-gray-400 text-sm">或点击选择文件 • 支持 .xlsx, .xls, .csv</p>
            </div>
          </div>
        )}
      </div>

      {/* Parse Result */}
      {parseResult && (
        <div className={`mt-4 p-4 rounded-xl border ${parseResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {parseResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{fileName}</span>
                </div>
                {parseResult.success ? (
                  <p className="text-green-700 text-sm">
                    成功解析 <span className="font-bold">{parseResult.parsedRows}</span> 条笔记
                    {parseResult.totalRows !== parseResult.parsedRows && (
                      <span className="text-gray-500 ml-1">（共 {parseResult.totalRows} 行）</span>
                    )}
                  </p>
                ) : (
                  <p className="text-red-700 text-sm">解析失败</p>
                )}

                {parseResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {parseResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-gray-400">•</span>
                        {err}
                      </li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li className="text-xs text-gray-400">...还有 {parseResult.errors.length - 5} 条警告</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={clearResult}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;
