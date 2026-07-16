import 'package:flutter/material.dart';

// A default avatar: the first letter of `letter`, white-on-color. The color
// is picked deterministically from `seed` (e.g. username) out of a fixed
// palette of dark/saturated colors chosen specifically for good contrast
// against white text, so it stays legible no matter which one lands.
class InitialAvatar extends StatelessWidget {
  final String seed;
  final String letter;
  final double radius;

  const InitialAvatar({
    super.key,
    required this.seed,
    required this.letter,
    this.radius = 40,
  });

  static const List<Color> _palette = [
    Color(0xFFD32F2F), // red 700
    Color(0xFFC2185B), // pink 700
    Color(0xFF7B1FA2), // purple 700
    Color(0xFF512DA8), // deep purple 700
    Color(0xFF303F9F), // indigo 700
    Color(0xFF1976D2), // blue 700
    Color(0xFF0288D1), // light blue 700
    Color(0xFF00796B), // teal 700
    Color(0xFF388E3C), // green 700
    Color(0xFFE64A19), // deep orange 700
    Color(0xFF5D4037), // brown 700
    Color(0xFF455A64), // blue grey 700
  ];

  Color get _color {
    if (seed.isEmpty) return _palette.first;
    final hash = seed.codeUnits.fold<int>(0, (sum, unit) => sum + unit);
    return _palette[hash % _palette.length];
  }

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: _color,
      child: Text(
        letter.isNotEmpty ? letter[0].toUpperCase() : '?',
        style: TextStyle(
          color: Colors.white,
          fontSize: radius,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
