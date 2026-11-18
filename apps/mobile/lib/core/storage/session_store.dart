import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/models/auth_session.dart';

const _kToken = 'medicore_jwt';
const _kUserId = 'medicore_user_id';
const _kUsername = 'medicore_username';
const _kRoles = 'medicore_roles';

final sessionStoreProvider = Provider<SessionStore>((ref) => SessionStore());

class SessionStore {
  Future<AuthSession?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_kToken);
    if (token == null || token.isEmpty) return null;

    final userId = prefs.getString(_kUserId) ?? '';
    final username = prefs.getString(_kUsername) ?? '';
    final rolesJson = prefs.getString(_kRoles);
    List<String> roles = const [];
    if (rolesJson != null && rolesJson.isNotEmpty) {
      final decoded = jsonDecode(rolesJson);
      if (decoded is List) {
        roles = decoded.map((e) => e.toString()).toList();
      }
    }

    return AuthSession(
      token: token,
      userId: userId,
      username: username,
      roles: roles,
    );
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kToken);
  }

  Future<void> save(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, session.token);
    await prefs.setString(_kUserId, session.userId);
    await prefs.setString(_kUsername, session.username);
    await prefs.setString(_kRoles, jsonEncode(session.roles));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kToken);
    await prefs.remove(_kUserId);
    await prefs.remove(_kUsername);
    await prefs.remove(_kRoles);
  }
}