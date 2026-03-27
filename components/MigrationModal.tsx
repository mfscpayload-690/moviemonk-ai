import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WATCHLIST_MIGRATION_EVENT, WATCHLIST_STORAGE_KEY } from '../hooks/useCloudWatchlists';
import { loadWatchlistsFromStorage } from '../hooks/watchlistStore';
import { fetchCloudWatchlists, uploadWatchlistsToCloud } from '../services/watchlistSync';

const MIGRATION_DECISION_PREFIX = 'moviemonk_watchlist_migration_choice_v1';

function getMigrationDecisionKey(userId: string): string {
  return `${MIGRATION_DECISION_PREFIX}:${userId}`;
}

export const MigrationModal: React.FC = () => {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const decisionKey = useMemo(() => (user?.id ? getMigrationDecisionKey(user.id) : null), [user?.id]);

  useEffect(() => {
    let cancelled = false;
    if (loading || !user?.id || !decisionKey) return;

    const shouldShow = async () => {
      if (localStorage.getItem(decisionKey) === 'done') return;
      const localFolders = loadWatchlistsFromStorage(localStorage);
      if (localFolders.length === 0) return;

      const cloudFolders = await fetchCloudWatchlists(user.id);
      if (!cancelled && cloudFolders.length === 0) {
        setVisible(true);
      }
    };

    void shouldShow().catch((error) => {
      console.warn('Failed to evaluate migration modal state', error);
    });

    return () => {
      cancelled = true;
    };
  }, [decisionKey, loading, user?.id]);

  if (!visible || !user?.id || !decisionKey) return null;

  const finalizeChoice = () => {
    localStorage.setItem(decisionKey, 'done');
    setVisible(false);
    window.dispatchEvent(new Event(WATCHLIST_MIGRATION_EVENT));
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const localFolders = loadWatchlistsFromStorage(localStorage);
      if (localFolders.length > 0) {
        await uploadWatchlistsToCloud(user.id, localFolders);
      }
      localStorage.removeItem(WATCHLIST_STORAGE_KEY);
      finalizeChoice();
    } catch (error) {
      console.warn('Failed to migrate watchlists to cloud', error);
    } finally {
      setBusy(false);
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem(WATCHLIST_STORAGE_KEY);
    finalizeChoice();
  };

  return (
    <div className="migration-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="migration-title">
      <div className="migration-modal-card">
        <h3 id="migration-title">Import Your Watchlists</h3>
        <p>
          We found watchlists saved on this device. Would you like to import them to your account?
        </p>
        <div className="migration-modal-actions">
          <button type="button" className="migration-btn-primary" onClick={() => void handleImport()} disabled={busy}>
            {busy ? 'Importing...' : 'Import to Cloud'}
          </button>
          <button type="button" className="migration-btn-secondary" onClick={handleStartFresh} disabled={busy}>
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};
