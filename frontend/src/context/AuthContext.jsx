import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext({ user: null, isAuthenticated: false, isLoading: true, login: async () => {}, register: async () => {}, logout: async () => {}, refreshUser: async () => {}, updateUser: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      setUser(res?.data || null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res?.data?.user) { setUser(res.data.user); return res.data.user; }
      throw new Error('Invalid login response');
    } finally { setIsLoading(false); }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await api.register(userData);
      if (res?.data?.user) {
        if (userData.role === 'admin' && !res.data.user.is_verified) return res.data.user;
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error('Invalid registration response');
    } finally { setIsLoading(false); }
  };

  const logout = async () => {
    setIsLoading(true);
    try { await api.logout(); setUser(null); } finally { setIsLoading(false); }
  };

  const forgotPassword = async (email) => {
    return await api.forgotPassword(email);
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    return await api.resetPassword({ email, otp, newPassword });
  };

  const updateUser = (upd) => setUser(p => (p ? { ...p, ...upd } : upd));

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      refreshUser,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
