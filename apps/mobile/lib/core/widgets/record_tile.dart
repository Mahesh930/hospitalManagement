import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../utils/json_display.dart';
import 'status_chip.dart';

class RecordTile extends StatelessWidget {
  const RecordTile({
    super.key,
    required this.record,
    this.onTap,
    this.statusKey = 'status',
  });

  final Map<String, dynamic> record;
  final VoidCallback? onTap;
  final String statusKey;

  @override
  Widget build(BuildContext context) {
    final title = pickTitle(record);
    final subtitle = pickSubtitle(record);
    final status = record[statusKey]?.toString();

    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
        ),
        subtitle: subtitle == null
            ? null
            : Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(subtitle, style: const TextStyle(color: AppTheme.textSecondary)),
              ),
        trailing: status == null
            ? const Icon(Icons.chevron_right, color: AppTheme.textSecondary)
            : StatusChip(label: status, tone: StatusChip.toneFromStatus(status)),
      ),
    );
  }
}