import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/record_tile.dart';
import '../../../core/widgets/section_header.dart';
import '../data/patients_repository.dart';

class PatientsScreen extends ConsumerStatefulWidget {
  const PatientsScreen({super.key});

  @override
  ConsumerState<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends ConsumerState<PatientsScreen> {
  final _search = TextEditingController();
  AsyncValue<List<Map<String, dynamic>>> _state = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _state = const AsyncValue.loading());
    final next = await AsyncValue.guard(
      () => ref.read(patientsRepositoryProvider).search(query: _search.text.trim()),
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
          const SectionHeader(title: 'Patients', subtitle: 'Search by name, phone, or UHID'),
          TextField(
            controller: _search,
            decoration: InputDecoration(
              hintText: 'Search patients…',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
              ),
            ),
            onSubmitted: (_) => _load(),
          ),
          const SizedBox(height: 12),
          _state.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyState(title: 'No patients found', message: 'Try another search term.');
              }
              return Column(
                children: [
                  for (final row in rows)
                    RecordTile(
                      record: row,
                      onTap: () {
                        final id = row['id']?.toString();
                        if (id != null) context.go('/home/patients/$id');
                      },
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