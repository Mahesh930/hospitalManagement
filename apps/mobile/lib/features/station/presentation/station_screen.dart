import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/roles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/json_display.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/section_header.dart';
import '../data/station_repository.dart';

class StationScreen extends ConsumerStatefulWidget {
  const StationScreen({super.key});

  @override
  ConsumerState<StationScreen> createState() => _StationScreenState();
}

class _StationScreenState extends ConsumerState<StationScreen> {
  AsyncValue<Map<String, dynamic>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final next = await AsyncValue.guard(() => ref.read(stationRepositoryProvider).myStation());
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
            title: 'My station',
            subtitle: 'Personalized workspace from /roles/me/station',
          ),
          _state.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (map) {
              final stations = map['stations'];
              final roles = map['roles'];
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (map['username'] != null)
                    Text('Signed in as ${map['username']}', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  if (roles is List)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final r in roles)
                          Chip(
                            label: Text(roleDisplayLabel(r.toString())),
                            backgroundColor: AppTheme.primaryTeal.withValues(alpha: 0.1),
                          ),
                      ],
                    ),
                  const SizedBox(height: 16),
                  if (stations is List)
                    for (final s in stations)
                      if (s is Map)
                        Card(
                          child: ListTile(
                            title: Text(
                              roleDisplayLabel(s['role']?.toString() ?? 'Station'),
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text(
                              s['description']?.toString() ??
                                  s['stationName']?.toString() ??
                                  displayValue(s),
                            ),
                          ),
                        ),
                  if (stations is! List) ...[
                    for (final m in flattenMetrics(map))
                      ListTile(
                        title: Text(m.key),
                        trailing: Text(m.value),
                      ),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}