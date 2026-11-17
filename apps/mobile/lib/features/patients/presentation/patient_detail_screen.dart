import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/json_display.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/section_header.dart';
import '../data/patients_repository.dart';

class PatientDetailScreen extends ConsumerStatefulWidget {
  const PatientDetailScreen({super.key, required this.patientId});

  final String patientId;

  @override
  ConsumerState<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends ConsumerState<PatientDetailScreen> {
  AsyncValue<Map<String, dynamic>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final next = await AsyncValue.guard(
      () => ref.read(patientsRepositoryProvider).getById(widget.patientId),
    );
    if (mounted) setState(() => _state = next);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Patient profile')),
      body: RefreshIndicator(
        color: AppTheme.primaryTeal,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _state.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(error: e, onRetry: _load),
              data: (map) {
                final title = pickTitle(map, keys: const ['fullName', 'uhid']);
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionHeader(title: title, subtitle: 'Patient identifier ${widget.patientId}'),
                    for (final entry in map.entries)
                      Card(
                        child: ListTile(
                          title: Text(_prettify(entry.key)),
                          subtitle: Text(displayValue(entry.value)),
                        ),
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  String _prettify(String key) => key
      .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
      .replaceAll('_', ' ');
}