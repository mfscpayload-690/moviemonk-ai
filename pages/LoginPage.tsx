import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/icons';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';
import { APP_VERSION } from '../lib/appMeta';

/* ── Inline SVG icons for OAuth providers ── */
const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.5-4-1.5-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1 2 .1 2.8.1.1-.7.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6.1a4.8 4.8 0 0 1 1.2-3.3c-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.7.2 3 .1 3.3a4.8 4.8 0 0 1 1.2 3.3c0 4.7-2.9 5.8-5.6 6.1.4.4.8 1 .8 2.1v3.1c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z"
    />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signInWithGitHub, signInWithGoogle, error } = useAuth();
  
  const [magneticTarget, setMagneticTarget] = useState<{ x: number, y: number } | null>(null);

  // Framer Motion cursor tracking for smooth spotlight effect
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
  const spotlightX = useSpring(mouseX, { stiffness: 100, damping: 25 });
  const spotlightY = useSpring(mouseY, { stiffness: 100, damping: 25 });

  useEffect(() => {
    // If already logged in, redirect away
    if (!loading && user) {
      navigate('/', { replace: true });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [loading, user, navigate, mouseX, mouseY]);

  const handleGitHub = () => {
    void signInWithGitHub().catch(() => undefined);
  };

  const handleGoogle = () => {
    void signInWithGoogle().catch(() => undefined);
  };

  // Magnetic Button Hover Logic
  const handleButtonHoverStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Set magnetic target to the center of the hovered button
    setMagneticTarget({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const handleButtonHoverEnd = () => {
    setMagneticTarget(null);
  };

  return (
    <div className="login-page-shell">
      {/* Dynamic Context Canvas */}
      <ParticleBackground magneticTarget={magneticTarget} />

      {/* Spotlight layer linked to Framer Motion values */}
      <motion.div
        className="login-spotlight"
        style={{
          x: useTransform(spotlightX, (v) => v - window.innerWidth),
          y: useTransform(spotlightY, (v) => v - window.innerHeight),
        }}
      />

      {/* Main interactive glass card */}
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Branding */}
        <div className="login-branding">
          <Logo className="login-logo drop-shadow-glow" />
          <h1 className="brand-signature title-font login-brand-title" aria-label="MovieMonk">
            <span className="brand-signature-movie">Movie</span>
            <span className="brand-signature-monk">Monk</span>
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

        {/* Strict Auth buttons only */}
        <div className="login-auth-buttons">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="login-oauth-btn login-oauth-btn--google"
            onClick={handleGoogle}
            onMouseEnter={handleButtonHoverStart}
            onMouseLeave={handleButtonHoverEnd}
            disabled={loading}
          >
            <GoogleIcon />
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="login-oauth-btn login-oauth-btn--github"
            onClick={handleGitHub}
            onMouseEnter={handleButtonHoverStart}
            onMouseLeave={handleButtonHoverEnd}
            disabled={loading}
          >
            <GitHubIcon />
            <span>{loading ? 'Connecting...' : 'Continue with GitHub'}</span>
          </motion.button>
        </div>

        <p className="login-auth-helper">Secure OAuth sign-in. No password required.</p>
        <p className="login-version-label">MovieMonk v{APP_VERSION} · MIT License</p>

        {/* Error display */}
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="login-error-text"
            role="alert"
            aria-live="polite"
          >
            {error}
          </motion.p>
        )}

        {/* Footer note */}
        <p className="login-footer-note">
          By continuing, you agree to MovieMonk's Terms of Service and acknowledge our Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
