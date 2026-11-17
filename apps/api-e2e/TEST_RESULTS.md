# MediCore test results

Last full run orchestrator: `node scripts/test-all.mjs`

| Suite | Command | Result |
|-------|---------|--------|
| Web roles / structure / RBAC nav | `pnpm test:roles` | **118 / 118 PASS** |
| API full (auth, RBAC allow/deny, edges) | `pnpm test:api` | **125 / 125 PASS** |
| API smoke | `pnpm test:api-smoke` | **PASS** |
| Mobile Flutter | `pnpm test:mobile` | **10 / 10 PASS** |
| Master orchestrator | `pnpm test:all` | **ALL PASS** |

## Coverage highlights

### API (`apps/api-e2e/test-api-full.mjs`)
- Auth: bad password, missing fields, empty body, no JWT, garbage JWT
- Signup: privilege escalation blocked (always PATIENT)
- All 20 staff role logins
- Allow-matrix + deny-matrix across admin, clinical, billing, lab, pharmacy
- Role catalog ≥ 21 roles
- Patients: empty query, missing UUID → 404, invalid UUID → **400**
- Billing / lab / pharmacy negative paths
- Station payload per role, duplicate signup rejection

### Web (`scripts/test-frontend-roles.mjs`)
- 21 system roles registered in catalog + `roles.ts`
- Dashboard station resolution for dedicated + generic stations
- Sidebar RBAC for doctor / nurse / pharmacy / cashier / lab / patient / super-admin
- `@medicore/api` client method coverage

### Mobile (`apps/mobile/test`)
- Role constants + nav filtering
- Login UI validation + demo account chips
- Live API smoke for key personas
- API base URL config

## Hardening applied from failures
1. **HR_ADMIN** can `GET /admin/users` (staff directory) — still cannot mutate `/admin/**`
2. **Invalid path UUIDs** return **400** via `MethodArgumentTypeMismatchException` handler (was 500)
3. Demo seed passwords for `admin` / `receptionist` / `pharmacist` refresh on startup
4. Flutter login tests override auth loading state (avoids Google Fonts / restore hang)

## How to run
```bash
# API must be up on :8080
pnpm test:all
# or individually
pnpm test:roles
pnpm test:api
pnpm test:mobile
```
