import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/session_store.dart';
import '../data/auth_repository.dart';
import '../models/auth_session.dart';

final authProvider = NotifierProvider<AuthController, AsyncValue<AuthSession?>>(
  AuthController.new,
);

class AuthController extends Notifier<AsyncValue<AuthSession?>> {
  @override
  AsyncValue<AuthSession?> build() {
    _restore();
    return const AsyncValue.loading();
  }

  Future<void> _restore() async {
  final session = await ref.read(sessionStoreProvider).load();
    state = AsyncValue.data(session);
  }

  Future<void> login(String username, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final session = await ref.read(authRepositoryProvider).login(username, password);
      await ref.read(sessionStoreProvider).save(session);
      return session;
    });
  }

  Future<void> logout() async {
    await ref.read(sessionStoreProvider).clear();
    state = const AsyncValue.data(null);
  }

  void clearSession() {
    state = const AsyncValue.data(null);
  }
}