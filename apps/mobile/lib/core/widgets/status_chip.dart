import 'package:flutter/material.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.tone = StatusTone.neutral});

  final String label;
  final StatusTone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      StatusTone.success => (const Color(0xFFD1FAE5), const Color(0xFF047857)),
      StatusTone.warning => (const Color(0xFFFEF3C7), const Color(0xFFB45309)),
      StatusTone.danger => (const Color(0xFFFEE2E2), const Color(0xFFB91C1C)),
      StatusTone.info => (const Color(0xFFCCFBF1), const Color(0xFF0F766E)),
      StatusTone.neutral => (const Color(0xFFE2E8F0), const Color(0xFF475569)),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }

  static StatusTone toneFromStatus(String? status) {
    final s = (status ?? '').toUpperCase();
    if (s.contains('PAID') || s.contains('COMPLETED') || s.contains('DONE')) {
      return StatusTone.success;
    }
    if (s.contains('PENDING') || s.contains('WAIT')) {
      return StatusTone.warning;
    }
    if (s.contains('CANCEL') || s.contains('FAIL') || s.contains('REJECT')) {
      return StatusTone.danger;
    }
    if (s.contains('PROGRESS') || s.contains('ACTIVE')) {
      return StatusTone.info;
    }
    return StatusTone.neutral;
  }
}

enum StatusTone { success, warning, danger, info, neutral }