/**
 * Authentication Context
 * Manages user authentication state across the application
 * - Stores JWT token and user info in localStorage
 * - Provides login/logout functions
 * - Checks token validity on app mount
 */
import { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

/** Helper to decode JWT payload without a library */
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/** Check if a JWT token is expired */
function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check localStorage for existing auth data
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && !isTokenExpired(storedToken) && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      // Clear expired/invalid data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  /**
   * Login — calls the backend login API
   * @returns {string} The user's role for navigation
   */
  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const data = response.data;

    // Store auth data
    const userData = {
      userId: data.userId,
      email: data.email,
      name: data.name,
      role: data.role,
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(data.token);
    setUser(userData);

    return data.role;
  };

  /** Logout — clears all auth data */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  /** Get the role-based dashboard path */
  const getDashboardPath = () => {
    if (!user) return '/login';
    const rolePaths = {
      ADMIN: '/admin/dashboard',
      DOCTOR: '/doctor/dashboard',
      NURSE: '/nurse/dashboard',
      RECEPTIONIST: '/receptionist/dashboard',
      PATIENT: '/patient/dashboard',
      LAB_TECHNICIAN: '/lab/dashboard',
      PHARMACIST: '/pharmacist/dashboard',
    };
    return rolePaths[user.role] || '/login';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !isTokenExpired(token),
    role: user?.role || null,
    login,
    logout,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Custom hook to access auth context */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
