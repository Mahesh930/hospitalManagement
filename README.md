# MediCore Hospital ERP

Enterprise hospital management platform with a **School ERP–style monorepo architecture**.

Full design: **[ARCHITECTURE.md](./ARCHITECTURE.md)** · Runbook: **[RUN_GUIDE.md](./RUN_GUIDE.md)**

## Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turbo + PNPM (+ Maven for Java) |
| API | Spring Boot 3 modular monolith (`apps/api`) |
| Web | Next.js 15 (`apps/web-admin`) |
| Mobile | Flutter (`apps/mobile`) |
| DB | PostgreSQL + JPA |
| Contracts | `@medicore/contracts` |

## Quick start

```powershell
copy .env.example .env
pnpm install

# API
.\mvnw.cmd -pl apps/api/hospital-app -am package -DskipTests
.\mvnw.cmd -pl apps/api/hospital-app spring-boot:run

# Web (new terminal)
pnpm dev

# Mobile (optional)
cd apps/mobile
flutter pub get
flutter run -d chrome
```

## Layout

```text
apps/api          Spring modular monolith
apps/web-admin    Next.js admin
apps/mobile       Flutter
apps/api-e2e      API smoke tests
packages/*        contracts, api-client, database, ui, common, ts-config
```
