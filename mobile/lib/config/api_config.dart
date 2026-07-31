/// Central configuration for MovieMonk API endpoints and keys.
class ApiConfig {
  ApiConfig._();

  /// Production backend hosted on Hugging Face Spaces.
  static const String baseUrl =
      'https://mfscpayload-690-moviemonk-backend.hf.space';

  /// Supabase project URL.
  static const String supabaseUrl =
      'https://udhksxsttuarxeouywfg.supabase.co';

  /// Supabase anon (publishable) key — safe to ship in client apps.
  static const String supabaseAnonKey =
      'sb_publishable_ovADhxNwfDChQcBP6mMH6A_2pImARoB';

  /// TMDB image CDN base. Append a size slug then the file path.
  /// Example: `$tmdbImageBase/w500/abc123.jpg`
  static const String tmdbImageBase = 'https://image.tmdb.org/t/p';

  /// Build a full TMDB poster/backdrop URL.
  static String tmdbImage(String? path, {String size = 'w500'}) {
    if (path == null || path.isEmpty) return '';
    return '$tmdbImageBase/$size$path';
  }
}
