import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medicore_mobile/features/auth/models/auth_session.dart';
import 'package:medicore_mobile/features/auth/presentation/login_screen.dart';
import 'package:medicore_mobile/features/auth/providers/auth_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _IdleAuth extends AuthController {
  @override
  AsyncValue<AuthSession?> build() => const AsyncValue.data(null);
}

Future<void> pumpLogin(WidgetTester tester) async {
  SharedPreferences.setMockInitialValues({});
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authProvider.overrideWith(_IdleAuth.new),
      ],
      child: const MaterialApp(home: LoginScreen()),
    ),
  );
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 100));
}

void main() {
  testWidgets('login form validates empty fields', (tester) async {
    await pumpLogin(tester);

    expect(find.text('Sign in'), findsWidgets);

    await tester.tap(find.widgetWithText(FilledButton, 'Sign in'));
    await tester.pump();

    expect(find.text('Required'), findsWidgets);
  });

  testWidgets('demo accounts panel expands', (tester) async {
    await pumpLogin(tester);

    await tester.tap(find.textContaining('Show demo accounts'));
    await tester.pump();

    expect(find.text('Admin'), findsOneWidget);
    expect(find.text('Doctor'), findsOneWidget);
    expect(find.text('Nurse'), findsOneWidget);
  });

  testWidgets('demo chip fills username field', (tester) async {
    await pumpLogin(tester);
    // Default 800x600 clips the demo wrap; expand surface for chip hit-tests.
    await tester.binding.setSurfaceSize(const Size(900, 1400));
    await tester.pump();

    await tester.tap(find.textContaining('Show demo accounts'));
    await tester.pump();

    final adminChip = find.widgetWithText(ActionChip, 'Admin');
    await tester.ensureVisible(adminChip);
    await tester.pump();
    await tester.tap(adminChip);
    await tester.pump();

    final usernameField = find.byType(TextFormField).first;
    final field = tester.widget<TextFormField>(usernameField);
    expect(field.controller?.text, 'admin');

    await tester.binding.setSurfaceSize(null);
  });
}
