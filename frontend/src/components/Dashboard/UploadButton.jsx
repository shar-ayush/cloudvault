// frontend/src/components/Dashboard/UploadButton.jsx
// Drag-and-drop file upload with progress bar

import React, { useState, useRef, useCallback } from 'react';
import { uploadFile } from '../../services/api';
import { Upload, CheckCircle, XCircle, FileIcon } from 'lucide-react';

export default function UploadButton({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const resetState = useCallback(() => {
    setFile(null);
    setProgress(0);
    setStatus('idle');
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  function handleFileSelect(e) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStatus('idle');
      setErrorMsg('');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setStatus('idle');
      setErrorMsg('');
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadFile(formData, (event) => {
        const pct = Math.round((event.loaded * 100) / event.total);
        setProgress(pct);
      });

      setStatus('success');
      console.log(`[Upload] Success: ${file.name}`);

      // Notify parent to refresh file list
      if (onUploadSuccess) onUploadSuccess();

      // Reset after a short delay
      setTimeout(() => resetState(), 2500);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || 'Upload failed');
      console.error('[Upload] Failed:', err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-600" />
        Upload File
      </h3>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileIcon className="w-8 h-8 text-blue-500" />
            <div className="text-left">
              <p className="font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
            </div>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Drag & drop a file here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {status === 'uploading' && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="mt-4 flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Upload successful!</span>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="mt-4 flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Upload button */}
      {file && status !== 'uploading' && status !== 'success' && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          Upload File
        </button>
      )}
    </div>
  );
}
