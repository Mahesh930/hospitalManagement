import 'package:flutter_test/flutter_test.dart';
import 'package:medicore_mobile/core/config/api_config.dart';

void main() {
  test('baseUrl includes API version path', () {
    expect(ApiConfig.baseUrl, contains('/api/v1'));
    expect(ApiConfig.baseUrl, startsWith('http'));
  });
}