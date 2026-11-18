import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/roles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/section_header.dart';
import '../data/roles_repository.dart';

class RolesCatalogScreen extends ConsumerStatefulWidget {
  const RolesCatalogScreen({super.key});

  @override
  ConsumerState<RolesCatalogScreen> createState() => _RolesCatalogScreenState();
}

class _RolesCatalogScreenState extends ConsumerState<RolesCatalogScreen> {
  AsyncValue<List<Map<String, dynamic>>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final next = await AsyncValue.guard(() => ref.read(rolesRepositoryProvider).catalog());
    if (mounted) setState(() => _state = next);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppTheme.primaryTeal,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SectionHeader(
            title: 'Role catalog',
            subtitle: 'Hospital stations and permissions from the API',
          ),
          _state.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyState(title: 'No roles', message: 'Catalog returned no entries.');
              }
              return Column(
                children: [
                  for (final row in rows)
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.badge_outlined, color: AppTheme.primaryTeal),
                        title: Text(
                          roleDisplayLabel(row['role']?.toString() ?? row['code']?.toString() ?? 'Role'),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          row['description']?.toString() ?? row['summary']?.toString() ?? 'Station profile',
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}