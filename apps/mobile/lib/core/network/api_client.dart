import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/api_config.dart';
import '../storage/session_store.dart';
import 'api_exceptions.dart';
import 'api_response.dart';
import '../../features/auth/providers/auth_provider.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await ref.read(sessionStoreProvider).getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await ref.read(sessionStoreProvider).clear();
          ref.read(authProvider.notifier).clearSession();
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});

Future<T> apiGetData<T>(
  Dio dio,
  String path, {
  Map<String, dynamic>? queryParameters,
  required T Function(dynamic data) parse,
}) async {
  try {
    final response = await dio.get<dynamic>(path, queryParameters: queryParameters);
    final status = response.statusCode ?? 0;
    if (status == 403) {
      throw ForbiddenException();
    }
    final body = response.data;
    if (body is Map<String, dynamic>) {
      final wrapped = ApiResponse<dynamic>.fromJson(body);
      if (!wrapped.success) {
        throw ApiFailure(wrapped.message ?? 'Request failed');
      }
      return parse(wrapped.data);
    }
    return parse(body);
  } on DioException catch (e) {
    final status = e.response?.statusCode;
    if (status == 403) throw ForbiddenException();
    if (status == 401) throw ApiFailure('Session expired. Please sign in again.');
    final msg = e.response?.data is Map
        ? (e.response!.data as Map)['message']?.toString()
        : null;
    throw ApiFailure(msg ?? e.message ?? 'Network error');
  }
}

Future<T> apiPostData<T>(
  Dio dio,
  String path, {
  Object? data,
  Map<String, dynamic>? queryParameters,
  required T Function(dynamic data) parse,
}) async {
  try {
    final response = await dio.post<dynamic>(
      path,
      data: data,
      queryParameters: queryParameters,
    );
    if ((response.statusCode ?? 0) == 403) throw ForbiddenException();
    final body = response.data;
    if (body is Map<String, dynamic>) {
      if (body.containsKey('success')) {
        final wrapped = ApiResponse<dynamic>.fromJson(body);
        if (!wrapped.success) {
          throw ApiFailure(wrapped.message ?? 'Request failed');
        }
        return parse(wrapped.data);
      }
      return parse(body);
    }
    return parse(body);
  } on DioException catch (e) {
    if (e.response?.statusCode == 403) throw ForbiddenException();
    final msg = e.response?.data is Map
        ? (e.response!.data as Map)['message']?.toString()
        : null;
    throw ApiFailure(msg ?? e.message ?? 'Network error');
  }
}