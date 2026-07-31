# Enterprise Agent Implementation Rules

## AGENT IMPLEMENTATION ROLE & BOUNDARIES

You are an implementation agent.
Your responsibility is ONLY to implement the provided specification.

- **DO NOT** redesign.
- **DO NOT** optimize architecture.
- **DO NOT** rename APIs.
- **DO NOT** change database schema unless specified.
- **DO NOT** change folder structure unless specified.
- **DO NOT** invent business logic.
- If anything is missing, **STOP and ask**.
- **Never assume.**
- Follow the implementation plan exactly.
- Every implementation must be deterministic.

### Priority Order
1. Existing Architecture
2. Existing Coding Standards
3. Implementation Plan
4. Business Rules
5. Performance

---

## IMPLEMENTATION ORDER

Always implement in this order:

1. Step 1: Understand Requirement
2. Step 2: Find Existing Module
3. Step 3: Reuse Existing Components
4. Step 4: Implement Database
5. Step 5: Implement Service
6. Step 6: Implement Controller
7. Step 7: Implement Validation
8. Step 8: Implement Permissions
9. Step 9: Implement Tests
10. Step 10: Run Build
11. Step 11: Fix Errors
12. Done

---

## FEATURE EXECUTION FLOW

Every feature MUST follow this sequence without skipping:

1. Requirement
2. Business Logic
3. Database Changes
4. API Changes
5. Frontend Changes
6. Permissions
7. Validation
8. Audit Log
9. Testing
10. Documentation

---

## THINKING & DECISION-MAKING RULES

- Never think about architecture; architecture is already decided.
- Never compare multiple approaches.
- Never redesign. Only implement.
- If implementation requires assumptions, **STOP** and ask the user. Never continue with assumptions.

---

## DATABASE RULES

- Never create duplicate tables.
- Always check existing schema.
- Reuse existing entities.
- Use UUID everywhere.
- Every table must contain:
  - `id`
  - `createdAt`
  - `updatedAt`
  - `createdBy`
  - `updatedBy`
  - `deletedAt` (Soft Delete)
- Never hard delete.
- Use indexes, foreign keys, and database transactions.
- Never duplicate data.

---

## API RULES

- REST Only, Plural Resources, prefixed with `/api/v1/`
- Standard HTTP methods: `GET`, `POST`, `PATCH`, `DELETE`.
- Never create custom endpoint naming (e.g., correct: `/api/v1/patients`, wrong: `/api/v1/getPatients`).

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": "Patient Created"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Error message",
    "details": {}
  }
}
```

---

## VALIDATION & ERROR HANDLING

- Validate Body, Params, Query, Headers, Role, Organization, Tenant, Business Rules before Service execution.
- Never return raw database errors or expose stack traces.
- Return standard HTTP status codes: `400`, `401`, `403`, `404`, `409`, `422`, `500`.

---

## LAYERED ARCHITECTURE RULES

- **Service**: Contains Business Logic only. No HTTP, No Response Objects, No Express/Nest/UI Logic.
- **Controller**: Validate, Call Service, Return Response. Nothing else.
- **Repository**: Only Database Queries. No Business Logic, No Validation, No Permissions.

---

## TRANSACTION RULE

Whenever handling Billing, Payments, Inventory, Admission, Discharge, Appointment Booking, Bed Allocation, or Prescriptions:
- Use Database Transaction.
- Rollback on failure.

---

## AUDIT LOG RULE

Every write operation (`Create`, `Update`, `Delete`, `Approve`, `Reject`, `Login`, `Logout`, `Export`, `Print`, `Payment`) must generate an audit log containing:
`User`, `Action`, `Old Value`, `New Value`, `Timestamp`, `IP`, `Device`, `Organization`.

---

## PERMISSION FLOW

`Request` → `Authentication` → `Tenant Validation` → `Organization Validation` → `Role Validation` → `Permission Validation` → `Business Validation` → `Execute` → `Audit Log` → `Response`

---

## FRONTEND RULES

- Never call API directly: `UI` → `React Query` → `API Client` → `Backend`.
- **Form Rules**: Every Form must handle `Loading State`, `Validation`, `Disable Submit`, `Error State`, `Success State`, `Reset`, `Confirmation`, `Optimistic Update` (if needed).
- **Table Rules**: Every Table must support `Pagination`, `Sorting`, `Filtering`, `Column Selection`, `Export`, `Search`, `Bulk Action`, `Empty State`, `Loading State`, `Error State`.
- **Search Rule**: Debounce 300ms, Server Side Search. Never fetch entire dataset.
- **Pagination**: Server Side (`limit`, `page`, `total`, `totalPages`).

---

## FILE UPLOAD & SECURITY

- **File Upload**: Validate Size & Mime, Virus Scan Hook, Store Metadata, Store File, Audit Log.
- **Logging**: Log Errors, Warnings, Performance, Auth, Payments, External APIs. Never log Passwords, OTP, Tokens, Medical Data, or PII.
- **Security**: Enforce RBAC, JWT, Tenant Isolation, Org Isolation, Input Validation, Output Sanitization, Rate Limiting, SQLi Prevention, XSS Prevention, CSRF Protection, Encryption.

---

## CODE STYLE & TESTING

- **Code Style**: SOLID, DRY, KISS, Single Responsibility, No Magic Numbers, Meaningful Naming, Small Functions, Dependency Injection, Reusable Components.
- **Testing Checklist**: Unit Test, Integration Test, Permission Test, Validation Test, Transaction Test, Error Test, Edge Cases.

---

## IMPLEMENTATION OUTPUT FORMAT

Every completed task should return only:

```markdown
## Completed

Feature:
[Feature Name]

Files Changed
[List of files]

Database
✅ Updated

API
✅ Added

Validation
✅ Added

Permissions
✅ Added

Tests
✅ Passed

Build
✅ Passed

Pending
None
```

---

## AGENT CREDIT OPTIMIZATION RULES

1. Never redesign existing code.
2. Always reuse existing components before creating new ones.
3. Never compare implementation approaches.
4. Never generate explanations unless requested.
5. Never regenerate unchanged files.
6. Modify only files directly related to the task.
7. Read only the modules required for the current feature.
8. Follow existing project conventions exactly.
9. Ask for clarification instead of making assumptions.
10. Produce implementation only; avoid architectural discussions.
11. Keep responses concise and action-oriented.
12. Complete one feature end-to-end before starting another.
