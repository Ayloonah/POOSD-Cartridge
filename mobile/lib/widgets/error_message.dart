import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/constants/app_colors.dart';

/// A colorblind-accessible error indicator.
///
/// Relies on an icon plus bold, high-contrast text rather than color alone
/// (e.g. red-on-green), which can be difficult or impossible to distinguish
/// for people with red-green color blindness.
class ErrorMessage extends StatelessWidget {
  final String message;
  final TextAlign textAlign;

  const ErrorMessage({
    super.key,
    required this.message,
    this.textAlign = TextAlign.start,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 2),
          child: Icon(
            Icons.error_outline,
            size: 16,
            color: AppColors.textLight,
          ),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            message,
            textAlign: textAlign,
            style: GoogleFonts.roboto(
              color: AppColors.textLight,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}
