import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/appointments/presentation/appointments_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/billing/presentation/billing_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/lab/presentation/lab_screen.dart';
import '../../features/nurse/presentation/nurse_screen.dart';
import '../../features/patients/presentation/patient_detail_screen.dart';
import '../../features/patients/presentation/patients_screen.dart';
import '../../features/pharmacy/presentation/pharmacy_screen.dart';
import '../../features/reception/presentation/reception_screen.dart';
import '../../features/roles_catalog/presentation/roles_catalog_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/station/presentation/station_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefresh(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final onLogin = state.matchedLocation == '/login';

      if (auth.isLoading) return null;

      final session = auth.value;
      final signedIn = session != null && session.isAuthenticated;

      if (!signedIn) {
        return onLogin ? null : '/login';
      }
      if (onLogin) return '/home/dashboard';
      if (state.matchedLocation == '/' || state.matchedLocation == '/home') {
        return '/home/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/home/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(child: DashboardScreen()),
          ),
          GoRoute(
            path: '/home/patients',
            pageBuilder: (context, state) => const NoTransitionPage(child: PatientsScreen()),
            routes: [
              GoRoute(
                path: ':patientId',
                builder: (context, state) => PatientDetailScreen(
                  patientId: state.pathParameters['patientId']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/home/appointments',
            pageBuilder: (context, state) => const NoTransitionPage(child: AppointmentsScreen()),
          ),
          GoRoute(
            path: '/home/billing',
            pageBuilder: (context, state) => const NoTransitionPage(child: BillingScreen()),
          ),
          GoRoute(
            path: '/home/lab',
            pageBuilder: (context, state) => const NoTransitionPage(child: LabScreen()),
          ),
          GoRoute(
            path: '/home/pharmacy',
            pageBuilder: (context, state) => const NoTransitionPage(child: PharmacyScreen()),
          ),
          GoRoute(
            path: '/home/nurse',
            pageBuilder: (context, state) => const NoTransitionPage(child: NurseScreen()),
          ),
          GoRoute(
            path: '/home/reception',
            pageBuilder: (context, state) => const NoTransitionPage(child: ReceptionScreen()),
          ),
          GoRoute(
            path: '/home/roles',
            pageBuilder: (context, state) => const NoTransitionPage(child: RolesCatalogScreen()),
          ),
          GoRoute(
            path: '/home/station',
            pageBuilder: (context, state) => const NoTransitionPage(child: StationScreen()),
          ),
        ],
      ),
    ],
  );
});

class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(this._ref) {
    _ref.listen<AsyncValue>(authProvider, (_, _) => notifyListeners());
  }

  final Ref _ref;
}