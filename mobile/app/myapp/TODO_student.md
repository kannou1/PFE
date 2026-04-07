# Student Layout & Sidebar User Data Fix

**Status**: User name stuck on defaults - web version uses API call post-login

## Analysis:
Web: useEffect getUserAuth() API → setStudent(userData)
Mobile: StorageService.getUser() → null/empty prenom/nom from backend

## Plan:
1. [ ] Add UserService.instance.getProfile() like web getUserAuth()
2. [ ] Update Layout.dart _loadStudent() use API if storage empty
3. [ ] Force reload after login navigation
4. [ ] Test with real backend user data

**Backend Check**: /users/profile returns full user? Test curl with token
