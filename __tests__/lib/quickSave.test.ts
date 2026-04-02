import {
  QUICK_SAVE_DEFAULT_COLOR,
  canSubmitQuickSave,
  getClosedQuickSaveState,
  getOpenedQuickSaveState,
  resolvePreferredQuickSaveFolderId
} from '../../lib/quickSave';
import { WatchlistFolder } from '../../types';

const makeFolder = (id: string, name: string): WatchlistFolder => ({
  id,
  name,
  color: '#7c3aed',
  icon: 'folder',
  items: []
});

describe('lib/quickSave', () => {
  it('prefers watchlist-like folder names when opening', () => {
    const folders = [makeFolder('a', 'Weekend Picks'), makeFolder('b', 'My Watchlist')];
    expect(resolvePreferredQuickSaveFolderId(folders)).toBe('b');
  });

  it('uses create-first defaults when no folders exist', () => {
    const opened = getOpenedQuickSaveState(
      { id: 10, media_type: 'movie', title: 'Dune' },
      [],
      'folder'
    );
    expect(opened.target?.title).toBe('Dune');
    expect(opened.folderId).toBe('');
    expect(opened.newFolderName).toBe('Watchlist');
    expect(opened.newFolderColor).toBe(QUICK_SAVE_DEFAULT_COLOR);
    expect(opened.newFolderIcon).toBe('folder');
  });

  it('supports close/reset and save validation flow', () => {
    const closed = getClosedQuickSaveState('folder');
    expect(closed.target).toBeNull();
    expect(canSubmitQuickSave(closed)).toBe(false);

    const canSaveByExistingFolder = canSubmitQuickSave({ ...closed, folderId: 'folder-1' });
    const canSaveByNewName = canSubmitQuickSave({ ...closed, newFolderName: 'Sci-Fi' });

    expect(canSaveByExistingFolder).toBe(true);
    expect(canSaveByNewName).toBe(true);
  });
});
