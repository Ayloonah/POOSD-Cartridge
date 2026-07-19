import 'package:flutter/material.dart';

// A collection grid card: cover image, title, rating (or "Not rated yet."),
// and the platform/hours played line. Everything else lives on the detail screen.
class GameCard extends StatelessWidget {
  final String title;
  final String? imageUrl;
  final double? rating;
  final String? platformPlayed;
  final double? hoursPlayed;
  final VoidCallback? onTap;

  const GameCard({
    super.key,
    required this.title,
    this.imageUrl,
    this.rating,
    this.platformPlayed,
    this.hoursPlayed,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 3 / 4,
              child: (imageUrl == null || imageUrl!.isEmpty)
                  ? Container(
                      color: Colors.grey[300],
                      child: const Icon(Icons.image_not_supported),
                    )
                  : Image.network(
                      imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: Colors.grey[300],
                        child: const Icon(Icons.image_not_supported),
                      ),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  _buildRating(),
                  if (platformPlayed != null && platformPlayed!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        _platformLine(),
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Star row when rated, or a "Not rated yet." label otherwise
  Widget _buildRating() {
    if (rating == null || rating == 0) {
      return const Text(
        'Not rated yet.',
        style: TextStyle(
          color: Colors.green,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      );
    }
    final filled = rating!.round().clamp(0, 5);
    return Row(
      children: List.generate(5, (i) {
        return Icon(
          i < filled ? Icons.star : Icons.star_border,
          size: 16,
          color: Colors.amber,
        );
      }),
    );
  }

  // "PC • 45 hrs", or just "PC" if no hours are logged
  String _platformLine() {
    if (hoursPlayed != null && hoursPlayed! > 0) {
      final hoursText = hoursPlayed! % 1 == 0
          ? hoursPlayed!.toInt().toString()
          : hoursPlayed!.toString();
      return '$platformPlayed • $hoursText hrs';
    }
    return platformPlayed!;
  }
}
