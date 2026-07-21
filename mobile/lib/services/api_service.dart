import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';

class ApiService {
  // get()
  Future<http.Response> get(String endpoint, {String? token}) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = <String, String>{};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    final response = await http.get(url, headers: headers);
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
    return response;
  }
}