import 'package:flutter/material.dart';

import '../../models/emploi_du_temps_model.dart';
import '../../services/emploi_du_temps_service.dart';
import '../../services/storage_service.dart';



class StudentTimetableScreen extends StatefulWidget {
  const StudentTimetableScreen({super.key});

  @override
  State<StudentTimetableScreen> createState() => _StudentTimetableScreenState();
}

class _StudentTimetableScreenState extends State<StudentTimetableScreen> {
  static const _bg = Color(0xFF0F1117);
  static const _card = Color(0xFF121826);
  static const _text = Color(0xFFE2E8F0);
  static const _muted = Color(0xFF94A3B8);
  static const _primary = Color(0xFF6366F1);
  static const _secondary = Color(0xFF8B5CF6);

  final _emploiService = EmploiDuTempsService.instance;


  bool _loading = true;
  String? _error;

  int _currentWeek = 0; // UI parity with web (not used by backend)

  final List<String> _days = const [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ];

  Map<String, List<_SessionVM>> _schedule = {};
  _SessionVM? _selected;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // backend is authenticated in the mobile app via ApiService interceptors.
      // The /emploi/getAll endpoint already returns the correct timetable for the connected student.
      await StorageService.instance.getToken();

      final emplois = await _emploiService.getAllEmploi();

      // Do NOT re-filter on mobile using user.classeId, because the stored user shape may differ
      // (classeId can be null/empty/wrong key), leading to missing/incorrect schedules.
      final filteredEmplois = emplois;



      if (filteredEmplois.isEmpty) {
        setState(() {
          _schedule = {for (final d in _days) d: []};
          _loading = false;
        });
        return;
      }


      final normalizeJourSemaine = (dynamic value) {
        if (value == null) return null;
        final v = value.toString().trim().toLowerCase();
        final map = <String, String>{
          'lundi': 'Lundi',
          'mardi': 'Mardi',
          'mercredi': 'Mercredi',
          'jeudi': 'Jeudi',
          'vendredi': 'Vendredi',
          'samedi': 'Samedi',
          'dimanche': 'Dimanche',
        };
        return map[v];
      };

      String normalizeTimeHHmm(String? value) {
        if (value == null) return '00:00';
        final s = value.trim().replaceAll('h', ':');
        final parts = s.split(':');
        if (parts.length < 2) return '00:00';
        final hh = int.tryParse(parts[0]) ?? 0;
        final mm = int.tryParse(parts[1]) ?? 0;
        return '${hh.toString().padLeft(2, '0')}:${mm.toString().padLeft(2, '0')}';
      }

      final scheduleData = <String, List<_SessionVM>>{
        for (final d in _days) d: [],
      };

      for (final emploi in filteredEmplois) {
        // Backend returns the timetable entries inside `emploi.seances`.
        // Each seance has: jourSemaine, heureDebut, heureFin, salle, typeCours, cours, cours.enseignant
        for (final seance in emploi.seances) {
          final day = normalizeJourSemaine(seance.jourSemaine);
          if (day == null || !scheduleData.containsKey(day)) continue;

          final coursName = seance.cours?.nom?.toString().trim().isNotEmpty == true
              ? seance.cours!.nom!.toString().trim()
              : (seance.cours?.name?.toString().trim().isNotEmpty == true ? seance.cours!.name!.toString().trim() : 'Course');

          final instructorName = seance.cours?.enseignant != null
              ? '${seance.cours!.enseignant!.prenom ?? ''} ${seance.cours!.enseignant!.nom ?? ''}'.trim().isNotEmpty
                  ? '${seance.cours!.enseignant!.prenom ?? ''} ${seance.cours!.enseignant!.nom ?? ''}'.trim()
                  : 'Instructor'
              : 'Instructor';

          scheduleData[day]!.add(
            _SessionVM(
              course: coursName,
              room: seance.salle.isNotEmpty ? seance.salle : 'Room TBA',
              instructor: instructorName,
              type: seance.typeCours.isNotEmpty ? seance.typeCours : (seance.type ?? 'Lecture'),
              seanceId: seance.id,
              notes: '',
              heureDebut: normalizeTimeHHmm(seance.heureDebut),
              heureFin: normalizeTimeHHmm(seance.heureFin),
            ),
          );
        }
      }



      for (final d in _days) {
        scheduleData[d]!.sort(
          (a, b) => a.heureDebut.compareTo(b.heureDebut),
        );
      }

      setState(() {
        _schedule = scheduleData;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  int _getTodayIndex() {
    final today = DateTime.now().weekday; // 1..7 (Mon..Sun)
    return today - 1; // 0..6
  }

  List<Color> _cellGradient(String course) {
    final lc = course.toLowerCase();
    if (lc.contains('security') || lc.contains('cryptography') || lc.contains('second')) {
      return const [Color(0xFF10B981), Color(0xFF0D9488)];
    }
    if (lc.contains('data') || lc.contains('analytics') || lc.contains('third')) {
      return const [Color(0xFFF97316), Color(0xFFEC4899)];
    }
    if (lc.contains('machine') || lc.contains('learning') || lc.contains('orange')) {
      return const [Color(0xFFF59E0B), Color(0xFFEC4899)];
    }
    if (lc.contains('network') || lc.contains('green')) {
      return const [Color(0xFF22C55E), Color(0xFF16A34A)];
    }
    if (lc.contains('web') || lc.contains('development')) {
      return const [Color(0xFF8B5CF6), Color(0xFF6D28D9)];
    }
    return const [Color(0xFF6366F1), Color(0xFF9333EA)];
  }

  int get _totalClasses => _schedule.values.fold<int>(0, (sum, list) => sum + list.length);

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: _bg,
        body: SafeArea(
          child: Center(
            child: CircularProgressIndicator(color: _primary),
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: _bg,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: _card,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: Colors.white.withOpacity(0.07)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline_rounded, size: 52, color: Color(0xFFEF4444)),
                    const SizedBox(height: 14),
                    const Text(
                      'Error Loading Schedule',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: _muted,
                      ),
                    ),
                    const SizedBox(height: 22),
                    _GradientButton(
                      label: 'Try Again',
                      gradient: const [_primary, _secondary],
                      onTap: _fetch,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    final hasSchedule = _totalClasses > 0;

    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: _primary,
          onRefresh: _fetch,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [_primary, Color(0xFFEC4899)],
                        ).createShader(bounds),
                        child: const Text(
                          'Weekly Schedule',
                          style: TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.1,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        hasSchedule
                            ? '${_totalClasses} classes scheduled this week'
                            : 'No schedule available',
                        style: TextStyle(color: _muted, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => setState(() => _currentWeek--),
                        icon: const Icon(Icons.chevron_left_rounded),
                        color: Colors.white,
                      ),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                          decoration: BoxDecoration(
                            color: _card,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.white.withOpacity(0.07)),
                          ),
                          child: Column(
                            children: [
                              Text(
                                'Week ${(_currentWeek).abs() + 1}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Fall 2025',
                                style: TextStyle(fontSize: 12, color: _muted),
                              ),
                            ],
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => setState(() => _currentWeek++),
                        icon: const Icon(Icons.chevron_right_rounded),
                        color: Colors.white,
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _card,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: Colors.white.withOpacity(0.07)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.35),
                          blurRadius: 22,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: !hasSchedule
                        ? SizedBox(
                            height: 260,
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: const [
                                  Icon(Icons.menu_book_outlined, size: 64, color: Colors.grey),
                                  SizedBox(height: 16),
                                  Text(
                                    'No Schedule Available',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : Column(
                            children: List.generate(_days.length, (index) {
                              final day = _days[index];
                              final isToday = index == _getTodayIndex();
                              final items = _schedule[day] ?? [];

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 18),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(16),
                                        gradient: isToday
                                            ? const LinearGradient(
                                                colors: [Color(0xFF3B82F6), Color(0xFF9333EA)],
                                              )
                                            : null,
                                        color: isToday ? null : Colors.white.withOpacity(0.04),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            day,
                                            style: TextStyle(
                                              color: isToday ? Colors.white : _text,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          if (isToday)
                                            const Padding(
                                              padding: EdgeInsets.only(top: 4),
                                              child: Text(
                                                'Today',
                                                style: TextStyle(
                                                  color: Colors.white70,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    items.isNotEmpty
                                        ? Column(
                                            children: List.generate(items.length, (i) {
                                              final s = items[i];
                                              final gradient = _cellGradient(s.course);
                                              return Padding(
                                                padding: const EdgeInsets.only(bottom: 10),
                                                child: InkWell(
                                                  borderRadius: BorderRadius.circular(18),
                                                  onTap: () => setState(() => _selected = s),
                                                  child: Container(
                                                    padding: const EdgeInsets.all(14),
                                                    decoration: BoxDecoration(
                                                      borderRadius: BorderRadius.circular(18),
                                                      gradient: LinearGradient(
                                                        colors: [gradient[0], gradient[1]],
                                                      ),
                                                      border: Border.all(
                                                        color: Colors.white.withOpacity(0.18),
                                                        width: 1,
                                                      ),
                                                      boxShadow: [
                                                        BoxShadow(
                                                          color: Colors.black.withOpacity(0.22),
                                                          blurRadius: 16,
                                                        ),
                                                      ],
                                                    ),
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          s.course,
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                          style: const TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 14,
                                                            fontWeight: FontWeight.w900,
                                                          ),
                                                        ),
                                                        const SizedBox(height: 10),
                                                        Row(
                                                          children: [
                                                            const Icon(Icons.access_time_rounded, size: 16, color: Colors.white70),
                                                            const SizedBox(width: 8),
                                                            Text(
                                                              '${s.heureDebut} - ${s.heureFin}',
                                                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                                                            ),
                                                          ],
                                                        ),
                                                        const SizedBox(height: 6),
                                                        Row(
                                                          children: [
                                                            const Icon(Icons.location_on_rounded, size: 16, color: Colors.white70),
                                                            const SizedBox(width: 8),
                                                            Text(
                                                              s.room,
                                                              maxLines: 1,
                                                              overflow: TextOverflow.ellipsis,
                                                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                                                            ),
                                                          ],
                                                        ),
                                                        const SizedBox(height: 10),
                                                        Align(
                                                          alignment: Alignment.centerLeft,
                                                          child: Container(
                                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                                            decoration: BoxDecoration(
                                                              color: Colors.white.withOpacity(0.18),
                                                              borderRadius: BorderRadius.circular(999),
                                                              border: Border.all(color: Colors.white.withOpacity(0.20)),
                                                            ),
                                                            child: Text(
                                                              s.type,
                                                              style: const TextStyle(
                                                                color: Colors.white,
                                                                fontSize: 11,
                                                                fontWeight: FontWeight.w900,
                                                              ),
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              );
                                            }),
                                          )
                                        : Container(
                                            height: 64,
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(18),
                                              border: Border.all(color: Colors.white.withOpacity(0.12)),
                                            ),
                                            child: Text(
                                              'No classes',
                                              style: TextStyle(color: _muted, fontWeight: FontWeight.w700, fontSize: 13),
                                            ),
                                          ),
                                  ],
                                ),
                              );
                            }),
                          ),
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

class _SessionVM {
  final String course;
  final String room;
  final String instructor;
  final String type;
  final String seanceId;
  final String notes;
  final String heureDebut;
  final String heureFin;

  _SessionVM({
    required this.course,
    required this.room,
    required this.instructor,
    required this.type,
    required this.seanceId,
    required this.notes,
    required this.heureDebut,
    required this.heureFin,
  });
}

class _GradientButton extends StatelessWidget {
  final String label;
  final List<Color> gradient;
  final VoidCallback onTap;

  const _GradientButton({
    required this.label,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: gradient),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}

