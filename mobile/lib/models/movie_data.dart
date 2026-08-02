// Data models for movie / TV show details, matching the backend DetailsResponse.

class MovieData {
  final String? tmdbId;
  final String title;
  final String year;
  final String? language;
  final String type; // 'movie' | 'show'
  final String? mediaType; // 'movie' | 'tv'
  final List<String> genres;
  final String posterUrl;
  final String backdropUrl;
  final String trailerUrl;
  final List<Rating> ratings;
  final List<CastMember> cast;
  final Crew crew;
  final String summaryShort;
  final String summaryMedium;
  final String summaryLongSpoilers;
  final String suspenseBreaker;
  final List<WatchOption> whereToWatch;
  final List<String> extraImages;
  final String aiNotes;
  final TVShowData? tvShow;
  final String? budget;
  final String? revenue;
  final TechnicalSpecs? technicalSpecs;
  final String? contentRating;
  final String? vibeCheck;
  final List<String>? contentAdvisory;
  final String? bestWatchedWith;
  final List<RelatedTitle>? related;

  MovieData({
    this.tmdbId,
    required this.title,
    required this.year,
    this.language,
    required this.type,
    this.mediaType,
    required this.genres,
    required this.posterUrl,
    required this.backdropUrl,
    required this.trailerUrl,
    required this.ratings,
    required this.cast,
    required this.crew,
    required this.summaryShort,
    required this.summaryMedium,
    required this.summaryLongSpoilers,
    required this.suspenseBreaker,
    required this.whereToWatch,
    required this.extraImages,
    required this.aiNotes,
    this.tvShow,
    this.budget,
    this.revenue,
    this.technicalSpecs,
    this.contentRating,
    this.vibeCheck,
    this.contentAdvisory,
    this.bestWatchedWith,
    this.related,
  });

  factory MovieData.fromJson(Map<String, dynamic> json) {
    return MovieData(
      tmdbId: json['tmdb_id']?.toString(),
      title: json['title'] ?? '',
      year: json['year'] ?? '',
      language: json['language'],
      type: json['type'] ?? 'movie',
      mediaType: json['media_type'],
      genres: List<String>.from(json['genres'] ?? []),
      posterUrl: json['poster_url'] ?? '',
      backdropUrl: json['backdrop_url'] ?? '',
      trailerUrl: json['trailer_url'] ?? '',
      ratings: (json['ratings'] as List?)
              ?.map((r) => Rating.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
      cast: (json['cast'] as List?)
              ?.map((c) => CastMember.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      crew: Crew.fromJson(json['crew'] as Map<String, dynamic>? ?? {}),
      summaryShort: json['summary_short'] ?? '',
      summaryMedium: json['summary_medium'] ?? '',
      summaryLongSpoilers: json['summary_long_spoilers'] ?? '',
      suspenseBreaker: json['suspense_breaker'] ?? '',
      whereToWatch: (json['where_to_watch'] as List?)
              ?.map((w) => WatchOption.fromJson(w as Map<String, dynamic>))
              .toList() ??
          [],
      extraImages: List<String>.from(json['extra_images'] ?? []),
      aiNotes: json['ai_notes'] ?? '',
      tvShow: json['tv_show'] != null
          ? TVShowData.fromJson(json['tv_show'] as Map<String, dynamic>)
          : null,
      budget: json['budget'],
      revenue: json['revenue'],
      technicalSpecs: json['technical_specs'] != null
          ? TechnicalSpecs.fromJson(
              json['technical_specs'] as Map<String, dynamic>)
          : null,
      contentRating: json['content_rating'],
      vibeCheck: json['vibe_check'],
      contentAdvisory: json['content_advisory'] != null
          ? List<String>.from(json['content_advisory'])
          : null,
      bestWatchedWith: json['best_watched_with'],
      related: (json['related'] as List?)
          ?.map((r) => RelatedTitle.fromJson(r as Map<String, dynamic>))
          .toList(),
    );
  }
}

class CastMember {
  final int? id;
  final String name;
  final String role;
  final String knownFor;
  final String? profileUrl;

  CastMember({
    this.id,
    required this.name,
    required this.role,
    required this.knownFor,
    this.profileUrl,
  });

  factory CastMember.fromJson(Map<String, dynamic> json) {
    return CastMember(
      id: json['id'],
      name: json['name'] ?? '',
      role: json['role'] ?? json['character'] ?? '',
      knownFor: json['known_for'] ?? 'Acting',
      profileUrl: json['profile_url'],
    );
  }
}

class Crew {
  final String director;
  final String writer;
  final String music;

  Crew({this.director = '', this.writer = '', this.music = ''});

  factory Crew.fromJson(Map<String, dynamic> json) {
    return Crew(
      director: json['director'] ?? '',
      writer: json['writer'] ?? '',
      music: json['music'] ?? '',
    );
  }
}

class Rating {
  final String source;
  final String score;

  Rating({required this.source, required this.score});

  factory Rating.fromJson(Map<String, dynamic> json) {
    return Rating(
      source: json['source'] ?? '',
      score: json['score'] ?? '',
    );
  }
}

class WatchOption {
  final String platform;
  final String link;
  final String type; // subscription | rent | free | buy
  final int? confidence;
  final String? region;

  WatchOption({
    required this.platform,
    required this.link,
    required this.type,
    this.confidence,
    this.region,
  });

  factory WatchOption.fromJson(Map<String, dynamic> json) {
    return WatchOption(
      platform: json['platform'] ?? '',
      link: json['link'] ?? '',
      type: json['type'] ?? 'subscription',
      confidence: json['confidence'],
      region: json['region'],
    );
  }
}

class TVShowData {
  final String status;
  final String? premiered;
  final String? ended;
  final int totalSeasons;
  final int totalEpisodes;
  final String network;
  final String language;
  final String? officialSite;
  final List<TVShowSeason> seasons;

  TVShowData({
    required this.status,
    this.premiered,
    this.ended,
    required this.totalSeasons,
    required this.totalEpisodes,
    required this.network,
    required this.language,
    this.officialSite,
    required this.seasons,
  });

  factory TVShowData.fromJson(Map<String, dynamic> json) {
    return TVShowData(
      status: json['status'] ?? '',
      premiered: json['premiered'],
      ended: json['ended'],
      totalSeasons: json['total_seasons'] ?? 0,
      totalEpisodes: json['total_episodes'] ?? 0,
      network: json['network'] ?? '',
      language: json['language'] ?? '',
      officialSite: json['official_site'],
      seasons: (json['seasons'] as List?)
              ?.map((s) => TVShowSeason.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class TVShowSeason {
  final int number;
  final String name;
  final int episodeCount;
  final String? premiereDate;
  final String? image;
  final String? summary;

  TVShowSeason({
    required this.number,
    required this.name,
    required this.episodeCount,
    this.premiereDate,
    this.image,
    this.summary,
  });

  factory TVShowSeason.fromJson(Map<String, dynamic> json) {
    return TVShowSeason(
      number: json['number'] ?? 0,
      name: json['name'] ?? '',
      episodeCount: json['episode_count'] ?? 0,
      premiereDate: json['premiere_date'],
      image: json['image'],
      summary: json['summary'],
    );
  }
}

class TechnicalSpecs {
  final String? camera;
  final String? aspectRatio;
  final String? audioFormat;
  final String? color;

  TechnicalSpecs({this.camera, this.aspectRatio, this.audioFormat, this.color});

  factory TechnicalSpecs.fromJson(Map<String, dynamic> json) {
    return TechnicalSpecs(
      camera: json['camera'],
      aspectRatio: json['aspect_ratio'],
      audioFormat: json['audio_format'],
      color: json['color'],
    );
  }
}

class RelatedTitle {
  final int id;
  final String title;
  final String? year;
  final String mediaType; // movie | tv
  final String? posterUrl;
  final double? popularity;

  RelatedTitle({
    required this.id,
    required this.title,
    this.year,
    required this.mediaType,
    this.posterUrl,
    this.popularity,
  });

  factory RelatedTitle.fromJson(Map<String, dynamic> json) {
    return RelatedTitle(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      year: json['year'],
      mediaType: json['media_type'] ?? 'movie',
      posterUrl: json['poster_url'],
      popularity: (json['popularity'] as num?)?.toDouble(),
    );
  }
}

/// Wraps the full `/api/details/{type}/{id}` response.
class DetailsResponse {
  final bool ok;
  final MovieData data;
  final List<RelatedTitle> similar;
  final bool cached;

  DetailsResponse({
    required this.ok,
    required this.data,
    required this.similar,
    required this.cached,
  });

  factory DetailsResponse.fromJson(Map<String, dynamic> json) {
    return DetailsResponse(
      ok: json['ok'] ?? false,
      data: MovieData.fromJson(json['data'] as Map<String, dynamic>),
      similar: (json['similar'] as List?)
              ?.map((s) => RelatedTitle.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
      cached: json['cached'] ?? false,
    );
  }
}
