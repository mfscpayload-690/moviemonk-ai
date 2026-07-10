import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SeoHead from '../components/SeoHead';
import { useCloudWatchlists } from '../hooks/useCloudWatchlists';
import { useWatched } from '../hooks/useWatched';
import { loadProfileSettings } from '../lib/userSettings';
import { ConfirmDialog, NoticeDialog, PromptDialog } from '../components/BrandedDialogs';
import ActionToast from '../components/ActionToast';
import { TrashIcon, EditIcon, CheckIcon, XMarkIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, Logo } from '../components/icons';
import { WatchlistFolder } from '../types';
import {
  getWatchlistIconOption,
  WatchlistIconBadge,
  WatchlistIconPicker,
  WATCHLIST_ICON_DEFAULT,
} from '../components/WatchlistIconPicker';
import { Share2, Copy, Check, GripVertical, Square, CheckSquare, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAuthAvatarUrl, getAuthDisplayName } from '../lib/authIdentity';
// import {
//   canNotifyWatchlistReminders,
//   deriveWatchlistReminders,
//   dismissReminder,
//   notifyReminder
// } from '../services/watchlistReminders';
import { emitClientEvent } from '../services/clientObservability';
import { apiPost } from '../lib/apiClient';
import { safeImgUrl, sanitizeImgUrl } from '../lib/seo';



function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app-container watchlists-dashboard-layout" style={{ background: '#121212' }}>
      <header className="app-header flex items-center justify-between px-4 sm:px-6 py-3 glass-panel border-b-0 z-50 sticky top-0">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 text-left" aria-label="Go to discovery home">
          <Logo className="w-[2.125rem] h-[2.125rem] sm:w-9 sm:h-9 text-primary drop-shadow-glow" />
          <h1 className="brand-signature title-font text-xl sm:text-2xl font-bold tracking-tight" aria-label="MovieMonk">
            <span className="brand-signature-movie">Movie</span>
            <span className="brand-signature-monk">Monk</span>
          </h1>
        </Link>
        <button type="button" className="mm-settings-nav-back" onClick={() => navigate('/')}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back to app
        </button>
      </header>
      <main
        className="w-full max-w-[92rem] mx-auto p-4 sm:p-6 lg:p-8 xl:px-10"
      >
        {children}
      </main>
    </div>
  );
}

export function WatchlistsDashboard() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { folderName: folderNameParam } = useParams<{ folderName?: string }>();
  const {
    addFolder,
    folders,
    renameFolder,
    setFolderIcon,
    deleteFolder,
    deleteItem,
    moveItem,
    reorderFolders,
    reorderItems,
    setFolderPrivacy,
    isCloud,
    isSyncing,
    isHydrated
  } = useCloudWatchlists();
  const { watchedCount, watched, toggle: toggleWatched } = useWatched();

  const [profile, setProfile] = useState<any>(null);
  const [showWatchedView, setShowWatchedView] = useState(false);

  // Detail View State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const activeFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);

  // Edit State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderIcon, setEditFolderIcon] = useState(WATCHLIST_ICON_DEFAULT);
  const [editFolderPublic, setEditFolderPublic] = useState(false);
  const [editFolderError, setEditFolderError] = useState<string | null>(null);
  const [syncBadgeVisible, setSyncBadgeVisible] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const syncHideTimerRef = useRef<number | null>(null);
  const syncSettledTimerRef = useRef<number | null>(null);
  const editingFolder = useMemo(
    () => folders.find((folder) => folder.id === editingFolderId) || null,
    [editingFolderId, folders]
  );

  // Share State
  const [sharingFolderId, setSharingFolderId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<{ id: string; name: string; count: number } | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderPublic, setNewFolderPublic] = useState(false);
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; description: string; tone?: 'default' | 'destructive' | 'success' } | null>(null);
  const [actionToast, setActionToast] = useState<{ message: string; kind: 'watchlist' | 'watched' } | null>(null);
  const [deletingItemIds, setDeletingItemIds] = useState<string[]>([]);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [folderDropTargetId, setFolderDropTargetId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [itemDropTargetId, setItemDropTargetId] = useState<string | null>(null);
  // const [reminderRefreshToken, setReminderRefreshToken] = useState(0);
  const [privacyPromptFolder, setPrivacyPromptFolder] = useState<WatchlistFolder | null>(null);

  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [mobileActionFolder, setMobileActionFolder] = useState<WatchlistFolder | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlOverflowY = html.style.overflowY;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverflowY = body.style.overflowY;

    html.style.overflow = 'auto';
    html.style.overflowY = 'auto';
    body.style.overflow = 'auto';
    body.style.overflowY = 'auto';

    return () => {
      html.style.overflow = previousHtmlOverflow;
      html.style.overflowY = previousHtmlOverflowY;
      body.style.overflow = previousBodyOverflow;
      body.style.overflowY = previousBodyOverflowY;
    };
  }, []);

  useEffect(() => {
    if (actionToast) {
      const timer = setTimeout(() => setActionToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionToast]);

  useEffect(() => {
    if (user?.id && supabase) {
      supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8)
        .then(({ data }) => {
          if (data) setSearchHistory(data);
        });
    } else {
      try {
        const raw = localStorage.getItem('moviemonk_search_history_v1');
        const parsed = raw ? JSON.parse(raw) : [];
        setSearchHistory(parsed.map((item: any, idx: number) => ({
          id: `local-${idx}`,
          query: item.query,
          created_at: new Date(item.timestamp).toISOString()
        })).slice(0, 8));
      } catch {
        setSearchHistory([]);
      }
    }
  }, [user?.id]);

  const handleClearHistory = async () => {
    if (user?.id && supabase) {
      try {
        const { error } = await supabase.from('search_history').delete().eq('user_id', user.id);
        if (error) throw error;
        setSearchHistory([]);
      } catch (err) {
        console.error('Failed to clear history from dashboard:', err);
      }
    } else {
      try {
        localStorage.removeItem('moviemonk_search_history_v1');
        localStorage.removeItem('moviemonk_autocomplete_cache_v1');
        setSearchHistory([]);
      } catch (err) {
        console.error('Failed to clear local history:', err);
      }
    }
  };

  // Deep-link & route synchronization: keep internal state in sync with URL pathname and params
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === '/watchlists/watched' || folderNameParam?.toLowerCase() === 'watched') {
      setShowWatchedView(true);
      setActiveFolderId(null);
    } else if (folderNameParam) {
      if (!isHydrated) {
        return;
      }
      const decoded = decodeURIComponent(folderNameParam);
      const match = folders.find(
        f => f.name.toLowerCase() === decoded.toLowerCase()
      );
      if (match) {
        setActiveFolderId(match.id);
        setShowWatchedView(false);
      } else {
        setActiveFolderId(null);
        setShowWatchedView(false);
      }
    } else {
      setActiveFolderId(null);
      setShowWatchedView(false);
    }
  }, [location.pathname, folderNameParam, folders, isHydrated]);

  // Sync URL when active folder changes
  const openFolder = (folderId: string | null) => {
    const applyTransition = () => {
      if (folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (folder && folder.name) {
          const sanitized = encodeURIComponent(folder.name).replace(/\./g, '%2E');
          if (sanitized && !sanitized.includes('/') && !sanitized.includes('\\')) {
            navigate(`/watchlists/${sanitized}`, { replace: false });
          }
        }
      } else {
        navigate('/watchlists', { replace: false });
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        applyTransition();
      });
    } else {
      applyTransition();
    }
  };

  useEffect(() => {
    setProfile(loadProfileSettings());
  }, []);

  useEffect(() => {
    if (!loading && !user && !folders.length) {
      // Allow guest view if they have local folders, otherwise they can just see empty state
      // Actually, if guest they can still use it. Wait, the user said "on logged in mode only" 
      // but let's support both seamlessly.
    }
  }, [user, loading, navigate]);

  // Derived Metrics
  const stats = useMemo(() => {
    let totalItems = 0;
    let movies = 0;
    let series = 0;

    folders.forEach(f => {
      totalItems += f.items.length;
      f.items.forEach(i => {
        if (i.movie.type === 'movie') movies++;
        if (i.movie.type === 'show') series++;
      });
    });

    const topFormat = movies > series ? 'Movies' : series > movies ? 'Series' : 'Balanced Mix';

    return {
      totalFolders: folders.length,
      totalSaved: totalItems,
      topFormat: totalItems > 0 ? topFormat : 'N/A'
    };
  }, [folders]);

  const topWatchedPosters = useMemo(() => {
    return watched.slice(0, 3).map(w => {
      if (!w.poster_url) return '';
      try {
        const parsed = new URL(w.poster_url);
        if (parsed.protocol === 'https:' && (parsed.hostname === 'image.tmdb.org' || parsed.hostname.endsWith('supabase.co'))) {
          return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
        }
      } catch {
        if (w.poster_url.startsWith('/') && !w.poster_url.startsWith('//')) {
          return w.poster_url;
        }
      }
      return '';
    }).filter(Boolean) as string[];
  }, [watched]);

  // const watchlistReminders = useMemo(
  //   () => deriveWatchlistReminders(folders, watched, 2),
  //   [folders, watched, reminderRefreshToken]
  // );

  // const handleDismissReminder = (reminderId: string) => {
  //   dismissReminder(reminderId);
  //   setReminderRefreshToken((value) => value + 1);
  //   emitClientEvent({
  //     event: 'watchlist_reminder_dismissed',
  //     data: { reminder_id: reminderId }
  //   });
  //   setActionToast({ message: 'Reminder dismissed', kind: 'watchlist' });
  // };

  // const handleNotifyReminder = async (reminder: (typeof watchlistReminders)[number]) => {
  //   const delivered = await notifyReminder(reminder);
  //   emitClientEvent({
  //     event: 'watchlist_reminder_notify_attempted',
  //     data: {
  //       reminder_id: reminder.id,
  //       delivered
  //     }
  //   });
  //   if (!delivered) {
  //     setNotice({
  //       title: 'Browser notifications are off',
  //       description: 'Enable notifications for this site to receive watchlist reminders.',
  //       tone: 'destructive'
  //     });
  //     return;
  //   }
  //   setActionToast({ message: 'Reminder sent', kind: 'watchlist' });
  // };

  const startEditFolder = (folder: WatchlistFolder) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderIcon(getWatchlistIconOption(folder.icon).key);
    setEditFolderPublic(folder.is_public || false);
  };

  const closeEditFolder = useCallback(() => {
    setEditingFolderId(null);
  }, []);

  const saveFolderEdits = () => {
    if (!editingFolderId) return;
    const folder = folders.find((f) => f.id === editingFolderId);
    if (!folder) return;

    const trimmedName = editFolderName.trim();
    if (!trimmedName) {
      setEditFolderError('Give the folder a name.');
      return;
    }

    const lower = trimmedName.toLowerCase();
    if (lower === 'watched' || lower === 'share') {
      setEditFolderError('That folder name is reserved for system features');
      return;
    }

    // Check duplicate (excluding itself)
    if (folders.some(f => f.id !== folder.id && f.name.toLowerCase() === lower)) {
      setEditFolderError('A folder with that name already exists');
      return;
    }

    if (trimmedName !== folder.name) {
      renameFolder(folder.id, trimmedName);
    }
    if ((editFolderIcon || WATCHLIST_ICON_DEFAULT) !== (folder.icon || WATCHLIST_ICON_DEFAULT)) {
      setFolderIcon(folder.id, editFolderIcon);
    }
    if (editFolderPublic !== (folder.is_public || false)) {
      setFolderPrivacy(folder.id, editFolderPublic);
    }
    closeEditFolder();
  };

  useEffect(() => {
    if (!editingFolderId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingFolderId]);

  useEffect(() => {
    if (!editingFolderId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditFolder();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeEditFolder, editingFolderId]);

  useEffect(() => {
    if (!isCloud) {
      setSyncBadgeVisible(false);
      setJustSynced(false);
      return;
    }

    if (syncHideTimerRef.current !== null) {
      window.clearTimeout(syncHideTimerRef.current);
      syncHideTimerRef.current = null;
    }
    if (syncSettledTimerRef.current !== null) {
      window.clearTimeout(syncSettledTimerRef.current);
      syncSettledTimerRef.current = null;
    }

    if (isSyncing) {
      setSyncBadgeVisible(true);
      setJustSynced(false);
      return;
    }

    if (syncBadgeVisible) {
      setJustSynced(true);
      syncSettledTimerRef.current = window.setTimeout(() => {
        setJustSynced(false);
      }, 2200);
      syncHideTimerRef.current = window.setTimeout(() => {
        setSyncBadgeVisible(false);
      }, 900);
    }
  }, [isCloud, isSyncing, syncBadgeVisible]);

  useEffect(() => {
    return () => {
      if (syncHideTimerRef.current !== null) {
        window.clearTimeout(syncHideTimerRef.current);
      }
      if (syncSettledTimerRef.current !== null) {
        window.clearTimeout(syncSettledTimerRef.current);
      }
    };
  }, []);

  const handleDeleteFolder = (id: string, name: string, count: number) => {
    setFolderDeleteTarget({ id, name, count });
  };

  const handleShareFolder = async (folder: WatchlistFolder) => {
    try {
      setShareLoading(true);
      setSharingFolderId(folder.id);
      setShareLink(null);

      const data = await apiPost<any>('/api/watchlists/share', {
        folder_name: folder.name,
        folder_icon: folder.icon || null,
        items: folder.items.map(item => ({
          id: item.id,
          saved_title: item.saved_title,
          movie: item.movie,
          added_at: item.added_at
        })),
        visibility: 'public'
      }, undefined, session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {});
      setShareLink(data.share_url);
    } catch (err) {
      console.error('Share error:', err);
      setNotice({
        title: 'Could not create share link',
        description: 'MovieMonk ran into an issue while generating that shared watchlist link. Please try again.',
        tone: 'destructive'
      });
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      });
    }
  };

  const displayName = getAuthDisplayName(user, profile?.fullName);
  const avatarUrl = getAuthAvatarUrl(user, profile?.avatarUrl);
  const sharingFolder = useMemo(() => folders.find((folder) => folder.id === sharingFolderId) || null, [folders, sharingFolderId]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);


  const handleCreateFolder = useCallback(() => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setNewFolderError('Give the folder a name before creating it.');
      return;
    }

    const lower = trimmed.toLowerCase();
    if (lower === 'watched' || lower === 'share') {
      setNewFolderError('That folder name is reserved for system features');
      return;
    }

    if (folders.some(f => f.name.toLowerCase() === lower)) {
      setNewFolderError('A folder with that name already exists');
      return;
    }

    addFolder(trimmed, undefined, WATCHLIST_ICON_DEFAULT, newFolderPublic);
    setCreateFolderOpen(false);
    setNewFolderName('');
    setNewFolderError(null);
    setNewFolderPublic(false);
    setActionToast({ message: 'Watchlist created', kind: 'watchlist' });
  }, [addFolder, newFolderName, folders, newFolderPublic]);


  if (loading) {
    return (
      <DashboardLayout>
        <SeoHead title="My Watchlists" robots="noindex, follow" />
        <div className="w-full mt-4 sm:mt-8 animate-pulse">
          {/* 1. Header skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 glass-panel p-5 sm:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto flex-1">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/5 shrink-0" />
              <div className="flex flex-col gap-2.5 flex-1">
                <div className="h-7 w-48 sm:w-64 bg-white/5 rounded-lg" />
                <div className="h-4 w-32 bg-white/5 rounded" />
              </div>
            </div>
            {/* Redesigned Watched Badge Skeleton */}
            <div className="w-full md:w-auto min-w-[240px] h-[78px] rounded-2xl bg-white/5 border border-white/10" />
          </div>

          {/* 3. Folders Section Header */}
          <div className="wl-section-header flex items-center justify-between mb-6">
            <div>
              <div className="h-7 w-40 bg-white/5 rounded-lg mb-2" />
              <div className="h-4 w-56 bg-white/5 rounded" />
            </div>
            <div className="h-9 w-28 bg-white/5 rounded-full" />
          </div>

          {/* 4. Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="wl-folder-card bg-white/2 border border-white/5">
                <div className="aspect-[16/10] w-full bg-white/5" />
                <div className="wl-folder-body">
                  <div className="h-5 w-32 bg-white/5 rounded mb-2" />
                  <div className="h-3 w-44 bg-white/5 rounded mb-4" />
                  <div className="flex justify-between">
                    <div className="h-6 w-8 bg-white/5 rounded" />
                    <div className="h-6 w-8 bg-white/5 rounded" />
                    <div className="h-6 w-8 bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const displayAvatarUrl = useMemo(() => {
    if (!avatarUrl) return '';
    try {
      const parsed = new URL(avatarUrl);
      const host = parsed.hostname;
      const isAllowedHost =
        host === 'supabase.co' || host.endsWith('.supabase.co') ||
        host === 'githubusercontent.com' || host.endsWith('.githubusercontent.com') ||
        host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com');
      if (parsed.protocol === 'https:' && isAllowedHost) {
        return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      if (avatarUrl.startsWith('/') && !avatarUrl.startsWith('//')) {
        return avatarUrl;
      }
    }
    return '';
  }, [avatarUrl]);

  return (
    <DashboardLayout>
      <SeoHead title="My Watchlists" robots="noindex, follow" />
      {/* 1. User Header & Watched Integration */}
      {!activeFolderId && !showWatchedView && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 glass-panel p-5 sm:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto flex-1">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-white/10 overflow-hidden flex-shrink-0 bg-brand-surface shadow-xl transition-transform hover:scale-105 duration-300">
              {displayAvatarUrl && !avatarFailed ? (
                <img src={displayAvatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarFailed(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold bg-gradient-to-br from-brand-primary to-brand-secondary">
                  {displayName[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight truncate">Welcome, {displayName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs sm:text-base text-brand-text-light">Your Cinematic Collection</p>
                {isCloud ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold tracking-wide ${isSyncing || syncBadgeVisible
                        ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary'
                        : justSynced
                          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-white/15 bg-white/5 text-brand-text-light'
                      }`}
                  >
                    {isSyncing || syncBadgeVisible ? (
                      <>
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                        <span className="hidden xs:inline">Syncing changes</span>
                        <span className="xs:hidden">Syncing</span>
                      </>
                    ) : justSynced ? (
                      <>
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12.5 9.2 17 19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Synced
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-brand-text-light/60" />
                        <span className="hidden xs:inline">Cloud connected</span>
                        <span className="xs:hidden">Connected</span>
                      </>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold tracking-wide text-brand-text-light">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-300/90" />
                    Local only
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Integrated Watched Card */}
          <button
            onClick={() => navigate('/watchlists/watched')}
            className="relative z-10 flex items-center justify-between gap-6 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-emerald-500/35 border border-white/10 transition-all duration-300 cursor-pointer text-left w-full md:w-auto min-w-[240px] group shadow-inner"
          >
            <div>
              <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                Watched
                <svg className="w-3.5 h-3.5 text-emerald-400/70 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="text-3xl font-extrabold text-white mt-1 leading-none font-mono">
                {watchedCount}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {topWatchedPosters.length > 0 ? (
                <div className="flex -space-x-3 overflow-hidden py-1">
                  {topWatchedPosters.map((poster, i) => (
                    <img
                      key={`watched-thumb-${i}`}
                      src={poster}
                      alt=""
                      className="w-9 h-14 rounded-md object-cover border border-white/15 shadow-lg transform group-hover:-translate-y-1 group-hover:rotate-2 transition-all duration-300"
                      style={{ zIndex: 10 + i }}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Watchlist reminders hidden for now */}
      {/* {!activeFolderId && !showWatchedView && watchlistReminders.length > 0 && (
        <section className="mm-reminders-panel glass-panel mb-10">
          <div className="mm-reminders-panel-header">
            <div>
              <h3>Watchlist reminders</h3>
              <p>Titles waiting in your lists. Notify now sends a one-time browser alert.</p>
            </div>
            {canNotifyWatchlistReminders() && (
              <span className="mm-reminders-notify-pill">Browser alerts available</span>
            )}
          </div>
          <div className="mm-reminders-grid">
            {watchlistReminders.map((reminder) => (
              <article key={reminder.id} className="mm-reminder-card relative group">
                <button
                  type="button"
                  className="mm-reminder-dismiss-icon"
                  onClick={() => handleDismissReminder(reminder.id)}
                  aria-label="Dismiss reminder"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <div className="mm-reminder-card-body">
                  <p className="mm-reminder-kicker">
                    {reminder.folderName} • {reminder.daysSaved}d ago
                  </p>
                  <h4>
                    {reminder.title}
                    {reminder.year ? ` (${reminder.year})` : ''}
                  </h4>
                </div>
                <div className="mm-reminder-actions">
                  <button type="button" className="mm-chip-button" onClick={() => openFolder(reminder.folderId)}>
                    View folder
                  </button>
                  <button type="button" className="mm-chip-button" onClick={() => void handleNotifyReminder(reminder)}>
                    Notify
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )} */}

      {/* 3. Watched List View */}
      {showWatchedView && !activeFolderId ? (
        <div className="animate-fade-in">
          <button
            onClick={() => navigate('/watchlists')}
            className="text-brand-text-light hover:text-white mb-6 flex items-center gap-2 group transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.5)]" />
              <h2 className="text-3xl font-bold text-white tracking-tight">Watched</h2>
              <span className="text-brand-text-dark text-sm font-medium">{watchedCount} title{watchedCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {watched.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-brand-text-light text-lg">Nothing marked as watched yet.</p>
              <Link to="/" className="mt-4 inline-block px-6 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors">
                Discover titles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {watched.map((item) => {
                const displayPosterUrl = (() => {
                  if (!item.poster_url) return '';
                  try {
                    const parsed = new URL(item.poster_url);
                    if (parsed.protocol === 'https:' && (parsed.hostname === 'image.tmdb.org' || parsed.hostname.endsWith('supabase.co'))) {
                      return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
                    }
                  } catch {
                    if (item.poster_url.startsWith('/') && !item.poster_url.startsWith('//')) {
                      return item.poster_url;
                    }
                  }
                  return '';
                })();

                const safeMediaType = item.media_type === 'tv' ? 'tv' : 'movie';
                const safeTmdbId = String(item.tmdb_id).replace(/[^0-9]/g, '');
                const safeLinkPath = `/${safeMediaType}/${safeTmdbId}`;

                return (
                  <div key={`${item.tmdb_id}-${item.media_type}`} className="group relative aspect-[2/3] rounded-xl overflow-hidden glass-panel border border-white/5 select-none bg-brand-surface shadow-xl hover:ring-2 hover:ring-emerald-500/50 transition-all cursor-pointer">
                    <Link to={safeLinkPath} className="absolute inset-0 z-10" />
                    {/* Poster */}
                    {displayPosterUrl ? (
                      <img src={displayPosterUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center text-brand-text-dark bg-gradient-to-br from-brand-surface to-black/40 text-sm">
                        {item.title}
                      </div>
                    )}

                    {/* Gradient info bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-12 z-20 pointer-events-none">
                      <h4 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-md">{item.title}</h4>
                      <span className="text-xs text-brand-text-light block mt-0.5">{item.year || 'Unknown'}</span>
                    </div>

                    {/* Watched badge */}
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                      {item.media_type === 'tv' ? 'Series' : 'Movie'}
                    </div>

                    {/* Unwatch button */}
                    <button
                      onClick={() => toggleWatched({
                        tmdb_id: item.tmdb_id,
                        media_type: item.media_type,
                        title: item.title,
                        poster_url: item.poster_url,
                        year: item.year,
                      })}
                      className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 hover:text-white"
                      title="Remove from watched"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeFolder ? (
        <div className="animate-fade-in transition-all duration-300">
          <button
            onClick={() => openFolder(null)}
            className="text-brand-text-light hover:text-white mb-6 flex items-center gap-2 group transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Folders
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-lg">
                <WatchlistIconBadge iconKey={activeFolder.icon} className="w-5 h-5" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{activeFolder.name}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFolderPrivacy(activeFolder.id, !activeFolder.is_public)}
                className={`p-2.5 sm:px-3 sm:py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-medium transition-all ${activeFolder.is_public
                    ? 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                    : 'bg-white/5 text-brand-text-dark hover:bg-white/10 hover:text-brand-text-light'
                  }`}
                title={activeFolder.is_public ? 'Make Private' : 'Make Public'}
              >
                {activeFolder.is_public ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{activeFolder.is_public ? 'Public' : 'Private'}</span>
              </button>
              <button
                onClick={() => handleShareFolder(activeFolder)}
                disabled={shareLoading}
                className="p-2.5 sm:px-3 sm:py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                title="Share folder"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">{shareLoading ? 'Creating link...' : 'Share'}</span>
                {shareLoading && <span className="sm:hidden">...</span>}
              </button>
              <button
                onClick={() => startEditFolder(activeFolder)}
                className="p-2.5 sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-light hover:text-white flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-colors"
                title="Edit folder"
              >
                <EditIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Folder</span>
              </button>
              <button
                onClick={() => {
                  handleDeleteFolder(activeFolder.id, activeFolder.name, activeFolder.items.length);
                }}
                className="p-2.5 sm:px-3 sm:py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-colors"
                title="Delete folder"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          {activeFolder.items.length === 0 ? (
            <div className="mm-empty-state">
              <h3>This folder is waiting for its first title</h3>
              <p>Save a movie or series from discovery, search, or a detail page and it will appear here instantly.</p>
              <div className="mm-empty-state-actions">
                <Link to="/" className="mm-empty-state-cta">
                  Go to discovery
                </Link>
                <Link to="/search" className="mm-empty-state-cta-secondary">
                  Search titles
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {activeFolder.items.map(item => {
                  const isWatched = watched.some((w) => w.tmdb_id === String(item.movie.tmdb_id || '') && w.media_type === (item.movie.type === 'show' ? 'tv' : 'movie'));
                  const displayPosterUrl = sanitizeImgUrl(item.movie.poster_url);

                  return (
                    <div
                      key={item.id}
                      className={`group relative aspect-[2/3] rounded-xl overflow-hidden glass-panel border border-white/5 select-none bg-brand-surface shadow-xl transition-all duration-300 ${itemDropTargetId === item.id ? 'mm-drop-target' : ''} ${deletingItemIds.includes(item.id) ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                      draggable
                      onDragStart={() => {
                        setDraggingItemId(item.id);
                        setItemDropTargetId(item.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setItemDropTargetId(item.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggingItemId && draggingItemId !== item.id) {
                          reorderItems(activeFolder.id, draggingItemId, item.id);
                        }
                        setDraggingItemId(null);
                        setItemDropTargetId(null);
                      }}
                      onDragEnd={() => {
                        setDraggingItemId(null);
                        setItemDropTargetId(null);
                      }}
                    >
                      <Link to={`/${item.movie.type === 'show' ? 'tv' : 'movie'}/${item.movie.tmdb_id}`} className="absolute inset-0 z-10" />
                      {displayPosterUrl ? (
                        <img src={displayPosterUrl} alt={item.movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center text-brand-text-dark bg-gradient-to-br from-brand-surface to-black/40">
                          {item.movie.title}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-12 z-20 pointer-events-none">
                        <h4 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-md text-depth">{item.movie.title}</h4>
                        <span className="text-xs text-brand-text-light block mt-0.5">{item.movie.year || 'Unknown'}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingItemIds((prev) => [...prev, item.id]);
                          setTimeout(() => {
                            deleteItem(activeFolder.id, item.id);
                            setDeletingItemIds((prev) => prev.filter((id) => id !== item.id));
                            setActionToast({ message: '1 item deleted', kind: 'watchlist' });
                          }, 300);
                        }}
                        className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/60 backdrop-blur-md text-red-400 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        title="Remove from folder"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                      <div className="p-2 rounded-full bg-black/50 text-white/70">
                        <GripVertical size={14} />
                      </div>

                      <div className="absolute top-2.5 left-2.5 flex gap-1 z-20">
                        <div className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white/90 text-[10px] font-bold tracking-wider uppercase">
                          {item.movie.type === 'show' ? 'Series' : 'Movie'}
                        </div>
                        {isWatched && (
                          <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur-md text-white flex items-center justify-center shadow-lg" title="Watched">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="wl-section-header flex items-center justify-between">
            <div>
              <h2 className="wl-section-title">Watchlist Folders</h2>
              <p className="wl-section-subtitle">Your curated cinematic archives</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="mm-chip-button" onClick={() => setCreateFolderOpen(true)}>Create folder</button>
              {!isCloud && folders.length > 0 && (
                <span className="text-xs bg-white/10 text-brand-text-light px-3 py-1 rounded-full">Local Storage</span>
              )}
            </div>
          </div>

          {folders.length === 0 ? (
            <div className="mm-empty-state">
              <h3>Build your first watchlist</h3>
              <p>Start with a folder for weekend picks, comfort rewatches, or what to see next. Then save titles into it from anywhere in the app.</p>
              <div className="mm-empty-state-actions">
                <button type="button" className="mm-empty-state-cta" onClick={() => setCreateFolderOpen(true)}>
                  Create your first watchlist
                </button>
                <Link to="/" className="mm-empty-state-cta-secondary">
                  Go to discovery
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {folders.map((folder, index) => {
                const heroItem = folder.items[0];
                const topPosters = folder.items.slice(0, 3).map(item => {
                  const url = item.movie?.poster_url;
                  if (!url) return '';
                  try {
                    const parsed = new URL(url);
                    if (parsed.protocol === 'https:' && (parsed.hostname === 'image.tmdb.org' || parsed.hostname.endsWith('supabase.co'))) {
                      return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
                    }
                  } catch {
                    if (url.startsWith('/') && !url.startsWith('//')) {
                      return url;
                    }
                  }
                  return '';
                }).filter(Boolean) as string[];
                return (
                  <div
                    key={folder.id}
                    className={`wl-folder-card ${folderDropTargetId === folder.id ? 'mm-drop-target' : ''}`}
                    draggable
                    onDragStart={() => {
                      setDraggingFolderId(folder.id);
                      setFolderDropTargetId(folder.id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setFolderDropTargetId(folder.id);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggingFolderId && draggingFolderId !== folder.id) {
                        reorderFolders(draggingFolderId, folder.id);
                      }
                      setDraggingFolderId(null);
                      setFolderDropTargetId(null);
                    }}
                    onDragEnd={() => {
                      setDraggingFolderId(null);
                      setFolderDropTargetId(null);
                    }}
                  >
                    {/* Poster Hero Area */}
                    <div className="wl-folder-poster" onClick={() => openFolder(folder.id)}>
                      {topPosters.length > 0 ? (
                        <div className="wl-poster-stack">
                          {topPosters.map((poster, i) => (
                            <img key={`${folder.id}-poster-${i}`} src={poster} alt={`${folder.name} stack ${i}`} loading="lazy" />
                          ))}
                        </div>
                      ) : (
                        <div className="wl-folder-poster-empty">
                          <svg fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125" /></svg>
                        </div>
                      )}
                      <div className="wl-folder-poster-overlay mm-scrim-bottom" />
                      <span
                        className="absolute top-2 left-2 z-30 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-white/90 shadow-lg border border-white/10"
                      >
                        {folder.items.length} {folder.items.length === 1 ? 'title' : 'titles'}
                      </span>
                      {folder.is_public && (
                        <span className="absolute top-2 right-2 z-30 px-2 py-0.5 rounded-md bg-brand-primary/80 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-white shadow-lg border border-white/10 flex items-center gap-1">
                          <Share2 size={10} /> Public
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="wl-folder-body">
                      <h3 className="wl-folder-name" onClick={() => openFolder(folder.id)}>{folder.name}</h3>
                      <p className="wl-folder-meta">{heroItem ? `Last added: ${heroItem.movie?.title || 'Untitled'}` : 'Empty folder'}</p>
                      <div className="wl-folder-actions hidden sm:flex">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            startEditFolder(folder);
                          }}
                          className="wl-folder-action-btn"
                          title="Edit Folder"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (folder.is_public) {
                              handleShareFolder(folder);
                            } else {
                              setPrivacyPromptFolder(folder);
                            }
                          }}
                          className="wl-folder-action-btn"
                          title="Share Folder"
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteFolder(folder.id, folder.name, folder.items.length);
                          }}
                          className="wl-folder-action-btn danger"
                          title="Delete Folder"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileActionFolder(folder);
                        }}
                        className="sm:hidden absolute bottom-2.5 right-2.5 p-2.5 bg-brand-surface/90 border border-white/10 text-white rounded-full z-30 shadow-xl backdrop-blur-xl transition-all active:scale-95 hover:bg-white/10"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SEARCH HISTORY SECTION */}
          {!activeFolder && !showWatchedView && (
            <div className="mt-12 animate-fade-in pb-12">
              <div className="wl-section-header mb-6 flex items-center justify-between">
                <div>
                  <h2 className="wl-section-title text-2xl font-bold">Recent Searches</h2>
                </div>
                {searchHistory.length > 0 && (
                  <button type="button" onClick={handleClearHistory} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-light hover:text-white flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50">
                    <TrashIcon className="w-3.5 h-3.5" /> Clear History
                  </button>
                )}
              </div>

              {searchHistory.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {searchHistory.map((sh, idx) => (
                    <Link
                      key={sh.id || idx}
                      to={`/search?q=${encodeURIComponent(sh.query)}`}
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2.5 text-sm font-medium shadow-sm"
                    >
                      <svg className="w-4 h-4 text-brand-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {sh.query}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center">
                  <svg className="w-10 h-10 text-white/20 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p className="text-brand-text-light text-sm">No recent searches yet — explore discovery or search for a title</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {editingFolder && (
        <div
          className="fixed inset-0 z-[12000] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-folder-title"
          onClick={closeEditFolder}
        >
          <div
            className="w-full sm:max-w-2xl bg-brand-surface border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl h-[88dvh] sm:h-[86dvh] max-h-[88dvh] sm:max-h-[86dvh] flex flex-col min-h-0 animate-scale-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="min-w-0">
                <h3 id="edit-folder-title" className="text-lg sm:text-xl font-bold text-white truncate">Edit folder</h3>
                <p className="text-sm text-brand-text-dark truncate">{editingFolder.name}</p>
              </div>
              <button
                type="button"
                onClick={closeEditFolder}
                className="p-2 rounded-lg hover:bg-white/10 text-white"
                aria-label="Close edit folder"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-5">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <WatchlistIconBadge iconKey={editFolderIcon} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-brand-text-dark">Preview</div>
                  <div className="text-white font-semibold truncate">{editFolderName.trim() || 'Untitled folder'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="folder-name-input" className="text-sm font-semibold text-white">Folder name</label>
                <input
                  id="folder-name-input"
                  value={editFolderName}
                  onChange={(event) => {
                    setEditFolderName(event.target.value);
                    setEditFolderError(null);
                  }}
                  className={`w-full rounded-lg border bg-black/30 px-4 py-3 text-white placeholder:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary ${editFolderError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10'}`}
                  placeholder="New folder name"
                  autoFocus
                />
                {editFolderError && (
                  <p className="text-xs text-red-400 mt-1">{editFolderError}</p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
                <WatchlistIconPicker selectedIcon={editFolderIcon} onSelect={setEditFolderIcon} compactLabel="Folder icon" />

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editFolderPublic ? 'bg-brand-primary border-brand-primary' : 'border-white/20 group-hover:border-white/40'}`}
                      onClick={() => setEditFolderPublic(!editFolderPublic)}
                    >
                      {editFolderPublic && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm text-brand-text-light font-medium" onClick={() => setEditFolderPublic(!editFolderPublic)}>Make this watchlist public</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-white/10 bg-brand-surface/70 backdrop-blur-md flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeEditFolder}
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFolderEdits}
                className="px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(folderDeleteTarget)}
        title={folderDeleteTarget ? `Delete "${folderDeleteTarget.name}"?` : 'Delete folder?'}
        description={folderDeleteTarget ? `This removes the folder and its ${folderDeleteTarget.count} saved title${folderDeleteTarget.count === 1 ? '' : 's'}.` : undefined}
        confirmLabel="Delete folder"
        tone="destructive"
        onConfirm={() => {
          if (!folderDeleteTarget) return;
          deleteFolder(folderDeleteTarget.id);
          if (activeFolderId === folderDeleteTarget.id) {
            openFolder(null);
          }
          setFolderDeleteTarget(null);
        }}
        onClose={() => setFolderDeleteTarget(null)}
      />

      <PromptDialog
        open={createFolderOpen}
        title="Create a new watchlist"
        description="Give the folder a short, memorable name. You can update its icon later."
        placeholder="Weekend picks"
        confirmLabel="Create folder"
        value={newFolderName}
        error={newFolderError}
        onChange={(value) => {
          setNewFolderName(value);
          if (newFolderError) setNewFolderError(null);
        }}
        onConfirm={handleCreateFolder}
        onClose={() => {
          setCreateFolderOpen(false);
          setNewFolderName('');
          setNewFolderPublic(false);
          setNewFolderError(null);
        }}
      >
        <div className="flex items-center gap-3 py-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newFolderPublic ? 'bg-brand-primary border-brand-primary' : 'border-white/20 group-hover:border-white/40'}`}
              onClick={() => setNewFolderPublic(!newFolderPublic)}
            >
              {newFolderPublic && <CheckIcon className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm text-brand-text-light font-medium" onClick={() => setNewFolderPublic(!newFolderPublic)}>Make this watchlist public</span>
          </label>
        </div>
      </PromptDialog>


      <NoticeDialog
        open={Boolean(notice)}
        title={notice?.title || ''}
        description={notice?.description}
        tone={notice?.tone}
        onClose={() => setNotice(null)}
      />

      {/* Share Modal */}
      {shareLink && (
        <div
          className="fixed inset-0 z-[12000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          onClick={() => {
            setSharingFolderId(null);
            setShareLink(null);
          }}
        >
          <div
            className="bg-brand-surface border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="share-modal-title" className="text-xl font-bold text-white mb-4">
              Share Watchlist
            </h3>

            <p className="text-sm text-brand-text-light mb-4">
              Anyone with this link can view your "{sharingFolder?.name || 'watchlist'}" watchlist:
            </p>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex items-center gap-3">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-white outline-none"
              />
              <button
                onClick={handleCopyShareLink}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {shareCopied ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} className="text-brand-text-light hover:text-white" />
                )}
              </button>
            </div>

            <p className="text-xs text-brand-text-dark mb-6">
              {shareCopied ? '✓ Link copied to clipboard' : 'Click the copy icon to share'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSharingFolderId(null);
                  setShareLink(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-light hover:text-white font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(shareLink, '_blank');
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                View Link
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Folder Action Sheet */}
      {mobileActionFolder && (
        <div className="fixed inset-0 z-[14000] sm:hidden flex items-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileActionFolder(null)}
          />
          <div className="relative w-full bg-brand-surface border-t border-white/10 rounded-t-3xl shadow-2xl p-6 flex flex-col animate-scale-up pb-8">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white px-2 mb-4 line-clamp-1">{mobileActionFolder.name}</h3>

            <button
              onClick={() => {
                setMobileActionFolder(null);
                startEditFolder(mobileActionFolder);
              }}
              className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-white/5 text-brand-text-light hover:text-white transition-colors text-left"
            >
              <EditIcon className="w-5 h-5" />
              <span className="text-lg">Edit Folder</span>
            </button>
            <button
              onClick={() => {
                if (mobileActionFolder) {
                  const folder = mobileActionFolder;
                  setMobileActionFolder(null);
                  if (folder.is_public) {
                    handleShareFolder(folder);
                  } else {
                    setPrivacyPromptFolder(folder);
                  }
                }
              }}
              className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-white/5 text-brand-text-light hover:text-white transition-colors text-left"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-lg">Share Folder</span>
            </button>
            <div className="h-px bg-white/5 mx-2 my-2" />
            <button
              onClick={() => {
                setMobileActionFolder(null);
                handleDeleteFolder(mobileActionFolder.id, mobileActionFolder.name, mobileActionFolder.items.length);
              }}
              className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors text-left"
            >
              <TrashIcon className="w-5 h-5" />
              <span className="text-lg">Delete Folder</span>
            </button>
          </div>
        </div>
      )}

      {privacyPromptFolder && (
        <ConfirmDialog
          open={!!privacyPromptFolder}
          title="Share Private Watchlist"
          description={`"${privacyPromptFolder.name}" is currently private. You need to make it public before you can share it with others.`}
          confirmLabel="Make Public & Share"
          onConfirm={async () => {
            const folder = privacyPromptFolder;
            setPrivacyPromptFolder(null);
            await setFolderPrivacy(folder.id, true);
            handleShareFolder(folder);
          }}
          onClose={() => setPrivacyPromptFolder(null)}
        >
          <div className="mt-4 p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/20 flex items-start gap-3">
            <div className="mt-0.5">
              <CheckSquare size={18} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Switch to Public</p>
              <p className="text-xs text-brand-text-dark mt-1">This will make the folder visible to anyone with the link.</p>
            </div>
          </div>
        </ConfirmDialog>
      )}

    </DashboardLayout>
  );
}
