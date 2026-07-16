import 'package:flutter/material.dart';

// Bottom sheet for picking a sort option from a fixed list.
// Pops with the chosen option, or null if dismissed without a choice.
class SortBottomSheet<T> extends StatelessWidget {
  final T selected;
  final List<T> options;
  final String Function(T) labelBuilder;

  const SortBottomSheet({
    super.key,
    required this.selected,
    required this.options,
    required this.labelBuilder,
  });

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
          for (final option in options)
            RadioListTile<T>(
              title: Text(labelBuilder(option)),
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
