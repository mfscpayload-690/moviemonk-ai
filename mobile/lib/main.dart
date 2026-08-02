import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'router.dart';
import 'services/auth_service.dart';
import 'services/watchlist_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AuthService.initSupabase();

  final authService = AuthService();
  authService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authService),
        ChangeNotifierProvider(create: (_) => WatchlistService()),
      ],
      child: const MovieMonkApp(),
    ),
  );
}

class MovieMonkApp extends StatelessWidget {
  const MovieMonkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MovieMonk AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: appRouter,
    );
  }
}
