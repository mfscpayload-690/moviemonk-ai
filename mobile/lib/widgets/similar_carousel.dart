import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/movie_data.dart';
import 'poster_card.dart';
import 'section_header.dart';

/// Horizontal scrollable carousel of related / similar titles.
class SimilarCarousel extends StatelessWidget {
  final String title;
  final List<RelatedTitle> items;

  const SimilarCarousel({
    super.key,
    required this.title,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: title, icon: Icons.recommend_outlined),
        const SizedBox(height: 4),
        SizedBox(
          height: 240,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final item = items[index];
              return PosterCard(
                id: item.id,
                title: item.title,
                year: item.year,
                mediaType: item.mediaType,
                posterUrl: item.posterUrl,
                width: 130,
                onTap: () {
                  context.push('/${item.mediaType}/${item.id}');
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
