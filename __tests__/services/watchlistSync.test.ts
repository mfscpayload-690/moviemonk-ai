const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      update: mockUpdate
    }))
  }
}));

import { addCloudFolder, updateCloudFolderIcon } from '../../services/watchlistSync';

describe('services/watchlistSync icon writes', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
  });

  it('includes icon payload when adding a cloud folder', async () => {
    mockInsert.mockResolvedValue({ error: null });

    await addCloudFolder('user-1', 'Favorites', '#7c3aed', 'heart', '3d62034e-ec72-4d9f-8ff7-84e28c6540f4');

    expect(mockInsert).toHaveBeenCalledWith({
      id: '3d62034e-ec72-4d9f-8ff7-84e28c6540f4',
      user_id: 'user-1',
      name: 'Favorites',
      color: '#7c3aed',
      icon: 'heart'
    });
  });

  it('treats missing icon column as non-fatal on icon update', async () => {
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: { message: 'column "icon" of relation "watchlist_folders" does not exist' } });

    await expect(updateCloudFolderIcon('folder-1', 'heart')).resolves.toBeUndefined();
  });

  it('throws when icon update fails for non-schema reason', async () => {
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: { message: 'permission denied' } });

    await expect(updateCloudFolderIcon('folder-1', 'heart')).rejects.toEqual({ message: 'permission denied' });
  });
});
