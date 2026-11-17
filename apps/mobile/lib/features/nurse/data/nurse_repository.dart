import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final nurseRepositoryProvider = Provider<NurseRepository>((ref) {
  return NurseRepository(ref.watch(dioProvider));
});

class NurseRepository {
  NurseRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> dashboard() async {
    return apiGetData<Map<String, dynamic>>(
      _dio,
      '/nurses/dashboard',
      parse: (data) => asMap(data),
    );
  }
}