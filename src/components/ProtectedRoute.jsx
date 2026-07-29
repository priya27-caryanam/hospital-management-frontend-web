/**
 * ProtectedRoute Component
 * Guards routes based on authentication status and user role
 * - Redirects to /login if not authenticated
 * - Redirects to user's dashboard if role doesn't match
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading, getDashboardPath } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  // Not authenticated — redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Role not allowed for this route — redirect to user's own dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return children;
}
