# `apps/mobile` — MediCore Flutter

Cross-platform client using the **same** Spring JWT API as `apps/web-admin`.

## Contract-first note

TypeScript DTOs live in `@medicore/contracts`. Flutter models are hand-maintained today; roadmap is OpenAPI → Dart codegen (School ERP “Generate Flutter models from Swagger” step).

## Run

```bash
cd apps/mobile
flutter pub get
flutter run -d chrome
```

API default: `http://localhost:8080/api/v1` (Android emulator: `10.0.2.2`).
