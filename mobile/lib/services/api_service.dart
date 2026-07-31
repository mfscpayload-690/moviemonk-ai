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
    final res = await _dio.get('/api/details/$mediaType/$tmdbId');
    return DetailsResponse.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Person ──

  Future<PersonResponse> getPerson(int personId) async {
    final res = await _dio.get('/api/person/$personId');
    return PersonResponse.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Vibe (AI discovery) ──

  Future<SearchPageResponse> vibeSearch(String prompt) async {
    final res = await _dio.post('/api/vibe', data: {'prompt': prompt});
    return SearchPageResponse.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Trending (TMDB proxy) ──

  Future<List<SearchResult>> getTrending({String timeWindow = 'week'}) async {
    try {
      final res = await _dio.get(
        '/api/tmdb/trending/all/$timeWindow',
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
