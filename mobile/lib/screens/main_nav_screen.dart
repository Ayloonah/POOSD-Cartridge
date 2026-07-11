import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'collection_screen.dart';
import 'lists_screen.dart';
import 'settings_screen.dart';

class MainNavScreen extends StatefulWidget {
  const MainNavScreen({super.key});

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  int _selectedIndex = 0;

  // Switch the visible tab
  void _goToTab(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  // Nav shell: bottom nav bar + the four tab screens, kept alive via IndexedStack
  // so switching tabs doesn't lose each screen's state (e.g. Home's fetched data)
  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        onSeeAllGames: () => _goToTab(1),
        onSeeAllLists: () => _goToTab(2),
      ),
      const CollectionScreen(),
      const ListsScreen(),
      const SettingsScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _goToTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.videogame_asset), label: 'Collection'),
          NavigationDestination(icon: Icon(Icons.list), label: 'Lists'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}
