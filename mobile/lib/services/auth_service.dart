import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/api_config.dart';

/// Manages Supabase authentication state across Mobile and Web.
class AuthService extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;
  late final StreamSubscription<AuthState> _authSub;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  String get displayName =>
      _user?.userMetadata?['full_name'] as String? ??
      _user?.userMetadata?['name'] as String? ??
      _user?.email?.split('@').first ??
      'MovieMonk User';

  String? get avatarUrl =>
      _user?.userMetadata?['avatar_url'] as String? ??
      _user?.userMetadata?['picture'] as String?;

  String? get email => _user?.email;

  String get provider {
    final appMeta = _user?.appMetadata;
    return (appMeta?['provider'] as String?) ?? 'email';
  }

  /// Must be called once at app startup (after Supabase.initialize).
  void init() {
    final client = Supabase.instance.client;
    _user = client.auth.currentUser;

    _authSub = client.auth.onAuthStateChange.listen((data) {
      _user = data.session?.user;
      _isLoading = false;
      _errorMessage = null;
      notifyListeners();
    });
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Target redirect URI for OAuth deep links.
  static String get _redirectUrl {
    if (kIsWeb) return Uri.base.origin;
    return 'com.moviemonk.mobile://login-callback';
  }

  /// Sign in with Google OAuth using PKCE security flow.
  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: _redirectUrl,
      );
      return success;
    } catch (e) {
      _errorMessage = 'Google authentication failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Sign in with GitHub OAuth using PKCE security flow.
  Future<bool> signInWithGitHub() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.github,
        redirectTo: _redirectUrl,
      );
      return success;
    } catch (e) {
      _errorMessage = 'GitHub authentication failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }



  /// Sign out and purge local credentials securely.
  Future<void> signOut() async {
    _isLoading = true;
    notifyListeners();

    try {
      await Supabase.instance.client.auth.signOut();
    } catch (_) {}

    _user = null;
    _isLoading = false;
    _errorMessage = null;
    notifyListeners();
  }

  /// Initialize Supabase SDK with PKCE security flow.
  static Future<void> initSupabase() async {
    await Supabase.initialize(
      url: ApiConfig.supabaseUrl,
      publishableKey: ApiConfig.supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }

  @override
  void dispose() {
    _authSub.cancel();
    super.dispose();
  }
}
