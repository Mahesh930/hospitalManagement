import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final stationRepositoryProvider = Provider<StationRepository>((ref) {
  return StationRepository(ref.watch(dioProvider));
});

class StationRepository {
  StationRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> myStation() async {
    return apiGetData<Map<String, dynamic>>(
      _dio,
      '/roles/me/station',
      parse: (data) => asMap(data),
    );
  }
}