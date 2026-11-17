"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { superAdminApi, SuperAdminHospitalDto } from "@medicore/api";
import { Building2, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function OnboardHospitalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SuperAdminHospitalDto>({
    name: "",
    registrationNumber: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    gstNumber: "",
    licenseNumber: "",
    category: "PRIVATE",
    ownershipType: "CORPORATE",
    email: "",
    phone: "",
    emergencyNumber: "",
    website: "",
    maxUsers: 25,
    maxDoctors: 10,
    maxBeds: 50,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.startsWith("max") ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.registrationNumber) {
      toast.error("Hospital Name and Registration Number are required");
      return;
    }

    setLoading(true);
    try {
      await superAdminApi.onboardHospital(formData);
      toast.success("Hospital onboarded and workspace provisioned successfully!");
      router.push("/super-admin/hospitals");
    } catch (err) {
      toast.error("Failed to onboard hospital. Check registration number uniqueness.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/hospitals"
            className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Onboard New Hospital Tenant</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Provision a new multi-tenant hospital workspace & default admin account</p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Building2 className="w-4 h-4 text-primary" />
              1. Basic Hospital Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Apollo Super Speciality Hospital"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. REG-HOSP-2026-904"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Medical License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="e.g. LIC-MED-88390"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="PRIVATE">Private Hospital</option>
                  <option value="GOVT">Government Hospital</option>
                  <option value="TRUST">Trust / Charitable</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Ownership Type
                </label>
                <select
                  name="ownershipType"
                  value={formData.ownershipType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="CORPORATE">Corporate Chain</option>
                  <option value="INDIVIDUAL">Individual Owner</option>
                  <option value="PARTNERSHIP">Partnership</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              2. Contact & Address Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, building, suite"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="e.g. 400001"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Official Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@hospital.com"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Emergency Line
                </label>
                <input
                  type="text"
                  name="emergencyNumber"
                  value={formData.emergencyNumber}
                  onChange={handleChange}
                  placeholder="108 / Ambulance hotline"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Section 3: SaaS License Capacity Quotas */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              3. SaaS License Capacity Quotas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Max Users Quota
                </label>
                <input
                  type="number"
                  name="maxUsers"
                  value={formData.maxUsers}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Max Doctors Quota
                </label>
                <input
                  type="number"
                  name="maxDoctors"
                  value={formData.maxDoctors}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Max Beds Quota
                </label>
                <input
                  type="number"
                  name="maxBeds"
                  value={formData.maxBeds}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Link
              href="/super-admin/hospitals"
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? "Provisioning..." : "Onboard & Provision Workspace"}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
