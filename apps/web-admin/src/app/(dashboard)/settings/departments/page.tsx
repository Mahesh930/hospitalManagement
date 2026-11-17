"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";

export default function DepartmentsSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hospital Setup &amp; Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tenant multi-hospital structure and departments</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-xl">
          <Link href="/settings/hospital" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Hospital
          </Link>
          <Link href="/settings/departments" className="px-3.5 py-1.5 bg-card text-foreground font-semibold text-xs rounded-lg shadow-sm">
            Departments
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4 shadow-sm">
        <Building2 className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">Department Configuration</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cardiology, Orthopedics, Pediatrics, OPD Clinics &amp; Emergency Wing management.
        </p>
      </div>
    </div>
  );
}
