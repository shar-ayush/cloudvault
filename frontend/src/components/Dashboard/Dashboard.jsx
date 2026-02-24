// frontend/src/components/Dashboard/Dashboard.jsx
// Main dashboard: upload area, file table, stats, version modal

import React, { useState, useEffect, useCallback } from 'react';
import { listFiles } from '../../services/api';
import Navbar from '../Layout/Navbar';
import UploadButton from './UploadButton';
import FileTable from './FileTable';
import VersionsModal from './VersionsModal';
import { RefreshCw, HardDrive, FileIcon, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Version modal state
  const [versionsFile, setVersionsFile] = useState(null);
  const [versionsOpen, setVersionsOpen] = useState(false);

  const fetchFiles = useCallback(async () => {
    setError('');
    try {
      const data = await listFiles();
      setFiles(data.files || []);
    } catch (err) {
      console.error('[Dashboard] Failed to fetch files:', err);
      setError(err.response?.data?.error || 'Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  function handleRefresh() {
    setRefreshing(true);
    fetchFiles();
  }

  function handleUploadSuccess() {
    fetchFiles();
  }

  function handleViewVersions(fileName) {
    setVersionsFile(fileName);
    setVersionsOpen(true);
  }

  function handleCloseVersions() {
    setVersionsOpen(false);
    setVersionsFile(null);
  }

  function handleVersionRestore() {
    fetchFiles(); // Refresh file list after restore
  }

  // Compute stats
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  function formatTotalSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Files</p>
              <p className="text-xl font-bold text-gray-800">{totalFiles}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <HardDrive className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Storage Used</p>
              <p className="text-xl font-bold text-gray-800">{formatTotalSize(totalSize)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-center">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Files
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Upload */}
        <UploadButton onUploadSuccess={handleUploadSuccess} />

        {/* File list */}
        <FileTable
          files={files}
          loading={loading}
          onDelete={() => {}}
          onViewVersions={handleViewVersions}
          onRefresh={handleRefresh}
        />
      </main>

      {/* Version history modal */}
      <VersionsModal
        fileName={versionsFile}
        isOpen={versionsOpen}
        onClose={handleCloseVersions}
        onRestore={handleVersionRestore}
      />
    </div>
  );
}
