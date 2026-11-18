"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { ROLE_STATION_META } from "@/lib/roles";

export default function RoleStationDashboard({ role }: { role: string }) {
  const meta = ROLE_STATION_META[role];
  if (!meta) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Station</h1>
        <p className="text-sm text-muted-foreground">No station metadata for role {role}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            <Shield className="w-3.5 h-3.5" />
            {role.replace(/_/g, " ")}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{meta.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {meta.modules.map((module) => (
          <div key={module} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">{module}</p>
            <p className="text-xs text-muted-foreground mt-1">Available for this HIS station role</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {role === "ACCOUNTANT" || role === "TPA_INSURANCE" ? (
            <Link href="/billing" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">
              Open Billing <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
          {role === "LAB_MANAGER" || role === "RADIOLOGIST" || role === "RADIOLOGY_TECH" || role === "BLOOD_BANK" ? (
            <Link href="/laboratory" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">
              Open Laboratory <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
          {role === "MRD" || role === "PHYSIOTHERAPIST" || role === "QUALITY_OFFICER" || role === "OT_COORDINATOR" ? (
            <Link href="/patients" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">
              Open Patients <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
          {role === "HR_ADMIN" ? (
            <Link href="/settings/hospital" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">
              Staff Settings <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
          {role === "ANESTHETIST" ? (
            <Link href="/doctor/ipd" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">
              Inpatient Ward <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
