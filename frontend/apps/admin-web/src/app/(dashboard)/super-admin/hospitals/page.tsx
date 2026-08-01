"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { superAdminApi, SuperAdminHospitalDto } from "@medicore/api";
import { Building2, Plus, Search, ShieldAlert, CheckCircle, Ban, Users, Stethoscope, BedDouble, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SuperAdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<SuperAdminHospitalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getAllHospitals();
      setHospitals(res.data?.data || []);
    } catch (err) {
      toast.error("Failed to load multi-tenant hospitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleToggleStatus = async (id: string, currentSuspended: boolean) => {
    try {
      await superAdminApi.toggleHospitalStatus(id, !currentSuspended);
      toast.success(currentSuspended ? "Hospital reactivated" : "Hospital suspended");
      fetchHospitals();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (h.city && h.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SaaS Multi-Hospital Directory</h1>
            <p className="text-sm text-muted-foreground mt-1">Platform management, tenant status, and hospital onboarding</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHospitals}
              className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/super-admin/hospitals/onboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Hospital</span>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals by name, registration number, or city..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Hospital List / Cards */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No Hospitals Found</h3>
            <p className="text-sm text-muted-foreground mt-1">Get started by onboarding a new hospital tenant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHospitals.map((h) => (
              <div
                key={h.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {h.registrationNumber}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-1.5 leading-snug">{h.name}</h3>
                      <p className="text-xs text-muted-foreground">{h.city ? `${h.city}, ${h.state || ""}` : h.address}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        h.isSuspended
                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {h.isSuspended ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      <span>{h.isSuspended ? "SUSPENDED" : "ACTIVE"}</span>
                    </span>
                  </div>

                  {/* Quotas */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/60 rounded-xl my-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                        <Users className="w-3 h-3" /> Users
                      </div>
                      <span className="text-sm font-bold text-foreground">{h.maxUsers || 25}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                        <Stethoscope className="w-3 h-3" /> Doctors
                      </div>
                      <span className="text-sm font-bold text-foreground">{h.maxDoctors || 10}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                        <BedDouble className="w-3 h-3" /> Beds
                      </div>
                      <span className="text-sm font-bold text-foreground">{h.maxBeds || 50}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                  <span className="text-xs text-muted-foreground">Category: <strong className="text-foreground">{h.category || "PRIVATE"}</strong></span>
                  <button
                    onClick={() => handleToggleStatus(h.id!, h.isSuspended || false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      h.isSuspended
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"
                    }`}
                  >
                    {h.isSuspended ? "Reactivate" : "Suspend Tenant"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
