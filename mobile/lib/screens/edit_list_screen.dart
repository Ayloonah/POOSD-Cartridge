import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_state.dart';
import '../widgets/game_checklist.dart';

class EditListScreen extends StatefulWidget {
  final Map<String, dynamic> list;
  final List<Map<String, dynamic>> collectionEntries;

  const EditListScreen({
    super.key,
    required this.list,
    required this.collectionEntries,
  });

  @override
  State<EditListScreen> createState() => _EditListScreenState();
}

class _EditListScreenState extends State<EditListScreen> {
  late final TextEditingController _nameController;
  late Set<String> _selectedEntryIds;
  String? _selectedCoverUrl;

  bool _isSaving = false;
  bool _isDeleting = false;
  String? _errorMessage;

  // Pre-fill from the list's current name, cover, and member games
  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.list['name']?.toString() ?? '');
    _nameController.addListener(_onFieldChanged);

    final listId = widget.list['listId']?.toString();
    _selectedEntryIds = widget.collectionEntries
        .where((entry) {
          final listIds = (entry['listIds'] as List?)?.map((id) => id.toString()).toSet() ?? {};
          return listIds.contains(listId);
        })
        .map((entry) => entry['entryId'].toString())
        .toSet();

    _selectedCoverUrl = widget.list['coverImage']?.toString();
  }

  void _onFieldChanged() => setState(() {});

  @override
  void dispose() {
    _nameController.removeListener(_onFieldChanged);
    _nameController.dispose();
    super.dispose();
  }

  // Games currently checked, in collection order — cover choices come from here
  List<Map<String, dynamic>> get _selectedEntries => widget.collectionEntries
      .where((entry) => _selectedEntryIds.contains(entry['entryId']?.toString()))
      .toList();

  void _toggleEntry(String entryId) {
    setState(() {
      if (_selectedEntryIds.contains(entryId)) {
        _selectedEntryIds.remove(entryId);
      } else {
        _selectedEntryIds.add(entryId);
      }
      // If the game backing the current cover got unchecked, fall back to
      // the next selected game's cover (or none, if the list is now empty)
      final stillAvailable =
          _selectedEntries.any((entry) => entry['coverImage']?.toString() == _selectedCoverUrl);
      if (!stillAvailable) {
        _selectedCoverUrl =
            _selectedEntries.isNotEmpty ? _selectedEntries.first['coverImage']?.toString() : null;
      }
    });
  }

  Future<void> _handleSave() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();
      final response = await apiService.patch('/lists/${widget.list['listId']}', {
        'name': _nameController.text.trim(),
        'coverImage': _selectedCoverUrl,
        'entryIds': _selectedEntryIds.toList(),
      }, token: token);

      if (!mounted) return;

      if (response.statusCode == 200) {
        Navigator.pop(context, true);
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _errorMessage =
              data['message'] ?? data['error'] ?? 'Could not save. Please try again.';
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

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete List?'),
        content: Text('This will delete "${widget.list['name']}". Games stay in your collection.'),
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

    setState(() => _isDeleting = true);

    try {
      final token = Provider.of<AuthState>(context, listen: false).token;
      final apiService = ApiService();
      final response = await apiService.delete(
        '/lists/${widget.list['listId']}',
        token: token,
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 204) {
        Navigator.pop(context, true);
      } else {
        setState(() => _isDeleting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not delete. Please try again.')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isDeleting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Something went wrong. Please try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSave = _nameController.text.trim().isNotEmpty && !_isSaving;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit List'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: _isDeleting ? null : _handleDelete,
          ),
        ],
      ),
      body: _isDeleting
          ? const Center(child: CircularProgressIndicator())
          : ListView(
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
                const Text('Cover', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                if (_selectedEntries.isEmpty)
                  const Text('Add a game below to set a cover.')
                else
                  SizedBox(
                    height: 90,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _selectedEntries.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final entry = _selectedEntries[index];
                        final coverUrl = entry['coverImage']?.toString();
                        final isSelected = coverUrl == _selectedCoverUrl;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedCoverUrl = coverUrl),
                          child: Container(
                            width: 64,
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSelected ? Colors.blue : Colors.transparent,
                                width: 3,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: (coverUrl == null || coverUrl.isEmpty)
                                  ? Container(color: Colors.grey[300])
                                  : Image.network(
                                      coverUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) =>
                                          Container(color: Colors.grey[300]),
                                    ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 24),
                const Text('Games in this List', style: TextStyle(fontWeight: FontWeight.w600)),
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
                      : const Text('Save Changes'),
                ),
              ],
            ),
    );
  }
}
