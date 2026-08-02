import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';

/// Movie/TV poster card with image, title, year, and optional rating overlay.
class PosterCard extends StatelessWidget {
  final int id;
  final String title;
  final String? year;
  final String mediaType; // movie | tv
  final String? posterUrl;
  final double? rating;
  final VoidCallback? onTap;
  final double width;

  const PosterCard({
    super.key,
    required this.id,
    required this.title,
    this.year,
    required this.mediaType,
    this.posterUrl,
    this.rating,
    this.onTap,
    this.width = double.infinity,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Poster image
            AspectRatio(
              aspectRatio: 2 / 3,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Image
                    if (posterUrl != null && posterUrl!.isNotEmpty)
                      CachedNetworkImage(
                        imageUrl: posterUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(
                          color: AppColors.surface,
                          child: const Center(
                            child: Icon(Icons.movie_outlined,
                                color: AppColors.textMuted, size: 32),
                          ),
                        ),
                        errorWidget: (_, _, _) => Container(
                          color: AppColors.surface,
                          child: const Center(
                            child: Icon(Icons.broken_image_outlined,
                                color: AppColors.textMuted, size: 32),
                          ),
                        ),
                      )
                    else
                      Container(
                        color: AppColors.surface,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.movie_outlined,
                                  color: AppColors.textMuted, size: 32),
                              const SizedBox(height: 8),
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 8),
                                child: Text(
                                  title,
                                  style: const TextStyle(
                                    color: AppColors.textDark,
                                    fontSize: 11,
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Rating overlay
                    if (rating != null && rating! > 0)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.75),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.star_rounded,
                                size: 13,
                                color: rating! >= 7
                                    ? AppColors.ratingGreen
                                    : rating! >= 5
                                        ? AppColors.ratingYellow
                                        : AppColors.ratingRed,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                rating!.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Media type badge
                    if (mediaType == 'tv')
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'TV',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Title
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                    height: 1.2,
                  ),
            ),
            if (year != null && year!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                year!,
                style: const TextStyle(
                  color: AppColors.textDark,
                  fontSize: 12,
                ),
              ),
            ],
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }
}
