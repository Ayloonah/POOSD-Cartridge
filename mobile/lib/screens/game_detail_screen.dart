import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import 'game_entry_form_screen.dart';

// Shows everything about one collection entry, and lets the user edit or
// delete it. Reuses the entry data already fetched by the Collection screen
// rather than re-fetching it here.
class GameDetailScreen extends StatefulWidget {
  final Map<String, dynamic> entry;
  final List<MapEntry<String, String>> availableLists;

  const GameDetailScreen({
    super.key,
    required this.entry,
    this.availableLists = const [],
  });

  @override
  State<GameDetailScreen> createState() => _GameDetailScreenState();
}

class _GameDetailScreenState extends State<GameDetailScreen> {
  bool _isDeleting = false;

  // Opens the shared entry form pre-filled with this entry's values
  Future<void> _handleEdit() async {
    final entry = widget.entry;
    final platforms = (entry['platforms'] as List?)?.map((p) => p.toString()).toList() ?? [];
    final listIds = (entry['listIds'] as List?)?.map((id) => id.toString()).toSet() ?? {};

    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => GameEntryFormScreen(
          entryId: entry['entryId']?.toString(),
          gameName: entry['name']?.toString() ?? '',
          gameCoverImage: entry['coverImage']?.toString(),
          platforms: platforms,
          availableLists: widget.availableLists,
          initialPlayed: entry['played'] == true,
          initialRating: (entry['rating'] as num?)?.toDouble(),
          initialHoursPlayed: (entry['hoursPlayed'] as num?)?.toDouble(),
          initialReview: entry['review']?.toString(),
          initialPlatformPlayed: entry['platformPlayed']?.toString(),
          initialListIds: listIds,
        ),
      ),
    );

    // Bubble the "something changed" signal back to the Collection screen
    if (saved == true && mounted) {
      Navigator.pop(context, true);
    }
  }

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove from Collection?'),
        content: Text('This will remove "${widget.entry['name']}" from your collection.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isDeleting = true);

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();
      final response = await apiService.delete(
        '/gameuserentries/${widget.entry['entryId']}',
        token: token,
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 204) {
        Navigator.pop(context, true);
      } else {
        setState(() => _isDeleting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not delete. Please try again.')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isDeleting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Something went wrong. Please try again.')),
        );
      }
    }
  }

  // Star row when rated, or a "Not rated yet." label otherwise
  Widget _buildRating(double? rating) {
    if (rating == null || rating == 0) {
      return const Text(
        'Not rated yet.',
        style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600),
      );
    }
    final filled = rating.round().clamp(0, 5);
    return Row(
      children: List.generate(
        5,
        (i) => Icon(
          i < filled ? Icons.star : Icons.star_border,
          color: Colors.amber,
        ),
      ),
    );
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    final entry = widget.entry;
    final coverImage = entry['coverImage']?.toString();
    final rating = (entry['rating'] as num?)?.toDouble();
    final hoursPlayed = (entry['hoursPlayed'] as num?)?.toDouble();
    final genres = (entry['genres'] as List?)?.map((g) => g.toString()).toList() ?? [];
    final listIds = (entry['listIds'] as List?)?.map((id) => id.toString()).toSet() ?? {};
    final listNames = widget.availableLists
        .where((list) => listIds.contains(list.key))
        .map((list) => list.value)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(entry['name']?.toString() ?? ''),
        actions: [
          IconButton(icon: const Icon(Icons.edit), onPressed: _handleEdit),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: _isDeleting ? null : _handleDelete,
          ),
        ],
      ),
      body: _isDeleting
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 3 / 4,
                    child: (coverImage == null || coverImage.isEmpty)
                        ? Container(
                            color: Colors.grey[300],
                            child: const Icon(Icons.image_not_supported, size: 48),
                          )
                        : Image.network(
                            coverImage,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              color: Colors.grey[300],
                              child: const Icon(Icons.image_not_supported, size: 48),
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  entry['name']?.toString() ?? '',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                _buildRating(rating),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(
                      entry['played'] == true
                          ? Icons.check_circle
                          : Icons.radio_button_unchecked,
                      size: 18,
                      color: entry['played'] == true ? Colors.green : Colors.grey,
                    ),
                    const SizedBox(width: 6),
                    Text(entry['played'] == true ? 'Played' : 'Not Yet Played'),
                  ],
                ),
                if (entry['platformPlayed'] != null &&
                    entry['platformPlayed'].toString().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Platform: ${entry['platformPlayed']}'),
                  ),
                if (hoursPlayed != null && hoursPlayed > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Hours Played: ${hoursPlayed % 1 == 0 ? hoursPlayed.toInt() : hoursPlayed}',
                    ),
                  ),
                if (genres.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Genres: ${genres.join(', ')}'),
                  ),
                if (entry['developer'] != null && entry['developer'].toString().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Developer: ${entry['developer']}'),
                  ),
                if (entry['releaseDate'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Release Date: ${DateTime.parse(entry['releaseDate']).year}'),
                  ),
                if (listNames.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('In Lists: ${listNames.join(', ')}'),
                  ),
                if (entry['review'] != null && entry['review'].toString().isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text('Review', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(entry['review'].toString()),
                ],
              ],
            ),
    );
  }
}
