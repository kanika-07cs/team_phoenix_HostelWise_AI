import React, { createContext, useState, useEffect, useContext } from 'react';
import { api, setAuthHeader } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Auto-login on mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthHeader(token);
        try {
          // Fetch real user details from backend
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.warn('Backend connection failed. Checking for demo sessions.', error);
          // If token matches demo, restore demo user
          const cachedUser = localStorage.getItem('demo_user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
            setDemoMode(true);
          } else {
            localStorage.removeItem('token');
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // 1. Prepare form data for OAuth2 compliance
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setAuthHeader(access_token);

      // Fetch user profile info
      const profileResponse = await api.get('/users/me');
      setUser(profileResponse.data);
      setDemoMode(false);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.warn('Backend login failed. Retrying with demo fallback credentials.', error);
      
      // Fallback Demo Login for Hackathon presentations
      if (
        (username === 'admin' && password === 'admin123') || 
        (username === 'supervisor' && password === 'supervisor123')
      ) {
        const isSuper = username === 'admin';
        const mockUser = {
          id: isSuper ? 1 : 2,
          username: username,
          email: isSuper ? 'admin@hostelwise.ai' : 'supervisor@hostelwise.ai',
          full_name: isSuper ? 'System Administrator' : 'Hostel A Supervisor',
          role_id: isSuper ? 1 : 2,
          role_name: isSuper ? 'super_admin' : 'supervisor',
          assigned_hostel_id: isSuper ? null : 1,
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        localStorage.setItem('token', 'demo-token-1337');
        localStorage.setItem('demo_user', JSON.stringify(mockUser));
        setUser(mockUser);
        setDemoMode(true);
        setLoading(false);
        return { success: true };
      }
      
      setLoading(false);
      let errorMsg = 'Invalid username or password';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errorMsg = JSON.stringify(error.response.data.detail);
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('demo_user');
    setAuthHeader(null);
    setUser(null);
    setDemoMode(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, demoMode, setDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
