# How to Run MediCore Hospital ERP (Monorepo)

Enterprise monorepo layout — see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Prerequisites

| Dependency | Version |
| :--- | :--- |
| Java JDK | 17+ |
| PostgreSQL | 13+ |
| Node.js | 18+ |
| pnpm | 9+/10+ |
| Flutter | 3.10+ (for mobile) |

## 1. Environment (SSOT)

```powershell
copy .env.example .env
```

Edit root `.env` only — do not duplicate secrets inside apps.

Create DB:

```sql
CREATE DATABASE hospital;
```

## 2. Install JS workspace

```powershell
pnpm install
```

## 3. Run API (`apps/api`)

```powershell
.\mvnw.cmd -pl apps/api/hospital-app -am package -DskipTests
.\mvnw.cmd -pl apps/api/hospital-app spring-boot:run
```

API: `http://localhost:8080/api/v1`

## 4. Run Web Admin (`apps/web-admin`)

```powershell
pnpm dev
```

Portal: `http://localhost:3000`

## 5. Run Mobile (`apps/mobile`)

```powershell
cd apps/mobile
flutter pub get
flutter run -d chrome
```

## Docker

```powershell
docker compose up --build
```

## Tests

```powershell
pnpm --filter @medicore/api-e2e test
powershell -ExecutionPolicy Bypass -File scripts/test-all-roles.ps1
cd apps/mobile; flutter test
```

## Ports

| Service | Port |
| :--- | :--- |
| PostgreSQL | 5432 |
| Spring API | 8080 |
| Next.js admin | 3000 |
| Flutter | shared API |
