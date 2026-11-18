import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/json_display.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/stat_card.dart';
import '../data/nurse_repository.dart';

class NurseScreen extends ConsumerStatefulWidget {
  const NurseScreen({super.key});

  @override
  ConsumerState<NurseScreen> createState() => _NurseScreenState();
}

class _NurseScreenState extends ConsumerState<NurseScreen> {
  AsyncValue<Map<String, dynamic>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final next = await AsyncValue.guard(() => ref.read(nurseRepositoryProvider).dashboard());
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
          const SectionHeader(title: 'Nursing station', subtitle: 'Triage and ward telemetry'),
          _state.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (map) {
              final metrics = flattenMetrics(map);
              return Column(
                children: [
                  for (final m in metrics)
                    StatCard(label: m.key, value: m.value, icon: Icons.monitor_heart_outlined),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}