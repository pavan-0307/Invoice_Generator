import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'Light';
  });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const activeTheme = user?.settings?.theme || theme;
    
    const applyTheme = () => {
      let isDark = false;
      if (activeTheme === 'Dark') {
        isDark = true;
      } else if (activeTheme === 'Light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setDarkMode(isDark);
    };

    applyTheme();
    localStorage.setItem('theme', activeTheme);

    if (activeTheme === 'System') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          setDarkMode(true);
        } else {
          document.documentElement.classList.remove('dark');
          setDarkMode(false);
        }
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [user?.settings?.theme, theme]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/me');
      if (response.data.success) {
        setUser(response.data.user);
        if (response.data.user.settings?.theme) {
          setTheme(response.data.user.settings.theme);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.success) {
        setUser(response.data.user);
        if (response.data.user.settings?.theme) {
          setTheme(response.data.user.settings.theme);
        }
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check backend status.'
      };
    }
  };

  const registerUser = async (business_name, owner_name, email, password) => {
    try {
      const response = await api.post('/register', {
        business_name,
        owner_name,
        email,
        password
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (user) {
      try {
        await api.put('/settings/theme', { theme: newTheme });
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            settings: { ...prev.settings, theme: newTheme }
          };
        });
      } catch (err) {
        console.error('Failed to sync theme to server:', err);
      }
    }
  };

  const toggleDarkMode = () => {
    const activeTheme = user?.settings?.theme || theme;
    const nextTheme = activeTheme === 'Dark' ? 'Light' : 'Dark';
    updateTheme(nextTheme);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register: registerUser, logout, darkMode, theme, updateTheme, toggleDarkMode, checkAuth, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
