import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class _DemoAccount {
  const _DemoAccount(this.username, this.password, this.label);
  final String username;
  final String password;
  final String label;
}

const _demoAccounts = <_DemoAccount>[
  _DemoAccount('superadmin@email.com', 'Password@123', 'Super Admin'),
  _DemoAccount('admin', 'admin123', 'Admin'),
  _DemoAccount('receptionist', 'receptionist123', 'Receptionist'),
  _DemoAccount('pharmacist', 'pharmacist123', 'Pharmacist'),
  _DemoAccount('doctor', 'Password@123', 'Doctor'),
  _DemoAccount('nurse', 'Password@123', 'Nurse'),
  _DemoAccount('cashier', 'Password@123', 'Cashier'),
  _DemoAccount('labtech', 'Password@123', 'Lab Tech'),
  _DemoAccount('labmanager', 'Password@123', 'Lab Manager'),
  _DemoAccount('radiologist', 'Password@123', 'Radiologist'),
  _DemoAccount('radiologytech', 'Password@123', 'Radiology Tech'),
  _DemoAccount('accountant', 'Password@123', 'Accountant'),
  _DemoAccount('tpainsurance', 'Password@123', 'TPA Insurance'),
  _DemoAccount('mrd', 'Password@123', 'MRD'),
  _DemoAccount('hradmin', 'Password@123', 'HR Admin'),
  _DemoAccount('otcoordinator', 'Password@123', 'OT Coordinator'),
  _DemoAccount('anesthetist', 'Password@123', 'Anesthetist'),
  _DemoAccount('physiotherapist', 'Password@123', 'Physiotherapist'),
  _DemoAccount('bloodbank', 'Password@123', 'Blood Bank'),
  _DemoAccount('qualityofficer', 'Password@123', 'Quality Officer'),
];

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _showDemos = false;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).login(_username.text.trim(), _password.text);
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (auth.hasValue && auth.value != null) {
      context.go('/home/dashboard');
    }
  }

  void _applyDemo(_DemoAccount account) {
    setState(() {
      _username.text = account.username;
      _password.text = account.password;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final busy = auth.isLoading;

    ref.listen(authProvider, (prev, next) {
      if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error.toString().replaceFirst('Exception: ', ''))),
        );
      }
    });

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE6F4F2),
              Color(0xFFF1F5F9),
              Color(0xFFDCEFEA),
            ],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Card(
                elevation: 0,
                color: Colors.white.withValues(alpha: 0.96),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: const BorderSide(color: AppTheme.borderSubtle),
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryTeal,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Icon(Icons.local_hospital, color: Colors.white, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'MediCore',
                                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                  Text(
                                    'Hospital ERP · mobile station',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: Colors.white.withValues(alpha: 0.9),
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Sign in',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Same JWT API as the web portal — role dashboards open after login.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 22),
                      Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            TextFormField(
                              controller: _username,
                              decoration: const InputDecoration(
                                labelText: 'Username',
                                prefixIcon: Icon(Icons.person_outline),
                              ),
                              textInputAction: TextInputAction.next,
                              validator: (v) =>
                                  (v == null || v.trim().isEmpty) ? 'Required' : null,
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _password,
                              obscureText: _obscure,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(Icons.lock_outline),
                                suffixIcon: IconButton(
                                  onPressed: () => setState(() => _obscure = !_obscure),
                                  icon: Icon(
                                    _obscure
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                  ),
                                ),
                              ),
                              onFieldSubmitted: (_) => _submit(),
                              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                            ),
                            const SizedBox(height: 22),
                            FilledButton(
                              onPressed: busy ? null : _submit,
                              style: FilledButton.styleFrom(
                                backgroundColor: AppTheme.primaryTeal,
                                minimumSize: const Size.fromHeight(48),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: busy
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text('Sign in'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: () => setState(() => _showDemos = !_showDemos),
                        icon: Icon(_showDemos ? Icons.expand_less : Icons.expand_more),
                        label: Text(_showDemos ? 'Hide demo accounts' : 'Show demo accounts'),
                      ),
                      if (_showDemos) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final demo in _demoAccounts)
                              ActionChip(
                                label: Text(demo.label),
                                onPressed: busy ? null : () => _applyDemo(demo),
                                backgroundColor: AppTheme.primaryTeal.withValues(alpha: 0.08),
                              ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
