import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/movie_data.dart';
import '../theme/app_colors.dart';

/// Horizontal scrollable cast member row.
class CastRow extends StatelessWidget {
  final List<CastMember> cast;
  final void Function(int personId)? onTap;

  const CastRow({super.key, required this.cast, this.onTap});

  @override
  Widget build(BuildContext context) {
    if (cast.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 140,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: cast.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final member = cast[index];
          return GestureDetector(
            onTap: member.id != null ? () => onTap?.call(member.id!) : null,
            child: SizedBox(
              width: 80,
              child: Column(
                children: [
                  // Profile image
                  ClipOval(
                    child: SizedBox(
                      width: 64,
                      height: 64,
                      child: member.profileUrl != null &&
                              member.profileUrl!.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: member.profileUrl!,
                              fit: BoxFit.cover,
                              placeholder: (_, _) => Container(
                                color: AppColors.surfaceLight,
                                child: const Icon(Icons.person,
                                    color: AppColors.textMuted, size: 28),
                              ),
                              errorWidget: (_, _, _) => Container(
                                color: AppColors.surfaceLight,
                                child: const Icon(Icons.person,
                                    color: AppColors.textMuted, size: 28),
                              ),
                            )
                          : Container(
                              color: AppColors.surfaceLight,
                              child: const Icon(Icons.person,
                                  color: AppColors.textMuted, size: 28),
                            ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Name
                  Text(
                    member.name,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textLight,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  // Character
                  Text(
                    member.role,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textDark,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
