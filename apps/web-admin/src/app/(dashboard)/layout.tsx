"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import Link from "next/link";
import {
  Activity, LayoutDashboard, Users, CalendarDays, Stethoscope,
  Receipt, Database, Settings, LogOut, ChevronLeft, Menu, Shield,
  FileSpreadsheet, Sun, Moon, Building2, ToggleLeft, CreditCard, UserCog,
  HeartPulse, Bed, Pill, Droplets, BellRing, ClipboardCheck,
  FlaskConical, UserCheck, Package, ShoppingCart, RefreshCw, AlertTriangle, ShieldAlert, Undo2,
  TestTube2, Banknote
} from "lucide-react";

import { superAdminApi, SuperAdminHospitalDto } from "@medicore/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const ALL_STAFF_ROLES = [
  "SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PHARMACIST", "CASHIER", "LAB_TECH",
  "ACCOUNTANT", "TPA_INSURANCE", "MRD", "LAB_MANAGER", "RADIOLOGIST", "RADIOLOGY_TECH",
  "BLOOD_BANK", "OT_COORDINATOR", "ANESTHETIST", "PHYSIOTHERAPIST", "HR_ADMIN", "QUALITY_OFFICER", "PATIENT",
];

const allNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL_STAFF_ROLES },
  { label: "Role Catalog", href: "/stations", icon: Shield, roles: ["SUPER_ADMIN", "ADMIN", "HR_ADMIN"] },
  { label: "Pharmacy Station", href: "/pharmacy", icon: Pill, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Dispensing Queue", href: "/pharmacy/queue", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Stock & Batches", href: "/pharmacy/inventory", icon: Package, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Purchase Orders", href: "/pharmacy/purchases", icon: ShoppingCart, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Returns & Wastage", href: "/pharmacy/returns", icon: Undo2, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Expiry & Recalls", href: "/pharmacy/expiry", icon: AlertTriangle, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Pharmacy Handover", href: "/pharmacy/handover", icon: FileSpreadsheet, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Pharmacy Reports", href: "/pharmacy/reports", icon: Database, roles: ["SUPER_ADMIN", "ADMIN", "PHARMACIST"] },
  { label: "Laboratory Station", href: "/laboratory", icon: FlaskConical, roles: ["SUPER_ADMIN", "ADMIN", "LAB_TECH", "LAB_MANAGER"] },
  { label: "Lab Manager", href: "/stations/lab-manager", icon: TestTube2, roles: ["SUPER_ADMIN", "ADMIN", "LAB_MANAGER"] },
  { label: "Radiologist", href: "/stations/radiologist", icon: Activity, roles: ["SUPER_ADMIN", "ADMIN", "RADIOLOGIST"] },
  { label: "Radiology Tech", href: "/stations/radiology-tech", icon: FlaskConical, roles: ["SUPER_ADMIN", "ADMIN", "RADIOLOGY_TECH"] },
  { label: "Blood Bank", href: "/stations/blood-bank", icon: Droplets, roles: ["SUPER_ADMIN", "ADMIN", "BLOOD_BANK"] },
  { label: "Nurse Station", href: "/nurse", icon: HeartPulse, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Wards & Beds", href: "/nurse/beds", icon: Bed, roles: ["SUPER_ADMIN", "ADMIN", "NURSE", "OT_COORDINATOR"] },
  { label: "Medication (eMAR)", href: "/nurse/emar", icon: Pill, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Fluid Balance (I/O)", href: "/nurse/fluid-balance", icon: Droplets, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Tasks & Escalation", href: "/nurse/tasks", icon: BellRing, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Clinical Assessments", href: "/nurse/assessments", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Shift Handover", href: "/nurse/handover", icon: FileSpreadsheet, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Reception Desk", href: "/reception", icon: Activity, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { label: "Queue & Tokens", href: "/reception/queue", icon: BellRing, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { label: "Patient Registration", href: "/reception/registration", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { label: "Front-Desk Coordination", href: "/reception/coordination", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { label: "Front-Desk Handover", href: "/reception/handover", icon: FileSpreadsheet, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { label: "Reception Reports", href: "/reception/reports", icon: Database, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { label: "Accounts Station", href: "/stations/accountant", icon: Banknote, roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { label: "TPA / Insurance", href: "/stations/tpa-insurance", icon: CreditCard, roles: ["SUPER_ADMIN", "ADMIN", "TPA_INSURANCE"] },
  { label: "MRD / Records", href: "/stations/mrd", icon: FileSpreadsheet, roles: ["SUPER_ADMIN", "ADMIN", "MRD"] },
  { label: "OT Coordinator", href: "/stations/ot-coordinator", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "ADMIN", "OT_COORDINATOR"] },
  { label: "Anesthetist", href: "/stations/anesthetist", icon: Stethoscope, roles: ["SUPER_ADMIN", "ADMIN", "ANESTHETIST"] },
  { label: "Physiotherapy", href: "/stations/physiotherapist", icon: HeartPulse, roles: ["SUPER_ADMIN", "ADMIN", "PHYSIOTHERAPIST"] },
  { label: "HR Admin", href: "/stations/hr-admin", icon: UserCog, roles: ["SUPER_ADMIN", "ADMIN", "HR_ADMIN"] },
  { label: "Quality / NABH", href: "/stations/quality", icon: ShieldAlert, roles: ["SUPER_ADMIN", "ADMIN", "QUALITY_OFFICER"] },
  { label: "SaaS Hospitals", href: "/super-admin/hospitals", icon: Building2, roles: ["SUPER_ADMIN"] },
  { label: "User Operations", href: "/super-admin/user-operations", icon: UserCog, roles: ["SUPER_ADMIN"] },
  { label: "Feature Flags", href: "/super-admin/feature-flags", icon: ToggleLeft, roles: ["SUPER_ADMIN"] },
  { label: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard, roles: ["SUPER_ADMIN"] },
  { label: "Patients", href: "/patients", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "MRD", "PHYSIOTHERAPIST", "OT_COORDINATOR", "QUALITY_OFFICER"] },
  { label: "Appointments", href: "/appointments", icon: CalendarDays, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT", "PHYSIOTHERAPIST", "OT_COORDINATOR"] },
  { label: "Doctor Queue & OPD", href: "/opd", icon: Stethoscope, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] },
  { label: "Inpatient Ward Rounds", href: "/doctor/ipd", icon: Bed, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "ANESTHETIST"] },
  { label: "Lab & Radiology Orders", href: "/doctor/investigations", icon: FlaskConical, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RADIOLOGIST"] },
  { label: "Doctor Profile", href: "/doctor/profile", icon: UserCheck, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] },
  { label: "Billing & Invoices", href: "/billing", icon: Receipt, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST", "CASHIER", "ACCOUNTANT", "TPA_INSURANCE"] },
  { label: "Master Data", href: "/master-data/medicines", icon: Database, roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Audit Logs", href: "/settings/audit-logs", icon: FileSpreadsheet, roles: ["SUPER_ADMIN", "ADMIN", "QUALITY_OFFICER"] },
  { label: "Hospital Settings", href: "/settings/hospital", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN", "HR_ADMIN"] },
];

const ROLE_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN: { label: "SUPER ADMIN", className: "bg-purple-600/15 text-purple-700 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-700" },
  ADMIN: { label: "ADMIN", className: "bg-blue-600/15 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-700" },
  DOCTOR: { label: "DOCTOR", className: "bg-emerald-600/15 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-700" },
  NURSE: { label: "NURSE", className: "bg-teal-600/15 text-teal-700 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-700" },
  PHARMACIST: { label: "PHARMACY", className: "bg-indigo-600/15 text-indigo-700 border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-700" },
  LAB_TECH: { label: "LAB TECH", className: "bg-cyan-600/15 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-700" },
  LAB_MANAGER: { label: "LAB MGR", className: "bg-cyan-700/15 text-cyan-800 border-cyan-400 dark:bg-cyan-600/15 dark:text-cyan-200 dark:border-cyan-600" },
  RADIOLOGIST: { label: "RADIOLOGY", className: "bg-sky-600/15 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-700" },
  RADIOLOGY_TECH: { label: "RAD TECH", className: "bg-sky-500/15 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-700" },
  BLOOD_BANK: { label: "BLOOD BANK", className: "bg-rose-600/15 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-700" },
  CASHIER: { label: "CASHIER", className: "bg-emerald-600/15 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-700" },
  ACCOUNTANT: { label: "ACCOUNTS", className: "bg-lime-600/15 text-lime-700 border-lime-300 dark:bg-lime-500/15 dark:text-lime-300 dark:border-lime-700" },
  TPA_INSURANCE: { label: "TPA", className: "bg-orange-600/15 text-orange-700 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-700" },
  MRD: { label: "MRD", className: "bg-stone-600/15 text-stone-700 border-stone-300 dark:bg-stone-500/15 dark:text-stone-300 dark:border-stone-600" },
  OT_COORDINATOR: { label: "OT COORD", className: "bg-violet-600/15 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-700" },
  ANESTHETIST: { label: "ANESTHESIA", className: "bg-fuchsia-600/15 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-700" },
  PHYSIOTHERAPIST: { label: "PHYSIO", className: "bg-green-600/15 text-green-700 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-700" },
  HR_ADMIN: { label: "HR", className: "bg-blue-500/15 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-700" },
  QUALITY_OFFICER: { label: "QUALITY", className: "bg-yellow-600/15 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-700" },
  RECEPTIONIST: { label: "RECEPTION", className: "bg-amber-600/15 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-700" },
  PATIENT: { label: "PATIENT", className: "bg-gray-600/15 text-gray-700 border-gray-300 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-600" },
};

function getPrimaryRoleBadge(roles: string[]) {
  const priority = [
    "SUPER_ADMIN", "ADMIN", "DOCTOR", "ANESTHETIST", "RADIOLOGIST", "NURSE", "PHARMACIST",
    "LAB_MANAGER", "LAB_TECH", "RADIOLOGY_TECH", "BLOOD_BANK", "ACCOUNTANT", "CASHIER",
    "TPA_INSURANCE", "MRD", "OT_COORDINATOR", "PHYSIOTHERAPIST", "HR_ADMIN", "QUALITY_OFFICER",
    "RECEPTIONIST", "PATIENT",
  ];
  for (const role of priority) {
    if (roles.includes(role)) return ROLE_BADGE_STYLES[role] ?? ROLE_BADGE_STYLES.PATIENT;
  }
  return ROLE_BADGE_STYLES.PATIENT;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, username, roles, selectedHospitalId, setSelectedHospitalId, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hospitals, setHospitals] = useState<SuperAdminHospitalDto[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) router.push("/login");
  }, [mounted, token, router]);

  useEffect(() => {
    if (mounted && token && roles.includes("SUPER_ADMIN")) {
      superAdminApi.getAllHospitals()
        .then((res) => {
          setHospitals(res.data?.data || []);
        })
        .catch(() => {});
    }
  }, [mounted, token, roles]);

  if (!mounted || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const allowedNavItems = allNavItems.filter((item) =>
    item.roles.some((role) => roles.includes(role))
  );

  const badge = getPrimaryRoleBadge(roles);

  return (
    <div className="flex h-screen overflow-hidden font-sans antialiased bg-background text-foreground">
      {/* ───────── Sidebar (always dark themed) ───────── */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 ease-in-out shrink-0 select-none border-r border-sidebar-border`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[15px] tracking-tight text-sidebar-foreground leading-tight">MediCore</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-muted font-semibold">Hospital ERP</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
          >
            {collapsed ? <Menu className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ───────── Main Content ───────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <h2 className="text-base font-semibold text-foreground capitalize tracking-tight">
            {pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard"}
          </h2>

          <div className="flex items-center gap-3">
            {/* Global Hospital Context Switcher for Super Admin */}
            {roles.includes("SUPER_ADMIN") && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-xs font-medium">
                <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="text-muted-foreground font-semibold shrink-0">Context:</span>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer text-xs max-w-[220px] truncate"
                >
                  <option value="ALL" className="bg-card text-foreground font-medium">🏢 All Hospitals (Global View)</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id} className="bg-card text-foreground font-medium">
                      🏥 {h.name} ({h.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wider ${badge.className}`}>
              <Shield className="w-3 h-3" />
              <span>{badge.label}</span>
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="h-5 w-px bg-border" />

            {/* User Info & Sign Out */}
            <span className="text-sm font-medium text-foreground">{username || "User"}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
