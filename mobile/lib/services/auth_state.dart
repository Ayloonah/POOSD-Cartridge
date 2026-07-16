import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// To notify listeners
class AuthState extends ChangeNotifier {
  // Private variables
  String? _token;
  String? _userId;
  String? _email;

  // Allows for a read-only way to access private vars from outside the AuthState class
  String? get token => _token;
  String? get userId => _userId;
  String? get email => _email;

  // Checks for if user is logged in or not
  bool get isLoggedIn => _token != null;

  // Stores the login info inside AuthState upon login
  // Saves on disk so if app closes, we remember the login until user manually logs out
  Future<void> login(String token, String userId, String email) async {
    _token = token;
    _userId = userId;
    _email = email;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('userId', userId);
    await prefs.setString('email', email);
  }

  // Removed stored info upon logout
  // Updates info on disc for logout permanence
  Future<void> logout() async {
    _token = null;
    _userId = null;
    _email = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userId = prefs.getString('userId');
    final email = prefs.getString('email');

    if (token != null && userId != null && email != null) {
      _token = token;
      _userId = userId;
      _email = email;
      notifyListeners();
    }
  }
}