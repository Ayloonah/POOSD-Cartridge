import 'package:flutter/material.dart';
import 'dart:async';
import '../services/api_service.dart';
import 'login_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String username;
  final String email;

  const VerifyEmailScreen({super.key, required this.username, required this.email});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  // If we need to resend the verification email
  bool _isResending = false;
  String? _resendMessage;
  int _cooldownSeconds = 0;
  Timer? _cooldownTimer;

  // Called automatically when screen is destroyed
  @override
  void dispose() {
    _cooldownTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleResend() async {
    setState(() {
      _isResending = true;
      _resendMessage = null;
    });

    try {
      final apiService = ApiService();
      final response = await apiService.post('/resend-verification', {
        'email': widget.email,
      });

      if (!mounted) return;

      if (response.statusCode == 200) {
        setState(() {
          _resendMessage = 'Verification email resent!';
        });
        _startCooldown();
      } else {
        setState(() {
          _resendMessage = 'Could not resend email. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        _resendMessage = 'Something went wrong. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isResending = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Email Validation')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'Check your email, ${widget.username}!',
              style: const TextStyle(fontSize: 18),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'We sent a verification link to ${widget.email}. After clicking on the link, come back and log in to start your Cartridge collection!',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (_resendMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  _resendMessage!,
                  style: const TextStyle(color: Colors.green),
                  textAlign: TextAlign.center,
                ),
              ),
            ElevatedButton(
              onPressed: (_isResending || _cooldownSeconds > 0) ? null : _handleResend,
              child: _isResending
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_cooldownSeconds > 0
                      ? 'Resend in ${_cooldownSeconds}s'
                      : 'Resend Verification Email'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              },
              child: const Text('Back to Login'),
            ),
          ],
        ),
      ),
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
}