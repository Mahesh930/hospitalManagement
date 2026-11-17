/**
 * MediCore Hospital ERP — Frontend Role Verification Test Suite
 * 
 * Tests:
 * 1. Role Catalog Completeness (all 21 system roles)
 * 2. Next.js Route Target Integrity (all station pages exist on disk)
 * 3. RBAC Sidebar Navigation Scoping (permitted vs. forbidden routes per role)
 * 4. Dashboard Station Component Matching (active role -> station view)
 * 5. API Client Methods & DTO Mapping for all role operations
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appsDir = path.resolve(rootDir, "apps", "web-admin");
const apiDir = path.resolve(rootDir, "packages", "api-client");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
  }
}

console.log("\n========================================================");
console.log("  MediCore ERP Frontend Role & Station Test Suite");
console.log("========================================================\n");

// -------------------------------------------------------------
// Test 1: Role Definitions & Catalog
// -------------------------------------------------------------
console.log("Suite 1: System Roles & Catalog Definitions");

const PRIMARY_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "NURSE",
  "RECEPTIONIST",
  "PHARMACIST",
  "CASHIER",
  "LAB_TECH",
  "PATIENT"
];

const EXTENDED_STATION_ROLES = [
  "ACCOUNTANT",
  "TPA_INSURANCE",
  "MRD",
  "LAB_MANAGER",
  "RADIOLOGIST",
  "RADIOLOGY_TECH",
  "BLOOD_BANK",
  "OT_COORDINATOR",
  "ANESTHETIST",
  "PHYSIOTHERAPIST",
  "HR_ADMIN",
  "QUALITY_OFFICER"
];

const ALL_ROLES = [...PRIMARY_ROLES, ...EXTENDED_STATION_ROLES];

assert(ALL_ROLES.length === 21, `Catalog contains all 21 system roles (got ${ALL_ROLES.length})`);

// Verify lib/roles.ts exists and defines EXTENDED_STATION_ROLES
const rolesTsPath = path.join(appsDir, "src", "lib", "roles.ts");
assert(fs.existsSync(rolesTsPath), "src/lib/roles.ts exists");

const rolesTsContent = fs.readFileSync(rolesTsPath, "utf-8");
EXTENDED_STATION_ROLES.forEach(role => {
  assert(rolesTsContent.includes(`"${role}"`), `roles.ts registers extended role '${role}'`);
  assert(rolesTsContent.includes(`${role}:`), `roles.ts has metadata block for '${role}'`);
});

// -------------------------------------------------------------
// Test 2: Next.js Route Page Files Integrity
// -------------------------------------------------------------
console.log("\nSuite 2: Next.js Route Pages on Disk for Role Stations");

const REQUIRED_ROUTE_FILES = [
  // Dashboard & Roles
  "src/app/(dashboard)/dashboard/page.tsx",
  "src/app/(dashboard)/layout.tsx",
  "src/app/login/page.tsx",
  
  // Doctor & OPD
  "src/app/(dashboard)/opd/page.tsx",
  "src/app/(dashboard)/patients/page.tsx",
  "src/app/(dashboard)/appointments/page.tsx",
  
  // Cashier & Billing
  "src/app/(dashboard)/billing/page.tsx",
  
  // Laboratory
  "src/app/(dashboard)/laboratory/page.tsx",
  
  // Nurse & Inpatient Wards
  "src/app/(dashboard)/nurse/page.tsx",
  "src/app/(dashboard)/nurse/beds/page.tsx",
  "src/app/(dashboard)/nurse/emar/page.tsx",
  
  // Pharmacy
  "src/app/(dashboard)/pharmacy/page.tsx",
  "src/app/(dashboard)/pharmacy/queue/page.tsx",
  "src/app/(dashboard)/pharmacy/inventory/page.tsx",
  
  // Receptionist Desk
  "src/app/(dashboard)/reception/page.tsx",
  "src/app/(dashboard)/reception/queue/page.tsx",
  "src/app/(dashboard)/reception/registration/page.tsx",
  
  // Extended Stations
  "src/app/(dashboard)/stations/page.tsx",
  "src/app/(dashboard)/stations/[role]/page.tsx",
  
  // Administration
  "src/app/(dashboard)/super-admin/hospitals/page.tsx",
  "src/app/(dashboard)/settings/hospital/page.tsx",
  "src/app/(dashboard)/settings/audit-logs/page.tsx"
];

REQUIRED_ROUTE_FILES.forEach(relPath => {
  const fullPath = path.join(appsDir, relPath);
  assert(fs.existsSync(fullPath), `Route page exists: ${relPath}`);
});

// -------------------------------------------------------------
// Test 3: Dashboard Station Component Resolution
// -------------------------------------------------------------
console.log("\nSuite 3: Dashboard Station Component Resolution Logic");

// Helper to simulate DashboardPage resolution logic
function resolveDashboardStation(roles) {
  const isElevated = roles.includes("SUPER_ADMIN") || roles.includes("ADMIN");
  const isDoctorOnly = roles.includes("DOCTOR") && !isElevated;
  const isNurseOnly = roles.includes("NURSE") && !isElevated;
  const isPharmacistOnly = roles.includes("PHARMACIST") && !isElevated;
  const isReceptionistOnly = roles.includes("RECEPTIONIST") && !isElevated;
  const isCashierOnly = roles.includes("CASHIER") && !isElevated;
  const isLabTechOnly = roles.includes("LAB_TECH") && !isElevated;
  const isPatientOnly = roles.includes("PATIENT") && !isElevated;
  const extendedStationRole = !isElevated
    ? EXTENDED_STATION_ROLES.find((role) => roles.includes(role))
    : undefined;

  if (isDoctorOnly) return "DoctorDashboard";
  if (isNurseOnly) return "NurseDashboard";
  if (isPharmacistOnly) return "PharmacyDashboard";
  if (isReceptionistOnly) return "ReceptionistDashboard";
  if (isCashierOnly) return "CashierDashboard";
  if (isLabTechOnly) return "LabDashboard";
  if (isPatientOnly) return "PatientDashboard";
  if (extendedStationRole) return `RoleStationDashboard(${extendedStationRole})`;
  return "AdminOverviewDashboard";
}

assert(resolveDashboardStation(["DOCTOR"]) === "DoctorDashboard", "DOCTOR resolves to DoctorDashboard");
assert(resolveDashboardStation(["NURSE"]) === "NurseDashboard", "NURSE resolves to NurseDashboard");
assert(resolveDashboardStation(["PHARMACIST"]) === "PharmacyDashboard", "PHARMACIST resolves to PharmacyDashboard");
assert(resolveDashboardStation(["RECEPTIONIST"]) === "ReceptionistDashboard", "RECEPTIONIST resolves to ReceptionistDashboard");
assert(resolveDashboardStation(["CASHIER"]) === "CashierDashboard", "CASHIER resolves to CashierDashboard");
assert(resolveDashboardStation(["LAB_TECH"]) === "LabDashboard", "LAB_TECH resolves to LabDashboard");
assert(resolveDashboardStation(["PATIENT"]) === "PatientDashboard", "PATIENT resolves to PatientDashboard");
assert(resolveDashboardStation(["ACCOUNTANT"]) === "RoleStationDashboard(ACCOUNTANT)", "ACCOUNTANT resolves to RoleStationDashboard(ACCOUNTANT)");
assert(resolveDashboardStation(["LAB_MANAGER"]) === "RoleStationDashboard(LAB_MANAGER)", "LAB_MANAGER resolves to RoleStationDashboard(LAB_MANAGER)");
assert(resolveDashboardStation(["RADIOLOGIST"]) === "RoleStationDashboard(RADIOLOGIST)", "RADIOLOGIST resolves to RoleStationDashboard(RADIOLOGIST)");
assert(resolveDashboardStation(["OT_COORDINATOR"]) === "RoleStationDashboard(OT_COORDINATOR)", "OT_COORDINATOR resolves to RoleStationDashboard(OT_COORDINATOR)");
assert(resolveDashboardStation(["ADMIN"]) === "AdminOverviewDashboard", "ADMIN resolves to AdminOverviewDashboard");
assert(resolveDashboardStation(["SUPER_ADMIN"]) === "AdminOverviewDashboard", "SUPER_ADMIN resolves to AdminOverviewDashboard");

// -------------------------------------------------------------
// Test 4: Sidebar Navigation Menu Access Control (RBAC)
// -------------------------------------------------------------
console.log("\nSuite 4: Sidebar Navigation Menu Access Control (RBAC)");

const layoutPath = path.join(appsDir, "src", "app", "(dashboard)", "layout.tsx");
const layoutContent = fs.readFileSync(layoutPath, "utf-8");

// Parse allNavItems from layout.tsx
const navItemsMatch = layoutContent.match(/const allNavItems: NavItem\[] = \[([\s\S]*?)\];/);
assert(navItemsMatch !== null, "Extracted allNavItems from layout.tsx");

const rawNavItems = navItemsMatch[1];
const itemRegex = /{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)",\s*icon:\s*\w+,\s*roles:\s*(\[[^\]]+\]|ALL_STAFF_ROLES)\s*}/g;
const navItems = [];
let match;
while ((match = itemRegex.exec(rawNavItems)) !== null) {
  let roles;
  if (match[3] === "ALL_STAFF_ROLES") {
    roles = ALL_ROLES;
  } else {
    roles = JSON.parse(match[3].replace(/'/g, '"'));
  }
  navItems.push({ label: match[1], href: match[2], roles });
}

assert(navItems.length > 25, `Extracted ${navItems.length} protected navigation items`);

function getPermittedRoutesForRole(role) {
  return navItems.filter(item => item.roles.includes(role)).map(i => i.href);
}

// Doctor RBAC check
const doctorRoutes = getPermittedRoutesForRole("DOCTOR");
assert(doctorRoutes.includes("/opd"), "DOCTOR can access /opd");
assert(doctorRoutes.includes("/appointments"), "DOCTOR can access /appointments");
assert(!doctorRoutes.includes("/billing"), "DOCTOR is denied /billing");
assert(!doctorRoutes.includes("/pharmacy"), "DOCTOR is denied /pharmacy");
assert(!doctorRoutes.includes("/super-admin/hospitals"), "DOCTOR is denied /super-admin/hospitals");

// Nurse RBAC check
const nurseRoutes = getPermittedRoutesForRole("NURSE");
assert(nurseRoutes.includes("/nurse"), "NURSE can access /nurse");
assert(nurseRoutes.includes("/nurse/beds"), "NURSE can access /nurse/beds");
assert(nurseRoutes.includes("/nurse/emar"), "NURSE can access /nurse/emar");
assert(!nurseRoutes.includes("/opd"), "NURSE is denied /opd (Doctor only)");
assert(!nurseRoutes.includes("/billing"), "NURSE is denied /billing");

// Pharmacist RBAC check
const pharmacyRoutes = getPermittedRoutesForRole("PHARMACIST");
assert(pharmacyRoutes.includes("/pharmacy"), "PHARMACIST can access /pharmacy");
assert(pharmacyRoutes.includes("/pharmacy/queue"), "PHARMACIST can access /pharmacy/queue");
assert(pharmacyRoutes.includes("/pharmacy/inventory"), "PHARMACIST can access /pharmacy/inventory");
assert(!pharmacyRoutes.includes("/nurse"), "PHARMACIST is denied /nurse");
assert(!pharmacyRoutes.includes("/opd"), "PHARMACIST is denied /opd");

// Cashier RBAC check
const cashierRoutes = getPermittedRoutesForRole("CASHIER");
assert(cashierRoutes.includes("/billing"), "CASHIER can access /billing");
assert(!cashierRoutes.includes("/pharmacy"), "CASHIER is denied /pharmacy");
assert(!cashierRoutes.includes("/opd"), "CASHIER is denied /opd");
assert(!cashierRoutes.includes("/nurse"), "CASHIER is denied /nurse");

// Lab Tech RBAC check
const labRoutes = getPermittedRoutesForRole("LAB_TECH");
assert(labRoutes.includes("/laboratory"), "LAB_TECH can access /laboratory");
assert(!labRoutes.includes("/billing"), "LAB_TECH is denied /billing");
assert(!labRoutes.includes("/opd"), "LAB_TECH is denied /opd");

// Patient RBAC check
const patientRoutes = getPermittedRoutesForRole("PATIENT");
assert(patientRoutes.includes("/dashboard"), "PATIENT can access /dashboard");
assert(patientRoutes.includes("/appointments"), "PATIENT can access /appointments");
assert(!patientRoutes.includes("/billing"), "PATIENT is denied staff /billing");
assert(!patientRoutes.includes("/opd"), "PATIENT is denied /opd");
assert(!patientRoutes.includes("/pharmacy"), "PATIENT is denied /pharmacy");

// Super Admin RBAC check
const superAdminRoutes = getPermittedRoutesForRole("SUPER_ADMIN");
assert(superAdminRoutes.includes("/super-admin/hospitals"), "SUPER_ADMIN can access /super-admin/hospitals");
assert(superAdminRoutes.includes("/super-admin/user-operations"), "SUPER_ADMIN can access /super-admin/user-operations");
assert(superAdminRoutes.includes("/super-admin/subscriptions"), "SUPER_ADMIN can access /super-admin/subscriptions");

// -------------------------------------------------------------
// Test 5: Frontend API Client Coverage per Role
// -------------------------------------------------------------
console.log("\nSuite 5: Frontend API Client Coverage per Role");

const apiIndexSource = fs.readFileSync(path.join(apiDir, "src", "index.ts"), "utf-8");

const REQUIRED_API_EXPORTS = [
  "authApi",
  "adminApi",
  "superAdminApi",
  "doctorsApi",
  "consultationsApi",
  "nurseApi",
  "receptionistApi",
  "pharmacyApi",
  "invoicesApi",
  "labApi",
  "patientsApi",
  "rolesApi"
];

REQUIRED_API_EXPORTS.forEach(apiExp => {
  assert(apiIndexSource.includes(apiExp), `@medicore/api exports '${apiExp}'`);
});

// Check Lab API methods
const labApiSource = fs.readFileSync(path.join(apiDir, "src", "lab.ts"), "utf-8");
assert(labApiSource.includes("getWorklist"), "labApi includes getWorklist()");
assert(labApiSource.includes("getById"), "labApi includes getById()");
assert(labApiSource.includes("collectSample"), "labApi includes collectSample()");
assert(labApiSource.includes("recordResult"), "labApi includes recordResult()");
assert(labApiSource.includes("getStats"), "labApi includes getStats()");

// Check Invoices / Billing API methods
const invoiceApiSource = fs.readFileSync(path.join(apiDir, "src", "invoices.ts"), "utf-8");
assert(invoiceApiSource.includes("getAll"), "invoicesApi includes getAll()");
assert(invoiceApiSource.includes("getStats"), "invoicesApi includes getStats()");
assert(invoiceApiSource.includes("collectPayment"), "invoicesApi includes collectPayment()");
assert(invoiceApiSource.includes("createFromConsultation"), "invoicesApi includes createFromConsultation()");
assert(invoiceApiSource.includes("applyDiscount"), "invoicesApi includes applyDiscount()");
assert(invoiceApiSource.includes("refund"), "invoicesApi includes refund()");

// Check Patient API methods
const patientApiSource = fs.readFileSync(path.join(apiDir, "src", "patients.ts"), "utf-8");
assert(patientApiSource.includes("getMyProfile"), "patientsApi includes getMyProfile()");
assert(patientApiSource.includes("getMyPortal"), "patientsApi includes getMyPortal()");

console.log("\n========================================================");
console.log(`  Test Results: ${passedTests} Passed, ${failedTests} Failed (Total ${totalTests})`);
console.log("========================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
