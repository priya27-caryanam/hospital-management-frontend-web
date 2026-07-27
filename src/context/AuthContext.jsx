/**
 * Authentication Context
 * Manages user authentication state across the application
 * - Stores JWT token and user info in localStorage
 * - Synchronously restores session on app mount/refresh using lazy initializers
 * - Provides login/logout functions
 */
import { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

/** Helper to decode JWT payload without external library */
function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
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
  if (!token) return true;
  const decoded = decodeToken(token);
  // If token cannot be decoded as standard JWT, treat as valid token string
  if (!decoded) return false;
  // If JWT contains an explicit exp claim, check expiration time
  if (decoded.exp && typeof decoded.exp === 'number') {
    return decoded.exp * 1000 < Date.now();
  }
  return false;
}

export function AuthProvider({ children }) {
  // Lazy state initializers for synchronous session restoration on initial render
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    return storedToken && !isTokenExpired(storedToken) ? storedToken : null;
  });

  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && !isTokenExpired(storedToken) && storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Clean up invalid or expired localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && isTokenExpired(storedToken)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * Login — calls backend login API and stores session
   * @returns {string} The user's role for navigation
   */
  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const data = response.data;

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
