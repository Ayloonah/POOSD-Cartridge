import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/models/collection_filters.dart';
import 'package:mobile/widgets/filter_bottom_sheet.dart';

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  Widget buildSheet({
    CollectionFilters current = const CollectionFilters(),
    List<MapEntry<String, String>> availableLists = const [],
    List<String> availableDevelopers = const [],
    List<String> availableGenres = const [],
    int minReleaseYear = 1990,
    int maxReleaseYear = 2024,
  }) {
    return MaterialApp(
      home: Scaffold(
        body: FilterBottomSheet(
          current: current,
          availableLists: availableLists,
          availableDevelopers: availableDevelopers,
          availableGenres: availableGenres,
          minReleaseYear: minReleaseYear,
          maxReleaseYear: maxReleaseYear,
        ),
      ),
    );
  }

  testWidgets('pre-fills checkbox state from the current filters', (tester) async {
    await tester.pumpWidget(buildSheet(
      current: const CollectionFilters(developers: {'Nintendo'}),
      availableDevelopers: const ['Nintendo', 'Sony'],
    ));

    final tiles = tester
        .widgetList<CheckboxListTile>(find.byType(CheckboxListTile))
        .toList();
    final nintendoTile = tiles.firstWhere((t) => (t.title as Text).data == 'Nintendo');
    final sonyTile = tiles.firstWhere((t) => (t.title as Text).data == 'Sony');

    expect(nintendoTile.value, isTrue);
    expect(sonyTile.value, isFalse);
  });

  testWidgets('hides the release year slider when min == max', (tester) async {
    await tester.pumpWidget(buildSheet(minReleaseYear: 2020, maxReleaseYear: 2020));

    expect(find.byType(RangeSlider), findsNothing);
  });

  testWidgets('shows the release year slider when there is a real range', (tester) async {
    await tester.pumpWidget(buildSheet(minReleaseYear: 1990, maxReleaseYear: 2024));

    expect(find.byType(RangeSlider), findsOneWidget);
  });

  testWidgets('"Clear All" pops with a fully-default CollectionFilters', (tester) async {
    Future<CollectionFilters?>? resultFuture;

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => ElevatedButton(
            onPressed: () {
              resultFuture = Navigator.of(context).push<CollectionFilters>(
                MaterialPageRoute(
                  builder: (_) => const Scaffold(
                    body: FilterBottomSheet(
                      current: CollectionFilters(developers: {'Nintendo'}),
                      availableLists: [],
                      availableDevelopers: ['Nintendo'],
                      availableGenres: [],
                      minReleaseYear: 1990,
                      maxReleaseYear: 2024,
                    ),
                  ),
                ),
              );
            },
            child: const Text('Open'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Clear All'));
    await tester.pumpAndSettle();

    final result = await resultFuture;
    expect(result!.isEmpty, isTrue);
  });

  testWidgets('"Apply Filters" carries forward an untouched selection with a null year range', (
    tester,
  ) async {
    Future<CollectionFilters?>? resultFuture;

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => ElevatedButton(
            onPressed: () {
              resultFuture = Navigator.of(context).push<CollectionFilters>(
                MaterialPageRoute(
                  builder: (_) => const Scaffold(
                    body: FilterBottomSheet(
                      current: CollectionFilters(developers: {'Nintendo'}, playedFilter: true),
                      availableLists: [],
                      availableDevelopers: ['Nintendo', 'Sony'],
                      availableGenres: [],
                      minReleaseYear: 1990,
                      maxReleaseYear: 2024,
                    ),
                  ),
                ),
              );
            },
            child: const Text('Open'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    // The button sits at the bottom of a long scrollable sheet, below the
    // fold — tap() doesn't auto-scroll, so without this the tap silently
    // misses, the sheet never pops, and the awaited result hangs forever.
    await tester.ensureVisible(find.text('Apply Filters'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Apply Filters'));
    await tester.pumpAndSettle();

    final result = await resultFuture;
    expect(result!.developers, {'Nintendo'});
    expect(result.playedFilter, isTrue);
    expect(result.releaseYearRange, isNull); // untouched, so not carried as an active filter
  });

  testWidgets('toggling a developer checkbox and applying includes it in the result', (
    tester,
  ) async {
    Future<CollectionFilters?>? resultFuture;

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => ElevatedButton(
            onPressed: () {
              resultFuture = Navigator.of(context).push<CollectionFilters>(
                MaterialPageRoute(
                  builder: (_) => const Scaffold(
                    body: FilterBottomSheet(
                      current: CollectionFilters(),
                      availableLists: [],
                      availableDevelopers: ['Nintendo', 'Sony'],
                      availableGenres: [],
                      minReleaseYear: 1990,
                      maxReleaseYear: 2024,
                    ),
                  ),
                ),
              );
            },
            child: const Text('Open'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Sony'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Apply Filters'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Apply Filters'));
    await tester.pumpAndSettle();

    final result = await resultFuture;
    expect(result!.developers, {'Sony'});
  });
}
