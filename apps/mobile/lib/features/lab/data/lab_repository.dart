import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final labRepositoryProvider = Provider<LabRepository>((ref) {
  return LabRepository(ref.watch(dioProvider));
});

class LabRepository {
  LabRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> worklist() async {
    return apiGetData<List<Map<String, dynamic>>>(
      _dio,
      '/lab/worklist',
      parse: (data) => asMapList(data),
    );
  }

  Future<Map<String, dynamic>> stats() async {
    return apiGetData<Map<String, dynamic>>(
      _dio,
      '/lab/stats',
      parse: (data) => asMap(data),
    );
  }
}