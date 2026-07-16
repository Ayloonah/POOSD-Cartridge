import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:provider/provider.dart';
import 'services/auth_state.dart';
import 'screens/auth_gate.dart';
import 'screens/reset_pw_screen.dart';

void main() {
  // So web links look like /reset-password?token=... instead of /#/reset-password?token=...
  usePathUrlStrategy();
  runApp(
    ChangeNotifierProvider(
      create: (context) => AuthState(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // App-wide routing: send /reset-password links (with their ?token=...)
  // to the reset screen, everything else through AuthGate
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cartridge',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      onGenerateRoute: (settings) {
        final uri = Uri.parse(settings.name ?? '/');
        if (uri.path == '/reset-password') {
          return MaterialPageRoute(
            builder: (context) => const ResetPasswordScreen(),
          );
        }
        //return MaterialPageRoute(builder: (context) => const AuthGate());
        return MaterialPageRoute(
          builder: (context) => const AuthGate(),
        ); // Change AuthGate()); to whatever screen you wanna test out and comment out the previous line for testing
      },
    );
  }
}
