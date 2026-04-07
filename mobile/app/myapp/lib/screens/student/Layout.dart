// lib/screens/student/student_layout.dart

import 'package:EduNex/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:EduNex/services/auth_service.dart';
import 'package:EduNex/screens/Auth/login.dart';
import '../../services/auth_service.dart';
import 'package:EduNex/services/storage_service.dart';
import '../Sidebars/StudentSidebar.dart';
import '../../services/user_service.dart';
import '../../models/user_model.dart';

const String _apiBase = 'http://192.168.1.165:5000';

// ─── Notification Model ───────────────────────────────────────────────────────

class _Notif {
  final String id;
  final String message;
  final String date;
  final bool   unread;
  const _Notif({required this.id, required this.message, required this.date, required this.unread});
}

// ─── Student Layout ───────────────────────────────────────────────────────────

class StudentLayout extends StatefulWidget {
  const StudentLayout({super.key});

  @override
  State<StudentLayout> createState() => _StudentLayoutState();
}

class _StudentLayoutState extends State<StudentLayout> {

  // ── State ──────────────────────────────────────────────────────────────────

  bool    _sidebarCollapsed = false;
  String  _currentPath      = '';
  bool    _loggingOut       = false;
  bool    _showLogoutSuccess = false;
  bool    _loadingUser      = true;

  String? _studentName;
  String? _studentEmail;
  String? _avatarUrl;
  String  _initials = 'ST';

  List<_Notif> _notifications     = [];
  bool         _loadingNotifs      = true;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _loadStudent();
    _fetchNotifications();
  }

  // ── Data ───────────────────────────────────────────────────────────────────

  Future<void> _loadStudent() async {
    setState(() => _loadingUser = true);
    try {
      UserModel? user;
      try {
        user = await getCurrentUser();
        print('Storage user: ${user?.fullName ?? "null"}');
      } catch (e) {
        print('Storage failed, fetching from API: $e');
      }
      
      if (user == null) {
        // Fallback to API like web getUserAuth
        user = await UserService.instance.getProfile();
      print('API user: ${user!.fullName} (${user.role})');
    }
    
    // user is non-null here
    final u = user!;
    
    final first = (u.prenom?.isNotEmpty == true ? u.prenom![0].toUpperCase() : '');
    final last  = (u.nom?.isNotEmpty == true ? u.nom![0].toUpperCase() : '');
    setState(() {
      _studentName  = u.fullName.isNotEmpty ? u.fullName : '${u.prenom ?? ''} ${u.nom ?? ''}'.trim();
      _studentEmail = u.email.isNotEmpty ? u.email : 'student@edunex.com';
      _initials     = (first + last).isNotEmpty ? first + last : 'ST';
      _avatarUrl    = u.imageUser != null && (u.imageUser as String).isNotEmpty
          ? '$_apiBase/images/${u.imageUser}'
          : null;
      _loadingUser = false;
    });
    } catch (e) {
      print('Full load error: $e');
      setState(() => _loadingUser = false);
    }
  }

  Future<void> _fetchNotifications() async {
    setState(() => _loadingNotifs = true);
    try {
      // Replace with your actual notification service call
      // final data = await NotificationService.instance.getByUser(userId);
      // For now, empty list:
      setState(() => _notifications = []);
    } catch (_) {
      setState(() => _notifications = []);
    } finally {
      setState(() => _loadingNotifs = false);
    }
  }

  String _formatDate(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1)  return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours   < 24) return '${diff.inHours} hour${diff.inHours > 1 ? "s" : ""} ago';
    if (diff.inDays    == 1) return 'Yesterday';
    if (diff.inDays    < 7)  return '${diff.inDays} days ago';
    return '${date.day}/${date.month}/${date.year}';
  }

  int get _unreadCount => _notifications.where((n) => n.unread).length;

  void _deleteNotification(String id) {
    setState(() => _notifications.removeWhere((n) => n.id == id));
    // await NotificationService.instance.delete(id);
  }

  Future<void> _handleLogout() async {
    setState(() => _loggingOut = true);
    try {
      await AuthService.instance.logout();
    } catch (_) {}
    setState(() { _loggingOut = false; _showLogoutSuccess = true; });
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  // ── Pages ──────────────────────────────────────────────────────────────────

  Widget _buildPage() {
    switch (_currentPath) {
      case '':              return const Center(child: Text('Dashboard'));
      case 'courses':       return const Center(child: Text('Courses'));
      case 'timetable':     return const Center(child: Text('Timetable'));
      case 'exams':         return const Center(child: Text('Exams & Notes'));
      case 'attendance':    return const Center(child: Text('Attendance'));
      case 'announcements': return const Center(child: Text('Announcements'));
      case 'requests':      return const Center(child: Text('Requests'));
      case 'messages':      return const Center(child: Text('Messages'));
      case 'notifications': return const Center(child: Text('Notifications'));
      case 'chatbot':       return const Center(child: Text('EduBot'));
      case 'profile':       return const Center(child: Text('Profile'));
      default:              return const Center(child: Text('Dashboard'));
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          Row(
            children: [
              StudentSidebar(
                currentPath:      _currentPath,
                isCollapsed:      _sidebarCollapsed,
                onToggleCollapse: () => setState(() => _sidebarCollapsed = !_sidebarCollapsed),
                onNavigate:       (p) => setState(() => _currentPath = p),
                studentName:      _studentName,
                studentEmail:     _studentEmail,
                avatarUrl:        _avatarUrl,
                user:             user,
              ),
              Expanded(
                child: Column(
                  children: [
                    _buildTopBar(isDark),
  Expanded(
                      child: _loadingUser 
                        ? const Center(child: CircularProgressIndicator())
                        : _buildPage(),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Logout success toast
          if (_showLogoutSuccess)
            Positioned(
              top: 72, right: 16,
              child: _LogoutToast(),
            ),
        ],
      ),
    );
  }

  // ── Top Bar ────────────────────────────────────────────────────────────────

  Widget _buildTopBar(bool isDark) {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor.withOpacity(0.95),
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor.withOpacity(0.5),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8, offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Sidebar toggle
          IconButton(
            icon: const Icon(Icons.menu_rounded),
            onPressed: () => setState(() => _sidebarCollapsed = !_sidebarCollapsed),
            iconSize: 22,
          ),
          const SizedBox(width: 8),
          // Logo + title
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              ),
            ),
            child: const Center(
              child: Text('E',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
            ),
          ),
          const SizedBox(width: 10),
          ShaderMask(
            shaderCallback: (b) => const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
            ).createShader(b),
            child: const Text('EduNex Student Portal',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ),
          const Spacer(),
          // Theme toggle
          IconButton(
            icon: Icon(isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded, size: 20),
            onPressed: () {
              // Wire to your ThemeProvider / setState
            },
          ),
          // Notifications
          _NotificationButton(
            unreadCount:   _unreadCount,
            notifications: _notifications,
            loading:       _loadingNotifs,
            onDelete:      _deleteNotification,
            onViewAll:     () => setState(() => _currentPath = 'notifications'),
          ),
          const SizedBox(width: 4),
          // User menu
          _UserMenuButton(
            initials:    _initials,
            fullName:    _studentName ?? 'Student User',
            email:       _studentEmail ?? 'student@edunex.com',
            avatarUrl:   _avatarUrl,
            loggingOut:  _loggingOut,
            onProfile:   () => setState(() => _currentPath = 'profile'),
            onLogout:    _handleLogout,
          ),
        ],
      ),
    );
  }
}

// ─── Notification Button ──────────────────────────────────────────────────────

class _NotificationButton extends StatelessWidget {
  final int           unreadCount;
  final List<_Notif>  notifications;
  final bool          loading;
  final void Function(String) onDelete;
  final VoidCallback  onViewAll;

  const _NotificationButton({
    required this.unreadCount,
    required this.notifications,
    required this.loading,
    required this.onDelete,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      offset: const Offset(0, 48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      constraints: const BoxConstraints(minWidth: 320, maxWidth: 360),
      itemBuilder: (_) => [
        PopupMenuItem(
          enabled: false,
          padding: EdgeInsets.zero,
          child: _NotificationPanel(
            notifications: notifications,
            loading:       loading,
            onDelete:      onDelete,
            onViewAll:     onViewAll,
          ),
        ),
      ],
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          const Padding(
            padding: EdgeInsets.all(8),
            child: Icon(Icons.notifications_none_rounded, size: 22),
          ),
          if (unreadCount > 0)
            Positioned(
              top: 2, right: 2,
              child: Container(
                width: 18, height: 18,
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    unreadCount > 9 ? '9+' : '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _NotificationPanel extends StatelessWidget {
  final List<_Notif>          notifications;
  final bool                  loading;
  final void Function(String) onDelete;
  final VoidCallback          onViewAll;

  const _NotificationPanel({
    required this.notifications,
    required this.loading,
    required this.onDelete,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 340,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                const Text('Notifications',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                const Spacer(),
                if (loading)
                  const SizedBox(width: 16, height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2)),
              ],
            ),
          ),
          const Divider(height: 1),
          // List (max 3)
          if (!loading && notifications.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Text('No new notifications',
                style: TextStyle(color: Colors.grey, fontSize: 13)),
            ),
          ...notifications.take(3).map((n) => _NotifTile(
            notif: n, onDelete: onDelete)),
          const Divider(height: 1),
          // View all
          TextButton(
            onPressed: onViewAll,
            child: const Text('View all notifications',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final _Notif                notif;
  final void Function(String) onDelete;
  const _NotifTile({required this.notif, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: notif.unread
            ? const Color(0xFF6366F1).withOpacity(0.05)
            : Colors.transparent,
      ),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          width: 8, height: 8,
          margin: const EdgeInsets.only(top: 4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: notif.unread
                ? const Color(0xFF6366F1)
                : Colors.grey.withOpacity(0.4),
          ),
        ),
        title: Text(notif.message,
          style: TextStyle(
            fontSize: 13,
            fontWeight: notif.unread ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        subtitle: Text(notif.date,
          style: const TextStyle(fontSize: 11, color: Colors.grey)),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline_rounded, size: 18),
          color: Colors.grey,
          onPressed: () => onDelete(notif.id),
        ),
      ),
    );
  }
}

// ─── User Menu Button ─────────────────────────────────────────────────────────

class _UserMenuButton extends StatelessWidget {
  final String    initials;
  final String    fullName;
  final String    email;
  final String?   avatarUrl;
  final bool      loggingOut;
  final VoidCallback onProfile;
  final VoidCallback onLogout;

  const _UserMenuButton({
    required this.initials,
    required this.fullName,
    required this.email,
    this.avatarUrl,
    required this.loggingOut,
    required this.onProfile,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      offset: const Offset(0, 48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onSelected: (v) {
        if (v == 'profile') onProfile();
        if (v == 'logout')  onLogout();
      },
      itemBuilder: (_) => [
        // User info header
        PopupMenuItem(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(fullName,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 2),
              Text(email,
                style: const TextStyle(color: Colors.grey, fontSize: 11)),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'profile',
          child: Row(children: const [
            Icon(Icons.person_outline_rounded, size: 18),
            SizedBox(width: 10),
            Text('Profile', style: TextStyle(fontSize: 14)),
          ]),
        ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'logout',
          child: loggingOut
              ? Row(children: const [
                  SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red)),
                  SizedBox(width: 10),
                  Text('Logging out...', style: TextStyle(fontSize: 14, color: Colors.red)),
                ])
              : Row(children: const [
                  Icon(Icons.logout_rounded, size: 18, color: Colors.red),
                  SizedBox(width: 10),
                  Text('Log out', style: TextStyle(fontSize: 14, color: Colors.red)),
                ]),
        ),
      ],
      child: CircleAvatar(
        radius: 17,
        backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
        backgroundColor: Colors.transparent,
        child: avatarUrl == null
            ? Container(
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  ),
                ),
                child: Center(
                  child: Text(initials,
                    style: const TextStyle(
                      color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              )
            : null,
      ),
    );
  }
}

// ─── Logout Toast ─────────────────────────────────────────────────────────────

class _LogoutToast extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        border: Border.all(color: const Color(0xFF86EFAC)),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 12)],
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 18),
          SizedBox(width: 8),
          Text('Successfully logged out! Redirecting...',
            style: TextStyle(color: Color(0xFF15803D), fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}