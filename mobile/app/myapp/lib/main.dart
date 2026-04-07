import 'package:flutter/material.dart';
import 'package:EduNex/screens/Auth/forget.dart' ;
import 'package:EduNex/screens/Auth/login.dart' ;
import 'package:EduNex/screens/test_theme/test_appbar.dart';
import 'package:EduNex/screens/test_theme/test_bottomsheet.dart';
import 'package:EduNex/screens/test_theme/test_button.dart';
import 'package:EduNex/screens/test_theme/test_checkbox.dart';
import 'package:EduNex/screens/test_theme/test_formfield.dart';
import 'package:EduNex/screens/test_theme/test_showdialog.dart';
import 'package:EduNex/screens/test_theme/test_text.dart';
import 'package:EduNex/utils/theme/theme.dart';

import 'screens/admin/profile.dart';
import 'screens/student/Layout.dart' as student_layout;
import 'screens/admin/users.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'EduNex',
      themeMode: ThemeMode.system,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/student': (context) => student_layout.StudentLayout(),
        '/teacher': (context) => Placeholder(child: Text('Teacher Dashboard')),
        '/admin': (context) => Placeholder(child: Text('Admin Dashboard')),
        '/admin/users': (context) => const AdminUsersScreen(),
        '/admin/profile': (context) => const AdminProfileScreen(),
      },
    );
  }
}


