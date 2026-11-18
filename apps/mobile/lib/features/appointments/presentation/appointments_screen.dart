import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/record_tile.dart';
import '../../../core/widgets/section_header.dart';
import '../data/appointments_repository.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen> {
  AsyncValue<List<Map<String, dynamic>>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final next = await AsyncValue.guard(() => ref.read(appointmentsRepositoryProvider).list());
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
          const SectionHeader(title: 'Appointments', subtitle: 'Scheduled visits across the hospital'),
          _state.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyState(title: 'No appointments', message: 'The schedule is clear for now.');
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