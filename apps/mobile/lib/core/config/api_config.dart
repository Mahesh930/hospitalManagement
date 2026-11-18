import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Resolves the MediCore API base URL for the current platform.
class ApiConfig {
  ApiConfig._();

  static const String _envOverride = String.fromEnvironment('API_BASE_URL');

  static const String _localhost = 'http://localhost:8080/api/v1';
  static const String _androidEmulator = 'http://10.0.2.2:8080/api/v1';

  /// Override with `--dart-define=API_BASE_URL=https://example.com/api/v1`.
  static String get baseUrl {
    if (_envOverride.isNotEmpty) {
      return _envOverride;
    }
    if (kIsWeb) {
      return _localhost;
    }
    try {
      if (Platform.isAndroid) {
        return _androidEmulator;
      }
    } catch (_) {
      // Unsupported platform (e.g. web already handled).
    }
    return _localhost;
  }
}