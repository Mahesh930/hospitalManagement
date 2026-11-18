import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/roles.dart';
import '../../core/theme/app_theme.dart';
import '../auth/providers/auth_provider.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider).value;
    final roles = auth?.roles ?? const <String>[];
    final destinations = destinationsForRoles(roles);
    final location = GoRouterState.of(context).uri.toString();
    final wide = MediaQuery.sizeOf(context).width >= 900;

    int selectedIndex = 0;
    for (var i = 0; i < destinations.length; i++) {
      final route = destinations[i].route;
      if (location == route || location.startsWith('$route/')) {
        selectedIndex = i;
        break;
      }
    }

    Future<void> onLogout() async {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) context.go('/login');
    }

    final badge = primaryRoleLabel(roles);

    return Scaffold(
      body: Row(
        children: [
          if (wide)
            NavigationRail(
              selectedIndex: selectedIndex,
              extended: MediaQuery.sizeOf(context).width >= 1100,
              onDestinationSelected: (i) => context.go(destinations[i].route),
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Column(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.primaryTeal.withValues(alpha: 0.15),
                      child: const Icon(Icons.local_hospital, color: AppTheme.primaryTeal),
                    ),
                    const SizedBox(height: 8),
                    Text('MediCore', style: Theme.of(context).textTheme.labelLarge),
                  ],
                ),
              ),
              trailing: Expanded(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: IconButton(
                      tooltip: 'Sign out',
                      onPressed: onLogout,
                      icon: const Icon(Icons.logout),
                    ),
                  ),
                ),
              ),
              destinations: [
                for (final d in destinations)
                  NavigationRailDestination(
                    icon: Icon(d.icon),
                    selectedIcon: Icon(d.icon, color: AppTheme.primaryTeal),
                    label: Text(d.label),
                  ),
              ],
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Material(
                  color: AppTheme.cardSlate,
                  elevation: 0,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 12, 12),
                    child: Row(
                      children: [
                        if (!wide)
                          const Icon(Icons.local_hospital, color: AppTheme.primaryTeal),
                        if (!wide) const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'MediCore Hospital',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              Text(
                                auth?.username ?? '',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppTheme.textSecondary,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        Chip(
                          avatar: const Icon(Icons.verified_user_outlined, size: 18),
                          label: Text(badge),
                          backgroundColor: AppTheme.primaryTeal.withValues(alpha: 0.1),
                          side: BorderSide.none,
                        ),
                        if (!wide) ...[
                          IconButton(
                            tooltip: 'Sign out',
                            onPressed: onLogout,
                            icon: const Icon(Icons.logout),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const Divider(height: 1, color: AppTheme.borderSubtle),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: wide
          ? null
          : NavigationBar(
              selectedIndex: selectedIndex,
              onDestinationSelected: (i) => context.go(destinations[i].route),
              destinations: [
                for (final d in destinations)
                  NavigationDestination(icon: Icon(d.icon), label: d.label),
              ],
            ),
    );
  }
}