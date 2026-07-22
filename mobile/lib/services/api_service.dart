import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';
import 'auth_state.dart';

class ApiService {
  // Set once at app startup (see main.dart). Lets every ApiService instance
  // — constructed fresh at each call site throughout the app — silently
  // apply a sliding-session refreshed token without every call site needing
  // to wire that up individually.
  static AuthState? authState;

  // Checks for the sliding-session refreshed token on any response and
  // applies it, so the caller never needs to think about this.
  void _applyRefreshedToken(http.Response response) {
    final refreshed = response.headers['x-refreshed-token'];
    if (refreshed != null) {
      authState?.updateToken(refreshed);
    }
  }

  // get()
  Future<http.Response> get(String endpoint, {String? token}) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = <String, String>{};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    final response = await http.get(url, headers: headers);
    _applyRefreshedToken(response);
    return response;
  }

  // post()
  Future<http.Response> post(String endpoint, Map<String, dynamic> body, {String? token}) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
    _applyRefreshedToken(response);
    return response;
  }

  // put()
  Future<http.Response> put(String endpoint, Map<String, dynamic> body, {String? token}) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(body)
    );
    _applyRefreshedToken(response);
    return response;
  }

  // patch()
  Future<http.Response> patch(String endpoint, Map<String, dynamic> body, {String? token}) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    final response = await http.patch(
      url,
      headers: headers,
      body: jsonEncode(body)
    );
    _applyRefreshedToken(response);
    return response;
  }

  // delete()
  Future<http.Response> delete(String endpoint, {String? token, Map<String, dynamic>? body}) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = <String, String>{};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }
    final response = await http.delete(
      url,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    _applyRefreshedToken(response);
    return response;
  }
}