// frontend/src/components/Layout/Navbar.jsx
// Top navigation bar with brand, user info, and sign-out

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Cloud, LogOut } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  const userEmail =
    currentUser?.attributes?.email ||
    currentUser?.username ||
    'User';

  return (
    <nav className="bg-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Cloud className="w-7 h-7 text-blue-200" />
            <span className="text-xl font-bold text-white tracking-tight">
              CloudVault <span className="text-blue-200">☁</span>
            </span>
          </div>

          {/* User info + Sign Out */}
          <div className="flex items-center gap-4">
            <span className="text-blue-100 text-sm hidden sm:inline-block">
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white text-sm rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
