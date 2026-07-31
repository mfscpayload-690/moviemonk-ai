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
