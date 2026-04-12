import React, { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AuthButton: React.FC = () => {
  const { isEnabled, user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  if (!isEnabled) {
    return null;
  }

  if (loading) {
    return <button className="auth-btn auth-btn-loading" disabled>Loading...</button>;
  }

  if (!user) {
    return (
      <button
        type="button"
        className="auth-btn auth-btn-signin"
        onClick={() => navigate('/login')}
        title="Sign in to MovieMonk"
      >
        <span className="hidden sm:inline">Sign in</span>
        <span className="sm:hidden">Log in</span>
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.preferred_username || user.user_metadata?.name || user.email || 'User') as string;

  return (
    <div className="auth-user-menu" ref={containerRef}>
      <button
        type="button"
        className="auth-btn auth-btn-avatar"
        onClick={() => setMenuOpen((value) => !value)}
        aria-expanded={menuOpen}
        aria-label="Open account menu"
      >
        {avatar ? (
          <img src={avatar} alt={displayName} className="auth-avatar" />
        ) : (
          <span className="auth-avatar-fallback">{displayName.slice(0, 1).toUpperCase()}</span>
        )}
      </button>
      {menuOpen && (
        <div className="auth-dropdown">
          <p className="auth-dropdown-name">{displayName}</p>
          <button
            type="button"
            className="auth-dropdown-item"
            onClick={() => {
              setMenuOpen(false);
              void signOut().catch(() => undefined);
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
