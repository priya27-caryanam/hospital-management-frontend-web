/**
 * ExcelUpload.jsx
 * Reusable Excel Upload Button & Inline Drag-and-Drop Uploader
 * Matches prompt specification #4:
 * Props: uploadUrl, buttonText, onSuccess
 */
import { useState, useRef } from 'react';
import { FileSpreadsheet, UploadCloud, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axios';

export default function ExcelUpload({ uploadUrl, buttonText = 'Import Excel', onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

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
      toast.error('Invalid file type! Only .xlsx and .xls files are supported.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file');
      return;
    }

    setUploading(true);
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      await axiosInstance.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      const isDept = uploadUrl?.includes('department');
      toast.success(
        isDept ? 'Departments imported successfully.' : 'Specializations imported successfully.'
      );

      // Clear selected file after upload
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Upload Error:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data || err.message;

      if (status === 401) {
        toast.error('Unauthorized (401): Please login again.');
      } else if (status === 403) {
        toast.error('Forbidden (403): You do not have permission to import.');
      } else if (status === 404) {
        toast.error('API Endpoint not found (404).');
      } else if (status === 409) {
        toast.error(`Duplicate Entry Conflict (409): ${msg}`);
      } else if (status === 500) {
        toast.error('Server Error (500): Check Excel column names and format.');
      } else {
        toast.error(msg || 'Failed to upload Excel file.');
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {!selectedFile ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>{buttonText}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="max-w-[150px] truncate" title={selectedFile.name}>
            {selectedFile.name}
          </span>

          {uploading ? (
            <div className="flex items-center gap-1.5 pl-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
              <span>{progress}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUpload}
                className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Upload Now
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
