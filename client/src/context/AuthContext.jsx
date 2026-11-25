import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jeevansync_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('jeevansync_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.success) {
            setUser(res.data);
          }
        } catch {
          localStorage.removeItem('jeevansync_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.success) {
      setUser(res.data.user);
      setToken(res.data.accessToken);
      localStorage.setItem('jeevansync_token', res.data.accessToken);
      return res.data;
    }
    throw new Error(res.error?.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.success) {
      setUser(res.data.user);
      setToken(res.data.accessToken);
      localStorage.setItem('jeevansync_token', res.data.accessToken);
      return res.data;
    }
    throw new Error(res.error?.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout api errors
    } finally {
      localStorage.removeItem('jeevansync_token');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
