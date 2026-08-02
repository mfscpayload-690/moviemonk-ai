/// Simple in-memory LRU cache with TTL for API responses.
class CacheService {
  static final CacheService _instance = CacheService._internal();
  factory CacheService() => _instance;
  CacheService._internal();

  final Map<String, _CacheEntry> _cache = {};
  static const int _maxSize = 100;

  /// Get a cached value, or null if expired / missing.
  T? get<T>(String key) {
    final entry = _cache[key];
    if (entry == null) return null;
    if (entry.isExpired) {
      _cache.remove(key);
      return null;
    }
    return entry.value as T?;
  }

  /// Store a value with a TTL (default 6 hours).
  void set(String key, dynamic value,
      {Duration ttl = const Duration(hours: 6)}) {
    // Evict oldest if at capacity
    if (_cache.length >= _maxSize && !_cache.containsKey(key)) {
      final oldest = _cache.entries.first.key;
      _cache.remove(oldest);
    }
    _cache[key] = _CacheEntry(value: value, expiresAt: DateTime.now().add(ttl));
  }

  /// Build a composite cache key.
  String buildKey(String prefix, Map<String, dynamic> params) {
    final sorted = params.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    final parts = sorted.map((e) => '${e.key}=${e.value}').join('&');
    return '$prefix:$parts';
  }

  /// Clear all cached data.
  void clear() => _cache.clear();
}

class _CacheEntry {
  final dynamic value;
  final DateTime expiresAt;
  _CacheEntry({required this.value, required this.expiresAt});
  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
