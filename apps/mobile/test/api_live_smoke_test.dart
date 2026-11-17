import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medicore_mobile/core/config/api_config.dart';

/// Live smoke against the shared Spring Boot API (skipped if server is down).
void main() {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 4),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
      validateStatus: (s) => s != null && s < 500,
    ),
  );

  Future<bool> serverUp() async {
    try {
      final res = await dio.post(
        '/auth/login',
        data: {'username': 'admin', 'password': 'admin123'},
      );
      return res.statusCode == 200 && res.data['jwt'] != null;
    } catch (_) {
      return false;
    }
  }

  test('login + role-scoped modules respond for key personas', () async {
    final up = await serverUp();
    if (!up) {
      // ignore: avoid_print
      print('SKIP: backend not reachable at ${ApiConfig.baseUrl}');
      return;
    }

    final accounts = <Map<String, String>>[
      {'user': 'admin', 'pass': 'admin123', 'path': '/admin/stats'},
      {'user': 'receptionist', 'pass': 'receptionist123', 'path': '/receptionist/dashboard'},
      {'user': 'nurse', 'pass': 'Password@123', 'path': '/nurses/dashboard'},
      {'user': 'pharmacist', 'pass': 'pharmacist123', 'path': '/pharmacy/dashboard'},
      {'user': 'cashier', 'pass': 'Password@123', 'path': '/invoices/stats'},
      {'user': 'labtech', 'pass': 'Password@123', 'path': '/lab/stats'},
      {'user': 'accountant', 'pass': 'Password@123', 'path': '/invoices/stats'},
      {'user': 'labmanager', 'pass': 'Password@123', 'path': '/lab/worklist'},
      {'user': 'mrd', 'pass': 'Password@123', 'path': '/patients'},
      {'user': 'hradmin', 'pass': 'Password@123', 'path': '/roles/catalog'},
    ];

    for (final a in accounts) {
      final login = await dio.post(
        '/auth/login',
        data: {'username': a['user'], 'password': a['pass']},
      );
      expect(login.statusCode, 200, reason: 'login ${a['user']}');
      final jwt = login.data['jwt'] as String;
      expect(jwt, isNotEmpty);
      expect(login.data['roles'], isNotEmpty);

      final res = await dio.get(
        a['path']!,
        options: Options(headers: {'Authorization': 'Bearer $jwt'}),
      );
      expect(
        res.statusCode,
        anyOf(200, 403),
        reason: '${a['user']} GET ${a['path']} -> ${res.statusCode}',
      );
      if (res.statusCode == 200) {
        expect(res.data['success'], isTrue, reason: '${a['user']} wrapper');
      }
    }
  });
}
