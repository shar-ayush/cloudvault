// frontend/src/context/AuthContext.jsx
// Authentication context using AWS Amplify Auth (Cognito)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signIn, signUp, signOut, confirmSignUp, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authenticated session on mount
  useEffect(() => {
    checkCurrentUser();
  }, []);

  async function checkCurrentUser() {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Sign in with email and password.
   */
  async function login(email, password) {
    try {
      const result = await signIn({ username: email, password });
      const user = await getCurrentUser();
      setCurrentUser(user);
      return result;
    } catch (err) {
      console.error('[Auth] Login failed:', err.message);
      throw err;
    }
  }

  /**
   * Register a new user with email and password.
   * Cognito may require email verification depending on pool config.
   */
  async function register(email, password) {
    try {
      const result = await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      return result;
    } catch (err) {
      console.error('[Auth] Registration failed:', err.message);
      throw err;
    }
  }

  /**
   * Confirm registration with verification code sent to email.
   */
  async function confirmRegistration(email, code) {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (err) {
      console.error('[Auth] Confirmation failed:', err.message);
      throw err;
    }
  }

  /**
   * Sign out the current user.
   */
  async function logout() {
    try {
      await signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('[Auth] Logout failed:', err.message);
      throw err;
    }
  }

  /**
   * Get the current JWT access token.
   */
  const getToken = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString();
    } catch (err) {
      console.error('[Auth] getToken failed:', err.message);
      throw err;
    }
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    register,
    confirmRegistration,
    logout,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook for consuming auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
