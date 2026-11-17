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
import '../data/billing_repository.dart';

class BillingScreen extends ConsumerStatefulWidget {
  const BillingScreen({super.key});

  @override
  ConsumerState<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends ConsumerState<BillingScreen> {
  AsyncValue<List<Map<String, dynamic>>> _invoices = const AsyncValue.loading();
  AsyncValue<Map<String, dynamic>> _stats = const AsyncValue.loading();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _invoices = const AsyncValue.loading();
      _stats = const AsyncValue.loading();
    });
    final inv = await AsyncValue.guard(() => ref.read(billingRepositoryProvider).listInvoices());
    final st = await AsyncValue.guard(() => ref.read(billingRepositoryProvider).stats());
    if (mounted) {
      setState(() {
        _invoices = inv;
        _stats = st;
      });
    }
  }

  Future<void> _pay(String id) async {
    try {
      await ref.read(billingRepositoryProvider).payInvoice(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment recorded')));
      }
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
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
          const SectionHeader(title: 'Billing & invoices', subtitle: 'Revenue cycle overview'),
          _stats.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (map) {
              final metrics = flattenMetrics(map, max: 4);
              if (metrics.isEmpty) return const SizedBox.shrink();
              return Column(
                children: [
                  for (final m in metrics)
                    StatCard(label: m.key, value: m.value, icon: Icons.payments_outlined),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Open invoices'),
          _invoices.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: _load),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyState(title: 'No invoices', message: 'No billing records to show.');
              }
              return Column(
                children: [
                  for (final row in rows)
                    RecordTile(
                      record: row,
                      onTap: () {
                        final id = row['id']?.toString();
                        final status = row['status']?.toString().toUpperCase() ?? '';
                        if (id != null && !status.contains('PAID')) {
                          _pay(id);
                        }
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