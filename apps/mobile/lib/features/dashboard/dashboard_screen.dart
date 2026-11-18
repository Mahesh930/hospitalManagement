import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/json_display.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/loading_view.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/stat_card.dart';
import '../auth/providers/auth_provider.dart';
import 'data/dashboard_repository.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  AsyncValue<Map<String, dynamic>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final session = ref.read(authProvider).value;
    if (session == null) {
      setState(() => _state = const AsyncValue.data({}));
      return;
    }
    final next = await AsyncValue.guard(
      () => ref.read(dashboardRepositoryProvider).loadDashboard(session),
    );
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
            title: 'Operational overview',
            subtitle: 'Live metrics from your role dashboard API',
          ),
          _state.when(
            loading: () => const LoadingView(message: 'Loading dashboard…'),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (map) {
              final metrics = flattenMetrics(map);
              if (metrics.isEmpty) {
                return const StatCard(
                  label: 'Status',
                  value: 'No metrics returned',
                  icon: Icons.insights_outlined,
                );
              }
              return LayoutBuilder(
                builder: (context, constraints) {
                  final cols = constraints.maxWidth > 700 ? 2 : 1;
                  return GridView.count(
                    crossAxisCount: cols,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: cols == 1 ? 2.8 : 2.4,
                    children: [
                      for (final m in metrics)
                        StatCard(label: m.key, value: m.value, icon: Icons.analytics_outlined),
                    ],
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}