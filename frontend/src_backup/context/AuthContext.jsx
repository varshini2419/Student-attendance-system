import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Verify token and fetch current profile
          const response = await API.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const seedDefaultUsers = async () => {
    try {
      const response = await API.post('/auth/seed');
      return response.data;
    } catch (err) {
      console.error('User seeding failed:', err);
      return { success: false, message: err.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout: handleLogout,
    seedDefaultUsers,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty' || user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
