import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import {
  Settings,
  Share2,
  FolderHeart,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthAvatarUrl, getAuthDisplayName } from '../../lib/authIdentity';
import { safeImgUrl } from '../../lib/seo';

export interface UserProfileMenuProps {
  user: User | null;
  isCloud: boolean;
  isSyncing: boolean;
  canShare: boolean;
  onOpenWatchlists: () => void;
  onOpenSettings: () => void;
  onShare: () => void;
}

const SAFE_AVATAR_PATTERN = /^(?:https?:\/\/(?:(?:[a-zA-Z0-9-]+\.)*(?:githubusercontent\.com|googleusercontent\.com|supabase\.co|tmdb\.org|unsplash\.com|tvmaze\.com|vercel\.app)|localhost|127\.0\.0\.1)(?::\d+)?\/[a-zA-Z0-9_.\/&=%?#+-]*|\/[a-zA-Z0-9_.\/&=%?#+-]*)$/i;

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  isCloud,
  isSyncing,
  canShare,
  onOpenWatchlists,
  onOpenSettings,
  onShare
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawAvatarUrl = safeImgUrl(getAuthAvatarUrl(user));
  const isAvatarSafe = typeof rawAvatarUrl === 'string' && SAFE_AVATAR_PATTERN.test(rawAvatarUrl);
  const avatarUrl = isAvatarSafe ? rawAvatarUrl.replace(/[<>"']/g, '') : '';
  const displayName = getAuthDisplayName(user);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSignIn = () => {
    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (currentPath !== '/login') {
        try {
          sessionStorage.setItem('auth_return_url', currentPath);
        } catch {
          // Ignore storage quota
        }
      }
    }
    navigate('/login');
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            className="h-9 w-9 flex items-center justify-center rounded-full text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
            title="Share this page"
            aria-label="Share page"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleSignIn}
          className="h-9 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 active:scale-95 shadow-[0_0_16px_rgba(168,85,247,0.35)] transition-all duration-200"
          title="Sign in to your MovieMonk account"
        >
          <span className="hidden sm:inline">Sign in</span>
          <span className="sm:hidden">Log in</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-1.5 p-0.5 sm:p-1 sm:pr-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 touch-target flex-shrink-0"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account and profile menu"
      >
        {/* Avatar Container with unclipped status dot */}
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden bg-purple-600/30 border border-white/15 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <UserIcon className="w-4 h-4 text-white/80" />
            )}
          </div>

          {/* Glowing Status Dot (positioned outside overflow-hidden) */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-950 transition-all ${
              isSyncing
                ? 'bg-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
                : isCloud
                ? 'bg-emerald-400 ring-2 ring-emerald-400/40 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-neutral-500 ring-1 ring-white/10'
            }`}
            title={isSyncing ? 'Syncing...' : isCloud ? 'Cloud Sync Active' : 'Offline/Local'}
            aria-hidden="true"
          />
        </div>

        <ChevronDown
          className={`hidden sm:block w-3.5 h-3.5 text-white/50 group-hover:text-white/80 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Profile Flyout Menu */}
      {isOpen && (
        <div
          aria-label="User settings and account menu"
          className="absolute right-0 top-full mt-2 w-72 bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-2 z-[9999] animate-scale-up origin-top-right overflow-hidden"
        >
          {/* User Details Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/50 truncate mt-0.5">{user.email || 'Cloud Member'}</p>
            
            {/* Luminous Status Badge */}
            <div className="mt-2.5 flex items-center">
              {isSyncing ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-400/10 border border-amber-400/30 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                  <span>Syncing library…</span>
                </div>
              ) : isCloud ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                  </span>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cloud sync active</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white/60 bg-white/[0.04] border border-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                  <CloudOff className="w-3.5 h-3.5 text-white/40" />
                  <span>Local device storage</span>
                </div>
              )}
            </div>
          </div>

          {/* Action List */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenWatchlists();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors text-left"
            >
              <FolderHeart className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium block">Watchlists</span>
                <span className="text-[10px] text-white/40 block">Saved films & collections</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-white/60 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium block">Settings & Preferences</span>
                <span className="text-[10px] text-white/40 block">Streaming services & AI modes</span>
              </div>
            </button>

            {canShare && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onShare();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors text-left"
              >
                <Share2 className="w-4 h-4 text-white/60 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">Share Page</span>
                  <span className="text-[10px] text-white/40 block">Copy link to clipboard</span>
                </div>
              </button>
            )}
          </div>

          {/* Sign Out Footer */}
          <div className="pt-1 mt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;

