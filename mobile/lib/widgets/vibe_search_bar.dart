import 'package:flutter/material.dart';
import 'dart:ui';
import '../theme/app_colors.dart';

/// Glassmorphism AI vibe search bar with sparkle icon.
class VibeSearchBar extends StatefulWidget {
  final void Function(String query) onSubmit;
  final bool isLoading;

  const VibeSearchBar({
    super.key,
    required this.onSubmit,
    this.isLoading = false,
  });

  @override
  State<VibeSearchBar> createState() => _VibeSearchBarState();
}

class _VibeSearchBarState extends State<VibeSearchBar>
    with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  late AnimationController _sparkleAnim;
  int _hintIndex = 0;

  static const _hints = [
    'dark psychological thriller like Zodiac...',
    'heartwarming anime with stunning visuals...',
    'mind-bending sci-fi like Interstellar...',
    'cozy rainy-day movies with a twist...',
    'Korean drama with revenge theme...',
    'underrated 90s comedy gems...',
  ];

  @override
  void initState() {
    super.initState();
    _sparkleAnim = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    // Rotate hints every 4 seconds
    Future.delayed(const Duration(seconds: 4), _rotateHint);
  }

  void _rotateHint() {
    if (!mounted) return;
    setState(() => _hintIndex = (_hintIndex + 1) % _hints.length);
    Future.delayed(const Duration(seconds: 4), _rotateHint);
  }

  @override
  void dispose() {
    _controller.dispose();
    _sparkleAnim.dispose();
    super.dispose();
  }

  void _submit() {
    final text = _controller.text.trim();
    if (text.isNotEmpty) {
      widget.onSubmit(text);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.12),
            AppColors.secondary.withValues(alpha: 0.08),
          ],
        ),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.25),
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    AnimatedBuilder(
                      animation: _sparkleAnim,
                      builder: (_, child) => Transform.rotate(
                        angle: _sparkleAnim.value * 6.28,
                        child: child,
                      ),
                      child: const Icon(
                        Icons.auto_awesome,
                        color: AppColors.accent,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'AI Vibe Search',
                      style: TextStyle(
                        color: AppColors.textLight,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Input row
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        style: const TextStyle(
                            color: AppColors.textLight, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: _hints[_hintIndex],
                          hintStyle: TextStyle(
                            color: AppColors.textMuted.withValues(alpha: 0.6),
                            fontSize: 13,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          filled: true,
                          fillColor: AppColors.surface.withValues(alpha: 0.6),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        onSubmitted: (_) => _submit(),
                        textInputAction: TextInputAction.search,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: widget.isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          backgroundColor: AppColors.primary,
                        ),
                        child: widget.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.search_rounded, size: 22),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
