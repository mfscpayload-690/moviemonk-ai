import 'dart:ui';

/// MovieMonk brand color palette.
/// Matches the web app's tailwind.config.js exactly.
class AppColors {
  AppColors._();

  // ── Core brand ──
  static const Color background    = Color(0xFF121212);
  static const Color surface       = Color(0xFF1E1E1E);
  static const Color surfaceLight  = Color(0xFF2A2A2A);
  static const Color primary       = Color(0xFF6A44FF);
  static const Color secondary     = Color(0xFFA855F7);
  static const Color accent        = Color(0xFFF472B6);

  // ── Text ──
  static const Color textLight     = Color(0xFFE5E7EB);
  static const Color textDark      = Color(0xFF9CA3AF);
  static const Color textMuted     = Color(0xFF6B7280);

  // ── Borders & dividers ──
  static const Color border        = Color(0xFF2E2E2E);
  static const Color divider       = Color(0xFF262626);

  // ── Semantic ──
  static const Color success       = Color(0xFF22C55E);
  static const Color warning       = Color(0xFFFACC15);
  static const Color error         = Color(0xFFEF4444);

  // ── Rating colors ──
  static const Color ratingGreen   = Color(0xFF22C55E);
  static const Color ratingYellow  = Color(0xFFFACC15);
  static const Color ratingRed     = Color(0xFFEF4444);

  // ── Gradient ──
  static const List<Color> primaryGradient = [primary, secondary];
  static const List<Color> accentGradient  = [secondary, accent];
}
