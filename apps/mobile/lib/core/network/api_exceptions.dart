class ForbiddenException implements Exception {
  ForbiddenException([this.message = 'You do not have access to this resource.']);

  final String message;

  @override
  String toString() => message;
}

class ApiFailure implements Exception {
  ApiFailure(this.message);

  final String message;

  @override
  String toString() => message;
}