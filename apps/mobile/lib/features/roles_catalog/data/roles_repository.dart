import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final rolesRepositoryProvider = Provider<RolesRepository>((ref) {
  return RolesRepository(ref.watch(dioProvider));
});

class RolesRepository {
  RolesRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> catalog() async {
    return apiGetData<List<Map<String, dynamic>>>(
      _dio,
      '/roles/catalog',
      parse: (data) => asMapList(data),
    );
  }
}