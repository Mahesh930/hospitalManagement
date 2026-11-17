import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/json_display.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/record_tile.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/stat_card.dart';
import '../data/pharmacy_repository.dart';

class PharmacyScreen extends ConsumerStatefulWidget {
  const PharmacyScreen({super.key});

  @override
  ConsumerState<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends ConsumerState<PharmacyScreen> {
  AsyncValue<Map<String, dynamic>> _dashboard = const AsyncValue.loading();
  AsyncValue<List<Map<String, dynamic>>> _queue = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _dashboard = const AsyncValue.loading();
      _queue = const AsyncValue.loading();
    });
    final dash = await AsyncValue.guard(() => ref.read(pharmacyRepositoryProvider).dashboard());
    final queue = await AsyncValue.guard(() => ref.read(pharmacyRepositoryProvider).queue());
    if (mounted) {
      setState(() {
        _dashboard = dash;
        _queue = queue;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppTheme.primaryTeal,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SectionHeader(title: 'Pharmacy', subtitle: 'Dispensing dashboard & prescription queue'),
          _dashboard.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (map) {
              final metrics = flattenMetrics(map, max: 4);
              return Column(
                children: [
                  for (final m in metrics)
                    StatCard(label: m.key, value: m.value, icon: Icons.medication_outlined),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          const SectionHeader(title: 'Prescription queue'),
          _queue.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyState(title: 'Queue clear', message: 'No prescriptions awaiting action.');
              }
              return Column(
                children: [for (final r in rows) RecordTile(record: r)],
              );
            },
          ),
        ],
      ),
    );
  }
}