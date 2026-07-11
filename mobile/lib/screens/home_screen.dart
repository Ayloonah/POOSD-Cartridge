import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../widgets/cover_card.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onSeeAllGames;
  final VoidCallback onSeeAllLists;

  const HomeScreen({
    super.key,
    required this.onSeeAllGames,
    required this.onSeeAllLists,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _recentGames = [];
  List<dynamic> _recentLists = [];

  // Kick off the initial data fetch
  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  // Fetch the user's game entries and lists, then derive the 5 most recent of each
  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();

      final gamesResponse = await apiService.get('/gameuserentries', token: token);
      final listsResponse = await apiService.get('/lists', token: token);

      if (!mounted) return;

      final gameEntries = gamesResponse.statusCode == 200
          ? List<Map<String, dynamic>>.from(jsonDecode(gamesResponse.body))
          : <Map<String, dynamic>>[];
      final lists = listsResponse.statusCode == 200
          ? List<Map<String, dynamic>>.from(jsonDecode(listsResponse.body))
          : <Map<String, dynamic>>[];

      // Most recently added games / updated lists first
      gameEntries.sort((a, b) =>
          DateTime.parse(b['createdAt']).compareTo(DateTime.parse(a['createdAt'])));
      lists.sort((a, b) =>
          DateTime.parse(b['updatedAt']).compareTo(DateTime.parse(a['updatedAt'])));

      setState(() {
        _recentGames = gameEntries.take(5).toList();
        _recentLists = lists.take(5).toList();
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not load your dashboard. Please try again.';
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

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: ListView(
                padding: const EdgeInsets.all(16.0),
                children: [
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  _buildSection(
                    title: 'Recently Added Games',
                    onSeeAll: widget.onSeeAllGames,
                    items: _recentGames,
                    emptyMessage: 'No games yet.',
                    emptyButtonLabel: 'Add a Game',
                    onEmptyButtonPressed: widget.onSeeAllGames,
                    nameKey: 'name',
                    imageKey: 'coverImage',
                  ),
                  const SizedBox(height: 24),
                  _buildSection(
                    title: 'Recently Updated Lists',
                    onSeeAll: widget.onSeeAllLists,
                    items: _recentLists,
                    emptyMessage: 'No lists yet.',
                    emptyButtonLabel: 'Add a List',
                    onEmptyButtonPressed: widget.onSeeAllLists,
                    nameKey: 'name',
                    imageKey: 'coverImage',
                  ),
                ],
              ),
            ),
    );
  }

  // Builds one carousel section: title + See All link, then either the
  // horizontally-scrolling cards or an empty-state message and add button
  Widget _buildSection({
    required String title,
    required VoidCallback onSeeAll,
    required List<dynamic> items,
    required String emptyMessage,
    required String emptyButtonLabel,
    required VoidCallback onEmptyButtonPressed,
    required String nameKey,
    required String imageKey,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton(onPressed: onSeeAll, child: const Text('See All')),
          ],
        ),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Text(emptyMessage),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: onEmptyButtonPressed,
                  child: Text(emptyButtonLabel),
                ),
              ],
            ),
          )
        else
          SizedBox(
            height: 180,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = items[index] as Map<String, dynamic>;
                return CoverCard(
                  title: item[nameKey]?.toString() ?? '',
                  imageUrl: item[imageKey]?.toString(),
                );
              },
            ),
          ),
      ],
    );
  }
}
