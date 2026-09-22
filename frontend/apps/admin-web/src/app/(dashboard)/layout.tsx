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
  HeartPulse, Bed, Pill
} from "lucide-react";

import { superAdminApi, SuperAdminHospitalDto } from "@medicore/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PHARMACIST", "PATIENT"] },
  { label: "Nurse Station", href: "/nurse", icon: HeartPulse, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Wards & Beds", href: "/nurse/beds", icon: Bed, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Medication (eMAR)", href: "/nurse/emar", icon: Pill, roles: ["SUPER_ADMIN", "ADMIN", "NURSE"] },
  { label: "Reception Desk", href: "/reception", icon: Activity, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"] },
  { label: "SaaS Hospitals", href: "/super-admin/hospitals", icon: Building2, roles: ["SUPER_ADMIN"] },
  { label: "User Operations", href: "/super-admin/user-operations", icon: UserCog, roles: ["SUPER_ADMIN"] },
  { label: "Feature Flags", href: "/super-admin/feature-flags", icon: ToggleLeft, roles: ["SUPER_ADMIN"] },
  { label: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard, roles: ["SUPER_ADMIN"] },
  { label: "Patients", href: "/patients", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"] },
  { label: "Appointments", href: "/appointments", icon: CalendarDays, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT"] },
  { label: "OPD Consultation", href: "/opd", icon: Stethoscope, roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] },
  { label: "Billing & Invoices", href: "/billing", icon: Receipt, roles: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST", "BILLING"] },
  { label: "Master Data", href: "/master-data/medicines", icon: Database, roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Audit Logs", href: "/settings/audit-logs", icon: FileSpreadsheet, roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Hospital Settings", href: "/settings/hospital", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN"] },
];

const ROLE_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN: { label: "SUPER ADMIN", className: "bg-purple-600/15 text-purple-700 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-700" },
  ADMIN: { label: "ADMIN", className: "bg-blue-600/15 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-700" },
  DOCTOR: { label: "DOCTOR", className: "bg-emerald-600/15 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-700" },
  NURSE: { label: "NURSE", className: "bg-teal-600/15 text-teal-700 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-700" },
  RECEPTIONIST: { label: "RECEPTION", className: "bg-amber-600/15 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-700" },
  PATIENT: { label: "PATIENT", className: "bg-gray-600/15 text-gray-700 border-gray-300 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-600" },
};

function getPrimaryRoleBadge(roles: string[]) {
  const priority = ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT"];
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
