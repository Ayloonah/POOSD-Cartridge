import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';

// Shared form for both adding a new collection entry and editing an existing
// one. Exactly one of gameId / rawgId / newGame should be set when creating;
// none of them are used (or needed) when entryId is set, i.e. editing.
class GameEntryFormScreen extends StatefulWidget {
  final String? gameId;
  final String? rawgId;
  final Map<String, dynamic>? newGame;

  final String gameName;
  final String? gameCoverImage;
  final List<String> platforms;
  final List<MapEntry<String, String>> availableLists;

  // Non-null when editing an existing entry instead of creating a new one
  final String? entryId;
  final bool initialPlayed;
  final double? initialRating;
  final double? initialHoursPlayed;
  final String? initialReview;
  final String? initialPlatformPlayed;
  final Set<String> initialListIds;

  const GameEntryFormScreen({
    super.key,
    this.gameId,
    this.rawgId,
    this.newGame,
    required this.gameName,
    this.gameCoverImage,
    this.platforms = const [],
    this.availableLists = const [],
    this.entryId,
    this.initialPlayed = false,
    this.initialRating,
    this.initialHoursPlayed,
    this.initialReview,
    this.initialPlatformPlayed,
    this.initialListIds = const {},
  });

  @override
  State<GameEntryFormScreen> createState() => _GameEntryFormScreenState();
}

class _GameEntryFormScreenState extends State<GameEntryFormScreen> {
  late bool _played;
  double? _rating;
  late final TextEditingController _hoursController;
  late final TextEditingController _reviewController;
  late final TextEditingController _platformFreeTextController;
  String? _selectedPlatform;
  late Set<String> _selectedListIds;

  bool _isSaving = false;
  String? _errorMessage;

  bool get _isEditing => widget.entryId != null;

  // Load initial values (blank/defaults for create, populated for edit)
  @override
  void initState() {
    super.initState();
    _played = widget.initialPlayed;
    _rating = widget.initialRating;
    _hoursController = TextEditingController(
      text: (widget.initialHoursPlayed != null && widget.initialHoursPlayed != 0)
          ? widget.initialHoursPlayed.toString()
          : '',
    );
    _reviewController = TextEditingController(text: widget.initialReview ?? '');
    _platformFreeTextController = TextEditingController(text: widget.initialPlatformPlayed ?? '');
    _selectedPlatform = widget.platforms.contains(widget.initialPlatformPlayed)
        ? widget.initialPlatformPlayed
        : null;
    _selectedListIds = Set.from(widget.initialListIds);
  }

  @override
  void dispose() {
    _hoursController.dispose();
    _reviewController.dispose();
    _platformFreeTextController.dispose();
    super.dispose();
  }

  // Create or update the entry, depending on whether entryId was passed in
  Future<void> _handleSave() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    final platformPlayed =
        widget.platforms.isNotEmpty ? _selectedPlatform : _platformFreeTextController.text;

    final body = <String, dynamic>{
      'played': _played,
      'hoursPlayed': double.tryParse(_hoursController.text) ?? 0,
      'rating': _rating,
      'review': _reviewController.text,
      'platformPlayed': platformPlayed,
      'listIds': _selectedListIds.toList(),
    };

    if (!_isEditing) {
      if (widget.gameId != null) {
        body['gameId'] = widget.gameId;
      } else if (widget.rawgId != null) {
        body['rawgId'] = widget.rawgId;
      } else if (widget.newGame != null) {
        body['newGame'] = widget.newGame;
      }
    }

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();
      final response = _isEditing
          ? await apiService.put('/gameuserentries/${widget.entryId}', body, token: token)
          : await apiService.post('/gameuserentries', body, token: token);

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        Navigator.pop(context, true);
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _errorMessage =
              data['message'] ?? data['error'] ?? 'Could not save. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Something went wrong. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Entry' : 'Add to Collection')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 64,
                  height: 85,
                  child: (widget.gameCoverImage == null || widget.gameCoverImage!.isEmpty)
                      ? Container(
                          color: Colors.grey[300],
                          child: const Icon(Icons.image_not_supported),
                        )
                      : Image.network(
                          widget.gameCoverImage!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            color: Colors.grey[300],
                            child: const Icon(Icons.image_not_supported),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.gameName,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Played'),
            value: _played,
            onChanged: (value) => setState(() => _played = value),
          ),
          const SizedBox(height: 8),
          const Text('Rating', style: TextStyle(fontWeight: FontWeight.w600)),
          Row(
            children: [
              ...List.generate(5, (i) {
                final starValue = i + 1;
                return IconButton(
                  icon: Icon(
                    _rating != null && starValue <= _rating!
                        ? Icons.star
                        : Icons.star_border,
                    color: Colors.amber,
                  ),
                  onPressed: () => setState(() => _rating = starValue.toDouble()),
                );
              }),
              if (_rating != null)
                TextButton(
                  onPressed: () => setState(() => _rating = null),
                  child: const Text('Clear'),
                ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _hoursController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Hours Played',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          if (widget.platforms.isNotEmpty)
            DropdownButtonFormField<String>(
              initialValue: _selectedPlatform,
              decoration: const InputDecoration(
                labelText: 'Platform',
                border: OutlineInputBorder(),
              ),
              items: [
                for (final platform in widget.platforms)
                  DropdownMenuItem(value: platform, child: Text(platform)),
              ],
              onChanged: (value) => setState(() => _selectedPlatform = value),
            )
          else
            TextField(
              controller: _platformFreeTextController,
              decoration: const InputDecoration(
                labelText: 'Platform',
                border: OutlineInputBorder(),
              ),
            ),
          const SizedBox(height: 16),
          TextField(
            controller: _reviewController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Review',
              border: OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 16),
          if (widget.availableLists.isNotEmpty) ...[
            const Text('Add to Lists', style: TextStyle(fontWeight: FontWeight.w600)),
            for (final list in widget.availableLists)
              CheckboxListTile(
                title: Text(list.value),
                value: _selectedListIds.contains(list.key),
                onChanged: (checked) {
                  setState(() {
                    if (checked == true) {
                      _selectedListIds.add(list.key);
                    } else {
                      _selectedListIds.remove(list.key);
                    }
                  });
                },
              ),
          ],
          const SizedBox(height: 16),
          if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            ),
          ElevatedButton(
            onPressed: _isSaving ? null : _handleSave,
            child: _isSaving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(_isEditing ? 'Save Changes' : 'Add to Collection'),
          ),
        ],
      ),
    );
  }
}
