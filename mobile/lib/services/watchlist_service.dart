import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/watchlist.dart';

/// Service managing user watchlists with Supabase cloud sync.
class WatchlistService extends ChangeNotifier {
  List<WatchlistFolder> _folders = [];
  bool _isLoading = false;

  List<WatchlistFolder> get folders => _folders;
  bool get isLoading => _isLoading;

  /// Fetch folders for authenticated user or return local defaults
  Future<void> fetchFolders() async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        _folders = _defaultFolders();
      } else {
        final res = await Supabase.instance.client
            .from('watchlist_folders')
            .select('*, watchlist_items(*)')
            .eq('user_id', user.id);

        _folders = (res as List)
            .map((f) => WatchlistFolder.fromJson(f as Map<String, dynamic>))
            .toList();
        if (_folders.isEmpty) {
          _folders = _defaultFolders();
        }
      }
    } catch (e) {
      debugPrint('Error fetching watchlists: $e');
      _folders = _defaultFolders();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Remove a title from all watchlist folders (e.g. when marked as Watched).
  Future<void> removeTitleFromWatchlists(int tmdbId, String mediaType) async {
    final targetMediaType = mediaType == 'show' ? 'tv' : mediaType;

    _folders = _folders.map((folder) {
      final filteredItems = folder.items.where((item) {
        final itemTmdb = int.tryParse(item.movie.tmdbId ?? '') ?? 0;
        final itemType = (item.movie.mediaType ?? item.movie.type) == 'show' ? 'tv' : (item.movie.mediaType ?? item.movie.type);
        return !(itemTmdb == tmdbId && itemType == targetMediaType);
      }).toList();

      return WatchlistFolder(
        id: folder.id,
        name: folder.name,
        icon: folder.icon,
        isPublic: folder.isPublic,
        items: filteredItems,
      );
    }).toList();

    notifyListeners();

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        await Supabase.instance.client
            .from('watchlist_items')
            .delete()
            .eq('tmdb_id', tmdbId.toString())
            .eq('media_type', targetMediaType);
      }
    } catch (e) {
      debugPrint('Error purging watched title from cloud watchlists: $e');
    }
  }

  List<WatchlistFolder> _defaultFolders() {
    return [
      WatchlistFolder(
        id: 'favorites',
        name: 'Favorites',
        icon: 'heart',
        items: [],
      ),
      WatchlistFolder(
        id: 'plan_to_watch',
        name: 'Plan to Watch',
        icon: 'bookmark',
        items: [],
      ),
    ];
  }
}
