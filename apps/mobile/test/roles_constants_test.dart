import 'package:flutter_test/flutter_test.dart';
import 'package:medicore_mobile/core/constants/roles.dart';

void main() {
  test('RoleCodes.all contains 21 system roles', () {
    expect(RoleCodes.all.length, 21);
    expect(RoleCodes.all.toSet().length, 21);
  });

  test('critical roles present', () {
    for (final role in [
      RoleCodes.admin,
      RoleCodes.doctor,
      RoleCodes.nurse,
      RoleCodes.labManager,
      RoleCodes.qualityOfficer,
      RoleCodes.hrAdmin,
    ]) {
      expect(RoleCodes.all.contains(role), isTrue, reason: role);
    }
  });

  test('nav destinations cover core modules', () {
    final routes = kAllDestinations.map((d) => d.route).toSet();
    expect(routes.contains('/home/dashboard'), isTrue);
    expect(routes.contains('/home/patients'), isTrue);
    expect(routes.contains('/home/billing'), isTrue);
    expect(routes.contains('/home/lab'), isTrue);
    expect(routes.contains('/home/pharmacy'), isTrue);
  });

  test('destinationsForRoles filters by role', () {
    final nurse = destinationsForRoles([RoleCodes.nurse]);
    final routes = nurse.map((d) => d.route).toSet();
    expect(routes.contains('/home/dashboard'), isTrue);
    expect(routes.contains('/home/pharmacy'), isFalse);
  });
}
