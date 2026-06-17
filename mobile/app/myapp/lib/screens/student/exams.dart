import 'package:flutter/material.dart';

import '../../models/examen_model.dart';
import '../../models/note_model.dart';
import '../../services/examen_service.dart';
import '../../services/note_service.dart';
import '../../services/storage_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Dark React-style colors
// ─────────────────────────────────────────────────────────────────────────────

const Color _bg = Color(0xFF0F1117);
const Color _card = Color(0xFF121826);
const Color _border = Color(0xFF2A2D3A);
const Color _primary = Color(0xFF6366F1);
const Color _secondary = Color(0xFF8B5CF6);
const Color _accent = Color(0xFFEC4899);
const Color _text = Color(0xFFE2E8F0);
const Color _muted = Color(0xFF94A3B8);
const Color _green = Color(0xFF10B981);
const Color _amber = Color(0xFFF59E0B);
const Color _red = Color(0xFFEF4444);
const Color _blue = Color(0xFF3B82F6);

// ─────────────────────────────────────────────────────────────────────────────
// View Model
// ─────────────────────────────────────────────────────────────────────────────

class _ExamVM {
  final ExamenModel exam;
  final NoteModel? note;
  final List<Color> gradient;

  _ExamVM({
    required this.exam,
    required this.note,
    required this.gradient,
  });

  bool get isCompleted {
    return DateTime.now().isAfter(exam.dateExamen) || note != null;
  }

  String get status => isCompleted ? 'Completed' : 'Upcoming';

  double? get score => note?.valeur;

  String? get gradeLetter => note?.gradeLetter;

  double get percentage {
    if (note == null || exam.noteTotale == 0) return 0;
    return (note!.valeur / exam.noteTotale) * 100;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

class StudentExamsScreen extends StatefulWidget {
  const StudentExamsScreen({super.key});

  @override
  State<StudentExamsScreen> createState() => _StudentExamsScreenState();
}

class _StudentExamsScreenState extends State<StudentExamsScreen> {
  final _examenService = ExamenService.instance;
  final _noteService = NoteService.instance;

  bool _loading = true;
  String? _error;

  String _filter = 'all';

  List<_ExamVM> _exams = [];

  @override
  void initState() {
    super.initState();
    _fetchExamsAndNotes();
  }

  Future<void> _fetchExamsAndNotes() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final user = await StorageService.instance.getUser();
      final userJson = user?.toJson();



      final examens = await _examenService.getAllExamens();

      List<NoteModel> notes = [];

      notes = await _noteService.getStudentNotes();


      final mapped = examens.asMap().entries.map((entry) {
        final index = entry.key;
        final exam = entry.value;

        NoteModel? note;
        try {
          note = notes.firstWhere((n) => n.examenId == exam.id);
        } catch (_) {
          note = null;
        }

        return _ExamVM(
          exam: exam,
          note: note,
          gradient: _gradientByIndex(index),
        );
      }).toList();

      if (!mounted) return;

      setState(() {
        _exams = mapped;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  List<_ExamVM> get _filteredExams {
    if (_filter == 'upcoming') {
      return _exams.where((e) => e.status.toLowerCase() == 'upcoming').toList();
    }

    if (_filter == 'completed') {
      return _exams.where((e) => e.status.toLowerCase() == 'completed').toList();
    }

    return _exams;
  }

  List<_ExamVM> get _completedExams {
    return _exams.where((e) => e.isCompleted).toList();
  }

  List<_ExamVM> get _upcomingExams {
    return _exams.where((e) => !e.isCompleted).toList();
  }

  double get _averagePercentage {
    final graded = _exams.where((e) => e.note != null).toList();

    if (graded.isEmpty) return 0;

    final total = graded.fold<double>(
      0,
      (sum, e) => sum + e.percentage,
    );

    return total / graded.length;
  }

  String get _gpa {
    final value = _averagePercentage / 25;
    return value.toStringAsFixed(2);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: _bg,
        body: Center(
          child: CircularProgressIndicator(color: _primary),
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
              child: _ErrorBox(
                error: _error!,
                onRetry: _fetchExamsAndNotes,
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: _primary,
          onRefresh: _fetchExamsAndNotes,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              const _Header(),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                sliver: SliverToBoxAdapter(
                  child: _StatsGrid(
                    gpa: _gpa,
                    averageScore: '${_averagePercentage.round()}%',
                    examsTaken: _completedExams.length.toString(),
                    upcoming: _upcomingExams.length.toString(),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                sliver: SliverToBoxAdapter(
                  child: _FilterTabs(
                    active: _filter,
                    onChanged: (value) {
                      setState(() => _filter = value);
                    },
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                sliver: _filteredExams.isEmpty
                    ? const SliverToBoxAdapter(
                        child: _EmptyCard(),
                      )
                    : SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final item = _filteredExams[index];

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: _ExamCard(
                                item: item,
                                onStudyNow: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Study now: ${item.exam.titre}',
                                      ),
                                      backgroundColor: _primary,
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                          childCount: _filteredExams.length,
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

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ShaderMask(
              shaderCallback: (bounds) {
                return const LinearGradient(
                  colors: [_primary, _secondary, _accent],
                ).createShader(bounds);
              },
              child: const Text(
                'Exams & Grades',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.8,
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Track your exam schedule and academic performance',
              style: TextStyle(
                color: _muted,
                fontSize: 15,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  final String gpa;
  final String averageScore;
  final String examsTaken;
  final String upcoming;

  const _StatsGrid({
    required this.gpa,
    required this.averageScore,
    required this.examsTaken,
    required this.upcoming,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      _StatItem(
        label: 'Current GPA',
        value: gpa,
        icon: Icons.workspace_premium_rounded,
        gradient: const [_accent, _secondary],
      ),
      _StatItem(
        label: 'Average Score',
        value: averageScore,
        icon: Icons.trending_up_rounded,
        gradient: const [_primary, _accent],
      ),
      _StatItem(
        label: 'Exams Taken',
        value: examsTaken,
        icon: Icons.description_rounded,
        gradient: const [_secondary, _primary],
      ),
      _StatItem(
        label: 'Upcoming',
        value: upcoming,
        icon: Icons.calendar_month_rounded,
        gradient: const [_accent, _primary],
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 1.25,
      ),
      itemBuilder: (context, index) {
        return _StatCard(item: items[index]);
      },
    );
  }
}

class _StatItem {
  final String label;
  final String value;
  final IconData icon;
  final List<Color> gradient;

  _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    required this.gradient,
  });
}

class _StatCard extends StatelessWidget {
  final _StatItem item;

  const _StatCard({
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.28),
            blurRadius: 22,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: item.gradient.map((c) => c.withOpacity(0.06)).toList(),
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: item.gradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: item.gradient.first.withOpacity(0.30),
                      blurRadius: 16,
                    ),
                  ],
                ),
                child: Icon(
                  item.icon,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const Spacer(),
              Text(
                item.value,
                style: const TextStyle(
                  color: _text,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                item.label,
                style: const TextStyle(
                  color: _muted,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter Tabs
// ─────────────────────────────────────────────────────────────────────────────

class _FilterTabs extends StatelessWidget {
  final String active;
  final ValueChanged<String> onChanged;

  const _FilterTabs({
    required this.active,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          _FilterButton(
            value: 'all',
            label: 'All Exams',
            icon: Icons.filter_list_rounded,
            active: active == 'all',
            onTap: () => onChanged('all'),
          ),
          _FilterButton(
            value: 'upcoming',
            label: 'Upcoming',
            icon: Icons.calendar_month_rounded,
            active: active == 'upcoming',
            onTap: () => onChanged('upcoming'),
          ),
          _FilterButton(
            value: 'completed',
            label: 'Completed',
            icon: Icons.check_circle_rounded,
            active: active == 'completed',
            onTap: () => onChanged('completed'),
          ),
        ],
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  const _FilterButton({
    required this.value,
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
          decoration: BoxDecoration(
            color: active ? _primary : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: active ? Colors.white : _muted,
                size: 19,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: active ? Colors.white : _muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exam Card
// ─────────────────────────────────────────────────────────────────────────────

class _ExamCard extends StatelessWidget {
  final _ExamVM item;
  final VoidCallback onStudyNow;

  const _ExamCard({
    required this.item,
    required this.onStudyNow,
  });

  @override
  Widget build(BuildContext context) {
    final exam = item.exam;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.30),
            blurRadius: 22,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: item.gradient.map((c) => c.withOpacity(0.06)).toList(),
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: item.gradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: item.gradient.first.withOpacity(0.30),
                          blurRadius: 18,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.description_rounded,
                      color: Colors.white,
                      size: 29,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exam.titre,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: _text,
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _Badge(
                              text: exam.type.toUpperCase(),
                              color: _primary,
                            ),
                            _Badge(
                              text: item.status,
                              color: item.isCompleted ? _green : _amber,
                            ),
                            _Badge(
                              text: '${exam.noteTotale.toStringAsFixed(0)} pts',
                              color: _blue,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(
                    Icons.calendar_month_rounded,
                    size: 17,
                    color: _muted,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _formatDate(exam.dateExamen),
                    style: const TextStyle(
                      color: _muted,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Icon(
                    Icons.access_time_rounded,
                    size: 17,
                    color: _muted,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _formatTime(exam.dateExamen),
                    style: const TextStyle(
                      color: _muted,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
              if (exam.description != null && exam.description!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  exam.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
              if (item.isCompleted && item.note != null) ...[
                const SizedBox(height: 16),
                _GradeBox(
                  score: item.note!.valeur,
                  maxScore: exam.noteTotale,
                  letter: item.note!.gradeLetter,
                  feedback: item.note!.appreciation,
                ),
              ],
              if (!item.isCompleted) ...[
                const SizedBox(height: 16),
                _StudyButton(onTap: onStudyNow),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Small UI Components
// ─────────────────────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  final String text;
  final Color color;

  const _Badge({
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.13),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withOpacity(0.30)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _GradeBox extends StatelessWidget {
  final double score;
  final double maxScore;
  final String letter;
  final String? feedback;

  const _GradeBox({
    required this.score,
    required this.maxScore,
    required this.letter,
    this.feedback,
  });

  @override
  Widget build(BuildContext context) {
    Color color;

    if (score >= 14) {
      color = _green;
    } else if (score >= 10) {
      color = _amber;
    } else {
      color = _red;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.30)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Grade: ${score.toStringAsFixed(2)}/${maxScore.toStringAsFixed(0)}  •  $letter',
            style: TextStyle(
              color: color,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (feedback != null && feedback!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              feedback!,
              style: TextStyle(
                color: color.withOpacity(0.90),
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StudyButton extends StatelessWidget {
  final VoidCallback onTap;

  const _StudyButton({
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(15),
        onTap: onTap,
        child: Container(
          width: double.infinity,
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [_primary, _secondary, _accent],
            ),
            borderRadius: BorderRadius.circular(15),
          ),
          child: const Text(
            'Study Now',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 42, horizontal: 20),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.description_outlined,
            size: 52,
            color: _muted,
          ),
          SizedBox(height: 14),
          Text(
            'No exams found for the selected filter.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _muted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorBox({
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            size: 52,
            color: _red,
          ),
          const SizedBox(height: 14),
          const Text(
            'Failed to load exams and grades',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _text,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _muted,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 22),
          _StudyButton(onTap: onRetry),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

List<Color> _gradientByIndex(int index) {
  final colors = [
    const [_primary, _blue],
    const [_secondary, _accent],
    const [_accent, _secondary],
    const [_primary, _secondary],
    const [_secondary, _primary],
  ];

  return colors[index % colors.length];
}

String _formatDate(DateTime date) {
  return '${date.day.toString().padLeft(2, '0')}/'
      '${date.month.toString().padLeft(2, '0')}/'
      '${date.year}';
}

String _formatTime(DateTime date) {
  return '${date.hour.toString().padLeft(2, '0')}:'
      '${date.minute.toString().padLeft(2, '0')}';
}