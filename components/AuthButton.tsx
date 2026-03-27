import React, { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GitHubMark: React.FC = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.5-4-1.5-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1 2 .1 2.8.1.1-.7.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6.1a4.8 4.8 0 0 1 1.2-3.3c-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.7.2 3 .1 3.3a4.8 4.8 0 0 1 1.2 3.3c0 4.7-2.9 5.8-5.6 6.1.4.4.8 1 .8 2.1v3.1c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z"
    />
  </svg>
);

export const AuthButton: React.FC = () => {
  const { user, loading, error, signInWithGitHub, signOut } = useAuth();
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

  if (loading) {
    return <button className="auth-btn auth-btn-loading" disabled>Loading...</button>;
  }

  if (!user) {
    return (
      <button
        type="button"
        className="auth-btn auth-btn-signin"
        onClick={() => {
          void signInWithGitHub().catch(() => undefined);
        }}
        title={error || 'Sign in with GitHub'}
      >
        <GitHubMark />
        <span className="hidden sm:inline">Sign in</span>
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
