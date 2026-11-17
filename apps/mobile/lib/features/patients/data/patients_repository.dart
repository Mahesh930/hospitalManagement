import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final patientsRepositoryProvider = Provider<PatientsRepository>((ref) {
  return PatientsRepository(ref.watch(dioProvider));
});

class PatientsRepository {
  PatientsRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> search({String? query}) async {
    return apiGetData<List<Map<String, dynamic>>>(
      _dio,
      '/patients',
      queryParameters: query != null && query.isNotEmpty ? {'query': query} : null,
      parse: (data) => asMapList(data),
    );
  }

  Future<Map<String, dynamic>> getById(String id) async {
    return apiGetData<Map<String, dynamic>>(
      _dio,
      '/patients/$id',
      parse: (data) => asMap(data),
    );
  }
}