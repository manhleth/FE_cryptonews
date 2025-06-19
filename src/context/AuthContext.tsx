"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  userId: number;
  username: string;
  email: string;
  fullname: string;
  phonenumber: string;
  birthday?: string;
  avatar?: string;
  roleId: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>; // ✅ Thêm refreshUser function
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Analytics tracking function
const trackActivity = async (activityType: string, token?: string) => {
  try {
    if (!token) return;
    
    await fetch('http://localhost:5000/api/Analytics/TrackActivity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        activityType: activityType
      })
    });
  } catch (error) {
    console.warn('Failed to track activity:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (newToken: string, userData: User) => {
    try {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);

      // Track login activity
      await trackActivity('LOGIN', newToken);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // ✅ Thêm refreshUser function
  const refreshUser = async () => {
    try {
      if (!token) {
        console.warn('No token available for refreshing user');
        return;
      }

      const response = await fetch('http://localhost:5000/api/User/GetUserInfor', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.statusCode === 1 && data.data) {
        const updatedUser = data.data;
        
        // Cập nhật state
        setUser(updatedUser);
        
        // Cập nhật localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        console.log('User data refreshed successfully');
      } else {
        throw new Error(data.message || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      
      // Nếu token không hợp lệ, logout user
      if (error instanceof Error && error.message.includes('401')) {
        console.warn('Token expired, logging out user');
        logout();
      }
      
      // Throw error để component có thể handle
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    refreshUser, // ✅ Export refreshUser
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};