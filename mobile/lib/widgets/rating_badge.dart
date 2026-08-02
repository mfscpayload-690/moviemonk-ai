import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Color-coded rating badge with source label.
class RatingBadge extends StatelessWidget {
  final String source;
  final String score;
  final bool compact;

  const RatingBadge({
    super.key,
    required this.source,
    required this.score,
    this.compact = false,
  });

  Color get _color {
    final numeric = _parseScore();
    if (numeric == null) return AppColors.textDark;
    if (numeric >= 7.0) return AppColors.ratingGreen;
    if (numeric >= 5.0) return AppColors.ratingYellow;
    return AppColors.ratingRed;
  }

  IconData get _icon {
    final s = source.toLowerCase();
    if (s.contains('imdb')) return Icons.star_rounded;
    if (s.contains('rotten')) return Icons.local_fire_department_rounded;
    if (s.contains('metacritic')) return Icons.analytics_rounded;
    return Icons.grade_rounded;
  }

  String get _label {
    final s = source.toLowerCase();
    if (s.contains('imdb')) return 'IMDb';
    if (s.contains('rotten')) return 'RT';
    if (s.contains('metacritic')) return 'MC';
    return source;
  }

  double? _parseScore() {
    final clean = score.replaceAll('%', '').replaceAll('/10', '').replaceAll('/100', '');
    final val = double.tryParse(clean);
    if (val == null) return null;
    if (score.contains('/100') || score.contains('%')) return val / 10;
    return val;
  }

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: _color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: _color.withValues(alpha: 0.3), width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(_icon, size: 14, color: _color),
            const SizedBox(width: 4),
            Text(
              score,
              style: TextStyle(
                color: _color,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_icon, size: 20, color: _color),
          const SizedBox(height: 4),
          Text(
            score,
            style: TextStyle(
              color: _color,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            _label,
            style: const TextStyle(
              color: AppColors.textDark,
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
