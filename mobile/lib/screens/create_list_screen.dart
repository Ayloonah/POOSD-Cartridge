import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../widgets/game_checklist.dart';

class CreateListScreen extends StatefulWidget {
  final List<Map<String, dynamic>> collectionEntries;

  const CreateListScreen({super.key, required this.collectionEntries});

  @override
  State<CreateListScreen> createState() => _CreateListScreenState();
}

class _CreateListScreenState extends State<CreateListScreen> {
  final _nameController = TextEditingController();
  final Set<String> _selectedEntryIds = {};

  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_onFieldChanged);
  }

  void _onFieldChanged() => setState(() {});

  @override
  void dispose() {
    _nameController.removeListener(_onFieldChanged);
    _nameController.dispose();
    super.dispose();
  }

  void _toggleEntry(String entryId) {
    setState(() {
      if (_selectedEntryIds.contains(entryId)) {
        _selectedEntryIds.remove(entryId);
      } else {
        _selectedEntryIds.add(entryId);
      }
    });
  }

  // Cover defaults to whichever selected game appears first in the collection
  String? _defaultCoverImage() {
    for (final entry in widget.collectionEntries) {
      if (_selectedEntryIds.contains(entry['entryId']?.toString())) {
        return entry['coverImage']?.toString();
      }
    }
    return null;
  }

  Future<void> _handleSave() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();
      final response = await apiService.post('/lists', {
        'name': _nameController.text.trim(),
        'coverImage': _defaultCoverImage(),
        'entryIds': _selectedEntryIds.toList(),
      }, token: token);

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        Navigator.pop(context, true);
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _errorMessage =
              data['message'] ?? data['error'] ?? 'Could not create the list. Please try again.';
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

  @override
  Widget build(BuildContext context) {
    final canSave = _nameController.text.trim().isNotEmpty && !_isSaving;

    return Scaffold(
      appBar: AppBar(title: const Text('New List')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'List Name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Add Games (optional)', style: TextStyle(fontWeight: FontWeight.w600)),
          GameChecklist(
            entries: widget.collectionEntries,
            selectedEntryIds: _selectedEntryIds,
            onToggle: _toggleEntry,
          ),
          const SizedBox(height: 16),
          if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            ),
          ElevatedButton(
            onPressed: canSave ? _handleSave : null,
            child: _isSaving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Create List'),
          ),
        ],
      ),
    );
  }
}
