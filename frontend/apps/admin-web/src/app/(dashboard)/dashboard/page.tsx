"use client";

import { useEffect, useState } from "react";
import { Users, CalendarDays, Receipt, Activity, Stethoscope, Clock, IndianRupee, Bed, UserCheck } from "lucide-react";
import Link from "next/link";
import { adminApi, HospitalAdminStatsDto } from "@medicore/api";
import { toast } from "sonner";

const quickActions = [
  { label: "Register Patient", href: "/patients/register", icon: Users, desc: "New patient registration" },
  { label: "Book Appointment", href: "/appointments?action=book", icon: CalendarDays, desc: "Schedule a visit" },
  { label: "View Queue", href: "/appointments/queue", icon: Activity, desc: "Live doctor queue" },
  { label: "OPD Console", href: "/opd", icon: Stethoscope, desc: "Active consultations" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<HospitalAdminStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err: unknown) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: "Today's OPD",
      value: loading ? "—" : (stats?.todayOpdPatients ?? 0).toString(),
      icon: Stethoscope,
      color: "from-blue-500 to-blue-600",
      href: "/opd",
    },
    {
      label: "Checked-In",
      value: loading ? "—" : (stats?.checkedInPatients ?? 0).toString(),
      icon: Clock,
      color: "from-emerald-500 to-emerald-600",
      href: "/appointments/queue",
    },
    {
      label: "Revenue Today",
      value: loading ? "—" : `₹${(stats?.totalRevenueToday ?? 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "from-amber-500 to-amber-600",
      href: "/billing",
    },
    {
      label: "Pending Bills",
      value: loading ? "—" : (stats?.pendingBillsCount ?? 0).toString(),
      icon: Receipt,
      color: "from-rose-500 to-rose-600",
      href: "/billing",
    },
    {
      label: "Total Doctors",
      value: loading ? "—" : (stats?.totalDoctors ?? 0).toString(),
      icon: UserCheck,
      color: "from-purple-500 to-purple-600",
      href: "/settings/hospital",
    },
    {
      label: "Total Patients",
      value: loading ? "—" : (stats?.totalPatients ?? 0).toString(),
      icon: Users,
      color: "from-cyan-500 to-cyan-600",
      href: "/patients",
    },
    {
      label: "Bed Occupancy",
      value: loading ? "—" : `${stats?.occupiedBeds ?? 0} / ${stats?.totalBeds ?? 50}`,
      icon: Bed,
      color: "from-indigo-500 to-indigo-600",
      href: "/settings/hospital",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hospital Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time operational, clinical, and financial analytics for your hospital.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Hospital Management Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <action.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
