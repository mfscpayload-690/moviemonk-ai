import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/search_result.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../widgets/poster_card.dart';
import '../widgets/section_header.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/vibe_search_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();

  List<SearchResult> _trending = [];
  List<SearchResult> _popular = [];
  bool _isLoading = true;
  bool _isVibeLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _apiService.getTrending(),
        _apiService.search('marvel', type: 'movie'),
      ]);

      setState(() {
        _trending = results[0] as List<SearchResult>;
        _popular = (results[1] as SearchPageResponse).results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load recommendations. Please pull to refresh.';
        _isLoading = false;
      });
    }
  }

  void _onSearchSubmit(String query) {
    if (query.trim().isEmpty) return;
    context.push('/search?q=${Uri.encodeComponent(query.trim())}');
  }

  void _onVibeSubmit(String prompt) async {
    setState(() => _isVibeLoading = true);
    context.push('/search?q=${Uri.encodeComponent(prompt)}&mode=vibe');
    setState(() => _isVibeLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.movie_filter_rounded,
                  color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'MovieMonk AI',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmarks_outlined),
            onPressed: () => context.push('/watchlists'),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),

              // Standard Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _searchController,
                  onSubmitted: _onSearchSubmit,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Search movies, TV shows, actors...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.textDark),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: AppColors.textDark),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                          )
                        : null,
                  ),
                  onChanged: (val) => setState(() {}),
                ),
              ),

              const SizedBox(height: 16),

              // AI Vibe Search Card
              VibeSearchBar(
                onSubmit: _onVibeSubmit,
                isLoading: _isVibeLoading,
              ),

              const SizedBox(height: 20),

              if (_error != null)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: Column(
                      children: [
                        Text(_error!,
                            style: const TextStyle(color: AppColors.textDark)),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: _loadData,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),

              if (_isLoading) ...[
                const SectionHeader(title: 'Trending This Week'),
                SkeletonLoader.posterRow(),
                const SizedBox(height: 20),
                const SectionHeader(title: 'Popular Movies'),
                SkeletonLoader.posterGrid(),
              ] else ...[
                // Trending Section
                if (_trending.isNotEmpty) ...[
                  const SectionHeader(
                    title: 'Trending This Week',
                    icon: Icons.whatshot_rounded,
                  ),
                  SizedBox(
                    height: 240,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _trending.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final item = _trending[index];
                        return PosterCard(
                          id: item.id,
                          title: item.title,
                          year: item.year,
                          mediaType: item.mediaType,
                          posterUrl: item.posterUrl,
                          rating: item.rating,
                          width: 130,
                          onTap: () =>
                              context.push('/${item.mediaType}/${item.id}'),
                        );
                      },
                    ),
                  ),
                ],

                const SizedBox(height: 16),

                // Popular Section
                if (_popular.isNotEmpty) ...[
                  const SectionHeader(
                    title: 'Popular Right Now',
                    icon: Icons.star_rounded,
                  ),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.55,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: _popular.length,
                    itemBuilder: (context, index) {
                      final item = _popular[index];
                      return PosterCard(
                        id: item.id,
                        title: item.title,
                        year: item.year,
                        mediaType: item.mediaType,
                        posterUrl: item.posterUrl,
                        rating: item.rating,
                        onTap: () =>
                            context.push('/${item.mediaType}/${item.id}'),
                      );
                    },
                  ),
                ],
              ],

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
