import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  // Reads user input and manages it
  final _passwordController = TextEditingController();
  final _passwordValidationController = TextEditingController();
  final _passwordFocusNode = FocusNode();

  // Pulled from the URL the emailed reset link points at (?token=...)
  String? _token;

  bool _isLoading = false;
  bool _submitted = false;
  String? _errorMessage;
  String? _passwordError;
  String? _passwordMismatch;

  // Set up listeners, read the token out of the current URL
  @override
  void initState() {
    super.initState();
    _token = Uri.base.queryParameters['token'];

    _passwordController.addListener(_onFieldChanged);
    _passwordValidationController.addListener(_onFieldChanged);
    _passwordValidationController.addListener(_checkPasswordsMatch);
    _passwordFocusNode.addListener(_validatePasswordOnBlur);
  }

  // Listener to check for changes in the form
  void _onFieldChanged() {
    setState(() {});
  }

  // Make sure password matches in both fields
  void _checkPasswordsMatch() {
    setState(() {
      if (_passwordValidationController.text.isEmpty) {
        _passwordMismatch = null;
      } else if (_passwordController.text != _passwordValidationController.text) {
        _passwordMismatch = 'Passwords don\'t match';
      } else {
        _passwordMismatch = null;
      }
    });
  }

  // Check that the password is strong enough
  void _validatePasswordOnBlur() {
    if (!_passwordFocusNode.hasFocus && _passwordController.text.isNotEmpty) {
      setState(() {
        _passwordError = _getPasswordError(_passwordController.text);
      });
    }
  }

  // Handle the error message logic
  String? _getPasswordError(String password) {
    if (password.length < 8 || password.length > 14) {
      return 'Password must be 8-14 characters';
    }
    if (!password.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain an uppercase letter';
    }
    if (!password.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain a number';
    }
    if (!password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      return 'Password must contain a special character';
    }
    return null;
  }

  // Checking if the form is ready to send yet or not
  bool _isFormValid() {
    return _passwordController.text.isNotEmpty &&
        _passwordValidationController.text.isNotEmpty &&
        _passwordMismatch == null &&
        _getPasswordError(_passwordController.text) == null;
  }

  // Called automatically when screen is destroyed
  @override
  void dispose() {
    _passwordController.removeListener(_onFieldChanged);
    _passwordValidationController.removeListener(_onFieldChanged);
    _passwordValidationController.removeListener(_checkPasswordsMatch);
    _passwordFocusNode.removeListener(_validatePasswordOnBlur);

    _passwordController.dispose();
    _passwordValidationController.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  // Reset password logic, API interaction
  Future<void> _handleSubmit() async {
    if (_passwordMismatch != null || _token == null) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiService = ApiService();
      final response = await apiService.post('/reset-password', {
        'token': _token,
        'password': _passwordController.text,
      });

      // If widget no longer on screen, leave
      if (!mounted) return;

      if (response.statusCode == 200) {
        setState(() {
          _submitted = true;
        });
      } else {
        setState(() {
          _errorMessage = 'This reset link is invalid or has expired. Please request a new one.';
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

  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _token == null
              ? [
                  const Text(
                    'This password reset link is invalid or has expired.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: _backToLogin,
                    child: const Text('Back to Login'),
                  ),
                ]
              : _submitted
                  ? [
                      const Text(
                        'Your password has been reset. You can now log in.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _backToLogin,
                        child: const Text('Back to Login'),
                      ),
                    ]
                  : [
                      const Text(
                        'Enter a new password for your account.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _passwordController,
                        focusNode: _passwordFocusNode,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'New Password',
                          border: const OutlineInputBorder(),
                          enabledBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: _passwordError != null ? Colors.red : Colors.black,
                            ),
                          ),
                          helperText: '8-14 characters, 1 uppercase letter, 1 number, 1 special character',
                          helperMaxLines: 2,
                          errorText: _passwordError,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _passwordValidationController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Confirm New Password',
                          border: const OutlineInputBorder(),
                          enabledBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: _passwordMismatch != null ? Colors.red : Colors.black,
                            ),
                          ),
                          errorText: _passwordMismatch,
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
                            : const Text('Reset Password'),
                      ),
                    ],
        ),
      ),
    );
  }
}
