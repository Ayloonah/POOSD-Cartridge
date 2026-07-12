import 'package:flutter/material.dart';
import 'dart:async';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/constants/app_colors.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _emailFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _emailController.addListener(_onFieldChanged);
    _emailFocusNode.addListener(_validateEmailOnBlur);
  }

  void _onFieldChanged() {
    setState(() {});
  }

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

  bool _isFormValid() {
    return _emailController.text.isNotEmpty &&
        RegExp(r'^[\w\.-]+@[\w\.-]+\.\w+$').hasMatch(_emailController.text);
  }

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

      if (!mounted) return;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkGreen,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: _submitted
                ? [
                    Text(
                      'If an account exists for that email, a password reset link has been sent.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.roboto(color: AppColors.textLight),
                    ),
                    const SizedBox(height: 16),
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.roboto(color: Colors.red),
                        ),
                      ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE0E0E0),
                        disabledBackgroundColor: const Color(0xFFE0E0E0),
                        foregroundColor: Colors.black54,
                        disabledForegroundColor: Colors.black26,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: (_isLoading || _cooldownSeconds > 0)
                          ? null
                          : _handleSubmit,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              _cooldownSeconds > 0
                                  ? 'Resend in ${_cooldownSeconds}s'
                                  : 'Resend Reset Link',
                              style: GoogleFonts.roboto(fontSize: 16),
                            ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton(
                        onPressed: _backToLogin,
                        child: Text(
                          'Back to Login',
                          style: GoogleFonts.roboto(color: AppColors.textLight),
                        ),
                      ),
                    ),
                  ]
                : [
                    Text(
                      'Enter your email address and we\'ll send you a link to reset your password.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.roboto(color: AppColors.textLight),
                    ),
                    const SizedBox(height: 20),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Email Address',
                        style: GoogleFonts.roboto(
                          color: AppColors.textLight,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _emailController,
                      focusNode: _emailFocusNode,
                      style: GoogleFonts.roboto(color: Colors.black87),
                      decoration: InputDecoration(
                        hintText: 'Email Address',
                        hintStyle: GoogleFonts.roboto(color: Colors.black45),
                        filled: true,
                        fillColor: AppColors.lightGreen,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        errorText: _emailFormatError,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_errorMessage != null)
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.roboto(color: Colors.red),
                      ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE0E0E0),
                        disabledBackgroundColor: const Color(0xFFE0E0E0),
                        foregroundColor: Colors.black54,
                        disabledForegroundColor: Colors.black26,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: (_isLoading || !_isFormValid())
                          ? null
                          : _handleSubmit,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              'Send Reset Link',
                              style: GoogleFonts.roboto(fontSize: 16),
                            ),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton(
                        onPressed: _backToLogin,
                        child: Text(
                          'Back to Login',
                          style: GoogleFonts.roboto(color: AppColors.textLight),
                        ),
                      ),
                    ),
                  ],
          ),
        ),
      ),
    );
  }
}
