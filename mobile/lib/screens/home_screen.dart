import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/constants/app_colors.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../utils/api_normalize.dart';
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
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
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
          ? List<Map<String, dynamic>>.from(jsonDecode(gamesResponse.body))
              .map(normalizeEntry)
              .toList()
          : <Map<String, dynamic>>[];
      final lists = listsResponse.statusCode == 200
          ? List<Map<String, dynamic>>.from(jsonDecode(listsResponse.body))
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
              child: Text(
                'See All',
                style: GoogleFonts.roboto(color: Colors.black),
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
