import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { User } from '@supabase/supabase-js';
import { useLocation } from 'react-router-dom';
import { BellIcon, FolderIcon, MoreIcon, SettingsIcon, ShareIcon, XMarkIcon } from './icons';

export interface HeaderUtilityMenuProps {
  user: User | null;
  isCloud: boolean;
  isSyncing: boolean;
  canShare: boolean;
  onOpenWatchlists: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onShare: () => void;
  defaultOpen?: boolean;
}

export interface HeaderUtilityMenuItem {
  key: 'watchlists' | 'notifications' | 'settings';
  label: string;
  description: string;
  disabled?: boolean;
}

interface HeaderUtilityMenuItemState {
  user: User | null;
  isCloud: boolean;
  isSyncing: boolean;
  canShare: boolean;
}

export function buildHeaderUtilityMenuItems({
  user,
  isCloud,
  isSyncing,
  canShare
}: HeaderUtilityMenuItemState): HeaderUtilityMenuItem[] {
  const items: HeaderUtilityMenuItem[] = [
    {
      key: 'watchlists',
      label: user ? 'Cloud Lists' : 'Watchlist',
      description: isSyncing
        ? 'Syncing across your devices'
        : isCloud
          ? 'Available across your devices'
          : 'Saved on this device'
    }
  ];

  if (user) {
    items.push(
      {
        key: 'notifications',
        label: 'Notifications',
        description: 'Recent in-app updates'
      },
      {
        key: 'settings',
        label: 'Settings',
        description: 'Profile and preference controls'
      }
    );
  }

  return items;
}

export function runUtilityMenuAction(closeMenu: () => void, action: () => void) {
  closeMenu();
  action();
}

function renderMenuIcon(key: HeaderUtilityMenuItem['key']) {
  switch (key) {
    case 'watchlists':
      return <FolderIcon className="w-4 h-4" />;
    case 'notifications':
      return <BellIcon className="w-4 h-4" />;
    case 'settings':
      return <SettingsIcon className="w-4 h-4" />;
    default:
      return null;
  }
}

export default function HeaderUtilityMenu({
  user,
  isCloud,
  isSyncing,
  canShare,
  onOpenWatchlists,
  onOpenNotifications,
  onOpenSettings,
  onShare,
  defaultOpen = false
}: HeaderUtilityMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const items = useMemo(
    () => buildHeaderUtilityMenuItems({ user, isCloud, isSyncing, canShare }),
    [user, isCloud, isSyncing, canShare]
  );

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node;
      const isInsideMenu =
        containerRef.current?.contains(targetNode) || sheetRef.current?.contains(targetNode);

      if (!isInsideMenu) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined' || window.innerWidth >= 640) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const actionMap: Record<HeaderUtilityMenuItem['key'], () => void> = {
    watchlists: onOpenWatchlists,
    notifications: onOpenNotifications,
    settings: onOpenSettings
  };

  const closeMenu = () => setOpen(false);

  const menuRows = items.map((item) => (
    <button
      key={item.key}
      type="button"
      className={`header-utility-item ${item.disabled ? 'is-disabled' : ''}`}
      disabled={item.disabled}
      aria-disabled={item.disabled}
      onClick={() => runUtilityMenuAction(closeMenu, actionMap[item.key])}
    >
      <span className="header-utility-item-icon">{renderMenuIcon(item.key)}</span>
      <span className="header-utility-item-copy">
        <span className="header-utility-item-label">{item.label}</span>
        <span className="header-utility-item-description">{item.description}</span>
      </span>
    </button>
  ));

  return (
    <>
      <div className="header-utility-menu flex items-center gap-1" ref={containerRef}>
        {/* Standalone Share button — always visible in header */}
        <button
          type="button"
          className={`auth-btn auth-btn-avatar header-more-btn ${
            canShare ? 'text-white hover:text-brand-primary' : 'opacity-40 cursor-not-allowed'
          }`}
          onClick={canShare ? () => { onShare(); } : undefined}
          aria-label="Share current page"
          title={canShare ? 'Copy shareable link' : 'Open a result to share'}
          disabled={!canShare}
        >
          <ShareIcon className="w-[18px] h-[18px]" />
        </button>

        {/* More (...) button */}
        <button
          type="button"
          className="auth-btn auth-btn-avatar header-more-btn"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open more options"
        >
          <MoreIcon className="w-[18px] h-[18px]" />
        </button>

        {open && (
          <div className="header-utility-dropdown hidden sm:block" role="menu" aria-label="Header utility menu">
            <p className="header-utility-title">More</p>
            <div className="header-utility-list">{menuRows}</div>
          </div>
        )}
      </div>

      {open && (() => {
        const mobileSheet = (
          <div
            className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-end justify-center p-0 sm:hidden"
            onClick={closeMenu}
            role="dialog"
            aria-modal="true"
            aria-label="Header utility menu"
          >
            <div
              className="w-full bg-brand-surface border border-white/10 rounded-t-2xl shadow-2xl p-4 space-y-4 modal-mobile-slide max-h-[85vh] overflow-hidden flex flex-col"
              ref={sheetRef}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">More</h3>
                  <p className="text-sm text-brand-text-light">Quick actions and utilities</p>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="p-2.5 rounded-lg hover:bg-white/10 touch-target"
                  aria-label="Close more options"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="header-utility-sheet-list">{menuRows}</div>
            </div>
          </div>
        );
        const portalTarget = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
        return portalTarget ? createPortal(mobileSheet, portalTarget) : mobileSheet;
      })()}
    </>
  );
}
