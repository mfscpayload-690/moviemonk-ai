import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/auth_service.dart';
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
    final auth = Provider.of<AuthService>(context);
    final watchlistService = Provider.of<WatchlistService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Watchlists'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => watchlistService.fetchFolders(),
            tooltip: 'Refresh watchlists',
          ),
        ],
      ),
      body: watchlistService.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => watchlistService.fetchFolders(),
              color: AppColors.primary,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Sign-in prompt for guest users
                  if (!auth.isAuthenticated) ...[
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.surfaceLight),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.cloud_sync_outlined,
                              color: AppColors.accent, size: 28),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'Cloud Sync Disabled',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: AppColors.textLight,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Sign in to synchronize watchlists and ratings across your devices.',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => context.push('/login'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 8),
                              textStyle: const TextStyle(fontSize: 12),
                            ),
                            child: const Text('Sign In'),
                          ),
                        ],
                      ),
                    ),
                  ],

                  if (watchlistService.folders.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Text(
                          'No watchlists found.',
                          style: TextStyle(color: AppColors.textDark),
                        ),
                      ),
                    )
                  else
                    ...watchlistService.folders.map((folder) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Theme(
                          data: Theme.of(context).copyWith(
                            dividerColor: Colors.transparent,
                          ),
                          child: ExpansionTile(
                            leading: const Icon(Icons.folder_special_rounded,
                                color: AppColors.primary),
                            title: Text(
                              folder.name,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textLight),
                            ),
                            subtitle: Text(
                              '${folder.items.length} ${folder.items.length == 1 ? "title" : "titles"}',
                              style: const TextStyle(
                                  color: AppColors.textDark, fontSize: 12),
                            ),
                            children: folder.items.isEmpty
                                ? [
                                    const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Text(
                                        'No titles in this list yet.',
                                        style: TextStyle(
                                            color: AppColors.textDark,
                                            fontSize: 13),
                                      ),
                                    ),
                                  ]
                                : folder.items.map((item) {
                                    final mediaType =
                                        item.movie.mediaType ??
                                        (item.movie.type == 'show' ? 'tv' : 'movie');
                                    final tmdbId = item.movie.tmdbId ?? '';

                                    return ListTile(
                                      leading: ClipRRect(
                                        borderRadius: BorderRadius.circular(6),
                                        child: SizedBox(
                                          width: 36,
                                          height: 52,
                                          child: item.movie.posterUrl.isNotEmpty
                                              ? CachedNetworkImage(
                                                  imageUrl: item.movie.posterUrl,
                                                  fit: BoxFit.cover,
                                                  errorWidget: (_, _, _) =>
                                                      Container(
                                                          color: AppColors.surface),
                                                )
                                              : Container(
                                                  color: AppColors.surface,
                                                  child: const Icon(
                                                      Icons.movie_outlined,
                                                      size: 18),
                                                ),
                                        ),
                                      ),
                                      title: Text(
                                        item.savedTitle.isNotEmpty
                                            ? item.savedTitle
                                            : item.movie.title,
                                        style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500),
                                      ),
                                      subtitle: item.movie.year.isNotEmpty
                                          ? Text(item.movie.year,
                                              style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.textDark))
                                          : null,
                                      trailing: const Icon(Icons.chevron_right,
                                          size: 18, color: AppColors.textDark),
                                      onTap: () {
                                        if (tmdbId.isNotEmpty) {
                                          context.push('/$mediaType/$tmdbId');
                                        }
                                      },
                                    );
                                  }).toList(),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
