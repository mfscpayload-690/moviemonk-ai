import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/search_result.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../widgets/poster_card.dart';
import '../widgets/skeleton_loader.dart';

class SearchScreen extends StatefulWidget {
  final String query;
  final String mode;

  const SearchScreen({super.key, required this.query, this.mode = 'keyword'});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ApiService _apiService = ApiService();
  late TextEditingController _controller;

  SearchPageResponse? _response;
  bool _isLoading = true;
  String? _error;
  String _typeFilter = 'all';

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.query);
    _performSearch();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _performSearch() async {
    final q = _controller.text.trim();
    if (q.isEmpty) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = widget.mode == 'vibe'
          ? await _apiService.vibeSearch(q)
          : await _apiService.search(q, type: _typeFilter);

      setState(() {
        _response = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Search failed. Please try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          onSubmitted: (_) => _performSearch(),
          textInputAction: TextInputAction.search,
          decoration: const InputDecoration(
            hintText: 'Search...',
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: _performSearch,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('All', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Movies', 'movie'),
                const SizedBox(width: 8),
                _buildFilterChip('TV Shows', 'tv'),
              ],
            ),
          ),

          // Vibe info banner if present
          if (_response?.vibe != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome, color: AppColors.accent, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _response!.vibe!.summary,
                      style: const TextStyle(
                        color: AppColors.textLight,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          Expanded(
            child: _isLoading
                ? SkeletonLoader.posterGrid()
                : _error != null
                    ? Center(
                        child: Text(_error!,
                            style: const TextStyle(color: AppColors.textDark)),
                      )
                    : _response == null || _response!.results.isEmpty
                        ? const Center(
                            child: Text(
                              'No results found.',
                              style: TextStyle(color: AppColors.textDark),
                            ),
                          )
                        : GridView.builder(
                            padding: const EdgeInsets.all(16),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.55,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 16,
                            ),
                            itemCount: _response!.results.length,
                            itemBuilder: (context, index) {
                              final item = _response!.results[index];
                              return PosterCard(
                                id: item.id,
                                title: item.title,
                                year: item.year,
                                mediaType: item.mediaType,
                                posterUrl: item.posterUrl,
                                rating: item.rating,
                                onTap: () => context.push(
                                    '/${item.mediaType}/${item.id}'),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final selected = _typeFilter == value;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (val) {
        if (val) {
          setState(() => _typeFilter = value);
          _performSearch();
        }
      },
    );
  }
}
