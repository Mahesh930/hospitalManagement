import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/json_display.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/stat_card.dart';
import '../data/reception_repository.dart';

class ReceptionScreen extends ConsumerStatefulWidget {
  const ReceptionScreen({super.key});

  @override
  ConsumerState<ReceptionScreen> createState() => _ReceptionScreenState();
}

class _ReceptionScreenState extends ConsumerState<ReceptionScreen> {
  AsyncValue<Map<String, dynamic>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final next = await AsyncValue.guard(() => ref.read(receptionRepositoryProvider).dashboard());
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
          const SectionHeader(title: 'Front office', subtitle: 'Reception live dashboard'),
          _state.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (map) {
              final metrics = flattenMetrics(map);
              return Column(
                children: [
                  for (final m in metrics)
                    StatCard(label: m.key, value: m.value, icon: Icons.meeting_room_outlined),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}