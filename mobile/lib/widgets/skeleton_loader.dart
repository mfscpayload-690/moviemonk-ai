import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_colors.dart';

/// Shimmer skeleton for poster cards during loading.
class SkeletonLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surface,
      highlightColor: AppColors.surfaceLight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }

  /// Grid of poster card skeletons.
  static Widget posterGrid({int count = 6}) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.58,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: count,
      itemBuilder: (context, index) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SkeletonLoader(
              width: double.infinity,
              height: 220,
              borderRadius: 14,
            ),
            const SizedBox(height: 8),
            SkeletonLoader(width: 120, height: 14),
            const SizedBox(height: 4),
            SkeletonLoader(width: 60, height: 12),
          ],
        );
      },
    );
  }

  /// Horizontal row of poster skeletons.
  static Widget posterRow({int count = 5}) {
    return SizedBox(
      height: 200,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: count,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, _) =>
            const SkeletonLoader(width: 130, height: 200, borderRadius: 14),
      ),
    );
  }

  /// Detail screen skeleton.
  static Widget detailSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SkeletonLoader(
            width: double.infinity, height: 280, borderRadius: 0),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonLoader(width: 200, height: 24),
              const SizedBox(height: 8),
              SkeletonLoader(width: 120, height: 16),
              const SizedBox(height: 16),
              SkeletonLoader(width: double.infinity, height: 60),
              const SizedBox(height: 16),
              SkeletonLoader(width: double.infinity, height: 100),
            ],
          ),
        ),
      ],
    );
  }
}
