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
import '../data/lab_repository.dart';

class LabScreen extends ConsumerStatefulWidget {
  const LabScreen({super.key});

  @override
  ConsumerState<LabScreen> createState() => _LabScreenState();
}

class _LabScreenState extends ConsumerState<LabScreen> {
  AsyncValue<List<Map<String, dynamic>>> _worklist = const AsyncValue.loading();
  AsyncValue<Map<String, dynamic>> _stats = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _worklist = const AsyncValue.loading();
      _stats = const AsyncValue.loading();
    });
    final wl = await AsyncValue.guard(() => ref.read(labRepositoryProvider).worklist());
    final st = await AsyncValue.guard(() => ref.read(labRepositoryProvider).stats());
    if (mounted) {
      setState(() {
        _worklist = wl;
        _stats = st;
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
          const SectionHeader(title: 'Laboratory', subtitle: 'Worklist and bench metrics'),
          _stats.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (map) {
              final metrics = flattenMetrics(map, max: 4);
              return Column(
                children: [
                  for (final m in metrics)
                    StatCard(label: m.key, value: m.value, icon: Icons.science_outlined),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          const SectionHeader(title: 'Worklist'),
          _worklist.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyState(title: 'Worklist empty', message: 'No pending lab orders.');
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