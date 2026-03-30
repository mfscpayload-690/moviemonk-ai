import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCloudWatchlists } from '../hooks/useCloudWatchlists';
import { loadProfileSettings } from '../lib/userSettings';
import logoUrl from '../asset/android-chrome-192x192.png';
import { TrashIcon, EditIcon, CheckIcon, XMarkIcon, ChevronRightIcon, BellIcon } from '../components/icons';
import { WatchlistFolder } from '../types';

export const WATCHLIST_COLORS = ['#7c3aed', '#db2777', '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7'];

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app-container" style={{ background: '#121212', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
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
  const { 
    folders, 
    renameFolder, 
    setFolderColor, 
    deleteFolder, 
    isCloud, 
    isSyncing 
  } = useCloudWatchlists();

  const [profile, setProfile] = useState<any>(null);

  // Edit State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('#7c3aed');

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
    setEditFolderColor(folder.color || '#7c3aed');
  };

  const saveFolderEdits = () => {
    if (!editingFolderId) return;
    const folder = folders.find((f) => f.id === editingFolderId);
    if (!folder) return;

    const trimmedName = editFolderName.trim();
    if (trimmedName && trimmedName !== folder.name) {
      renameFolder(folder.id, trimmedName);
    }
    if (editFolderColor !== folder.color) {
      setFolderColor(folder.id, editFolderColor);
    }
    setEditingFolderId(null);
  };

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
            <p className="text-brand-text-light mt-1 flex items-center gap-2">
              Your Cinematic Collection {isSyncing && <span className="text-xs text-brand-primary animate-pulse">(Syncing...)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
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
      </div>

      {/* 3. Watchlist Grid */}
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

              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: folder.color, boxShadow: `0 0 12px ${folder.color}80` }} />
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">{folder.name}</h3>
                </div>
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40">
                  {folder.items.length}
                </div>
              </div>

              {/* Edit Mode Inline */}
              {editingFolderId === folder.id ? (
                <div className="relative z-10 mt-4 space-y-3 bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <input
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-shadow"
                    placeholder="Folder name"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {WATCHLIST_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditFolderColor(color)}
                          className={`w-5 h-5 rounded-full border ${editFolderColor === color ? 'border-white ring-1 ring-white/50 scale-110' : 'border-transparent'} transition-all`}
                          style={{ backgroundColor: color }}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingFolderId(null)} className="p-1.5 rounded-md hover:bg-white/10 text-brand-text-light hover:text-white transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                      <button onClick={saveFolderEdits} className="p-1.5 rounded-md hover:bg-brand-primary/20 text-brand-primary transition-colors">
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-sm text-brand-text-dark font-medium">
                    {folder.items.length === 1 ? '1 item' : `${folder.items.length} items`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEditFolder(folder)}
                      className="text-xs font-medium text-brand-text-light hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 inline-flex items-center gap-1.5 transition-all"
                    >
                      <EditIcon className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id, folder.name, folder.items.length)}
                      className="text-xs font-medium text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 inline-flex items-center gap-1.5 transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
              
              {/* Fallback for mobile / touch devices since hover is tricky */}
              {!editingFolderId && (
                <div className="sm:hidden relative z-10 mt-6 flex items-center justify-between">
                  <span className="text-sm text-brand-text-dark font-medium">
                    {folder.items.length === 1 ? '1 item' : `${folder.items.length} items`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditFolder(folder)} className="p-1.5 text-brand-text-light">
                      <EditIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* 4. Recent Items Preview (Optional future expansion) */}
      {stats.totalSaved > 0 && (
        <div className="mt-12 text-center">
          <p className="text-brand-text-dark text-sm inline-flex items-center gap-2">
            Go back to <Link to="/" className="text-brand-primary hover:underline">Search</Link> to view folder contents and continue building your collection.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
