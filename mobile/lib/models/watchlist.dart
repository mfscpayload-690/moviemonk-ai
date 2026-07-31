// Watchlist data models (mirrors Supabase schema).

import 'movie_data.dart';

class WatchlistFolder {
  final String id;
  final String name;
  final String? icon;
  final bool isPublic;
  final List<WatchlistItem> items;

  WatchlistFolder({
    required this.id,
    required this.name,
    this.icon,
    this.isPublic = false,
    required this.items,
  });

  factory WatchlistFolder.fromJson(Map<String, dynamic> json) {
    return WatchlistFolder(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      icon: json['icon'],
      isPublic: json['is_public'] ?? false,
      items: (json['items'] as List?)
              ?.map((i) => WatchlistItem.fromJson(i as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'icon': icon,
        'is_public': isPublic,
        'items': items.map((i) => i.toJson()).toList(),
      };
}

class WatchlistItem {
  final String id;
  final String savedTitle;
  final MovieData movie;
  final String addedAt;

  WatchlistItem({
    required this.id,
    required this.savedTitle,
    required this.movie,
    required this.addedAt,
  });

  factory WatchlistItem.fromJson(Map<String, dynamic> json) {
    return WatchlistItem(
      id: json['id'] ?? '',
      savedTitle: json['saved_title'] ?? '',
      movie: MovieData.fromJson(json['movie'] as Map<String, dynamic>),
      addedAt: json['added_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'saved_title': savedTitle,
        'added_at': addedAt,
      };
}
