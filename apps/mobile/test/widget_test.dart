import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:medicore_mobile/app.dart';

void main() {
  testWidgets('MediCore app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MedicoreApp()));
    await tester.pump();

    expect(find.textContaining('Sign in'), findsOneWidget);
  });
}