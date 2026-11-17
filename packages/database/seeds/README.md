# Modular seed catalog

| Module | Responsibility | Demo users / data |
|--------|----------------|-------------------|
| `iam` | Roles, permissions, staff accounts | admin, receptionist, doctor, … |
| `clinical` | Wards, beds, admissions, appointments | nurse ward assignment |
| `pharmacy` | Medicine catalogue + FEFO batches | pharmacist queue |
| `billing` | Charge samples + pending invoices | cashier desk |
| `diagnostics` | Lab / radiology bookings | labtech worklist |

Implement new seed data as a dedicated Java `@Component` under `apps/api/hospital-app/.../config/seed/` and invoke from `DataInitializer`.
