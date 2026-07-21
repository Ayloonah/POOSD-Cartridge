import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../models/list_sort_option.dart';
import '../models/collection_filters.dart';
import '../widgets/list_card.dart';
import '../widgets/sort_bottom_sheet.dart';
import '../utils/api_normalize.dart';
import 'collection_screen.dart';
import 'create_list_screen.dart';
import 'edit_list_screen.dart';

class ListsScreen extends StatefulWidget {
  const ListsScreen({super.key});

  @override
  State<ListsScreen> createState() => _ListsScreenState();
}

class _ListsScreenState extends State<ListsScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  List<Map<String, dynamic>> _lists = [];
  List<Map<String, dynamic>> _collectionEntries = [];

  ListSortOption _sortOption = ListSortOption.mostRecentlyUpdated;

  @override
  void initState() {
    super.initState();
    _loadLists();
  }

  // Fetch the user's lists and their collection (the latter is needed for
  // the create/edit list flows' game checklists)
  Future<void> _loadLists() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();

      final listsResponse = await apiService.get('/lists', token: token);
      final entriesResponse =
          await apiService.get('/user-game-entries/collection', token: token);

      if (!mounted) return;

      setState(() {
        _lists = listsResponse.statusCode == 200
            ? List<Map<String, dynamic>>.from(jsonDecode(listsResponse.body))
                .map(normalizeList)
                .toList()
            : [];
        _collectionEntries = entriesResponse.statusCode == 200
            ? List<Map<String, dynamic>>.from(jsonDecode(entriesResponse.body))
                .map(normalizeEntry)
                .toList()
            : [];
        _sortLists();
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not load your lists. Please try again.';
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

  void _sortLists() {
    _lists.sort((a, b) {
      switch (_sortOption) {
        case ListSortOption.mostRecentlyUpdated:
          return DateTime.parse(b['updatedAt']).compareTo(DateTime.parse(a['updatedAt']));
        case ListSortOption.oldestToRecent:
          return DateTime.parse(a['updatedAt']).compareTo(DateTime.parse(b['updatedAt']));
        case ListSortOption.nameAZ:
          return (a['name'] ?? '').toString().compareTo((b['name'] ?? '').toString());
        case ListSortOption.nameZA:
          return (b['name'] ?? '').toString().compareTo((a['name'] ?? '').toString());
      }
    });
  }

  Future<void> _openSortSheet() async {
    final result = await showModalBottomSheet<ListSortOption>(
      context: context,
      builder: (context) => SortBottomSheet<ListSortOption>(
        selected: _sortOption,
        options: ListSortOption.values,
        labelBuilder: (option) => option.label,
      ),
    );
    if (result != null) {
      setState(() {
        _sortOption = result;
        _sortLists();
      });
    }
  }

  Future<void> _openCreateList() async {
    final created = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => CreateListScreen(collectionEntries: _collectionEntries),
      ),
    );
    if (created == true) {
      _loadLists();
    }
  }

  Future<void> _openEditList(Map<String, dynamic> list) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => EditListScreen(
          list: list,
          collectionEntries: _collectionEntries,
        ),
      ),
    );
    if (changed == true) {
      _loadLists();
    }
  }

  void _openListContents(Map<String, dynamic> list) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CollectionScreen(
          title: list['name']?.toString(),
          initialFilters: CollectionFilters(listIds: {list['listId'].toString()}),
        ),
      ),
    );
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lists'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _openCreateList),
        ],
      ),
      floatingActionButton: FloatingActionButton.small(
        onPressed: _openSortSheet,
        child: const Icon(Icons.sort),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadLists,
              child: _lists.isEmpty
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
                                const Text('No lists yet.'),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: _openCreateList,
                                  child: const Text('New List'),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 80),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.65,
                      ),
                      itemCount: _lists.length,
                      itemBuilder: (context, index) {
                        final list = _lists[index];
                        return ListCard(
                          title: list['name']?.toString() ?? '',
                          imageUrl: list['coverImage']?.toString(),
                          onTap: () => _openListContents(list),
                          onEdit: () => _openEditList(list),
                        );
                      },
                    ),
            ),
    );
  }
}
