import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../models/collection_sort_option.dart';
import '../models/collection_filters.dart';
import '../widgets/game_card.dart';
import '../widgets/sort_bottom_sheet.dart';
import '../widgets/filter_bottom_sheet.dart';
import '../utils/api_normalize.dart';
import 'game_detail_screen.dart';
import 'add_game_screen.dart';

const int _pageSize = 10;

class CollectionScreen extends StatefulWidget {
  // Lets the Lists tab reuse this screen pre-filtered to one list
  final CollectionFilters? initialFilters;
  final String? title;

  const CollectionScreen({super.key, this.initialFilters, this.title});

  @override
  State<CollectionScreen> createState() => _CollectionScreenState();
}

class _CollectionScreenState extends State<CollectionScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  List<Map<String, dynamic>> _allEntries = [];
  List<Map<String, dynamic>> _filteredSortedEntries = [];
  int _visibleCount = _pageSize;

  List<MapEntry<String, String>> _availableLists = [];

  CollectionSortOption _sortOption = CollectionSortOption.dateAddedNewest;
  CollectionFilters _filters = const CollectionFilters();

  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    if (widget.initialFilters != null) {
      _filters = widget.initialFilters!;
    }
    _scrollController.addListener(_onScroll);
    _loadCollection();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  // Reveal 10 more cards once the user nears the bottom of the grid
  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (_visibleCount < _filteredSortedEntries.length) {
        setState(() {
          _visibleCount =
              (_visibleCount + _pageSize).clamp(0, _filteredSortedEntries.length);
        });
      }
    }
  }

  // Fetch the user's full collection and their lists (for the list filter)
  Future<void> _loadCollection() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();

      final entriesResponse =
          await apiService.get('/user-game-entries/collection', token: token);
      final listsResponse = await apiService.get('/lists', token: token);

      if (!mounted) return;

      final entries = entriesResponse.statusCode == 200
          ? List<Map<String, dynamic>>.from(jsonDecode(entriesResponse.body))
              .map(normalizeEntry)
              .toList()
          : <Map<String, dynamic>>[];
      final lists = listsResponse.statusCode == 200
          ? List<Map<String, dynamic>>.from(jsonDecode(listsResponse.body))
              .map(normalizeList)
              .toList()
          : <Map<String, dynamic>>[];

      setState(() {
        _allEntries = entries;
        _availableLists = lists
            .map((list) => MapEntry(list['listId'].toString(), list['name'].toString()))
            .toList();
        _visibleCount = _pageSize;
        _applySortAndFilter();
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not load your collection. Please try again.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // Recomputes the visible list from _allEntries based on current filters + sort
  void _applySortAndFilter() {
    final result = _allEntries.where((entry) {
      if (_filters.listIds.isNotEmpty) {
        final entryListIds =
            (entry['listIds'] as List?)?.map((id) => id.toString()).toSet() ?? {};
        if (entryListIds.intersection(_filters.listIds).isEmpty) return false;
      }
      if (_filters.playedFilter != null) {
        final played = entry['played'] == true;
        if (played != _filters.playedFilter) return false;
      }
      if (_filters.releaseYearRange != null) {
        final releaseDate = entry['releaseDate'];
        if (releaseDate == null) return false;
        final year = DateTime.parse(releaseDate).year;
        if (year < _filters.releaseYearRange!.start.round() ||
            year > _filters.releaseYearRange!.end.round()) {
          return false;
        }
      }
      if (_filters.developers.isNotEmpty) {
        final entryDevelopers =
            (entry['developers'] as List?)?.map((d) => d.toString()).toSet() ?? {};
        if (entryDevelopers.intersection(_filters.developers).isEmpty) return false;
      }
      if (_filters.genres.isNotEmpty) {
        final entryGenres =
            (entry['genres'] as List?)?.map((g) => g.toString()).toSet() ?? {};
        if (entryGenres.intersection(_filters.genres).isEmpty) return false;
      }
      return true;
    }).toList();

    result.sort((a, b) {
      switch (_sortOption) {
        case CollectionSortOption.dateAddedNewest:
          return DateTime.parse(b['createdAt']).compareTo(DateTime.parse(a['createdAt']));
        case CollectionSortOption.dateAddedOldest:
          return DateTime.parse(a['createdAt']).compareTo(DateTime.parse(b['createdAt']));
        case CollectionSortOption.titleAZ:
          return (a['name'] ?? '').toString().compareTo((b['name'] ?? '').toString());
        case CollectionSortOption.titleZA:
          return (b['name'] ?? '').toString().compareTo((a['name'] ?? '').toString());
        case CollectionSortOption.ratingHighToLow:
          return ((b['rating'] ?? 0) as num).compareTo((a['rating'] ?? 0) as num);
        case CollectionSortOption.ratingLowToHigh:
          return ((a['rating'] ?? 0) as num).compareTo((b['rating'] ?? 0) as num);
      }
    });

    _filteredSortedEntries = result;
  }

  // Distinct, sorted values for a list-of-strings field (e.g. genres)
  List<String> _distinctListValues(String key) {
    final values = <String>{};
    for (final entry in _allEntries) {
      final list = entry[key] as List?;
      if (list != null) values.addAll(list.map((v) => v.toString()));
    }
    return values.toList()..sort();
  }

  // Min/max release year across the collection, for the filter's range slider
  (int, int) _releaseYearBounds() {
    final years = _allEntries
        .map((entry) => entry['releaseDate'])
        .where((date) => date != null)
        .map((date) => DateTime.parse(date).year)
        .toList();
    if (years.isEmpty) {
      final currentYear = DateTime.now().year;
      return (currentYear, currentYear);
    }
    years.sort();
    return (years.first, years.last);
  }

  Future<void> _openSortSheet() async {
    final result = await showModalBottomSheet<CollectionSortOption>(
      context: context,
      builder: (context) => SortBottomSheet<CollectionSortOption>(
        selected: _sortOption,
        options: CollectionSortOption.values,
        labelBuilder: (option) => option.label,
      ),
    );
    if (result != null) {
      setState(() {
        _sortOption = result;
        _visibleCount = _pageSize;
        _applySortAndFilter();
      });
    }
  }

  Future<void> _openAddGame() async {
    final added = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => AddGameScreen(availableLists: _availableLists),
      ),
    );
    if (added == true) {
      _loadCollection();
    }
  }

  Future<void> _openFilterSheet() async {
    final (minYear, maxYear) = _releaseYearBounds();
    final result = await showModalBottomSheet<CollectionFilters>(
      context: context,
      isScrollControlled: true,
      builder: (context) => FilterBottomSheet(
        current: _filters,
        availableLists: _availableLists,
        availableDevelopers: _distinctListValues('developers'),
        availableGenres: _distinctListValues('genres'),
        minReleaseYear: minYear,
        maxReleaseYear: maxYear,
      ),
    );
    if (result != null) {
      setState(() {
        _filters = result;
        _visibleCount = _pageSize;
        _applySortAndFilter();
      });
    }
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    final visible = _filteredSortedEntries.take(_visibleCount).toList();
    final reachedEnd =
        _visibleCount >= _filteredSortedEntries.length && _filteredSortedEntries.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? 'Collection'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _openAddGame),
        ],
      ),
      floatingActionButton: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton.small(
            heroTag: 'sortFab',
            onPressed: _openSortSheet,
            child: const Icon(Icons.sort),
          ),
          const SizedBox(width: 12),
          FloatingActionButton.small(
            heroTag: 'filterFab',
            onPressed: _openFilterSheet,
            child: const Icon(Icons.filter_list),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadCollection,
              child: _allEntries.isEmpty
                  ? ListView(
                      children: [
                        if (_errorMessage != null)
                          Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                        Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Center(
                            child: Column(
                              children: [
                                const Text('No games in your collection yet.'),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: _openAddGame,
                                  child: const Text('Add a Game'),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : CustomScrollView(
                      controller: _scrollController,
                      slivers: [
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                          sliver: SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                              childAspectRatio: 0.65,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final entry = visible[index];
                                return GameCard(
                                  title: entry['name']?.toString() ?? '',
                                  imageUrl: entry['coverImage']?.toString(),
                                  rating: (entry['rating'] as num?)?.toDouble(),
                                  platformPlayed: entry['platformPlayed']?.toString(),
                                  hoursPlayed: (entry['hoursPlayed'] as num?)?.toDouble(),
                                  onTap: () async {
                                    final changed = await Navigator.push<bool>(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => GameDetailScreen(
                                          entry: entry,
                                          availableLists: _availableLists,
                                        ),
                                      ),
                                    );
                                    if (changed == true) {
                                      _loadCollection();
                                    }
                                  },
                                );
                              },
                              childCount: visible.length,
                            ),
                          ),
                        ),
                        if (reachedEnd)
                          const SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.all(24.0),
                              child: Center(
                                child: Text(
                                  "You've reached the end of your collection.",
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            ),
                          ),
                        // Clearance so the FABs don't sit on top of the last row
                        const SliverToBoxAdapter(child: SizedBox(height: 72)),
                      ],
                    ),
            ),
    );
  }
}
