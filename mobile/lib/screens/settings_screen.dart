import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile section
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (auth.avatarUrl != null && auth.avatarUrl!.isNotEmpty)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(28),
                      child: CachedNetworkImage(
                        imageUrl: auth.avatarUrl!,
                        width: 56,
                        height: 56,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) => _buildAvatarFallback(auth),
                      ),
                    )
                  else
                    _buildAvatarFallback(auth),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                auth.displayName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textLight,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (auth.isAuthenticated) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: AppColors.primary.withValues(alpha: 0.4),
                                  ),
                                ),
                                child: Text(
                                  auth.provider.toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.accent,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          auth.email ?? 'Guest user (Offline mode)',
                          style: const TextStyle(
                            color: AppColors.textDark,
                            fontSize: 13,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Auth Button
          ElevatedButton.icon(
            onPressed: () {
              if (auth.isAuthenticated) {
                auth.signOut();
              } else {
                context.push('/login');
              }
            },
            icon: Icon(auth.isAuthenticated ? Icons.logout : Icons.login),
            label: Text(auth.isAuthenticated ? 'Sign Out' : 'Sign In / Account'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: auth.isAuthenticated
                  ? AppColors.surfaceLight
                  : AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),

          const SizedBox(height: 30),

          // App Info
          const ListTile(
            leading: Icon(Icons.info_outline, color: AppColors.textDark),
            title: Text('App Version'),
            subtitle: Text('MovieMonk AI v1.0.0 (Build 1)'),
          ),
          const ListTile(
            leading: Icon(Icons.cloud_done_outlined, color: AppColors.textDark),
            title: Text('Backend'),
            subtitle: Text('Hugging Face Spaces (FastAPI) & Supabase Auth'),
          ),
          const ListTile(
            leading: Icon(Icons.shield_outlined, color: AppColors.textDark),
            title: Text('Security & Privacy'),
            subtitle: Text('PKCE Auth Flow • Encrypted Tokens • Zero Tracking'),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarFallback(AuthService auth) {
    return CircleAvatar(
      radius: 28,
      backgroundColor: AppColors.primary,
      child: Text(
        auth.displayName.isNotEmpty ? auth.displayName[0].toUpperCase() : 'M',
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
    );
  }
}
