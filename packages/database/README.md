# `@medicore/database`

Single source of truth for **schema ownership** and **modular seeding** in MediCore.

> Runtime persistence is **Spring Data JPA + PostgreSQL** inside `apps/api` (Hospital ERP equivalent of Prisma in the School ERP reference).

## Schema ownership

| Concern | Location |
|---------|----------|
| Entities / enums | `apps/api/hospital-core/.../entity` |
| Repositories | `apps/api/hospital-core/.../repository` (+ patient/billing extras) |
| Runtime DDL / migrations | `apps/api/hospital-app/.../application.properties` → Flyway roadmap |

## Modular seeds (enterprise pattern)

Seed modules live conceptually under:

```text
packages/database/seeds/
  iam/           # roles, permissions, staff users
  clinical/      # doctors, wards, beds, appointments
  pharmacy/      # catalogues, batches
  billing/       # sample invoices, charges
  diagnostics/   # lab bookings
```

Execution today is orchestrated by Spring `DataInitializer` in `apps/api/hospital-app`, which calls domain seed helpers. Prefer extending **per-domain seed classes** instead of one giant method.

## Selective seeding (roadmap)

```bash
# future: profile-based selective seeds
# spring.profiles.active=seed-iam,seed-clinical
```
