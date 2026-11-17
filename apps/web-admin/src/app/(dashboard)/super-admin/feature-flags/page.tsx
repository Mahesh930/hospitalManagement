"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { superAdminApi, SuperAdminHospitalDto, FeatureFlagDto } from "@medicore/api";
import { ToggleLeft, ToggleRight, Building2, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const MODULES = [
  { code: "PHARMACY", name: "Pharmacy & Inventory Module", desc: "Drug dispensaries, stock management, auto-reordering" },
  { label: "RADIOLOGY", code: "RADIOLOGY", name: "Radiology & Imaging (PACS)", desc: "DICOM integration, X-Ray & MRI reporting" },
  { code: "ICU", name: "ICU & Critical Care Module", desc: "Live vitals telemetry, ICU bed allocation, ventilator logs" },
  { code: "HR_PAYROLL", name: "HR & Staff Payroll", desc: "Staff attendance, salary slips, roster planning" },
  { code: "ABDM", name: "ABDM / ABHA Ayushman Integration", desc: "National Digital Health Mission connector & ABHA ID creation" },
];

export default function FeatureFlagsPage() {
  const [hospitals, setHospitals] = useState<SuperAdminHospitalDto[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async () => {
    try {
      const res = await superAdminApi.getAllHospitals();
      const list = res.data?.data || [];
      setHospitals(list);
      if (list.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(list[0].id!);
      }
    } catch (err) {
      toast.error("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  const fetchFlags = async (hospId: string) => {
    if (!hospId) return;
    try {
      const res = await superAdminApi.getHospitalFeatureFlags(hospId);
      const map: Record<string, boolean> = {};
      (res.data?.data || []).forEach((f) => {
        map[f.moduleCode] = f.enabled;
      });
      setFlags(map);
    } catch (err) {
      toast.error("Failed to fetch feature flags");
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospitalId) {
      fetchFlags(selectedHospitalId);
    }
  }, [selectedHospitalId]);

  const handleToggle = async (moduleCode: string, currentEnabled: boolean) => {
    if (!selectedHospitalId) return;
    try {
      await superAdminApi.toggleFeatureFlag(selectedHospitalId, moduleCode, !currentEnabled);
      setFlags((prev) => ({ ...prev, [moduleCode]: !currentEnabled }));
      toast.success(`${moduleCode} module ${!currentEnabled ? "ENABLED" : "DISABLED"} for tenant`);
    } catch (err) {
      toast.error("Failed to toggle feature flag");
    }
  };

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Per-Tenant Feature Flag Control</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Enable or disable specific system modules dynamically for hospital tenants</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-300 dark:border-purple-700 rounded-xl text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>SUPER ADMIN OVERRIDE</span>
          </div>
        </div>

        {/* Tenant Selector */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Select Hospital Tenant:
          </label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-background border border-input rounded-xl text-foreground font-medium text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.registrationNumber}) — {h.city || "Main Branch"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Module Flags Matrix */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">
            Module Entitlements Matrix
          </h3>

          <div className="divide-y divide-border">
            {MODULES.map((m) => {
              const isEnabled = flags[m.code] ?? true;
              return (
                <div key={m.code} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{m.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {m.code}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>

                  <button
                    onClick={() => handleToggle(m.code, isEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isEnabled
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                    }`}
                  >
                    {isEnabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    <span>{isEnabled ? "ENABLED" : "DISABLED"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
