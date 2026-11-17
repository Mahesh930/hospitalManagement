# `apps/api` — MediCore Spring Modular Monolith

Maps to School ERP `apps/api` (NestJS) using **Spring Boot 3** domain modules.

```text
apps/api/
  hospital-core/       # entities, repos, security helpers, ApiResponse
  hospital-patient/
  hospital-opd/        # appointments, doctors, lab
  hospital-billing/    # invoices + pharmacy
  hospital-reception/
  hospital-nurse/
  hospital-app/        # runnable boot app, auth, admin, seeds
```

## Run

From repo root:

```bash
./mvnw -pl apps/api/hospital-app -am package -DskipTests
./mvnw -pl apps/api/hospital-app spring-boot:run
```

API base: `http://localhost:8080/api/v1`
