import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/movie_data.dart';
import '../models/search_result.dart';
import '../models/person_data.dart';

/// HTTP client for the MovieMonk FastAPI backend.
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MovieMonk-Android/1.0',
      },
    ));

    _dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      logPrint: (o) {}, // silence in production
    ));
  }

  // ── Health ──

  Future<bool> checkHealth() async {
    try {
      final res = await _dio.get('/api/health');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // ── Search ──

  Future<SearchPageResponse> search(
    String query, {
    int page = 1,
    String type = 'all',
    String? genres,
    int? yearMin,
    int? yearMax,
    double? ratingMin,
    String sortBy = 'popularity.desc',
  }) async {
    final params = <String, dynamic>{
      'q': query,
      'page': page,
      'type': type,
      'sortBy': sortBy,
    };
    if (genres != null) params['genres'] = genres;
    if (yearMin != null) params['yearMin'] = yearMin;
    if (yearMax != null) params['yearMax'] = yearMax;
    if (ratingMin != null) params['ratingMin'] = ratingMin;

    final res = await _dio.get('/api/search', queryParameters: params);
    return SearchPageResponse.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Suggest (autocomplete) ──

  Future<List<SuggestionItem>> suggest(String query) async {
    final res = await _dio.get('/api/suggest', queryParameters: {'q': query});
    final data = res.data;
    if (data is Map && data['suggestions'] is List) {
      return (data['suggestions'] as List)
          .map((s) => SuggestionItem.fromJson(s as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  // ── Details ──

  Future<DetailsResponse> getDetails(String mediaType, int tmdbId) async {
    try {
      final res = await _dio.get('/api/details/$mediaType/$tmdbId');
      return DetailsResponse.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      // Fallback directly to TMDB proxy if details aggregator route errors
      final res = await _dio.get(
        '/api/tmdb',
        queryParameters: {'endpoint': '/$mediaType/$tmdbId'},
      );
      final raw = res.data as Map<String, dynamic>;
      final title = (raw['title'] ?? raw['name'] ?? 'Untitled').toString();
      final dateStr = (raw['release_date'] ?? raw['first_air_date'] ?? '').toString();
      final year = dateStr.length >= 4 ? dateStr.substring(0, 4) : '';

      final fakeMovieDataJson = <String, dynamic>{
        'tmdb_id': tmdbId.toString(),
        'title': title,
        'year': year,
        'type': mediaType == 'tv' ? 'show' : 'movie',
        'media_type': mediaType,
        'genres': (raw['genres'] as List?)?.map((g) => (g is Map ? g['name'] : '').toString()).where((g) => g.isNotEmpty).toList() ?? [],
        'poster_url': ApiConfig.tmdbImage(raw['poster_path']),
        'backdrop_url': ApiConfig.tmdbImage(raw['backdrop_path'], size: 'w780'),
        'trailer_url': '',
        'ratings': raw['vote_average'] != null
            ? [{'source': 'TMDB', 'score': raw['vote_average'].toString(), 'numeric': (raw['vote_average'] as num).toDouble()}]
            : [],
        'cast': [],
        'crew': {'directors': [], 'writers': [], 'producers': []},
        'summary_short': (raw['overview'] ?? '').toString(),
        'summary_medium': (raw['overview'] ?? '').toString(),
        'summary_long_spoilers': '',
        'suspense_breaker': '',
        'where_to_watch': [],
        'extra_images': [],
        'ai_notes': '',
      };

      return DetailsResponse.fromJson({
        'ok': true,
        'data': fakeMovieDataJson,
        'similar': [],
        'cached': false,
      });
    }
  }

  // ── Person ──

  Future<PersonResponse> getPerson(int personId) async {
    try {
      final res = await _dio.get('/api/person/$personId');
      return PersonResponse.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      final res = await _dio.get(
        '/api/tmdb',
        queryParameters: {'endpoint': '/person/$personId'},
      );
      final raw = res.data as Map<String, dynamic>;
      final fakePersonJson = <String, dynamic>{
        'ok': true,
        'person': {
          'id': personId,
          'name': (raw['name'] ?? '').toString(),
          'biography': (raw['biography'] ?? '').toString(),
          'profile_url': ApiConfig.tmdbImage(raw['profile_path']),
        },
        'top_work': [],
        'credits_all': [],
        'credits_acting': [],
        'credits_directing': [],
        'credits_other': [],
        'known_for_tags': [],
        'related_people': [],
        'cached': false,
      };
      return PersonResponse.fromJson(fakePersonJson);
    }
  }

  // ── Vibe (AI discovery) ──

  Future<SearchPageResponse> vibeSearch(String prompt) async {
    return search(prompt);
  }

  // ── Trending (TMDB proxy) ──

  Future<List<SearchResult>> getTrending({String timeWindow = 'week'}) async {
    try {
      final res = await _dio.get(
        '/api/tmdb',
        queryParameters: {'endpoint': '/trending/all/$timeWindow'},
      );
      final data = res.data;
      if (data is Map && data['results'] is List) {
        return (data['results'] as List).map((item) {
          final mt = item['media_type'] ?? 'movie';
          final title = item['title'] ?? item['name'] ?? '';
          final dateField =
              mt == 'movie' ? 'release_date' : 'first_air_date';
          final year = (item[dateField] ?? '').toString();
          return SearchResult(
            id: item['id'] ?? 0,
            title: title,
            year: year.length >= 4 ? year.substring(0, 4) : null,
            type: mt == 'tv' ? 'show' : 'movie',
            mediaType: mt,
            posterUrl: item['poster_path'] != null
                ? ApiConfig.tmdbImage(item['poster_path'], size: 'w342')
                : null,
            backdropUrl: item['backdrop_path'] != null
                ? ApiConfig.tmdbImage(item['backdrop_path'], size: 'w780')
                : null,
            overview: item['overview'],
            rating: (item['vote_average'] as num?)?.toDouble(),
            genreIds: List<int>.from(item['genre_ids'] ?? []),
            genres: [],
            confidence: 0.0,
            popularity: (item['popularity'] as num?)?.toDouble(),
          );
        }).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}
