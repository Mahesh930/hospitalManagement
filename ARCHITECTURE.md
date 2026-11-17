# MediCore Hospital ERP — Enterprise Monorepo Architecture

This workspace follows the **School ERP High-Performance Monorepo** blueprint, adapted to MediCore’s production stack:

| Reference (School ERP) | MediCore mapping |
|------------------------|------------------|
| NestJS modular monolith | **Spring Boot** modular monolith (`apps/api`) |
| Prisma | **JPA/Hibernate** entities in `hospital-core` + `packages/database` SSOT docs |
| Turbo + PNPM | **Turbo + PNPM** for TS/web packages |
| Next.js admin | **Next.js** `apps/web-admin` |
| Flutter mobile | **Flutter** `apps/mobile` |
| `@school-erp/contracts` | **`@medicore/contracts`** |

## Tech stack

- **Monorepo:** Turbo + PNPM workspaces (+ Maven reactor for Java)
- **Backend:** Spring Boot 3 modular monolith
- **Frontend Admin:** Next.js 15 (App Router)
- **Mobile:** Flutter
- **Database:** PostgreSQL (JPA)
- **Contracts:** shared TypeScript DTOs in `@medicore/contracts`

## Core principles

### 1. Single Source of Truth (SSOT)

- **Environment:** root `.env` / `.env.example` only
- **Database schema:** owned by `apps/api/hospital-core` entities; catalogued in `packages/database`
- **Types/Contracts:** `packages/contracts` — web clients import these; API implements matching shapes

### 2. Contract-first flow

1. Define / update DTO in `packages/contracts`
2. Implement / keep Spring controllers compatible
3. Consume in `apps/web-admin` via `@medicore/api` + contracts
4. Generate Flutter models from OpenAPI (roadmap) for `apps/mobile`

### 3. Modular seeding

Domain seed modules under `packages/database/seeds/` (iam, clinical, pharmacy, billing, diagnostics), executed by Spring `DataInitializer` helpers in `apps/api/hospital-app`.

### 4. Global resilience

- Central `GlobalExceptionHandler`
- Unified `{ success, data, message }` `ApiResponse`
- JWT + RBAC (`RoleType` / `PermissionType` / `@PreAuthorize`)

## Directory structure

```text
/
├── apps/
│   ├── api/              # Spring modular monolith
│   ├── web-admin/        # Next.js admin portal
│   ├── mobile/           # Flutter app
│   └── api-e2e/          # API smoke / e2e harness
├── packages/
│   ├── database/         # Schema/seed SSOT docs
│   ├── contracts/        # Shared DTOs
│   ├── api-client/       # @medicore/api HTTP client
│   ├── common/           # Shared TS helpers
│   ├── ui/               # Shared UI primitives
│   └── ts-config/        # Shared TypeScript config
├── .env.example          # Global secrets template (SSOT)
├── turbo.json
├── pnpm-workspace.yaml
└── pom.xml               # Maven reactor for apps/api/*
```

## Developer workflow

```bash
# JS workspace
pnpm install
pnpm build
pnpm dev                  # web-admin

# API
./mvnw -pl apps/api/hospital-app -am package -DskipTests
./mvnw -pl apps/api/hospital-app spring-boot:run

# Mobile
cd apps/mobile && flutter pub get && flutter run

# Seeds catalog
pnpm --filter @medicore/database seed:catalog

# API e2e smoke
pnpm --filter @medicore/api-e2e test
```

## Roadmap

- [ ] OpenAPI export from Spring + Flutter model codegen CI
- [ ] Flyway migrations (replace `ddl-auto=create/update` in prod)
- [ ] Headless `@medicore/ui` for multiple portals
- [ ] Terraform/Pulumi IaC
- [ ] Split seed runners by Spring profiles (`seed-iam`, `seed-clinical`, …)
