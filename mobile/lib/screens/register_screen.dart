import 'package:flutter/material.dart';
import 'dart:convert';
import '../services/api_service.dart';
import 'email_verif_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Read user input and manage it
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailController = TextEditingController();
  final _emailValidationController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _passwordValidationController = TextEditingController();

  // Set up a listener for the email validation
  @override
  void initState() {
    super.initState();
    // Listeners initialization
    _emailValidationController.addListener(_checkEmailsMatch);
    _firstNameController.addListener(_onFieldChanged);
    _lastNameController.addListener(_onFieldChanged);
    _usernameController.addListener(_onFieldChanged);
    _passwordController.addListener(_onFieldChanged);
    _emailController.addListener(_onFieldChanged);
    _emailValidationController.addListener(_onFieldChanged);
    _passwordValidationController.addListener(_onFieldChanged);
    _usernameFocusNode.addListener(_validateUsernameOnBlur);
    _passwordFocusNode.addListener(_validatePasswordOnBlur);
    _emailFocusNode.addListener(_validateEmailOnBlur);
    _passwordValidationController.addListener(_checkPasswordsMatch);
  }

  // Check to make sure both email fields match
  void _checkEmailsMatch() {
    setState(() {
      if (_emailValidationController.text.isEmpty) {
        _emailMismatch = null;
      } else if (_emailController.text != _emailValidationController.text) {
        _emailMismatch = 'Email addresses don\'t match';
      } else {
        _emailMismatch = null;
      }
    });
  }

  // Make sure usernames don't have spaces in them
  void _validateUsernameOnBlur() {
    if (!_usernameFocusNode.hasFocus && _usernameController.text.isNotEmpty) {
      setState(() {
        if (_usernameController.text.contains(' ')) {
          _usernameError = 'Username cannot contain spaces';
        } else {
          _usernameError = null;
        }
      });
    }
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

  // Called automatically when screen is destroyed
  @override
  void dispose() {
    // Release listeners
    _emailValidationController.removeListener(_checkEmailsMatch);
    _firstNameController.removeListener(_onFieldChanged);
    _lastNameController.removeListener(_onFieldChanged);
    _usernameController.removeListener(_onFieldChanged);
    _passwordController.removeListener(_onFieldChanged);
    _emailController.removeListener(_onFieldChanged);
    _emailValidationController.removeListener(_onFieldChanged);
    _passwordValidationController.removeListener(_onFieldChanged);
    _usernameFocusNode.removeListener(_validateUsernameOnBlur);
    _passwordFocusNode.removeListener(_validatePasswordOnBlur);
    _emailFocusNode.removeListener(_validateEmailOnBlur);
    _passwordValidationController.removeListener(_checkPasswordsMatch);

    // Release resources held by controllers
    _usernameController.dispose();
    _passwordController.dispose();
    _emailController.dispose();
    _emailValidationController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameFocusNode.dispose();
    _passwordFocusNode.dispose();
    _emailFocusNode.dispose();
    _passwordValidationController.dispose();

    // Do what dispose() usually does as well
    super.dispose();
  }

  bool _isLoading = false;
  String? _errorMessage;
  String? _emailMismatch;
  String? _passwordMismatch;

  final _usernameFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  final _emailFocusNode = FocusNode();

  String? _usernameError;
  String? _passwordError;
  String? _emailFormatError;

  // Checking if the form is ready to send yet or not
  bool _isFormValid() {
  return _firstNameController.text.isNotEmpty &&
      _lastNameController.text.isNotEmpty &&
      _usernameController.text.isNotEmpty &&
      _passwordController.text.isNotEmpty &&
      _passwordValidationController.text.isNotEmpty &&
      _emailController.text.isNotEmpty &&
      _emailValidationController.text.isNotEmpty &&
      _emailMismatch == null &&
      _passwordMismatch == null;
}

  // Registration logic, API interaction
  Future<void> _handleRegister() async {
    // If the emails and/or password don't match, don't allow registration
    if (_emailMismatch != null || _passwordMismatch != null) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiService = ApiService();
      final response = await apiService.post('/register', {
        'firstName': _firstNameController.text,
        'lastName': _lastNameController.text,
        'email': _emailController.text,
        'username': _usernameController.text,
        'password': _passwordController.text,
      });

      // If widget no longer on screen, leave
      if (!mounted) return;

      // If response from API is good
      if (response.statusCode ==  201) {
        final data = jsonDecode(response.body);
        Navigator.pushReplacement(
          context, 
          MaterialPageRoute(builder: (context) => VerifyEmailScreen(username: data['username'], email: _emailController.text)),
        );
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _errorMessage = data['error'] ?? 'Registration failed. Please check your information and try again.';
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
  
  // Screen contents
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      // Registration form
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _firstNameController,
              decoration: const InputDecoration(
                labelText: 'First Name',
                border: OutlineInputBorder()
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _lastNameController,
              decoration: const InputDecoration(
                labelText: 'Last Name',
                border: OutlineInputBorder()
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _usernameController,
              focusNode: _usernameFocusNode,
              decoration: InputDecoration(
                labelText: 'Username',
                border: OutlineInputBorder(),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: _usernameError != null ? Colors.red : Colors.black,
                  ),
                ),
                errorText: _usernameError,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              focusNode: _passwordFocusNode,
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
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
                labelText: 'Confirm your Password',
                border: OutlineInputBorder(),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: _passwordMismatch != null ? Colors.red : Colors.black,
                  ),
                ),
                errorText: _passwordMismatch,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              focusNode: _emailFocusNode,
              decoration: InputDecoration(
                labelText: 'Email Address',
                border: OutlineInputBorder(),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: _emailFormatError != null ? Colors.red : Colors.black,
                  ),
                ),
                errorText: _emailFormatError,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailValidationController,
              decoration: InputDecoration(
                labelText: 'Confirm Your Email',
                border: OutlineInputBorder(),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(
                    color: _emailMismatch != null ? Colors.red : Colors.black,
                  ),
                ),
                errorText: _emailMismatch,
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
              onPressed: (_isLoading || !_isFormValid()) ? null : _handleRegister,
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Register'),
            ),
          ],
        ),
      )
    );
  }
}