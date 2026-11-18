import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final pharmacyRepositoryProvider = Provider<PharmacyRepository>((ref) {
  return PharmacyRepository(ref.watch(dioProvider));
});

class PharmacyRepository {
  PharmacyRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> dashboard() async {
    return apiGetData<Map<String, dynamic>>(
      _dio,
      '/pharmacy/dashboard',
      parse: (data) => asMap(data),
    );
  }

  /// Prescription queue (backend path `/pharmacy/prescriptions`).
  Future<List<Map<String, dynamic>>> queue() async {
    return apiGetData<List<Map<String, dynamic>>>(
      _dio,
      '/pharmacy/prescriptions',
      parse: (data) => asMapList(data),
    );
  }
}