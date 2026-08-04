/**
 * ExcelUploadModal.jsx
 * Reusable Drag & Drop Excel File Import Component for Admin Panel
 * Supports .xlsx and .xls files with upload progress, validation, and toast feedback
 */
import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axios';

export default function ExcelUploadModal({
  isOpen,
  onClose,
  uploadUrl,
  apiMethod,
  buttonText = 'Import Excel',
  title = 'Import Data via Excel',
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validExtensions = ['.xlsx', '.xls'];
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  const validateFile = (file) => {
    if (!file) return false;
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt && !validMimeTypes.includes(file.type)) {
      toast.error('Invalid file type! Please select an Excel file (.xlsx or .xls)');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (apiMethod) {
        await apiMethod(selectedFile);
      } else if (uploadUrl) {
        await axiosInstance.post(uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success(
        title.toLowerCase().includes('department')
          ? 'Departments imported successfully.'
          : title.toLowerCase().includes('specialization')
          ? 'Specializations imported successfully.'
          : 'Excel file imported successfully!'
      );

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Excel upload error:', err);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.response?.data || err.message;

      if (status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (status === 403) {
        toast.error('Forbidden: You do not have permission to import Excel files.');
      } else if (status === 404) {
        toast.error('Import endpoint not found.');
      } else if (status === 409) {
        toast.error(`Duplicate Entry Conflict: ${message}`);
      } else if (status === 500) {
        toast.error('Server error while processing Excel file. Please verify file format.');
      } else {
        toast.error(message || 'Failed to import Excel file. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Upload .xlsx or .xls file to bulk import records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
              : selectedFile
              ? 'border-emerald-300 bg-emerald-50/40'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/60 hover:border-blue-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {!selectedFile ? (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Click to browse or drag & drop file here
                </p>
                <p className="text-xs text-slate-500 mt-1">Supports Microsoft Excel format (.xlsx, .xls)</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full p-3 rounded-xl bg-white border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600 shrink-0" />
                <div className="text-left truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for import
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFile();
                }}
                disabled={uploading}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
                title="Remove File"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
