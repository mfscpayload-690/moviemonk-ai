import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Check } from 'lucide-react';
import type { SharedWatchlistView, WatchlistItem } from '../types';
import { useWatchlists } from '../hooks/useWatchlists';
import '../styles/shared-watchlist.css';

export function SharedWatchlistView() {
  const { token: shareToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveToFolder, addFolder } = useWatchlists();
  
  const [shareData, setShareData] = useState<SharedWatchlistView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);

  const sharedBy = shareData?.shared_by || 'User';
  const fullShareUrl = `${window.location.origin}/watchlists/share?token=${shareToken}`;

  useEffect(() => {
    const loadShare = async () => {
      try {
        setLoading(true);
        const token = shareToken || searchParams.get('token');
        
        if (!token) {
          setError('No share link provided');
          setLoading(false);
          return;
        }

        // Fetch shared watchlist from backend
        const res = await fetch(`/api/watchlists/share?token=${encodeURIComponent(token)}`);
        
        if (!res.ok) {
          throw new Error(`Failed to load shared watchlist: ${res.status}`);
        }

        const data: SharedWatchlistView = await res.json();
        setShareData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load shared watchlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [shareToken, searchParams]);

  const handleAddToMyWatchlist = (item: WatchlistItem) => {
    try {
      setAddingToWatchlist(item.id);
      
      // Create a new folder for this shared list
      const folderName = shareData?.folderName || 'Shared List';
      const folderIcon = shareData?.folderIcon;

      // Save item to watchlist
      saveToFolder('default', item.movie, item.saved_title);
      
      // Show success feedback
      setTimeout(() => setAddingToWatchlist(null), 500);
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
      setAddingToWatchlist(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImportWatchlist = () => {
    if (!shareData) return;
    
    try {
      // Create new folder with shared list name
      const newFolderId = addFolder(
        `${shareData.folderName} (shared)`,
        shareData.folderIcon
      );

      if (!newFolderId) return;

      // Add all items to the new folder
      shareData.items.forEach(item => {
        saveToFolder(newFolderId, item.movie, item.saved_title);
      });

      // Navigate to the new watchlist
      navigate(`/watchlists/${encodeURIComponent(`${shareData.folderName} (shared)`)}`);
    } catch (err) {
      console.error('Failed to import watchlist:', err);
    }
  };

  if (loading) {
    return (
      <div className="shared-watchlist-container">
        <div className="shared-loading">
          <div className="spinner"></div>
          <p>Loading shared watchlist...</p>
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="shared-watchlist-container">
        <div className="shared-error">
          <h2>Unable to Load Watchlist</h2>
          <p>{error || 'The watchlist could not be found or has expired.'}</p>
          <button onClick={() => navigate('/')} className="error-home-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-watchlist-container">
      <header className="shared-watchlist-header">
        <button 
          onClick={() => navigate(-1)}
          className="shared-back-btn"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="shared-header-content">
          <h1 className="shared-watchlist-title">{shareData.folderName}</h1>
          <p className="shared-by-text">Shared by {sharedBy} • {shareData.item_count} items</p>
        </div>
      </header>

      <div className="shared-actions">
        <button 
          onClick={handleImportWatchlist}
          className="shared-action-btn shared-action-primary"
        >
          <Plus size={18} />
          Add All to My Watchlists
        </button>
        <button 
          onClick={handleCopyLink}
          className="shared-action-btn shared-action-secondary"
        >
          <Copy size={18} />
          {copied ? 'Link Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="shared-items-list">
        {shareData.items.length === 0 ? (
          <div className="shared-empty">
            <p>No items in this watchlist yet</p>
          </div>
        ) : (
          shareData.items.map(item => (
            <div key={item.id} className="shared-item-card">
              <div className="shared-item-poster">
                <img 
                  src={item.movie.poster_url} 
                  alt={item.movie.title}
                  className="shared-poster-image"
                />
              </div>
              <div className="shared-item-details">
                <h3 className="shared-item-title">{item.movie.title}</h3>
                <p className="shared-item-year">{item.movie.year}</p>
                {item.movie.genres && item.movie.genres.length > 0 && (
                  <p className="shared-item-genres">
                    {item.movie.genres.slice(0, 2).join(', ')}
                  </p>
                )}
                {item.saved_title && (
                  <p className="shared-item-note">Notes: {item.saved_title}</p>
                )}
              </div>
              <button
                onClick={() => handleAddToMyWatchlist(item)}
                className={`shared-item-add-btn ${addingToWatchlist === item.id ? 'added' : ''}`}
                disabled={addingToWatchlist === item.id}
              >
                {addingToWatchlist === item.id ? (
                  <>
                    <Check size={16} />
                    Added
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <footer className="shared-watchlist-footer">
        <p className="footer-text">
          Found on MovieMonk • <a href="/">Visit MovieMonk</a>
        </p>
      </footer>
    </div>
  );
}
