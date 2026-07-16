import 'package:flutter/material.dart';
import 'game_entry_form_screen.dart';

// Fallback for when a searched game isn't found in the cache or on RAWG.
// Only Name is required here — everything else is optional metadata that
// would normally come from the game database automatically.
class ManualGameFormScreen extends StatefulWidget {
  final String initialName;
  final List<MapEntry<String, String>> availableLists;

  const ManualGameFormScreen({
    super.key,
    required this.initialName,
    this.availableLists = const [],
  });

  @override
  State<ManualGameFormScreen> createState() => _ManualGameFormScreenState();
}

class _ManualGameFormScreenState extends State<ManualGameFormScreen> {
  late final TextEditingController _nameController;
  final _coverImageController = TextEditingController();
  final _genresController = TextEditingController();
  final _platformsController = TextEditingController();
  final _developerController = TextEditingController();
  DateTime? _releaseDate;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName);
    _nameController.addListener(_onFieldChanged);
  }

  void _onFieldChanged() {
    setState(() {});
  }

  @override
  void dispose() {
    _nameController.removeListener(_onFieldChanged);
    _nameController.dispose();
    _coverImageController.dispose();
    _genresController.dispose();
    _platformsController.dispose();
    _developerController.dispose();
    super.dispose();
  }

  List<String> _splitCommaList(String text) {
    return text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  // Hands the manually-entered game details off to the entry form, which
  // will send them as `newGame` when the entry gets created
  void _continue() {
    final platforms = _splitCommaList(_platformsController.text);
    final coverImage = _coverImageController.text.trim();
    final developer = _developerController.text.trim();

    final newGame = {
      'name': _nameController.text.trim(),
      'coverImage': coverImage.isEmpty ? null : coverImage,
      'genres': _splitCommaList(_genresController.text),
      'platforms': platforms,
      'releaseDate': _releaseDate?.toIso8601String(),
      'developer': developer.isEmpty ? null : developer,
    };

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => GameEntryFormScreen(
          newGame: newGame,
          gameName: _nameController.text.trim(),
          gameCoverImage: coverImage.isEmpty ? null : coverImage,
          platforms: platforms,
          availableLists: widget.availableLists,
        ),
      ),
    );
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create a New Game Entry')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Game Name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _coverImageController,
            decoration: const InputDecoration(
              labelText: 'Cover Image URL (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _genresController,
            decoration: const InputDecoration(
              labelText: 'Genres (comma-separated, optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _platformsController,
            decoration: const InputDecoration(
              labelText: 'Platforms (comma-separated, optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _developerController,
            decoration: const InputDecoration(
              labelText: 'Developer (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(
              _releaseDate == null
                  ? 'Release Date (optional)'
                  : 'Release Date: ${_releaseDate!.year}-${_releaseDate!.month.toString().padLeft(2, '0')}-${_releaseDate!.day.toString().padLeft(2, '0')}',
            ),
            trailing: const Icon(Icons.calendar_today),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _releaseDate ?? DateTime.now(),
                firstDate: DateTime(1950),
                lastDate: DateTime.now(),
              );
              if (picked != null) setState(() => _releaseDate = picked);
            },
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _nameController.text.trim().isEmpty ? null : _continue,
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }
}
