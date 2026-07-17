import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../widgets/initial_avatar.dart';
import 'splash_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmNewPasswordController = TextEditingController();
  final _newPasswordFocusNode = FocusNode();

  String _originalUsername = '';
  String _originalEmail = '';

  bool? _usernameAvailable; // null = unchanged / not yet checked
  bool _isCheckingUsername = false;
  Timer? _usernameDebounce;

  String? _newPasswordError;
  String? _passwordMismatch;

  bool _isLoadingProfile = true;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _usernameController.addListener(_onUsernameChanged);
    _emailController.addListener(_onFieldChanged);
    _currentPasswordController.addListener(_onFieldChanged);
    _newPasswordController.addListener(_onFieldChanged);
    _confirmNewPasswordController.addListener(_checkPasswordsMatch);
    _newPasswordFocusNode.addListener(_validateNewPasswordOnBlur);
    _loadProfile();
  }

  void _onFieldChanged() => setState(() {});

  @override
  void dispose() {
    _usernameController.removeListener(_onUsernameChanged);
    _emailController.removeListener(_onFieldChanged);
    _currentPasswordController.removeListener(_onFieldChanged);
    _newPasswordController.removeListener(_onFieldChanged);
    _confirmNewPasswordController.removeListener(_checkPasswordsMatch);
    _newPasswordFocusNode.removeListener(_validateNewPasswordOnBlur);

    _usernameDebounce?.cancel();
    _usernameController.dispose();
    _emailController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmNewPasswordController.dispose();
    _newPasswordFocusNode.dispose();
    super.dispose();
  }

  // Loads the current username/email (AuthState only tracks the confirmed
  // email, not username) and refreshes the pending-email banner state
  Future<void> _loadProfile() async {
    setState(() {
      _isLoadingProfile = true;
      _errorMessage = null;
    });

    try {
      final authState = Provider.of<AuthState>(context, listen: false);
      final apiService = ApiService();
      final response = await apiService.get('/auth/me', token: authState.token);

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _originalUsername = data['username']?.toString() ?? '';
          _usernameController.text = _originalUsername;
          _originalEmail = data['email']?.toString() ?? '';
          _emailController.text = _originalEmail;
        });

        final pendingEmail = data['pendingEmail']?.toString();
        await authState.setPendingEmail(
          (pendingEmail != null && pendingEmail.isNotEmpty) ? pendingEmail : null,
        );
        if (data['email'] != null && data['email'] != authState.email) {
          await authState.updateEmail(data['email'].toString());
        }
      } else {
        setState(() {
          _errorMessage = 'Could not load your profile. Please try again.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not load your profile. Please try again.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingProfile = false;
        });
      }
    }
  }

  bool get _usernameChanged =>
      _usernameController.text.trim().isNotEmpty &&
      _usernameController.text.trim() != _originalUsername;

  bool get _emailChanged =>
      _emailController.text.trim().isNotEmpty &&
      _emailController.text.trim() != _originalEmail;

  bool get _wantsPasswordChange =>
      _currentPasswordController.text.isNotEmpty ||
      _newPasswordController.text.isNotEmpty ||
      _confirmNewPasswordController.text.isNotEmpty;

  // Debounced real-time username availability check
  void _onUsernameChanged() {
    setState(() {
      _usernameAvailable = null;
    });
    _usernameDebounce?.cancel();

    final candidate = _usernameController.text.trim();
    if (candidate.isEmpty || candidate == _originalUsername) return;

    _usernameDebounce = Timer(
      const Duration(milliseconds: 450),
      () => _checkUsernameAvailability(candidate),
    );
  }

  Future<void> _checkUsernameAvailability(String candidate) async {
    setState(() => _isCheckingUsername = true);

    try {
      final authState = Provider.of<AuthState>(context, listen: false);
      final apiService = ApiService();
      final response = await apiService.get(
        '/auth/checkUsername?username=${Uri.encodeQueryComponent(candidate)}',
        token: authState.token,
      );

      if (!mounted) return;

      // Ignore stale responses if the user kept typing
      if (_usernameController.text.trim() != candidate) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() => _usernameAvailable = data['available'] == true);
      }
    } catch (e) {
      // Save will still re-validate server-side; no need to surface this
    } finally {
      if (mounted) setState(() => _isCheckingUsername = false);
    }
  }

  // Make sure the new password matches its confirmation field
  void _checkPasswordsMatch() {
    setState(() {
      if (_confirmNewPasswordController.text.isEmpty) {
        _passwordMismatch = null;
      } else if (_newPasswordController.text != _confirmNewPasswordController.text) {
        _passwordMismatch = 'Passwords don\'t match';
      } else {
        _passwordMismatch = null;
      }
    });
  }

  void _validateNewPasswordOnBlur() {
    if (!_newPasswordFocusNode.hasFocus && _newPasswordController.text.isNotEmpty) {
      setState(() {
        _newPasswordError = _getPasswordError(_newPasswordController.text);
      });
    }
  }

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

  bool _isFormValid() {
    if (_usernameChanged && _usernameAvailable != true) return false;
    if (_emailChanged &&
        !RegExp(r'^[\w\.-]+@[\w\.-]+\.\w+$').hasMatch(_emailController.text.trim())) {
      return false;
    }
    if (_wantsPasswordChange) {
      if (_currentPasswordController.text.isEmpty) return false;
      if (_getPasswordError(_newPasswordController.text) != null) return false;
      if (_newPasswordController.text != _confirmNewPasswordController.text) return false;
    }
    return _usernameChanged || _emailChanged || _wantsPasswordChange;
  }

  Future<void> _handleSave() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    final body = <String, dynamic>{};
    if (_usernameChanged) body['username'] = _usernameController.text.trim();
    if (_emailChanged) body['email'] = _emailController.text.trim();
    if (_wantsPasswordChange) {
      body['currentPassword'] = _currentPasswordController.text;
      body['newPassword'] = _newPasswordController.text;
    }

    try {
      final authState = Provider.of<AuthState>(context, listen: false);
      final apiService = ApiService();
      final response = await apiService.put('/auth/profile', body, token: authState.token);

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        _originalUsername = data['username']?.toString() ?? _usernameController.text.trim();
        _usernameController.text = _originalUsername;

        final pendingEmail = data['pendingEmail']?.toString();
        await authState.setPendingEmail(
          (pendingEmail != null && pendingEmail.isNotEmpty) ? pendingEmail : null,
        );
        if (data['email'] != null) {
          _originalEmail = data['email'].toString();
          _emailController.text = _originalEmail;
          if (data['email'] != authState.email) {
            await authState.updateEmail(data['email'].toString());
          }
        }

        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmNewPasswordController.clear();

        if (!mounted) return;
        setState(() {
          _usernameAvailable = null;
          _newPasswordError = null;
          _passwordMismatch = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved.')),
        );
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _errorMessage =
              data['message'] ?? data['error'] ?? 'Could not save changes. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Something went wrong. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  void _goToSplash() {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const SplashScreen()),
      (route) => false,
    );
  }

  Future<void> _handleLogout() async {
    final authState = Provider.of<AuthState>(context, listen: false);
    await authState.logout();
    if (!mounted) return;
    _goToSplash();
  }

  Future<void> _handleDeleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account?'),
        content: const Text(
          'This permanently deletes your account, collection, and lists. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isSaving = true);

    try {
      final authState = Provider.of<AuthState>(context, listen: false);
      final apiService = ApiService();
      final response = await apiService.delete('/auth/account', token: authState.token);

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 204) {
        await authState.logout();
        if (!mounted) return;
        _goToSplash();
      } else {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not delete account. Please try again.')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Something went wrong. Please try again.')),
        );
      }
    }
  }

  Widget _usernameSuffixIcon() {
    if (!_usernameChanged) return const SizedBox.shrink();
    if (_isCheckingUsername) {
      return const Padding(
        padding: EdgeInsets.all(14),
        child: SizedBox(
          height: 16,
          width: 16,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }
    if (_usernameAvailable == true) {
      return const Icon(Icons.check_circle, color: Colors.green);
    }
    if (_usernameAvailable == false) {
      return const Icon(Icons.cancel, color: Colors.red);
    }
    return const SizedBox.shrink();
  }

  // Screen contents
  @override
  Widget build(BuildContext context) {
    final pendingEmail = context.watch<AuthState>().pendingEmail;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: _isLoadingProfile
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Center(
                  child: InitialAvatar(
                    seed: _originalUsername,
                    letter: _originalUsername,
                    radius: 40,
                  ),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _usernameController,
                  decoration: InputDecoration(
                    labelText: 'Username',
                    border: const OutlineInputBorder(),
                    suffixIcon: _usernameSuffixIcon(),
                    errorText: _usernameChanged && _usernameAvailable == false
                        ? 'That username is taken'
                        : null,
                  ),
                ),
                const SizedBox(height: 24),
                const Text('Change Password', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                TextField(
                  controller: _currentPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Current Password',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _newPasswordController,
                  focusNode: _newPasswordFocusNode,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    border: const OutlineInputBorder(),
                    helperText: '8-14 characters, 1 uppercase letter, 1 number, 1 special character',
                    helperMaxLines: 2,
                    errorText: _newPasswordError,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _confirmNewPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Confirm New Password',
                    border: const OutlineInputBorder(),
                    errorText: _passwordMismatch,
                  ),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email Address',
                    border: const OutlineInputBorder(),
                    helperText: pendingEmail != null ? 'Pending verification: $pendingEmail' : null,
                    helperMaxLines: 2,
                  ),
                ),
                const SizedBox(height: 16),
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                  ),
                ElevatedButton(
                  onPressed: (_isSaving || !_isFormValid()) ? null : _handleSave,
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Save'),
                ),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: _isSaving ? null : _handleLogout,
                  child: const Text('Logout'),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                  ),
                  onPressed: _isSaving ? null : _handleDeleteAccount,
                  child: const Text('Delete Account'),
                ),
              ],
            ),
    );
  }
}
