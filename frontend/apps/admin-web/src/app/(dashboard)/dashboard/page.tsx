"use client";

import { Users, CalendarDays, Receipt, Activity, Stethoscope, Clock, TrendingUp, IndianRupee } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Today's OPD", value: "—", icon: Stethoscope, color: "from-blue-500 to-blue-600", href: "/opd" },
  { label: "Checked-In", value: "—", icon: Clock, color: "from-emerald-500 to-emerald-600", href: "/appointments/queue" },
  { label: "Revenue Today", value: "—", icon: IndianRupee, color: "from-amber-500 to-amber-600", href: "/billing" },
  { label: "Pending Bills", value: "—", icon: Receipt, color: "from-rose-500 to-rose-600", href: "/billing" },
];

const quickActions = [
  { label: "Register Patient", href: "/patients/register", icon: Users, desc: "New patient registration" },
  { label: "Book Appointment", href: "/appointments?action=book", icon: CalendarDays, desc: "Schedule a visit" },
  { label: "View Queue", href: "/appointments/queue", icon: Activity, desc: "Live doctor queue" },
  { label: "OPD Console", href: "/opd", icon: Stethoscope, desc: "Active consultations" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to MediCore ERP. Overview of today&apos;s operations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>vs. yesterday</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
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

      {/* Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">Connect to backend to see live data</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Doctor Queue</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">Connect to backend to see live data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
