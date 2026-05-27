import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const register = async (phone, password, confirmPassword, inviteCode) => {
    const response = await axios.post(`${API}/auth/register`, {
      phone,
      password,
      confirm_password: confirmPassword,
      invite_code: inviteCode || null
    });
    setUser(response.data);
    return response.data;
  };

  const login = async (phone, password) => {
    const response = await axios.post(`${API}/auth/login`, { phone, password });
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (e) {
      // Silent error
    }
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (e) {
      // Silent
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
