/**
 * SplashScreen — Animated intro screen
 * Shows hospital branding for 2 seconds, then redirects:
 *   • Authenticated users → role-specific dashboard
 *   • Guests → /home
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, getDashboardPath } = useAuth();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Wait for auth context to finish loading before deciding
    if (loading) return;

    // Start fade-out transition after 1.5 s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);

    // Navigate after the full 2 s
    const navTimer = setTimeout(() => {
      navigate(isAuthenticated ? getDashboardPath() : '/home', { replace: true });
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [loading, isAuthenticated, getDashboardPath, navigate]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800
        transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Animated logo */}
      <div className="animate-pulse flex flex-col items-center gap-4">
        {/* Outer glow ring */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-white/10 blur-xl animate-ping" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-2xl">
            <Activity className="h-14 w-14 text-white drop-shadow-lg" strokeWidth={2.2} />
          </div>
        </div>

        {/* Hospital name */}
        <h1 className="text-5xl font-extrabold tracking-widest text-white drop-shadow-md select-none">
          HMS
        </h1>
        <p className="text-blue-100 text-sm font-medium tracking-wide">
          Hospital Management System
        </p>
      </div>

      {/* Subtle loading bar */}
      <div className="absolute bottom-16 w-48 h-1 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full bg-white/70 rounded-full animate-[loading_2s_ease-in-out_forwards]" />
      </div>

      <style>{`
        @keyframes loading {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
