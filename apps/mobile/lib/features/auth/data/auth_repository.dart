import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exceptions.dart';
import '../models/auth_session.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});

class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;

  Future<AuthSession> login(String username, String password) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'username': username, 'password': password},
      );

      final body = response.data;
      if (body == null) {
        throw ApiFailure('Empty response from server');
      }

      final jwt = body['jwt']?.toString() ?? '';
      final userId = body['userId']?.toString() ?? '';
      final uname = body['username']?.toString() ?? username;
      final rolesRaw = body['roles'];
      final roles = <String>[];
      if (rolesRaw is List) {
        for (final r in rolesRaw) {
          roles.add(r.toString());
        }
      }

      if (jwt.isEmpty) {
        throw ApiFailure('Login did not return a token');
      }

      return AuthSession(token: jwt, userId: userId, username: uname, roles: roles);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response!.data as Map)['message']?.toString()
          : null;
      throw ApiFailure(msg ?? 'Invalid credentials or server unavailable');
    }
  }
}