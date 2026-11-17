import 'package:flutter/material.dart';

import '../network/api_exceptions.dart';
import '../theme/app_theme.dart';
import 'empty_state.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    required this.error,
    this.onRetry,
  });

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    if (error is ForbiddenException) {
      return EmptyState(
        title: 'Access restricted',
        message: (error as ForbiddenException).message,
        icon: Icons.lock_outline,
      );
    }
  final message = error.toString().replaceFirst('Exception: ', '');
    return EmptyState(
      title: 'Something went wrong',
      message: message,
      icon: Icons.error_outline,
      action: onRetry == null
          ? null
          : FilledButton.icon(
              onPressed: onRetry,
              style: FilledButton.styleFrom(backgroundColor: AppTheme.primaryTeal),
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
    );
  }
}