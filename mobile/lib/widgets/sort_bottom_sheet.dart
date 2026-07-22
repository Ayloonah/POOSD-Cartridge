import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/constants/app_colors.dart';

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
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Sort By',
              style: GoogleFonts.roboto(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          for (final option in options)
            RadioListTile<T>(
              title: Text(labelBuilder(option), style: GoogleFonts.roboto()),
              value: option,
              groupValue: selected,
              activeColor: AppColors.lightGreen,
              onChanged: (value) => Navigator.pop(context, value),
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
