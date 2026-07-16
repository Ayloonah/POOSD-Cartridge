import 'package:flutter/material.dart';
import '../models/collection_sort_option.dart';

// Bottom sheet for picking how the collection grid is sorted.
// Pops with the chosen option, or null if dismissed without a choice.
class SortBottomSheet extends StatelessWidget {
  final CollectionSortOption selected;

  const SortBottomSheet({super.key, required this.selected});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Sort By',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          for (final option in CollectionSortOption.values)
            RadioListTile<CollectionSortOption>(
              title: Text(option.label),
              value: option,
              groupValue: selected,
              onChanged: (value) => Navigator.pop(context, value),
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
