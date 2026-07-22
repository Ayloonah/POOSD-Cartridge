import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// To notify listeners
class AuthState extends ChangeNotifier {
  // Private variables
  String? _token;
  String? _userId;
  String? _email;
  String? _pendingEmail; // set while a new email is awaiting SendGrid re-verification

  // Allows for a read-only way to access private vars from outside the AuthState class
  String? get token => _token;
  String? get userId => _userId;
  String? get email => _email;
  String? get pendingEmail => _pendingEmail;

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

  // Applies a sliding-session refreshed token (see ApiService), silently
  // replacing the stored one — the user stays logged in without noticing
  // as long as they keep using the app.
  Future<void> updateToken(String token) async {
    _token = token;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  // Called once the primary email is confirmed to have actually changed
  // (i.e. after Settings re-fetches the profile and sees a new value)
  Future<void> updateEmail(String email) async {
    _email = email;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('email', email);
  }

  // Drives the "please verify your new email" banner; null once verified/cleared
  Future<void> setPendingEmail(String? pendingEmail) async {
    _pendingEmail = pendingEmail;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    if (pendingEmail == null) {
      await prefs.remove('pendingEmail');
    } else {
      await prefs.setString('pendingEmail', pendingEmail);
    }
  }

  // Removed stored info upon logout
  // Updates info on disc for logout permanence
  Future<void> logout() async {
    _token = null;
    _userId = null;
    _email = null;
    _pendingEmail = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userId = prefs.getString('userId');
    final email = prefs.getString('email');
    final pendingEmail = prefs.getString('pendingEmail');

    if (token != null && userId != null && email != null) {
      _token = token;
      _userId = userId;
      _email = email;
      _pendingEmail = pendingEmail;
      notifyListeners();
    }
  }
}