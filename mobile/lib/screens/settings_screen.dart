import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      auth.displayName[0].toUpperCase(),
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.displayName,
                            style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textLight)),
                        Text(auth.email ?? 'Guest user',
                            style: const TextStyle(
                                color: AppColors.textDark, fontSize: 13)),
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
                auth.signInWithGoogle();
              }
            },
            icon: Icon(auth.isAuthenticated ? Icons.logout : Icons.login),
            label: Text(auth.isAuthenticated ? 'Sign Out' : 'Sign In with Google'),
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  auth.isAuthenticated ? AppColors.surfaceLight : AppColors.primary,
            ),
          ),

          const SizedBox(height: 30),

          const ListTile(
            leading: Icon(Icons.info_outline, color: AppColors.textDark),
            title: Text('App Version'),
            subtitle: Text('MovieMonk AI v1.0.0 (Build 1)'),
          ),
          const ListTile(
            leading: Icon(Icons.cloud_done_outlined, color: AppColors.textDark),
            title: Text('Backend'),
            subtitle: Text('Hugging Face Spaces (FastAPI)'),
          ),
        ],
      ),
    );
  }
}
