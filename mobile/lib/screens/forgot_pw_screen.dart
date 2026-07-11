import 'package:flutter/material.dart';
import 'dart:async';
import '../services/api_service.dart';
import 'login_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  // Reads user input and manages it
  final _emailController = TextEditingController();
  final _emailFocusNode = FocusNode();

  // Set up listeners for the email format check
  @override
  void initState() {
    super.initState();
    _emailController.addListener(_onFieldChanged);
    _emailFocusNode.addListener(_validateEmailOnBlur);
  }

  // Listener to check for changes in the form
  void _onFieldChanged() {
    setState(() {});
  }

  // Make sure the email uses a valid email pattern (something@email.com)
  void _validateEmailOnBlur() {
    if (!_emailFocusNode.hasFocus && _emailController.text.isNotEmpty) {
      setState(() {
        final emailPattern = RegExp(r'^[\w\.-]+@[\w\.-]+\.\w+$');
        if (!emailPattern.hasMatch(_emailController.text)) {
          _emailFormatError = 'Enter a valid email address';
        } else {
          _emailFormatError = null;
        }
      });
    }
  }

  // Called automatically when screen is destroyed
  @override
  void dispose() {
    _emailController.removeListener(_onFieldChanged);
    _emailFocusNode.removeListener(_validateEmailOnBlur);
    _emailController.dispose();
    _emailFocusNode.dispose();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  bool _isLoading = false;
  String? _errorMessage;
  String? _emailFormatError;
  bool _submitted = false;
  int _cooldownSeconds = 0;
  Timer? _cooldownTimer;

  // Checking if the form is ready to send yet or not
  bool _isFormValid() {
    return _emailController.text.isNotEmpty &&
        RegExp(r'^[\w\.-]+@[\w\.-]+\.\w+$').hasMatch(_emailController.text);
  }

  // Forgot password logic, API interaction
  Future<void> _handleSubmit() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiService = ApiService();
      final response = await apiService.post('/reset-password', {
        'email': _emailController.text,
      });

      // If widget no longer on screen, leave
      if (!mounted) return;

      // Don't reveal whether the email is registered either way
      if (response.statusCode == 200) {
        setState(() {
          _submitted = true;
        });
        _startCooldown();
      } else {
        setState(() {
          _errorMessage = 'Something went wrong. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Something went wrong. Please try again.';
      });
    } finally {
      // If widget no longer on screen, skip this
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _backToLogin() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  void _startCooldown() {
    setState(() {
      _cooldownSeconds = 15;
    });

    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds <= 1) {
        timer.cancel();
        setState(() {
          _cooldownSeconds = 0;
        });
      } else {
        setState(() {
          _cooldownSeconds--;
        });
      }
    });
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Forgot Password')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _submitted
              ? [
                  const Text(
                    'If an account exists for that email, a password reset link has been sent.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ElevatedButton(
                    onPressed: (_isLoading || _cooldownSeconds > 0) ? null : _handleSubmit,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_cooldownSeconds > 0
                            ? 'Resend in ${_cooldownSeconds}s'
                            : 'Resend Reset Link'),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: _backToLogin,
                    child: const Text('Back to Login'),
                  ),
                ]
              : [
                  const Text(
                    'Enter your email address and we\'ll send you a link to reset your password.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _emailController,
                    focusNode: _emailFocusNode,
                    decoration: InputDecoration(
                      labelText: 'Email Address',
                      border: const OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: _emailFormatError != null ? Colors.red : Colors.black,
                        ),
                      ),
                      errorText: _emailFormatError,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_errorMessage != null)
                    Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: (_isLoading || !_isFormValid()) ? null : _handleSubmit,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Send Reset Link'),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: _backToLogin,
                    child: const Text('Back to Login'),
                  ),
                ],
        ),
      ),
    );
  }
}
