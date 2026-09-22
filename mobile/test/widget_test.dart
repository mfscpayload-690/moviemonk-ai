import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:moviemonk_ai/models/search_result.dart';
import 'package:moviemonk_ai/widgets/section_header.dart';
import 'package:moviemonk_ai/widgets/rating_badge.dart';

void main() {
  group('Model Deserialization Tests', () {
    test('SearchResult parses JSON correctly', () {
      final json = <String, dynamic>{
        'id': 550,
        'title': 'Fight Club',
        'year': '1999',
        'type': 'movie',
        'media_type': 'movie',
        'rating': 8.4,
        'genre_ids': [18],
        'genres': ['Drama'],
        'confidence': 0.95,
      };

      final result = SearchResult.fromJson(json);
      expect(result.id, 550);
      expect(result.title, 'Fight Club');
      expect(result.year, '1999');
      expect(result.rating, 8.4);
      expect(result.genres, contains('Drama'));
    });

    test('SearchPageResponse handles empty and populated results', () {
      final json = <String, dynamic>{
        'ok': true,
        'query': 'Inception',
        'page': 1,
        'total_pages': 1,
        'total_results': 1,
        'results': [
          {
            'id': 27205,
            'title': 'Inception',
            'year': '2010',
            'type': 'movie',
            'genre_ids': [28, 878],
            'genres': ['Action', 'Science Fiction'],
            'confidence': 0.99,
          }
        ],
        'people': [],
      };

      final response = SearchPageResponse.fromJson(json);
      expect(response.ok, isTrue);
      expect(response.query, 'Inception');
      expect(response.results.length, 1);
      expect(response.results.first.title, 'Inception');
    });
  });

  group('Widget Tests', () {
    testWidgets('SectionHeader displays title and invokes action', (tester) async {
      bool actionTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SectionHeader(
              title: 'Trending Movies',
              actionLabel: 'See All',
              onAction: () => actionTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Trending Movies'), findsOneWidget);
      expect(find.text('See All'), findsOneWidget);

      await tester.tap(find.text('See All'));
      await tester.pump();

      expect(actionTapped, isTrue);
    });

    testWidgets('RatingBadge displays correct label and score', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RatingBadge(
              source: 'imdb',
              score: '8.5',
            ),
          ),
        ),
      );

      expect(find.text('IMDb'), findsOneWidget);
      expect(find.text('8.5'), findsOneWidget);
    });
  });
}
