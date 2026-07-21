import 'package:flutter/material.dart';
import 'package:mobile/constants/app_colors.dart';

// Checklist of the user's collection entries, used to pick which games
// belong to a list. Games not yet in the collection aren't selectable here
// — they get added to lists later, once they're in the collection.
class GameChecklist extends StatelessWidget {
  final List<Map<String, dynamic>> entries;
  final Set<String> selectedEntryIds;
  final ValueChanged<String> onToggle;

  const GameChecklist({
    super.key,
    required this.entries,
    required this.selectedEntryIds,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Text('Your collection is empty — add some games first.'),
      );
    }

    return Column(
      children: [
        for (final entry in entries)
          CheckboxListTile(
            secondary: SizedBox(
              width: 40,
              height: 56,
              child:
                  (entry['coverImage'] == null ||
                      entry['coverImage'].toString().isEmpty)
                  ? Container(color: Colors.grey[300])
                  : Image.network(
                      entry['coverImage'].toString(),
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          Container(color: Colors.grey[300]),
                    ),
            ),
            title: Text(entry['name']?.toString() ?? ''),
            value: selectedEntryIds.contains(entry['entryId']?.toString()),
            activeColor: AppColors.lightGreen,
            onChanged: (_) => onToggle(entry['entryId']?.toString() ?? ''),
          ),
      ],
    );
  }
}
