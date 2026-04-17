import React, { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuthAvatarUrl, getAuthDisplayName } from '../lib/authIdentity';

export const AuthButton: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const avatar = getAuthAvatarUrl(user);
  const displayName = getAuthDisplayName(user);

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

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatar]);

  // The `isEnabled` check is removed so the "Sign in" button always shows, allowing users to reach the /login page even if they don't have local env setup.
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

  return (
    <div className="auth-user-menu" ref={containerRef}>
      <button
        type="button"
        className="auth-btn auth-btn-avatar"
        onClick={() => setMenuOpen((value) => !value)}
        aria-expanded={menuOpen}
        aria-label="Open account menu"
      >
        {avatar && !avatarFailed ? (
          <img src={avatar} alt={displayName} className="auth-avatar" onError={() => setAvatarFailed(true)} />
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
