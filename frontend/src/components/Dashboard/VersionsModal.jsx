// frontend/src/components/Dashboard/VersionsModal.jsx
// Modal showing file version history with download/restore actions

import React, { useState, useEffect } from 'react';
import { listVersions, downloadFile, restoreVersion } from '../../services/api';
import { X, Download, RotateCcw, Loader2, CheckCircle, Clock } from 'lucide-react';

export default function VersionsModal({ fileName, isOpen, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && fileName) {
      fetchVersions();
    }
    return () => {
      setVersions([]);
      setError('');
      setSuccessMsg('');
    };
  }, [isOpen, fileName]);

  async function fetchVersions() {
    setLoading(true);
    setError('');
    try {
      const data = await listVersions(fileName);
      setVersions(data.versions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(versionId) {
    try {
      const data = await downloadFile(fileName, versionId);
      // The pre-signed URL already has Content-Disposition: attachment set server-side
      const anchor = document.createElement('a');
      anchor.href = data.url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      setError('Failed to generate download link');
    }
  }

  async function handleRestore(versionId, label) {
    const confirmed = window.confirm(
      `Restore ${fileName} to ${label}? This will create a new version from ${label}.`
    );
    if (!confirmed) return;

    setRestoringId(versionId);
    setError('');
    setSuccessMsg('');

    try {
      await restoreVersion(fileName, versionId);
      setSuccessMsg(`Successfully restored to ${label}! A new version has been created.`);
      console.log(`[Versions] Restored ${fileName} to ${label}`);
      await fetchVersions(); // Refresh version list
      if (onRestore) onRestore();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Version History</h3>
            <p className="text-sm text-gray-500 mt-0.5">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {/* Success */}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No versions found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Version</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {versions.map((v) => (
                  <tr key={v.versionId} className="hover:bg-gray-50">
                    <td className="py-3">
                      <span className="font-medium text-gray-800">{v.label}</span>
                      {v.isLatest && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Latest
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-gray-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(v.lastModified)}
                    </td>
                    <td className="py-3 text-gray-600">{formatSize(v.size)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(v.versionId)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Download this version"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRestore(v.versionId, v.label)}
                          disabled={v.isLatest || restoringId === v.versionId}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title={v.isLatest ? 'Already the latest version' : 'Restore this version'}
                        >
                          {restoringId === v.versionId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
