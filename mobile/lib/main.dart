import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:provider/provider.dart';
import 'services/auth_state.dart';
import 'screens/auth_gate.dart';
import 'screens/reset_pw_screen.dart';
import 'screens/verify_email_confirm_screen.dart';

// Lets the Android App Link handler push a screen without needing its own
// BuildContext (the link can arrive before or after the widget tree builds).
final navigatorKey = GlobalKey<NavigatorState>();

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

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSubscription;

  @override
  void initState() {
    super.initState();

    // Cold start: the app was launched by tapping the link. Deferred to
    // after the first frame so navigatorKey.currentState is attached.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) _handleIncomingLink(initialUri);
    });

    // Warm start: the app was already running when the link was tapped.
    _linkSubscription = _appLinks.uriLinkStream.listen(_handleIncomingLink);
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  // Routes an incoming Android App Link (e.g. a tapped password-reset email)
  // to the matching screen, same destinations as onGenerateRoute below.
  void _handleIncomingLink(Uri uri) {
    if (uri.path == '/reset-password') {
      navigatorKey.currentState?.push(
        MaterialPageRoute(
          builder: (context) =>
              ResetPasswordScreen(token: uri.queryParameters['token']),
        ),
      );
    } else if (uri.path == '/verify-email') {
      navigatorKey.currentState?.push(
        MaterialPageRoute(
          builder: (context) => VerifyEmailConfirmScreen(
            token: uri.queryParameters['token'],
          ),
        ),
      );
    }
  }

  // App-wide routing: send /reset-password links (with their ?token=...)
  // to the reset screen, everything else through AuthGate
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
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
        if (uri.path == '/verify-email') {
          return MaterialPageRoute(
            builder: (context) => const VerifyEmailConfirmScreen(),
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
