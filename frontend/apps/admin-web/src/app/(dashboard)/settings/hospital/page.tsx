"use client";

import { useState } from "react";
import Link from "next/link";
import { hospitalsApi, HospitalDto } from "@medicore/api";
import { toast } from "sonner";
import { Building2, Plus } from "lucide-react";

export default function HospitalSettingsPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !registrationNumber) {
      toast.error("All hospital fields are required");
      return;
    }

    setLoading(true);
    try {
      const payload: HospitalDto = { name, address, registrationNumber };
      await hospitalsApi.provision(payload);
      toast.success("Hospital Provisioned Successfully!");
      setName("");
      setAddress("");
      setRegistrationNumber("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Provisioning failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hospital Setup &amp; Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tenant multi-hospital structure and departments</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-xl">
          <Link href="/settings/hospital" className="px-3.5 py-1.5 bg-card text-foreground font-semibold text-xs rounded-lg shadow-sm">
            Hospital
          </Link>
          <Link href="/settings/departments" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Departments
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Multi-Hospital Provisioning (US-100)
        </h2>

        <form onSubmit={handleProvision} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Hospital Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apollo City Hospital, Branch 1"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Full Physical Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Building, Street, City, State, Pincode"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">State / Clinical Registration No. *</label>
            <input
              type="text"
              required
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. REG-MH-2026-9901"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {loading ? "Provisioning..." : "Provision Hospital Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
