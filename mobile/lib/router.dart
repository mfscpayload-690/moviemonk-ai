import 'package:go_router/go_router.dart';
import 'screens/home_screen.dart';
import 'screens/search_screen.dart';
import 'screens/movie_detail_screen.dart';
import 'screens/person_detail_screen.dart';
import 'screens/watchlists_screen.dart';
import 'screens/settings_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) {
        final query = state.uri.queryParameters['q'] ?? '';
        final mode = state.uri.queryParameters['mode'] ?? 'keyword';
        return SearchScreen(query: query, mode: mode);
      },
    ),
    GoRoute(
      path: '/movie/:id',
      builder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
        return MovieDetailScreen(mediaType: 'movie', tmdbId: id);
      },
    ),
    GoRoute(
      path: '/tv/:id',
      builder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
        return MovieDetailScreen(mediaType: 'tv', tmdbId: id);
      },
    ),
    GoRoute(
      path: '/person/:id',
      builder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
        return PersonDetailScreen(personId: id);
      },
    ),
    GoRoute(
      path: '/watchlists',
      builder: (context, state) => const WatchlistsScreen(),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
  ],
);
