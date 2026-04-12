import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/icons';

/* ── Inline SVG icons for OAuth providers ── */
const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.5-4-1.5-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1 2 .1 2.8.1.1-.7.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6.1a4.8 4.8 0 0 1 1.2-3.3c-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.7.2 3 .1 3.3a4.8 4.8 0 0 1 1.2 3.3c0 4.7-2.9 5.8-5.6 6.1.4.4.8 1 .8 2.1v3.1c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z"
    />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { isEnabled, user, loading, signInWithGitHub, signInWithGoogle, error } = useAuth();

  // If already logged in, redirect away
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

  const handleGitHub = () => {
    void signInWithGitHub().catch(() => undefined);
  };

  const handleGoogle = () => {
    void signInWithGoogle().catch(() => undefined);
  };

  const handleContinueGuest = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="login-page-shell">
      {/* Ambient background effects */}
      <div className="login-bg-glow login-bg-glow--violet" />
      <div className="login-bg-glow login-bg-glow--pink" />

      <div className="login-card">
        {/* Branding */}
        <div className="login-branding">
          <Logo className="login-logo" />
          <h1 className="login-title">
            <span className="login-title-movie">Movie</span>
            <span className="login-title-monk">Monk</span>
          </h1>
        </div>

        {/* Welcome text */}
        <div className="login-hero-text">
          <h2 className="login-headline">Welcome to MovieMonk</h2>
          <p className="login-subtext">
            Experience cinema like never before with our AI-powered discovery engine.
            Your next favorite film is one click away.
          </p>
        </div>

        {/* Auth buttons */}
        {isEnabled && (
          <div className="login-auth-buttons">
            <button
              type="button"
              className="login-oauth-btn login-oauth-btn--google"
              onClick={handleGoogle}
              disabled={loading}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className="login-oauth-btn login-oauth-btn--github"
              onClick={handleGitHub}
              disabled={loading}
            >
              <GitHubIcon />
              <span>Continue with GitHub</span>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="login-divider">
          <span className="login-divider-line" />
          <span className="login-divider-text">or</span>
          <span className="login-divider-line" />
        </div>

        {/* Guest option */}
        <button
          type="button"
          className="login-guest-btn"
          onClick={handleContinueGuest}
        >
          Continue without an account
        </button>

        {/* Error display */}
        {error && (
          <p className="login-error-text">{error}</p>
        )}

        {/* Footer note */}
        <p className="login-footer-note">
          By continuing, you agree to MovieMonk's Terms of Service and acknowledge our Privacy Policy.
        </p>
      </div>
    </div>
  );
}
