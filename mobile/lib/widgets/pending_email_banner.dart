import 'package:flutter/material.dart';

// Shown app-wide while an email change is awaiting SendGrid re-verification
class PendingEmailBanner extends StatelessWidget {
  final String pendingEmail;

  const PendingEmailBanner({super.key, required this.pendingEmail});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.amber[100],
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Icon(Icons.info_outline, size: 18, color: Colors.black87),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Please verify your new email ($pendingEmail) to finish updating it.',
                  style: const TextStyle(color: Colors.black87, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
