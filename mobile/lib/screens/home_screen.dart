import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/constants/app_colors.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../utils/api_normalize.dart';
import '../widgets/game_card.dart';
import '../widgets/list_card.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onSeeAllGames;
  final VoidCallback onSeeAllLists;

  const HomeScreen({
    super.key,
    required this.onSeeAllGames,
    required this.onSeeAllLists,
  });

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<Map<String, dynamic>> _collectionEntries = [];
  List<dynamic> _recentGames = [];
  List<dynamic> _recentLists = [];

  // Kick off the initial data fetch
  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  // Called by MainNavScreen when this tab is (re)selected, since the
  // IndexedStack keeps this screen alive rather than rebuilding it — without
  // this, changes made on other tabs (e.g. adding a game) would never show
  // up here until the app restarts.
  Future<void> refresh() => _loadDashboardData();

  // Fetch the user's game entries and lists, then derive the 5 most recent of each
  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();

      final gamesResponse = await apiService.get(
        '/user-game-entries/collection',
        token: token,
      );
      final listsResponse = await apiService.get('/lists', token: token);

      if (!mounted) return;

      final gameEntries = gamesResponse.statusCode == 200
          ? List<Map<String, dynamic>>.from(
              jsonDecode(gamesResponse.body),
            ).map(normalizeEntry).toList()
          : <Map<String, dynamic>>[];
      final lists = listsResponse.statusCode == 200
          ? List<Map<String, dynamic>>.from(
              jsonDecode(listsResponse.body),
            ).map(normalizeList).toList()
          : <Map<String, dynamic>>[];

      // Most recently added games / updated lists first
      gameEntries.sort(
        (a, b) => DateTime.parse(
          b['createdAt'],
        ).compareTo(DateTime.parse(a['createdAt'])),
      );
      lists.sort(
        (a, b) => DateTime.parse(
          b['updatedAt'],
        ).compareTo(DateTime.parse(a['updatedAt'])),
      );

      setState(() {
        _collectionEntries = gameEntries;
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

  // The 4 most recently added games in this list, for the card's cover grid
  List<String?> _recentCoverImages(String listId) {
    final entries = _collectionEntries.where((entry) {
      final listIds =
          (entry['listIds'] as List?)?.map((id) => id.toString()).toSet() ?? {};
      return listIds.contains(listId);
    }).toList();
    entries.sort(
      (a, b) => DateTime.parse(
        b['createdAt'],
      ).compareTo(DateTime.parse(a['createdAt'])),
    );
    return entries.take(4).map((e) => e['coverImage']?.toString()).toList();
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: Container(
          color: AppColors.darkGreen,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SafeArea(
            bottom: false,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Image.asset('assets/images/cartridge_logo.png', height: 36),
                const SizedBox(width: 12),
                Image.asset('assets/images/little_logo.png', height: 28),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.lightGreen),
            )
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
                        style: GoogleFonts.roboto(color: Colors.red),
                      ),
                    ),
                  _buildSection(
                    title: 'Recently Added Games',
                    onSeeAll: widget.onSeeAllGames,
                    items: _recentGames,
                    emptyMessage: 'No games yet.',
                    emptyButtonLabel: 'Add a Game',
                    onEmptyButtonPressed: widget.onSeeAllGames,
                    cardBuilder: (item) => GameCard(
                      title: item['name']?.toString() ?? '',
                      imageUrl: item['coverImage']?.toString(),
                      rating: (item['rating'] as num?)?.toDouble(),
                      platformPlayed: item['platformPlayed']?.toString(),
                      hoursPlayed: (item['hoursPlayed'] as num?)?.toDouble(),
                      width: 138,
                      height: 212,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSection(
                    title: 'Recently Updated Lists',
                    onSeeAll: widget.onSeeAllLists,
                    items: _recentLists,
                    emptyMessage: 'No lists yet.',
                    emptyButtonLabel: 'Add a List',
                    onEmptyButtonPressed: widget.onSeeAllLists,
                    cardBuilder: (item) => SizedBox(
                      width: 138,
                      height: 212,
                      child: ListCard(
                        title: item['name']?.toString() ?? '',
                        coverImages: _recentCoverImages(
                          item['listId'].toString(),
                        ),
                      ),
                    ),
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
    required Widget Function(Map<String, dynamic> item) cardBuilder,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: GoogleFonts.vt323(
                fontSize: 30,
                color: AppColors.darkGreen,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                backgroundColor: AppColors.lightGreen,
                foregroundColor: AppColors.darkGreen,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                'See All',
                style: GoogleFonts.roboto(
                  color: AppColors.darkGreen,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Text(emptyMessage, style: GoogleFonts.roboto()),
                const SizedBox(height: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.darkGreen,
                    foregroundColor: AppColors.textLight,
                  ),
                  onPressed: onEmptyButtonPressed,
                  child: Text(
                    emptyButtonLabel,
                    style: GoogleFonts.roboto(color: AppColors.textLight),
                  ),
                ),
              ],
            ),
          )
        else
          SizedBox(
            height: 212,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = items[index] as Map<String, dynamic>;
                return cardBuilder(item);
              },
            ),
          ),
      ],
    );
  }
}
