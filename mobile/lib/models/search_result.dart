// Data models for the `/api/search` response.

class SearchResult {
  final int id;
  final String title;
  final String? year;
  final String type; // movie | show
  final String mediaType; // movie | tv
  final String? posterUrl;
  final String? backdropUrl;
  final String? overview;
  final double? rating;
  final List<int> genreIds;
  final List<String> genres;
  final double confidence;
  final double? popularity;
  final String? originalLanguage;
  final double? vibeScore;
  final List<String>? matchReasons;

  SearchResult({
    required this.id,
    required this.title,
    this.year,
    required this.type,
    required this.mediaType,
    this.posterUrl,
    this.backdropUrl,
    this.overview,
    this.rating,
    required this.genreIds,
    required this.genres,
    required this.confidence,
    this.popularity,
    this.originalLanguage,
    this.vibeScore,
    this.matchReasons,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    return SearchResult(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      year: json['year'],
      type: json['type'] ?? 'movie',
      mediaType: json['media_type'] ?? 'movie',
      posterUrl: json['poster_url'],
      backdropUrl: json['backdrop_url'],
      overview: json['overview'],
      rating: (json['rating'] as num?)?.toDouble(),
      genreIds: List<int>.from(json['genre_ids'] ?? []),
      genres: List<String>.from(json['genres'] ?? []),
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      popularity: (json['popularity'] as num?)?.toDouble(),
      originalLanguage: json['original_language'],
      vibeScore: (json['vibe_score'] as num?)?.toDouble(),
      matchReasons: json['match_reasons'] != null
          ? List<String>.from(json['match_reasons'])
          : null,
    );
  }
}

class PersonSearchCandidate {
  final int id;
  final String name;
  final double score;
  final double confidence;
  final double? popularity;
  final String? knownForDepartment;
  final List<String> knownForTitles;
  final String? profileUrl;

  PersonSearchCandidate({
    required this.id,
    required this.name,
    required this.score,
    required this.confidence,
    this.popularity,
    this.knownForDepartment,
    required this.knownForTitles,
    this.profileUrl,
  });

  factory PersonSearchCandidate.fromJson(Map<String, dynamic> json) {
    return PersonSearchCandidate(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      popularity: (json['popularity'] as num?)?.toDouble(),
      knownForDepartment: json['known_for_department'],
      knownForTitles: List<String>.from(json['known_for_titles'] ?? []),
      profileUrl: json['profile_url'],
    );
  }
}

class VibeInfo {
  final String intentType;
  final String summary;
  final List<String> signals;

  VibeInfo({
    required this.intentType,
    required this.summary,
    required this.signals,
  });

  factory VibeInfo.fromJson(Map<String, dynamic> json) {
    return VibeInfo(
      intentType: json['intent_type'] ?? 'vibe_discovery',
      summary: json['summary'] ?? '',
      signals: List<String>.from(json['signals'] ?? []),
    );
  }
}

class SearchPageResponse {
  final bool ok;
  final String query;
  final int page;
  final int totalPages;
  final int totalResults;
  final String? searchMode;
  final SearchResult? hero;
  final List<SearchResult> results;
  final List<PersonSearchCandidate> people;
  final VibeInfo? vibe;

  SearchPageResponse({
    required this.ok,
    required this.query,
    required this.page,
    required this.totalPages,
    required this.totalResults,
    this.searchMode,
    this.hero,
    required this.results,
    required this.people,
    this.vibe,
  });

  factory SearchPageResponse.fromJson(Map<String, dynamic> json) {
    return SearchPageResponse(
      ok: json['ok'] ?? false,
      query: json['query'] ?? '',
      page: json['page'] ?? 1,
      totalPages: json['total_pages'] ?? 1,
      totalResults: json['total_results'] ?? 0,
      searchMode: json['search_mode'],
      hero: json['hero'] != null
          ? SearchResult.fromJson(json['hero'] as Map<String, dynamic>)
          : null,
      results: (json['results'] as List?)
              ?.map((r) => SearchResult.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
      people: (json['people'] as List?)
              ?.map((p) =>
                  PersonSearchCandidate.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
      vibe: json['vibe'] != null
          ? VibeInfo.fromJson(json['vibe'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Suggestion item from `/api/suggest`.
class SuggestionItem {
  final int id;
  final String title;
  final String? year;
  final String type; // movie | show | person
  final String mediaType; // movie | tv | person
  final String? posterUrl;
  final double confidence;
  final String? knownForDepartment;
  final List<String>? knownForTitles;

  SuggestionItem({
    required this.id,
    required this.title,
    this.year,
    required this.type,
    required this.mediaType,
    this.posterUrl,
    required this.confidence,
    this.knownForDepartment,
    this.knownForTitles,
  });

  factory SuggestionItem.fromJson(Map<String, dynamic> json) {
    return SuggestionItem(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      year: json['year'],
      type: json['type'] ?? 'movie',
      mediaType: json['media_type'] ?? 'movie',
      posterUrl: json['poster_url'],
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      knownForDepartment: json['known_for_department'],
      knownForTitles: json['known_for_titles'] != null
          ? List<String>.from(json['known_for_titles'])
          : null,
    );
  }
}
