class ApiResponse<T> {
  const ApiResponse({
    required this.success,
    this.data,
    this.message,
  });

  final bool success;
  final T? data;
  final String? message;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json, [
    T Function(dynamic json)? fromJsonT,
  ]) {
    final raw = json['data'];
    T? parsed;
    if (fromJsonT != null && raw != null) {
      parsed = fromJsonT(raw);
    } else if (raw is T) {
      parsed = raw;
    }
    return ApiResponse<T>(
      success: json['success'] as bool? ?? false,
      data: parsed,
      message: json['message'] as String?,
    );
  }
}

List<Map<String, dynamic>> asMapList(dynamic data) {
  if (data is! List) return const [];
  return data
      .whereType<Map>()
      .map((e) => Map<String, dynamic>.from(e))
      .toList();
}

Map<String, dynamic> asMap(dynamic data) {
  if (data is Map) return Map<String, dynamic>.from(data);
  return const {};
}