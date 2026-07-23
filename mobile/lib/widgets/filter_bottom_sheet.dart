import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/constants/app_colors.dart';
import '../models/collection_filters.dart';

// Bottom sheet for live-editing collection filters — every change is
// applied immediately via onChanged, no separate "Apply" step. Each facet's
// own options (except "Belongs to List", which always lists every list)
// narrow to reflect what the *other* currently-active filters would leave
// visible, so e.g. picking a developer narrows the genre list, without a
// filter ever hiding its own currently-selected value.
class FilterBottomSheet extends StatefulWidget {
  final CollectionFilters current;
  final List<Map<String, dynamic>> entries; // already narrowed by search text
  final List<MapEntry<String, String>> availableLists; // (listId, name) — always shown in full
  final ValueChanged<CollectionFilters> onChanged;

  const FilterBottomSheet({
    super.key,
    required this.current,
    required this.entries,
    required this.availableLists,
    required this.onChanged,
  });

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late Set<String> _listIds;
  bool? _playedFilter;
  late RangeValues _yearRange;
  bool _yearRangeTouched = false;
  late Set<String> _developers;
  late Set<String> _genres;

  // Load whatever filters are already active as the starting selection
  @override
  void initState() {
    super.initState();
    _listIds = Set.from(widget.current.listIds);
    _playedFilter = widget.current.playedFilter;
    _developers = Set.from(widget.current.developers);
    _genres = Set.from(widget.current.genres);
    if (widget.current.releaseYearRange != null) {
      _yearRange = widget.current.releaseYearRange!;
      _yearRangeTouched = true;
    } else {
      _yearRange = const RangeValues(0, 0); // resynced on first build
    }
  }

  // Entries matching every active filter EXCEPT the ones named true here —
  // used to compute each facet's own options against what the *other*
  // filters would actually leave visible.
  List<Map<String, dynamic>> _entriesExcluding({
    bool list = false,
    bool played = false,
    bool year = false,
    bool developers = false,
    bool genres = false,
    required RangeValues? activeYearRange,
  }) {
    return widget.entries.where((entry) {
      if (!list && _listIds.isNotEmpty) {
        final entryListIds = (entry['listIds'] as List?)
                ?.map((id) => id.toString())
                .toSet() ??
            {};
        if (entryListIds.intersection(_listIds).isEmpty) return false;
      }
      if (!played && _playedFilter != null) {
        final isPlayed = entry['played'] == true;
        if (isPlayed != _playedFilter) return false;
      }
      if (!year && activeYearRange != null) {
        final releaseDate = entry['releaseDate'];
        if (releaseDate == null) return false;
        final entryYear = DateTime.parse(releaseDate).year;
        if (entryYear < activeYearRange.start.round() ||
            entryYear > activeYearRange.end.round()) {
          return false;
        }
      }
      if (!developers && _developers.isNotEmpty) {
        final entryDevelopers = (entry['developers'] as List?)
                ?.map((d) => d.toString())
                .toSet() ??
            {};
        if (entryDevelopers.intersection(_developers).isEmpty) return false;
      }
      if (!genres && _genres.isNotEmpty) {
        final entryGenres = (entry['genres'] as List?)
                ?.map((g) => g.toString())
                .toSet() ??
            {};
        if (entryGenres.intersection(_genres).isEmpty) return false;
      }
      return true;
    }).toList();
  }

  (int, int)? _yearBoundsFrom(List<Map<String, dynamic>> entries) {
    final years = entries
        .map((entry) => entry['releaseDate'])
        .where((date) => date != null)
        .map((date) => DateTime.parse(date).year)
        .toList();
    if (years.isEmpty) return null;
    years.sort();
    return (years.first, years.last);
  }

  void _emitChange() {
    widget.onChanged(
      CollectionFilters(
        listIds: _listIds,
        playedFilter: _playedFilter,
        releaseYearRange: _yearRangeTouched ? _yearRange : null,
        developers: _developers,
        genres: _genres,
      ),
    );
  }

  // Resets every filter and applies immediately — clearing is itself the
  // action here, same spirit as every other change in this sheet.
  void _clearAll() {
    setState(() {
      _listIds = {};
      _playedFilter = null;
      _yearRangeTouched = false;
      _developers = {};
      _genres = {};
    });
    _emitChange();
  }

  // Sheet contents
  @override
  Widget build(BuildContext context) {
    // Year bounds/effective range first — developer, genre, and played
    // facets below need to filter by whatever year range is currently
    // active (if any).
    final yearCandidates = _entriesExcluding(year: true, activeYearRange: null);
    final yearBounds = _yearBoundsFrom(yearCandidates);
    final hasYearData = yearBounds != null && yearBounds.$1 < yearBounds.$2;

    RangeValues? activeYearRange;
    RangeValues sliderValues = const RangeValues(0, 0);
    if (yearBounds != null) {
      final minD = yearBounds.$1.toDouble();
      final maxD = yearBounds.$2.toDouble();
      if (_yearRangeTouched) {
        // The user's chosen sub-range might now sit outside the (possibly
        // shrunk) dynamic bounds from other filters changing — clamp for
        // display so RangeSlider never receives out-of-bounds values.
        sliderValues = RangeValues(
          _yearRange.start.clamp(minD, maxD),
          _yearRange.end.clamp(minD, maxD),
        );
        activeYearRange = sliderValues;
      } else {
        // Keep tracking the full dynamic range until the user actually
        // drags the slider — this is what "no year filter active" looks like.
        sliderValues = RangeValues(minD, maxD);
        activeYearRange = null;
      }
    }

    final developerOptions = <String>{};
    for (final entry in _entriesExcluding(
      developers: true,
      activeYearRange: activeYearRange,
    )) {
      final list = entry['developers'] as List?;
      if (list != null) developerOptions.addAll(list.map((d) => d.toString()));
    }
    final sortedDevelopers = developerOptions.toList()..sort();

    final genreOptions = <String>{};
    for (final entry in _entriesExcluding(
      genres: true,
      activeYearRange: activeYearRange,
    )) {
      final list = entry['genres'] as List?;
      if (list != null) genreOptions.addAll(list.map((g) => g.toString()));
    }
    final sortedGenres = genreOptions.toList()..sort();

    final playedCandidates = _entriesExcluding(
      played: true,
      activeYearRange: activeYearRange,
    );
    final anyPlayed = playedCandidates.any((e) => e['played'] == true);
    final anyUnplayed = playedCandidates.any((e) => e['played'] != true);

    return DraggableScrollableSheet(
      // maxChildSize matches initialChildSize so scrolling through a long
      // filter list can never grow the sheet toward full-screen — it stays
      // pinned at 85%, leaving a backdrop strip up top that's always
      // reachable to tap-dismiss without first scrolling back to the top.
      initialChildSize: 0.85,
      minChildSize: 0.4,
      maxChildSize: 0.85,
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
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: _clearAll,
                    child: Text(
                      'Clear All',
                      style: GoogleFonts.inter(color: AppColors.darkGreen),
                    ),
                  ),
                ],
              ),
              if (widget.availableLists.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Belongs to List',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
                for (final list in widget.availableLists)
                  CheckboxListTile(
                    title: Text(list.value, style: GoogleFonts.inter()),
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
                      _emitChange();
                    },
                  ),
              ],
              const SizedBox(height: 8),
              Text(
                'Played Status',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
              RadioListTile<bool?>(
                title: Text('All', style: GoogleFonts.inter()),
                value: null,
                groupValue: _playedFilter,
                activeColor: AppColors.lightGreen,
                onChanged: (value) {
                  setState(() => _playedFilter = value);
                  _emitChange();
                },
              ),
              if (anyPlayed)
                RadioListTile<bool?>(
                  title: Text('Played', style: GoogleFonts.inter()),
                  value: true,
                  groupValue: _playedFilter,
                  activeColor: AppColors.lightGreen,
                  onChanged: (value) {
                    setState(() => _playedFilter = value);
                    _emitChange();
                  },
                ),
              if (anyUnplayed)
                RadioListTile<bool?>(
                  title: Text('Not Yet Played', style: GoogleFonts.inter()),
                  value: false,
                  groupValue: _playedFilter,
                  activeColor: AppColors.lightGreen,
                  onChanged: (value) {
                    setState(() => _playedFilter = value);
                    _emitChange();
                  },
                ),
              if (hasYearData) ...[
                const SizedBox(height: 8),
                Text(
                  'Release Year: ${sliderValues.start.round()} - ${sliderValues.end.round()}',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
                RangeSlider(
                  min: yearBounds.$1.toDouble(),
                  max: yearBounds.$2.toDouble(),
                  divisions: (yearBounds.$2 - yearBounds.$1).clamp(1, 100),
                  values: sliderValues,
                  activeColor: AppColors.lightGreen,
                  labels: RangeLabels(
                    sliderValues.start.round().toString(),
                    sliderValues.end.round().toString(),
                  ),
                  onChanged: (values) {
                    setState(() {
                      _yearRange = values;
                      _yearRangeTouched = true;
                    });
                    _emitChange();
                  },
                ),
              ],
              if (sortedDevelopers.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Developer',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
                for (final developer in sortedDevelopers)
                  CheckboxListTile(
                    title: Text(developer, style: GoogleFonts.inter()),
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
                      _emitChange();
                    },
                  ),
              ],
              if (sortedGenres.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Genre',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
                for (final genre in sortedGenres)
                  CheckboxListTile(
                    title: Text(genre, style: GoogleFonts.inter()),
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
                      _emitChange();
                    },
                  ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}
