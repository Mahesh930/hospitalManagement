import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/roles.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_response.dart';
import '../../auth/models/auth_session.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(ref.watch(dioProvider));
});

class DashboardRepository {
  DashboardRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> loadDashboard(AuthSession session) async {
    final roles = session.roles.map((e) => e.toUpperCase()).toSet();

    if (roles.contains(RoleCodes.superAdmin) || roles.contains(RoleCodes.admin)) {
      return _fetchMap('/admin/stats');
    }
    if (roles.contains(RoleCodes.receptionist)) {
      return _fetchMap('/receptionist/dashboard');
    }
    if (roles.contains(RoleCodes.nurse)) {
      return _fetchMap('/nurses/dashboard');
    }
    if (roles.contains(RoleCodes.pharmacist)) {
      return _fetchMap('/pharmacy/dashboard');
    }
    if (roles.contains(RoleCodes.cashier) || roles.contains(RoleCodes.accountant)) {
      return _fetchMap('/invoices/stats');
    }
    if (roles.contains(RoleCodes.labTech) || roles.contains(RoleCodes.labManager)) {
      return _fetchMap('/lab/stats');
    }
    if (roles.contains(RoleCodes.doctor)) {
      try {
        return await _fetchMap('/doctors/dashboard');
      } catch (_) {
        return {'note': 'Doctor dashboard unavailable for this account.'};
      }
    }

    return _fetchMap('/roles/me/station');
  }

  Future<Map<String, dynamic>> _fetchMap(String path) async {
    final data = await apiGetData<dynamic>(_dio, path, parse: (d) => d);
    return asMap(data);
  }
}