// frontend/src/services/api.js
// Axios instance with Cognito JWT interceptor + API functions

import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor — attach Bearer token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn('[API] Could not attach auth token:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const msg = error.response.data?.error || error.message;
      console.error(`[API] ${error.response.status}: ${msg}`);
    } else {
      console.error('[API] Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ───────────────────── API Functions ─────────────────────

export async function uploadFile(formData, onUploadProgress) {
  const response = await api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
}

export async function listFiles() {
  const response = await api.get('/api/files/list');
  return response.data;
}

export async function downloadFile(fileName, versionId = null) {
  const params = versionId ? { versionId } : {};
  const response = await api.get(`/api/files/download/${encodeURIComponent(fileName)}`, {
    params,
  });
  return response.data;
}

export async function deleteFile(fileName) {
  const response = await api.delete(`/api/files/delete/${encodeURIComponent(fileName)}`);
  return response.data;
}

export async function listVersions(fileName) {
  const response = await api.get(`/api/files/versions/${encodeURIComponent(fileName)}`);
  return response.data;
}

export async function restoreVersion(fileName, versionId) {
  const response = await api.post(
    `/api/files/restore/${encodeURIComponent(fileName)}/${encodeURIComponent(versionId)}`
  );
  return response.data;
}

export default api;
