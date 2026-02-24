// frontend/src/components/Dashboard/FileTable.jsx
// Table listing user files with download, versions, and delete actions

import React, { useState } from 'react';
import { downloadFile, deleteFile } from '../../services/api';
import { Download, History, Trash2, FileIcon, Loader2 } from 'lucide-react';

export default function FileTable({ files, loading, onDelete, onViewVersions, onRefresh }) {
  const [deletingFile, setDeletingFile] = useState(null);

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleDownload(fileName) {
    try {
      const data = await downloadFile(fileName);
      // The pre-signed URL already has Content-Disposition: attachment set server-side
      const anchor = document.createElement('a');
      anchor.href = data.url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      console.error('[FileTable] Download failed:', err);
      alert('Failed to generate download link');
    }
  }

  async function handleDelete(fileName) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingFile(fileName);
    try {
      await deleteFile(fileName);
      console.log(`[FileTable] Deleted ${fileName}`);
      if (onDelete) onDelete(fileName);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('[FileTable] Delete failed:', err);
      alert(err.response?.data?.error || 'Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!files || files.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <FileIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No files yet</h3>
        <p className="text-gray-400">Upload your first file using the upload area above</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500 uppercase text-xs tracking-wider">
              <th className="px-6 py-4 font-semibold">File Name</th>
              <th className="px-6 py-4 font-semibold">Size</th>
              <th className="px-6 py-4 font-semibold">Last Modified</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {files.map((file) => (
              <tr key={file.name} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800 truncate max-w-xs">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{formatSize(file.size)}</td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(file.lastModified || file.uploadedAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {/* Download */}
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Versions */}
                    <button
                      onClick={() => onViewVersions && onViewVersions(file.name)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Versions"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(file.name)}
                      disabled={deletingFile === file.name}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingFile === file.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
