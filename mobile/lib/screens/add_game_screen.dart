import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import 'game_entry_form_screen.dart';
import 'manual_game_form_screen.dart';

class AddGameScreen extends StatefulWidget {
  final List<MapEntry<String, String>> availableLists;

  const AddGameScreen({super.key, this.availableLists = const []});

  @override
  State<AddGameScreen> createState() => _AddGameScreenState();
}

class _AddGameScreenState extends State<AddGameScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;
  bool _hasSearched = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _results = [];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Searches RAWG via the backend's /games/search
  Future<void> _search() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isSearching = true;
      _hasSearched = true;
      _errorMessage = null;
    });

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();
      final response = await apiService.get(
        '/games/search?search=${Uri.encodeQueryComponent(query)}',
        token: token,
      );

      if (!mounted) return;

      setState(() {
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          _results = List<Map<String, dynamic>>.from(data['results'] ?? []);
        } else {
          _results = [];
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not search right now. Please try again.';
          _results = [];
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
      }
    }
  }

  // Search results only ever have rawgId right now (backend doesn't check
  // the cache before hitting RAWG) — gameId would only appear if that changes
  Future<void> _selectResult(Map<String, dynamic> game) async {
    final platforms = (game['platforms'] as List?)?.map((p) => p.toString()).toList() ?? [];
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => GameEntryFormScreen(
          gameId: game['gameId']?.toString(),
          rawgId: game['gameId'] == null ? game['rawgId']?.toString() : null,
          gameName: game['name']?.toString() ?? '',
          gameCoverImage: game['coverImage']?.toString(),
          platforms: platforms,
          availableLists: widget.availableLists,
        ),
      ),
    );
    if (saved == true && mounted) {
      Navigator.pop(context, true);
    }
  }

  Future<void> _createManually() async {
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => ManualGameFormScreen(
          initialName: _searchController.text.trim(),
          availableLists: widget.availableLists,
        ),
      ),
    );
    if (saved == true && mounted) {
      Navigator.pop(context, true);
    }
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add a Game')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _searchController,
              onSubmitted: (_) => _search(),
              decoration: InputDecoration(
                labelText: 'Search for a game',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: _search,
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_isSearching) const Center(child: CircularProgressIndicator()),
            if (_errorMessage != null)
              Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            if (!_isSearching && _hasSearched && _results.isEmpty) ...[
              Text(
                'No games found for "${_searchController.text.trim()}".',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _createManually,
                child: const Text('Create a New Game Entry'),
              ),
            ],
            if (!_isSearching && _results.isNotEmpty)
              Expanded(
                child: ListView.builder(
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    final game = _results[index];
                    final coverImage = game['coverImage']?.toString();
                    return ListTile(
                      leading: SizedBox(
                        width: 40,
                        height: 56,
                        child: (coverImage == null || coverImage.isEmpty)
                            ? Container(color: Colors.grey[300])
                            : Image.network(
                                coverImage,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    Container(color: Colors.grey[300]),
                              ),
                      ),
                      title: Text(game['name']?.toString() ?? ''),
                      subtitle: Text(
                        (game['platforms'] as List?)?.join(', ') ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onTap: () => _selectResult(game),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
