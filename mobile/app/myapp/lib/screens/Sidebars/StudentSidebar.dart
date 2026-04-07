import 'package:flutter/material.dart';
import '../../models/user_model.dart';

// ─── Nav Item Model ───────────────────────────────────────────────────────────

class _NavItem {
  final String path;
  final String label;
  final IconData icon;
  const _NavItem({required this.path, required this.label, required this.icon});
}

const _navItems = [
  _NavItem(path: '',            label: 'Dashboard',     icon: Icons.dashboard_rounded),
  _NavItem(path: 'courses',     label: 'Courses',       icon: Icons.menu_book_rounded),
  _NavItem(path: 'timetable',   label: 'Timetable',     icon: Icons.calendar_month_rounded),
  _NavItem(path: 'exams',       label: 'Exams & Notes', icon: Icons.description_rounded),
  _NavItem(path: 'attendance',  label: 'Attendance',    icon: Icons.how_to_reg_rounded),
  _NavItem(path: 'announcements', label: 'Announcements', icon: Icons.campaign_rounded),
  _NavItem(path: 'requests',    label: 'Requests',      icon: Icons.send_rounded),
  _NavItem(path: 'messages',    label: 'Messages',      icon: Icons.chat_bubble_outline_rounded),
  _NavItem(path: 'notifications', label: 'Notifications', icon: Icons.notifications_none_rounded),
  _NavItem(path: 'chatbot',     label: 'EduBot',        icon: Icons.smart_toy_rounded),
];

// ─── Student Sidebar ──────────────────────────────────────────────────────────

class StudentSidebar extends StatefulWidget {
  final String currentPath;
  final void Function(String path) onNavigate;
  final bool isCollapsed;
  final VoidCallback onToggleCollapse;

  // Student data (pass from parent or fetch inside)
  final String? studentName;
final String? studentEmail;
final String? avatarUrl;
  final UserModel? user;

  const StudentSidebar({
    super.key,
    required this.currentPath,
    required this.onNavigate,
    this.isCollapsed = false,
    required this.onToggleCollapse,
    this.studentName,
    this.studentEmail,
    this.avatarUrl,
    this.user,
  });


  @override
  State<StudentSidebar> createState() => _StudentSidebarState();
}

class _StudentSidebarState extends State<StudentSidebar>
    with SingleTickerProviderStateMixin {

  late AnimationController _animCtrl;
  late Animation<double> _widthAnim;

  static const double _expandedWidth  = 240;
  static const double _collapsedWidth = 68;

  // ── Theme colors mirroring the React design ──────────────────────────────────

static const _primary   = Color(0xFF6366F1); // indigo
  static const _secondary = Color(0xFF8B5CF6); // violet
  static const _bg        = Color(0xFF0F1117);
  static const _surface   = Color(0xFF1A1D27);
  static const _border    = Color(0xFF2A2D3A);
  static const _textPrimary   = Color(0xFFE2E8F0);
  static const _textSecondary = Color(0xFF94A3B8);
  static const _accent = Color(0xFF10B981);

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
      value: widget.isCollapsed ? 0.0 : 1.0,
    );
    _widthAnim = Tween<double>(begin: _collapsedWidth, end: _expandedWidth)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));
  }

  @override
  void didUpdateWidget(StudentSidebar old) {
    super.didUpdateWidget(old);
    if (old.isCollapsed != widget.isCollapsed) {
      widget.isCollapsed ? _animCtrl.reverse() : _animCtrl.forward();
    }
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  String _getInitials() {
    final name = widget.studentName ?? '';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    if (parts.isNotEmpty && parts.first.isNotEmpty) return parts.first[0].toUpperCase();
    return 'ST';
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _widthAnim,
      builder: (_, __) {
        final collapsed = _widthAnim.value <= (_collapsedWidth + _expandedWidth) / 2;
        return Container(
          width: _widthAnim.value,
          height: double.infinity,
          decoration: BoxDecoration(
            color: _bg,
            border: Border(right: BorderSide(color: _border, width: 1)),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0F1117), Color(0xFF13161F)],
            ),
          ),
          child: Column(
            children: [
              _buildHeader(collapsed),
              Expanded(child: _buildMenu(collapsed)),
              _buildFooter(collapsed),
            ],
          ),
        );
      },
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────────

  Widget _buildHeader(bool collapsed) {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: _border, width: 1)),
      ),
      child: InkWell(
        onTap: widget.onToggleCollapse,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: collapsed ? 0 : 16),
          child: Row(
            mainAxisAlignment: collapsed ? MainAxisAlignment.center : MainAxisAlignment.start,
            children: [
              // Logo box
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [_primary, _secondary],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _primary.withOpacity(0.4),
                      blurRadius: 12, offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Center(
                  child: Text('E',
                    style: TextStyle(
                      color: Colors.white, fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              if (!collapsed) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShaderMask(
                        shaderCallback: (b) => const LinearGradient(
                          colors: [_primary, _secondary],
                        ).createShader(b),
                        child: const Text('EduNex',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const Text('Student Portal',
                        style: TextStyle(
                          fontSize: 10,
                          color: _textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_left_rounded,
                  color: _textSecondary,
                  size: 18,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ── Menu ──────────────────────────────────────────────────────────────────────

  Widget _buildMenu(bool collapsed) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: collapsed ? 8 : 12,
        vertical: 16,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: _navItems.map((item) => _buildNavItem(item, collapsed)).toList(),
      ),
    );
  }

  Widget _buildNavItem(_NavItem item, bool collapsed) {
    final isActive = widget.currentPath == item.path;

    final tile = GestureDetector(
      onTap: () => widget.onNavigate(item.path),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 44,
        margin: const EdgeInsets.symmetric(vertical: 2),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          gradient: isActive
              ? LinearGradient(
                  colors: [
                    _primary.withOpacity(0.15),
                    _secondary.withOpacity(0.1),
                  ],
                )
              : null,
          border: isActive
              ? Border(left: BorderSide(color: _primary, width: 3))
              : null,
          color: isActive ? null : Colors.transparent,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(10),
            hoverColor: Colors.white.withOpacity(0.05),
            onTap: () => widget.onNavigate(item.path),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: collapsed ? 0 : 12),
              child: Row(
                mainAxisAlignment: collapsed
                    ? MainAxisAlignment.center
                    : MainAxisAlignment.start,
                children: [
                  Icon(
                    item.icon,
                    size: 20,
                    color: isActive ? _primary : _textSecondary,
                  ),
                  if (!collapsed) ...[
                    const SizedBox(width: 12),
                    Text(
                      item.label,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                        color: isActive ? _textPrimary : _textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );

    if (collapsed) {
      return Tooltip(
        message: item.label,
        preferBelow: false,
        child: tile,
      );
    }
    return tile;
  }

  // ── Footer ────────────────────────────────────────────────────────────────────

  Widget _buildFooter(bool collapsed) {
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: _border, width: 1)),
      ),
      padding: EdgeInsets.all(collapsed ? 8 : 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => widget.onNavigate('profile'),
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: collapsed ? 0 : 8,
            vertical: 8,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: collapsed
                ? MainAxisAlignment.center
                : MainAxisAlignment.start,
            children: [
              // Avatar
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _primary.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: CircleAvatar(
                  radius: 16,
                  backgroundImage: widget.avatarUrl != null
                      ? NetworkImage(widget.avatarUrl!)
                      : null,
                  backgroundColor: Colors.transparent,
                  child: widget.avatarUrl == null
                      ? Container(
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [_primary, _secondary],
                            ),
                          ),
                          child: Center(
                            child: Text(
                              _getInitials(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        )
                      : null,
                ),
              ),
              if (!collapsed) ...[
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
  Text(
                        widget.user?.fullName ?? widget.studentName ?? 'Loading...',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: _textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
  Text(
                        widget.user?.email ?? widget.studentEmail ?? 'student@edunex.com',
                        style: const TextStyle(
                          fontSize: 11,
                          color: _textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}