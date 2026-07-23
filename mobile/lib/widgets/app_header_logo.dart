import 'package:flutter/material.dart';
import '../utils/tab_navigation.dart';

// The Cartridge logo shown in every screen's header. Tapping it always
// returns to the Home tab's root screen — the common "tap the logo to go
// home" convention — regardless of which tab or how deeply nested the
// current screen is.
class AppHeaderLogo extends StatelessWidget {
  const AppHeaderLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => goToHomeTab?.call(),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Image.asset('assets/images/cartridge_logo.png', height: 36),
          const SizedBox(width: 12),
          Image.asset('assets/images/little_logo.png', height: 28),
        ],
      ),
    );
  }
}
