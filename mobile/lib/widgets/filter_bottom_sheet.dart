import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/constants/app_colors.dart';
import '../models/collection_filters.dart';

// Bottom sheet for staging filter selections before applying them.
// Pops with the resulting CollectionFilters, or null if dismissed without applying.
class FilterBottomSheet extends StatefulWidget {
  final CollectionFilters current;
  final List<MapEntry<String, String>> availableLists; // (listId, name)
  final List<String> availableDevelopers;
  final List<String> availableGenres;
  final int minReleaseYear;
  final int maxReleaseYear;

  const FilterBottomSheet({
    super.key,
    required this.current,
    required this.availableLists,
    required this.availableDevelopers,
    required this.availableGenres,
    required this.minReleaseYear,
    required this.maxReleaseYear,
  });

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late Set<String> _listIds;
  bool? _playedFilter;
  late RangeValues _yearRange;
  late Set<String> _developers;
  late Set<String> _genres;

  // Load whatever filters are already active as the starting selection
  @override
  void initState() {
    super.initState();
    _listIds = Set.from(widget.current.listIds);
    _playedFilter = widget.current.playedFilter;
    _yearRange = widget.current.releaseYearRange ??
        RangeValues(
          widget.minReleaseYear.toDouble(),
          widget.maxReleaseYear.toDouble(),
        );
    _developers = Set.from(widget.current.developers);
    _genres = Set.from(widget.current.genres);
  }

  // Reset every field back to "no filter"
  void _clearAll() {
    setState(() {
      _listIds = {};
      _playedFilter = null;
      _yearRange = RangeValues(
        widget.minReleaseYear.toDouble(),
        widget.maxReleaseYear.toDouble(),
      );
      _developers = {};
      _genres = {};
    });
  }

  // Sheet contents
  @override
  Widget build(BuildContext context) {
    final hasYearData = widget.minReleaseYear < widget.maxReleaseYear;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return SafeArea(
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(16.0),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Filters',
                    style: GoogleFonts.roboto(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: _clearAll,
                    child: Text(
                      'Clear All',
                      style: GoogleFonts.roboto(color: AppColors.darkGreen),
                    ),
                  ),
                ],
              ),
              if (widget.availableLists.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Belongs to List',
                  style: GoogleFonts.roboto(fontWeight: FontWeight.w600),
                ),
                for (final list in widget.availableLists)
                  CheckboxListTile(
                    title: Text(list.value, style: GoogleFonts.roboto()),
                    value: _listIds.contains(list.key),
                    activeColor: AppColors.lightGreen,
                    checkColor: AppColors.darkGreen,
                    onChanged: (checked) {
                      setState(() {
                        if (checked == true) {
                          _listIds.add(list.key);
                        } else {
                          _listIds.remove(list.key);
                        }
                      });
                    },
                  ),
              ],
              const SizedBox(height: 8),
              Text(
                'Played Status',
                style: GoogleFonts.roboto(fontWeight: FontWeight.w600),
              ),
              RadioListTile<bool?>(
                title: Text('All', style: GoogleFonts.roboto()),
                value: null,
                groupValue: _playedFilter,
                activeColor: AppColors.lightGreen,
                onChanged: (value) => setState(() => _playedFilter = value),
              ),
              RadioListTile<bool?>(
                title: Text('Played', style: GoogleFonts.roboto()),
                value: true,
                groupValue: _playedFilter,
                activeColor: AppColors.lightGreen,
                onChanged: (value) => setState(() => _playedFilter = value),
              ),
              RadioListTile<bool?>(
                title: Text('Not Yet Played', style: GoogleFonts.roboto()),
                value: false,
                groupValue: _playedFilter,
                activeColor: AppColors.lightGreen,
                onChanged: (value) => setState(() => _playedFilter = value),
              ),
              if (hasYearData) ...[
                const SizedBox(height: 8),
                Text(
                  'Release Year: ${_yearRange.start.round()} - ${_yearRange.end.round()}',
                  style: GoogleFonts.roboto(fontWeight: FontWeight.w600),
                ),
                RangeSlider(
                  min: widget.minReleaseYear.toDouble(),
                  max: widget.maxReleaseYear.toDouble(),
                  divisions: (widget.maxReleaseYear - widget.minReleaseYear).clamp(1, 100),
                  values: _yearRange,
                  activeColor: AppColors.lightGreen,
                  labels: RangeLabels(
                    _yearRange.start.round().toString(),
                    _yearRange.end.round().toString(),
                  ),
                  onChanged: (values) => setState(() => _yearRange = values),
                ),
              ],
              if (widget.availableDevelopers.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Developer',
                  style: GoogleFonts.roboto(fontWeight: FontWeight.w600),
                ),
                for (final developer in widget.availableDevelopers)
                  CheckboxListTile(
                    title: Text(developer, style: GoogleFonts.roboto()),
                    value: _developers.contains(developer),
                    activeColor: AppColors.lightGreen,
                    checkColor: AppColors.darkGreen,
                    onChanged: (checked) {
                      setState(() {
                        if (checked == true) {
                          _developers.add(developer);
                        } else {
                          _developers.remove(developer);
                        }
                      });
                    },
                  ),
              ],
              if (widget.availableGenres.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Genre',
                  style: GoogleFonts.roboto(fontWeight: FontWeight.w600),
                ),
                for (final genre in widget.availableGenres)
                  CheckboxListTile(
                    title: Text(genre, style: GoogleFonts.roboto()),
                    value: _genres.contains(genre),
                    activeColor: AppColors.lightGreen,
                    checkColor: AppColors.darkGreen,
                    onChanged: (checked) {
                      setState(() {
                        if (checked == true) {
                          _genres.add(genre);
                        } else {
                          _genres.remove(genre);
                        }
                      });
                    },
                  ),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.lightGreen,
                  foregroundColor: AppColors.darkGreen,
                ),
                onPressed: () {
                  Navigator.pop(
                    context,
                    CollectionFilters(
                      listIds: _listIds,
                      playedFilter: _playedFilter,
                      releaseYearRange: (!hasYearData ||
                              (_yearRange.start == widget.minReleaseYear.toDouble() &&
                                  _yearRange.end == widget.maxReleaseYear.toDouble()))
                          ? null
                          : _yearRange,
                      developers: _developers,
                      genres: _genres,
                    ),
                  );
                },
                child: Text(
                  'Apply Filters',
                  style: GoogleFonts.roboto(
                    color: AppColors.darkGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
