import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/watchlist_service.dart';
import '../theme/app_colors.dart';

class WatchlistsScreen extends StatefulWidget {
  const WatchlistsScreen({super.key});

  @override
  State<WatchlistsScreen> createState() => _WatchlistsScreenState();
}

class _WatchlistsScreenState extends State<WatchlistsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) {
        Provider.of<WatchlistService>(context, listen: false).fetchFolders();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final watchlistService = Provider.of<WatchlistService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Watchlists'),
      ),
      body: watchlistService.isLoading
          ? const Center(child: CircularProgressIndicator())
          : watchlistService.folders.isEmpty
              ? const Center(
                  child: Text('No watchlists found.',
                      style: TextStyle(color: AppColors.textDark)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: watchlistService.folders.length,
                  itemBuilder: (context, index) {
                    final folder = watchlistService.folders[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: const Icon(Icons.folder_special_rounded,
                            color: AppColors.primary),
                        title: Text(folder.name,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${folder.items.length} titles'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {},
                      ),
                    );
                  },
                ),
    );
  }
}
