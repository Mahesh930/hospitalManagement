"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import RoleStationDashboard from "@/components/dashboard/RoleStationDashboard";
import { RoleGuard } from "@/components/RoleGuard";
import { ROLE_STATION_META } from "@/lib/roles";

const SLUG_TO_ROLE: Record<string, string> = {
  accountant: "ACCOUNTANT",
  "tpa-insurance": "TPA_INSURANCE",
  mrd: "MRD",
  "lab-manager": "LAB_MANAGER",
  radiologist: "RADIOLOGIST",
  "radiology-tech": "RADIOLOGY_TECH",
  "blood-bank": "BLOOD_BANK",
  "ot-coordinator": "OT_COORDINATOR",
  anesthetist: "ANESTHETIST",
  physiotherapist: "PHYSIOTHERAPIST",
  "hr-admin": "HR_ADMIN",
  quality: "QUALITY_OFFICER",
};

export default function StationRolePage() {
  const params = useParams();
  const slug = String(params.role || "");
  const role = useMemo(() => SLUG_TO_ROLE[slug] || slug.toUpperCase().replace(/-/g, "_"), [slug]);

  if (!ROLE_STATION_META[role]) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-foreground">Unknown station</h1>
        <p className="text-sm text-muted-foreground">No station configured for “{slug}”.</p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN", role]}>
      <RoleStationDashboard role={role} />
    </RoleGuard>
  );
}
