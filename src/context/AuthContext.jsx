/**
 * Authentication Context
 * Manages user authentication state across the application
 * - Stores JWT token and user info in localStorage & sessionStorage
 * - Synchronously restores session on app mount/refresh
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
  if (!decoded) return false;
  if (decoded.exp && typeof decoded.exp === 'number') {
    return decoded.exp * 1000 < Date.now();
  }
  return false;
}

/** Helper to get stored token from tab-isolated sessionStorage or fallback localStorage */
function getStoredToken() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return token && token !== 'undefined' && token !== 'null' && !isTokenExpired(token) ? token : null;
}

/** Helper to get stored user from tab-isolated sessionStorage or fallback localStorage */
function getStoredUser() {
  const validToken = getStoredToken();
  if (!validToken) return null;
  const rawUser = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  // Clean up invalid or expired session tokens on mount
  useEffect(() => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * Login — calls backend login API and stores tab-isolated session
   * Accepts username (Email or Mobile Number) and password
   */
  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    const resData = response.data;

    // Support both direct response objects and wrapper objects
    const data = resData?.data || resData;

    const tokenStr =
      data.token ||
      data.jwt ||
      data.jwtToken ||
      data.accessToken ||
      resData.token ||
      resData.jwt ||
      resData.jwtToken ||
      resData.accessToken;

    if (!tokenStr) {
      throw new Error('No JWT token returned from authentication server');
    }

    const rawRole = data.role || resData.role || 'PATIENT';
    const cleanRole = String(rawRole).replace('ROLE_', '').toUpperCase();

    const userData = {
      userId: data.userId || data.id || resData.userId || resData.id || 1,
      email: data.email || data.username || username,
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'User',
      role: cleanRole,
    };

    // Store token and user data in storage
    sessionStorage.setItem('token', tokenStr);
    sessionStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenStr);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(tokenStr);
    setUser(userData);

    return cleanRole;
  };

  /** Logout — completely clears all authentication data and tab sessions */
  const logout = () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing storage on logout:', e);
    }
    setToken(null);
    setUser(null);
    window.location.href = '/home';
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
