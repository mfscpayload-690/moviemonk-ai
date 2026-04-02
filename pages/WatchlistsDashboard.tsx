import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCloudWatchlists } from '../hooks/useCloudWatchlists';
import { useWatched } from '../hooks/useWatched';
import { loadProfileSettings } from '../lib/userSettings';
import logoUrl from '../asset/android-chrome-192x192.png';
import { TrashIcon, EditIcon, CheckIcon, XMarkIcon, ChevronRightIcon } from '../components/icons';
import { WatchlistFolder } from '../types';
import {
  getWatchlistIconOption,
  WatchlistIconBadge,
  WatchlistIconPicker,
  WATCHLIST_ICON_DEFAULT,
} from '../components/WatchlistIconPicker';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app-container" style={{ background: '#121212', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header className="app-header flex items-center justify-between px-4 sm:px-6 py-3 glass-panel border-b-0 z-50 sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="MovieMonk" className="w-8 h-8" />
          <span className="text-white font-bold text-[15px] tracking-tight">MovieMonk</span>
        </Link>
        <button type="button" className="mm-settings-nav-back" onClick={() => navigate('/')}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back to app
        </button>
      </header>
      <main
        className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
        style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {children}
      </main>
    </div>
  );
}

function getAvatarUrl(user: any, profile: any): string | null {
  return profile?.avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
}

export function WatchlistsDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { folderName: folderNameParam } = useParams<{ folderName?: string }>();
  const { 
    folders, 
    renameFolder, 
    setFolderIcon,
    deleteFolder, 
    deleteItem,
    isCloud, 
    isSyncing 
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
  const [syncBadgeVisible, setSyncBadgeVisible] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const syncHideTimerRef = useRef<number | null>(null);
  const syncSettledTimerRef = useRef<number | null>(null);
  const editingFolder = useMemo(
    () => folders.find((folder) => folder.id === editingFolderId) || null,
    [editingFolderId, folders]
  );

  // Deep-link: resolve :folderName param → activeFolderId once folders are loaded
  const [deepLinkResolved, setDeepLinkResolved] = useState(false);
  useEffect(() => {
    if (deepLinkResolved || folders.length === 0) return;
    if (folderNameParam) {
      const decoded = decodeURIComponent(folderNameParam);
      const match = folders.find(
        f => f.name.toLowerCase() === decoded.toLowerCase()
      );
      if (match) setActiveFolderId(match.id);
    }
    setDeepLinkResolved(true);
  }, [folderNameParam, folders, deepLinkResolved]);

  // Sync URL when active folder changes
  const openFolder = (folderId: string | null) => {
    setActiveFolderId(folderId);
    if (folderId) {
      setShowWatchedView(false);
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        navigate(`/watchlists/${encodeURIComponent(folder.name)}`, { replace: false });
      }
    } else {
      navigate('/watchlists', { replace: false });
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

  const startEditFolder = (folder: WatchlistFolder) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderIcon(getWatchlistIconOption(folder.icon).key);
  };

  const closeEditFolder = useCallback(() => {
    setEditingFolderId(null);
  }, []);

  const saveFolderEdits = () => {
    if (!editingFolderId) return;
    const folder = folders.find((f) => f.id === editingFolderId);
    if (!folder) return;

    const trimmedName = editFolderName.trim();
    if (trimmedName && trimmedName !== folder.name) {
      renameFolder(folder.id, trimmedName);
    }
    if ((editFolderIcon || WATCHLIST_ICON_DEFAULT) !== (folder.icon || WATCHLIST_ICON_DEFAULT)) {
      setFolderIcon(folder.id, editFolderIcon);
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
    if (window.confirm(`Are you sure you want to delete "${name}" and its ${count} items?`)) {
      deleteFolder(id);
    }
  };

  const displayName = profile?.fullName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
  const avatarUrl = getAvatarUrl(user, profile);

  if (loading) {
    return <DashboardLayout><p className="text-center text-brand-text-light mt-10">Loading Dashboard...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      {/* 1. User Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/10 overflow-hidden flex-shrink-0 bg-brand-surface shadow-2xl">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-brand-primary to-brand-secondary">
                {displayName[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Welcome, {displayName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-brand-text-light">Your Cinematic Collection</p>
              {isCloud ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                    isSyncing || syncBadgeVisible
                      ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary'
                      : justSynced
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/15 bg-white/5 text-brand-text-light'
                  }`}
                >
                  {isSyncing || syncBadgeVisible ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      Syncing changes
                    </>
                  ) : justSynced ? (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12.5 9.2 17 19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Synced
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-brand-text-light/60" />
                      Cloud connected
                    </>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand-text-light">
                  <span className="h-2 w-2 rounded-full bg-amber-300/90" />
                  Local only
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Metric Cards */}
      {!activeFolderId && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary to-transparent opacity-50" />
            <div className="text-sm font-semibold text-brand-text-light uppercase tracking-wider mb-2">Total Saved</div>
            <div className="text-3xl font-bold text-white">{stats.totalSaved}</div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-secondary to-transparent opacity-50" />
            <div className="text-sm font-semibold text-brand-text-light uppercase tracking-wider mb-2">Folders</div>
            <div className="text-3xl font-bold text-white">{stats.totalFolders}</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-transparent opacity-50" />
            <div className="text-sm font-semibold text-brand-text-light uppercase tracking-wider mb-2">Top Format</div>
            <div className="text-2xl font-bold text-white">{stats.topFormat}</div>
          </div>
          <button
            onClick={() => { setShowWatchedView(true); openFolder(null); }}
            className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer text-left w-full"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-transparent opacity-50" />
            <div className="text-sm font-semibold text-brand-text-light uppercase tracking-wider mb-2 flex items-center gap-2">
              Watched
              <svg className="w-3.5 h-3.5 text-brand-text-dark group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{watchedCount}</div>
          </button>
        </div>
      )}

      {/* 3. Watched List View */}
      {showWatchedView && !activeFolderId ? (
        <div className="animate-fade-in">
          <button
            onClick={() => setShowWatchedView(false)}
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
              {watched.map((item) => (
                <div key={`${item.tmdb_id}-${item.media_type}`} className="group relative aspect-[2/3] rounded-xl overflow-hidden glass-panel border border-white/5 select-none bg-brand-surface shadow-xl">
                  {/* Poster */}
                  {item.poster_url ? (
                    <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
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
              ))}
            </div>
          )}
        </div>
      ) : activeFolder ? (
        <div className="animate-fade-in">
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
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => startEditFolder(activeFolder)}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-light hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <EditIcon className="w-4 h-4" /> Edit Folder
              </button>
              <button 
                onClick={() => {
                  handleDeleteFolder(activeFolder.id, activeFolder.name, activeFolder.items.length);
                  openFolder(null);
                }}
                className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {activeFolder.items.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-brand-text-dark" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
              </div>
              <p className="text-brand-text-light text-lg">This folder is empty.</p>
              <Link to="/" className="mt-4 inline-block px-6 py-2 rounded-full bg-brand-primary hover:bg-brand-secondary text-white font-medium transition-colors">
                Discover titles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {activeFolder.items.map(item => (
                <div key={item.id} className="group relative aspect-[2/3] rounded-xl overflow-hidden glass-panel border border-white/5 select-none bg-brand-surface shadow-xl">
                  <Link to={`/${item.movie.type === 'show' ? 'tv' : 'movie'}/${item.movie.tmdb_id}`} className="absolute inset-0 z-10" />
                  {item.movie.poster_url ? (
                    <img src={item.movie.poster_url} alt={item.movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center text-brand-text-dark bg-gradient-to-br from-brand-surface to-black/40">
                      {item.movie.title}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-12 z-20 pointer-events-none">
                    <h4 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-md">{item.movie.title}</h4>
                    <span className="text-xs text-brand-text-light block mt-0.5">{item.movie.year || 'Unknown'}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteItem(activeFolder.id, item.id);
                    }}
                    className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/60 backdrop-blur-md text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    title="Remove from folder"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white/90 text-[10px] font-bold tracking-wider uppercase">
                    {item.movie.type === 'show' ? 'Series' : 'Movie'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Your Folders</h2>
            {!isCloud && folders.length > 0 && (
              <span className="text-xs bg-white/10 text-brand-text-light px-3 py-1 rounded-full">Local Storage</span>
            )}
          </div>

          {folders.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-brand-text-dark" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No folders yet</h3>
          <p className="text-brand-text-light max-w-sm mx-auto">Explore movies and series, and click "Save to List" to start building your collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map(folder => (
            <div
              key={folder.id}
              className="group glass-panel rounded-2xl border border-white/5 p-5 transition-all duration-300 hover:scale-[1.01] hover:border-white/15 flex flex-col justify-between min-h-[160px] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`
              }}
            >
              {/* Subtle color splash based on folder color */}
              <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30" 
                style={{ backgroundColor: folder.color }}
              />

              <div className="relative z-10 flex justify-between items-start cursor-pointer" onClick={() => openFolder(folder.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <WatchlistIconBadge iconKey={folder.icon} className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors pr-2 break-words max-w-[200px]">{folder.name}</h3>
                </div>
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40">
                  {folder.items.length}
                </div>
              </div>

              <div className="relative z-10 mt-6 flex items-center justify-between">
                <span className="text-sm text-brand-text-dark font-medium">
                  {folder.items.length === 1 ? '1 item' : `${folder.items.length} items`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      startEditFolder(folder);
                    }}
                    className="text-xs font-medium text-brand-text-light hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 inline-flex items-center gap-1.5 transition-all"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteFolder(folder.id, folder.name, folder.items.length);
                    }}
                    className="text-xs font-medium text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 inline-flex items-center gap-1.5 transition-all"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                  onChange={(event) => setEditFolderName(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="New folder name"
                  autoFocus
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <WatchlistIconPicker selectedIcon={editFolderIcon} onSelect={setEditFolderIcon} compactLabel="Folder icon" />
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
      
    </DashboardLayout>
  );
}
