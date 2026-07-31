import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/movie_data.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../widgets/cast_row.dart';
import '../widgets/rating_badge.dart';
import '../widgets/similar_carousel.dart';
import '../widgets/skeleton_loader.dart';

class MovieDetailScreen extends StatefulWidget {
  final String mediaType;
  final int tmdbId;

  const MovieDetailScreen({
    super.key,
    required this.mediaType,
    required this.tmdbId,
  });

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  final ApiService _apiService = ApiService();

  DetailsResponse? _details;
  bool _isLoading = true;
  String? _error;
  bool _revealSuspense = false;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await _apiService.getDetails(widget.mediaType, widget.tmdbId);
      setState(() {
        _details = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load details.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(),
        body: SkeletonLoader.detailSkeleton(),
      );
    }

    if (_error != null || _details == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error ?? 'Unknown error',
                  style: const TextStyle(color: AppColors.textDark)),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: _loadDetails,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final movie = _details!.data;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Hero Backdrop App Bar
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                movie.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  shadows: [Shadow(blurRadius: 10, color: Colors.black)],
                ),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (movie.backdropUrl.isNotEmpty)
                    CachedNetworkImage(
                      imageUrl: movie.backdropUrl,
                      fit: BoxFit.cover,
                    ),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.background,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content Details
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Meta info row (year, rating, type)
                  Row(
                    children: [
                      if (movie.year.isNotEmpty) ...[
                        Text(movie.year,
                            style: const TextStyle(
                                color: AppColors.textDark,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(width: 12),
                      ],
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          movie.type.toUpperCase(),
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Genre Chips
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: movie.genres
                        .map((g) => Chip(
                              label: Text(g),
                              backgroundColor: AppColors.surfaceLight,
                            ))
                        .toList(),
                  ),

                  const SizedBox(height: 16),

                  // Ratings Row
                  if (movie.ratings.isNotEmpty) ...[
                    Row(
                      children: movie.ratings
                          .map((r) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: RatingBadge(
                                  source: r.source,
                                  score: r.score,
                                  compact: true,
                                ),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Overview / Summary
                  const Text(
                    'Overview',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    movie.summaryMedium.isNotEmpty
                        ? movie.summaryMedium
                        : movie.summaryShort,
                    style: const TextStyle(
                      color: AppColors.textDark,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Suspense Breaker (Twist reveal)
                  if (movie.suspenseBreaker.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.lock_clock,
                                  color: AppColors.warning, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Suspense Breaker (Spoiler)',
                                style: TextStyle(
                                  color: AppColors.textLight,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          _revealSuspense
                              ? Text(
                                  movie.suspenseBreaker,
                                  style: const TextStyle(
                                    color: AppColors.warning,
                                    fontSize: 13,
                                  ),
                                )
                              : TextButton.icon(
                                  onPressed: () =>
                                      setState(() => _revealSuspense = true),
                                  icon: const Icon(Icons.visibility),
                                  label: const Text('Tap to reveal main twist'),
                                ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Cast Section
                  if (movie.cast.isNotEmpty) ...[
                    const Text(
                      'Cast',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textLight,
                      ),
                    ),
                    const SizedBox(height: 12),
                    CastRow(cast: movie.cast),
                    const SizedBox(height: 24),
                  ],

                  // Trailer link
                  if (movie.trailerUrl.isNotEmpty) ...[
                    ElevatedButton.icon(
                      onPressed: () => launchUrl(Uri.parse(movie.trailerUrl)),
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Watch Official Trailer'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Similar Carousel
                  if (_details!.similar.isNotEmpty) ...[
                    SimilarCarousel(
                      title: 'Similar Titles',
                      items: _details!.similar,
                    ),
                    const SizedBox(height: 30),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
