import 'package:flutter/material.dart';

// A list's cover (a 2x2 grid of its 4 most recently added games' covers,
// padded with the placeholder icon if it has fewer than 4) + name, with a
// small edit affordance in the corner. Styled to match GameCard, minus the
// rating/platform line. Tapping the card body is a separate action from
// tapping the edit icon.
class ListCard extends StatelessWidget {
  final String title;
  final List<String?> coverImages;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;

  const ListCard({
    super.key,
    required this.title,
    this.coverImages = const [],
    this.onTap,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildCoverGrid()),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            if (onEdit != null)
              Positioned(
                top: 4,
                right: 4,
                child: Material(
                  color: Colors.black87,
                  shape: const CircleBorder(),
                  child: IconButton(
                    icon: const Icon(Icons.edit, size: 18, color: Colors.white),
                    onPressed: onEdit,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // A 2x2 grid of the list's 4 most recent covers, padded with the
  // missing-image placeholder for any empty slots. Built from Expanded
  // rows/cells (rather than GridView's square-by-default cells) so the
  // covers stretch to fill all the space Expanded gives this widget,
  // instead of leaving empty space below a row of square cells.
  Widget _buildCoverGrid() {
    final cells = List<String?>.generate(
      4,
      (i) => i < coverImages.length ? coverImages[i] : null,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(child: _buildCoverRow(cells.sublist(0, 2))),
        const SizedBox(height: 1),
        Expanded(child: _buildCoverRow(cells.sublist(2, 4))),
      ],
    );
  }

  Widget _buildCoverRow(List<String?> urls) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(child: _buildCoverCell(urls[0])),
        const SizedBox(width: 1),
        Expanded(child: _buildCoverCell(urls[1])),
      ],
    );
  }

  Widget _buildCoverCell(String? url) {
    if (url == null || url.isEmpty) {
      return Container(
        color: Colors.grey[300],
        child: const Icon(Icons.image_not_supported),
      );
    }
    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => Container(
        color: Colors.grey[300],
        child: const Icon(Icons.image_not_supported),
      ),
    );
  }
}
