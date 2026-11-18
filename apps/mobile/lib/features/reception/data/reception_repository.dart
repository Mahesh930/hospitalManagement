import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final receptionRepositoryProvider = Provider<ReceptionRepository>((ref) {
  return ReceptionRepository(ref.watch(dioProvider));
});

class ReceptionRepository {
  ReceptionRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> dashboard() async {
    return apiGetData<Map<String, dynamic>>(
      _dio,
      '/receptionist/dashboard',
      parse: (data) => asMap(data),
    );
  }
}