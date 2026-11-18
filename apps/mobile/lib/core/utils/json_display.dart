import 'package:intl/intl.dart';

String displayValue(dynamic value) {
  if (value == null) return '—';
  if (value is num) {
    if (value is double && value == value.roundToDouble()) {
      return value.toStringAsFixed(0);
    }
    return value.toString();
  }
  if (value is bool) return value ? 'Yes' : 'No';
  if (value is DateTime) return DateFormat.yMMMd().add_jm().format(value);
  if (value is List) return '${value.length} items';
  if (value is Map) return '${value.length} fields';
  final text = value.toString();
  if (text.length > 80) return '${text.substring(0, 77)}…';
  return text;
}

String pickTitle(Map<String, dynamic> row, {List<String> keys = const []}) {
  const defaults = [
    'fullName',
    'patientName',
    'name',
    'title',
    'username',
    'uhid',
    'id',
    'invoiceNumber',
    'testName',
    'medicineName',
  ];
  for (final key in [...keys, ...defaults]) {
    final v = row[key];
    if (v != null && v.toString().isNotEmpty) return v.toString();
  }
  return 'Record';
}

String? pickSubtitle(Map<String, dynamic> row) {
  for (final key in ['status', 'phone', 'department', 'scheduledAt', 'createdAt', 'role']) {
    final v = row[key];
    if (v != null && v.toString().isNotEmpty) return v.toString();
  }
  return null;
}

List<MapEntry<String, String>> flattenMetrics(Map<String, dynamic> map, {int max = 12}) {
  final entries = <MapEntry<String, String>>[];
  void walk(String prefix, dynamic value) {
    if (entries.length >= max) return;
    if (value is Map) {
      value.forEach((k, v) {
        if (entries.length >= max) return;
        final key = prefix.isEmpty ? k.toString() : '$prefix · ${k.toString()}';
        if (v is Map || v is List) {
          walk(key, v);
        } else {
          entries.add(MapEntry(_prettifyKey(key), displayValue(v)));
        }
      });
    } else if (value is List) {
      entries.add(MapEntry(_prettifyKey(prefix), '${value.length}'));
    } else if (prefix.isNotEmpty) {
      entries.add(MapEntry(_prettifyKey(prefix), displayValue(value)));
    }
  }

  map.forEach((k, v) => walk(k.toString(), v));
  return entries.take(max).toList();
}

String _prettifyKey(String key) {
  return key
      .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
      .replaceAll('_', ' ')
      .replaceAll('·', '·')
      .trim();
}