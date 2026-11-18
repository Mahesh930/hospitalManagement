class AuthSession {
  const AuthSession({
    required this.token,
    required this.userId,
    required this.username,
    required this.roles,
  });

  final String token;
  final String userId;
  final String username;
  final List<String> roles;

  bool get isAuthenticated => token.isNotEmpty;

  bool hasRole(String role) => roles.map((e) => e.toUpperCase()).contains(role.toUpperCase());

  bool hasAnyRole(Iterable<String> candidates) {
    final mine = roles.map((e) => e.toUpperCase()).toSet();
    return candidates.any((c) => mine.contains(c.toUpperCase()));
  }
}