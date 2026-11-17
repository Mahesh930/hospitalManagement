import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';

final billingRepositoryProvider = Provider<BillingRepository>((ref) {
  return BillingRepository(ref.watch(dioProvider));
});

class BillingRepository {
  BillingRepository(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> listInvoices() async {
    return apiGetData<List<Map<String, dynamic>>>(
      _dio,
      '/invoices',
      parse: (data) => asMapList(data),
    );
  }

  Future<Map<String, dynamic>> stats() async {
    return apiGetData<Map<String, dynamic>>(
      _dio,
      '/invoices/stats',
      parse: (data) => asMap(data),
    );
  }

  Future<Map<String, dynamic>> payInvoice(String invoiceId, {String method = 'CASH'}) async {
    return apiPostData<Map<String, dynamic>>(
      _dio,
      '/invoices/$invoiceId/pay',
      queryParameters: {'paymentMethod': method},
      parse: (data) => asMap(data),
    );
  }
}