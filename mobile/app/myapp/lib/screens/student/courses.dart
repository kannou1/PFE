import 'package:flutter/material.dart';

import '../../models/cours_model.dart';
import '../../services/cours_service.dart';
import '../../services/storage_service.dart';
import 'course_details.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

List<Color> _gradientColors(String value) {
  final lc = value.toLowerCase();

  if (lc.contains('glsi') || lc.contains('first') || lc.contains('1')) {
    return [const Color(0xFF3B82F6), const Color(0xFF9333EA)];
  }

  if (lc.contains('security') || lc.contains('second') || lc.contains('2')) {
    return [const Color(0xFF10B981), const Color(0xFF0D9488)];
  }

  if (lc.contains('data') || lc.contains('third') || lc.contains('3')) {
    return [const Color(0xFFF97316), const Color(0xFFEC4899)];
  }

  return [const Color(0xFF6366F1), const Color(0xFF9333EA)];
}

String _initials(String name) {
  final parts = name.trim().split(' ');

  return parts
      .take(2)
      .map((p) => p.isNotEmpty ? p[0].toUpperCase() : '')
      .join();
}

// ─────────────────────────────────────────────────────────────────────────────
// View Model compatible with your CoursModel
// ─────────────────────────────────────────────────────────────────────────────

class _CourseVM {
  final String id;
  final String title;
  final String code;
  final String description;
  final int credits;
  final String semester;
  final String className;
  final String instructor;
  final String? classId;
  final String? instructorId;
  final List<Color> gradient;

  _CourseVM({
    required this.id,
    required this.title,
    required this.code,
    required this.description,
    required this.credits,
    required this.semester,
    required this.className,
    required this.instructor,
    required this.gradient,
    this.classId,
    this.instructorId,
  });

  factory _CourseVM.from(CoursModel c) {
    final gradientBase = '${c.nom} ${c.code} ${c.semestre} ${c.classeId ?? ''}';

    return _CourseVM(
      id: c.id,
      title: c.nom,
      code: c.code,
      description: c.description ?? 'No description available.',
      credits: c.credits,
      semester: c.semestre,
      className: (c.classeNom != null && c.classeNom!.isNotEmpty)
          ? c.classeNom!
          : (c.classeId != null ? 'Class assigned' : 'General'),
      instructor: (c.enseignantNom != null && c.enseignantNom!.isNotEmpty)
          ? c.enseignantNom!
          : (c.enseignantId != null ? 'Instructor assigned' : 'TBA'),
      classId: c.classeId,
      instructorId: c.enseignantId,
      gradient: _gradientColors(gradientBase),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

class StudentCoursesScreen extends StatefulWidget {
  const StudentCoursesScreen({super.key});

  @override
  State<StudentCoursesScreen> createState() => _StudentCoursesScreenState();
}

class _StudentCoursesScreenState extends State<StudentCoursesScreen> {
  final _coursService = CoursService.instance;

  List<_CourseVM> _courses = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchCourses();
  }

  Future<void> _fetchCourses() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final rawCourses = await _coursService.getAllCours();

      if (!mounted) return;

      setState(() {
        _courses = rawCourses.map(_CourseVM.from).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const bool isDark = true;

    if (_loading) {
      return const _LoadingScreen();
    }

    if (_error != null) {
      return _ErrorScreen(
        error: _error!,
        onRetry: _fetchCourses,
      );
    }

    if (_courses.isEmpty) {
      return _EmptyScreen(
        onRefresh: _fetchCourses,
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F1117),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFF6366F1),
          onRefresh: _fetchCourses,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              const _Header(),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final course = _courses[index];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: _CourseCard(
                          course: course,
                          isDark: isDark,
                          onTap: () => _showDetails(context, course),
                        ),
                      );
                    },
                    childCount: _courses.length,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDetails(BuildContext context, _CourseVM course) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return _DetailsSheet(
          course: course,
          onOpenMaterials: () async {
            Navigator.pop(context);

            final token = await StorageService.instance.getToken();
            final user = await StorageService.instance.getUser();

            final userMap = user?.toJson();
            final userId =
                userMap?['_id']?.toString() ?? userMap?['id']?.toString();

            if (token == null || token.isEmpty) {
              if (!context.mounted) return;

              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Session expired. Please login again.'),
                  backgroundColor: Color(0xFFEF4444),
                ),
              );

              return;
            }

            if (!context.mounted) return;

            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => StudentCourseDetailsScreen(
                  courseId: course.id,
                  token: token,
                  userId: userId,
                ),
              ),
            );
          },
          onContactInstructor: () {
            Navigator.pop(context);

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  course.instructorId != null
                      ? 'Instructor ID: ${course.instructorId}'
                      : 'No instructor assigned',
                ),
              ),
            );
          },
        );
      },
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
                  colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                ).createShader(bounds);
              },
              child: const Text(
                'My Courses',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Track your learning progress and access course materials',
              style: TextStyle(
                fontSize: 15,
                height: 1.4,
                color: Colors.grey.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Course Card
// ─────────────────────────────────────────────────────────────────────────────

class _CourseCard extends StatefulWidget {
  final _CourseVM course;
  final bool isDark;
  final VoidCallback onTap;

  const _CourseCard({
    required this.course,
    required this.isDark,
    required this.onTap,
  });

  @override
  State<_CourseCard> createState() => _CourseCardState();
}

class _CourseCardState extends State<_CourseCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _hoverAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );

    _hoverAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOut,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.course;

    final cardBg = const Color(0xFF121826);
    final shadowColor = Colors.black.withOpacity(0.45);
    final borderColor = Colors.white.withOpacity(0.07);
    final mutedFg = Colors.grey.shade400;
    final textPrimary = Colors.white;

    return MouseRegion(
      onEnter: (_) => _controller.forward(),
      onExit: (_) => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _hoverAnimation,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(0, -6 * _hoverAnimation.value),
            child: child,
          );
        },
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onTap,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: borderColor),
                boxShadow: [
                  BoxShadow(
                    color: shadowColor,
                    blurRadius: 24,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _CardHeader(course: c),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 34, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              c.code,
                              style: TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                                color: mutedFg,
                              ),
                            ),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: Text(
                                '•',
                                style: TextStyle(color: mutedFg),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                c.semester,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: mutedFg,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _InstructorRow(course: c),
                        Divider(
                          height: 28,
                          color: Colors.white.withOpacity(0.08),
                        ),
                        _CourseInfoSection(course: c),
                        const SizedBox(height: 14),
                        _StatsGrid(course: c),
                        const SizedBox(height: 14),
                        Divider(
                          height: 1,
                          color: Colors.white.withOpacity(0.08),
                        ),
                        const SizedBox(height: 10),
                        Center(
                          child: Text(
                            'Tap to view details →',
                            style: TextStyle(
                              fontSize: 11,
                              color: mutedFg,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Header
// ─────────────────────────────────────────────────────────────────────────────

class _CardHeader extends StatelessWidget {
  final _CourseVM course;

  const _CardHeader({
    required this.course,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: course.gradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -8,
                    right: -8,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.10),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Container(
                    color: Colors.black.withOpacity(0.08),
                  ),
                ],
              ),
            ),
          ),
          const Positioned(
            top: 14,
            right: 14,
            child: _StatusBadge(status: 'Available'),
          ),
          Positioned(
            bottom: -22,
            left: 20,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: course.gradient),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF121826),
                  width: 3,
                ),
                boxShadow: [
                  BoxShadow(
                    color: course.gradient.first.withOpacity(0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.menu_book_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 8,
          ),
        ],
      ),
      child: Text(
        status,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Color(0xFF374151),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Instructor Row
// ─────────────────────────────────────────────────────────────────────────────

class _InstructorRow extends StatelessWidget {
  final _CourseVM course;

  const _InstructorRow({
    required this.course,
  });

  @override
  Widget build(BuildContext context) {
    final initials = _initials(course.instructor);

    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: course.gradient),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            initials.isEmpty ? 'T' : initials,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                course.instructor,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              Text(
                course.instructorId != null
                    ? 'Instructor linked'
                    : '',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Course Info Section
// ─────────────────────────────────────────────────────────────────────────────

class _CourseInfoSection extends StatelessWidget {
  final _CourseVM course;

  const _CourseInfoSection({
    required this.course,
  });

  @override
  Widget build(BuildContext context) {
    final mutedFg = Colors.grey.shade400;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Course Information',
          style: TextStyle(
            fontSize: 12,
            color: mutedFg,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          course.description,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 13,
            height: 1.4,
            color: mutedFg,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Grid
// ─────────────────────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  final _CourseVM course;

  const _StatsGrid({
    required this.course,
  });

  @override
  Widget build(BuildContext context) {
    final tileBg = Colors.white.withOpacity(0.05);

    return Row(
      children: [
        Expanded(
          child: _StatTile(
            icon: Icons.auto_stories_rounded,
            label: 'Credits',
            value: '${course.credits}',
            accentColor: course.gradient.first,
            bg: tileBg,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatTile(
            icon: Icons.school_rounded,
            label: 'Class',
            value: course.className,
            accentColor: course.gradient.last,
            bg: tileBg,
          ),
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color accentColor;
  final Color bg;

  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.accentColor,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 18,
            color: accentColor,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey.shade500,
                  ),
                ),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Details Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────

class _DetailsSheet extends StatelessWidget {
  final _CourseVM course;
  final VoidCallback onOpenMaterials;
  final VoidCallback onContactInstructor;

  const _DetailsSheet({
    required this.course,
    required this.onOpenMaterials,
    required this.onContactInstructor,
  });

  @override
  Widget build(BuildContext context) {
    final sheetBg = const Color(0xFF121826);
    final mutedFg = Colors.grey.shade400;
    final tileBg = Colors.white.withOpacity(0.05);

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.50,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF121826),
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(28),
            ),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 8),
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
                  children: [
                    ShaderMask(
                      shaderCallback: (bounds) {
                        return const LinearGradient(
                          colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                        ).createShader(bounds);
                      },
                      child: Text(
                        course.title,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        const _Chip(
                          label: 'Available',
                          icon: Icons.check_circle_rounded,
                          color: Color(0xFF059669),
                        ),
                        _Chip(
                          label: course.code,
                          icon: Icons.menu_book_rounded,
                        ),
                        _Chip(
                          label: course.semester,
                          icon: Icons.calendar_month_rounded,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _DetailTile(
                      bg: tileBg,
                      child: Row(
                        children: [
                          Icon(
                            Icons.person_rounded,
                            size: 20,
                            color: course.gradient.first,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Instructor',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: mutedFg,
                                  ),
                                ),
                                Text(
                                  course.instructor,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                                if (course.instructorId != null)
                                  Text(
                                    'ID: ${course.instructorId}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: mutedFg,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    _DetailTile(
                      bg: tileBg,
                      child: Row(
                        children: [
                          Icon(
                            Icons.auto_stories_rounded,
                            size: 20,
                            color: course.gradient.last,
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Credits',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: mutedFg,
                                ),
                              ),
                              Text(
                                '${course.credits} Credits',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    _DetailTile(
                      bg: tileBg,
                      child: Row(
                        children: [
                          Icon(
                            Icons.school_rounded,
                            size: 20,
                            color: course.gradient.first,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Class',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: mutedFg,
                                  ),
                                ),
                                Text(
                                  course.className,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                                if (course.classId != null)
                                  Text(
                                    'ID: ${course.classId}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: mutedFg,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    _DetailTile(
                      bg: tileBg,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Course Description',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            course.description,
                            style: TextStyle(
                              fontSize: 13,
                              color: mutedFg,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: course.gradient
                              .map((color) => color.withOpacity(0.12))
                              .toList(),
                        ),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: course.gradient.first.withOpacity(0.25),
                        ),
                      ),
                      child: RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.white,
                          ),
                          children: [
                            const TextSpan(
                              text: 'Semester: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextSpan(text: course.semester),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: _GradientButton(
                            label: 'View Course Materials',
                            gradient: course.gradient,
                            onTap: onOpenMaterials,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _OutlineActionButton(
                            label: 'Contact Instructor',
                            gradient: course.gradient,
                            onTap: onContactInstructor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _DetailTile extends StatelessWidget {
  final Widget child;
  final Color bg;

  const _DetailTile({
    required this.child,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: child,
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color? color;

  const _Chip({
    required this.label,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final fg = color ?? Colors.grey.shade300;
    final bg = Colors.white.withOpacity(0.08);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withOpacity(0.10),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 13,
              color: fg,
            ),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────────────────────

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
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: gradient),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}

class _OutlineActionButton extends StatelessWidget {
  final String label;
  final List<Color> gradient;
  final VoidCallback onTap;

  const _OutlineActionButton({
    required this.label,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: gradient.first,
              width: 1.5,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: gradient.first,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading / Error / Empty Screens
// ─────────────────────────────────────────────────────────────────────────────

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1117),
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 48,
                height: 48,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation(
                    Color(0xFF6366F1),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Loading your courses…',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorScreen extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorScreen({
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1117),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: const Color(0xFF121826),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.30),
                    blurRadius: 24,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    size: 52,
                    color: Color(0xFFEF4444),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Failed to Load Courses',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    error,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade400,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: onRetry,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 28,
                          vertical: 13,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFF6366F1),
                              Color(0xFF9333EA),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'Try Again',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyScreen extends StatelessWidget {
  final Future<void> Function() onRefresh;

  const _EmptyScreen({
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1117),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFF6366F1),
          onRefresh: onRefresh,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: ShaderMask(
                    shaderCallback: (bounds) {
                      return const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                      ).createShader(bounds);
                    },
                    child: const Text(
                      'My Courses',
                      style: TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.menu_book_outlined,
                        size: 64,
                        color: Colors.grey.shade500,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No Courses Found',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'You are not enrolled in any courses yet.',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ],
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