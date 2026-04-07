import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';

UserModel? _cachedUser;

UserModel? get currentUser {
  return _cachedUser;
}

Future<UserModel?> loadCurrentUser() async {
  if (_cachedUser != null) return _cachedUser;
  
  try {
    _cachedUser = await getCurrentUser();
    if (_cachedUser == null) {
      _cachedUser = await UserService.instance.getProfile();
    }
  } catch (e) {
    debugPrint('loadCurrentUser error: $e');
  }
  
  return _cachedUser;
}

void clearCurrentUser() {
  _cachedUser = null;
}

