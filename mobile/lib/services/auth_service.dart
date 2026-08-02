import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/api_config.dart';

/// Manages Supabase authentication state.
class AuthService extends ChangeNotifier {
  User? _user;
  late final StreamSubscription<AuthState> _authSub;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  String get displayName =>
      _user?.userMetadata?['full_name'] as String? ??
      _user?.email?.split('@').first ??
      'User';
  String? get avatarUrl =>
      _user?.userMetadata?['avatar_url'] as String?;
  String? get email => _user?.email;

  /// Must be called once at app startup (after Supabase.initialize).
  void init() {
    final client = Supabase.instance.client;
    _user = client.auth.currentUser;

    _authSub = client.auth.onAuthStateChange.listen((data) {
      _user = data.session?.user;
      notifyListeners();
    });
  }

  /// Sign in with Google OAuth.
  Future<void> signInWithGoogle() async {
    await Supabase.instance.client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'com.moviemonk.ai://login-callback',
    );
  }

  /// Sign out.
  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
    _user = null;
    notifyListeners();
  }

  /// Initialize Supabase SDK. Call before runApp.
  static Future<void> initSupabase() async {
    await Supabase.initialize(
      url: ApiConfig.supabaseUrl,
      publishableKey: ApiConfig.supabaseAnonKey,
    );
  }

  @override
  void dispose() {
    _authSub.cancel();
    super.dispose();
  }
}
