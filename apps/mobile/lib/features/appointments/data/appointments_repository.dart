import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final appointmentsRepositoryProvider = Provider<AppointmentsRepository>((ref) {
  return AppointmentsRepository(ref.watch(dioProvider));
});

class AppointmentsRepository {
  AppointmentsRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> list() async {
    return apiGetData<List<Map<String, dynamic>>>(
      _dio,
      '/appointments',
      parse: (data) => asMapList(data),
    );
  }
}