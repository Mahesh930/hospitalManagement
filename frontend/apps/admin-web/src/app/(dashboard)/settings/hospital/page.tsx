"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { hospitalsApi, HospitalDto, adminApi, SuperAdminUserDto } from "@medicore/api";
import { toast } from "sonner";
import { Building2, Plus, UserPlus, Users, Shield, Phone, Lock, RefreshCw } from "lucide-react";

export default function HospitalSettingsPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Staff Management states
  const [staffUsers, setStaffUsers] = useState<SuperAdminUserDto[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    username: "", password: "", phone: "", role: "RECEPTIONIST"
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  const fetchStaffUsers = async () => {
    setStaffLoading(true);
    try {
      const users = await adminApi.getStaffUsers();
      setStaffUsers(users || []);
    } catch {
      toast.error("Failed to load hospital staff records");
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffUsers();
  }, []);

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

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.username || !staffForm.password) {
      toast.error("Username and password are required");
      return;
    }

    setCreatingStaff(true);
    try {
      await adminApi.createStaffUser(staffForm);
      toast.success(`Staff user '${staffForm.username}' created successfully as ${staffForm.role}`);
      setStaffForm({ username: "", password: "", phone: "", role: "RECEPTIONIST" });
      setStaffModalOpen(false);
      fetchStaffUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to create staff member");
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hospital Setup &amp; Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage hospital tenant structure, staff accounts, and departments</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-xl">
          <Link href="/settings/hospital" className="px-3.5 py-1.5 bg-card text-foreground font-semibold text-xs rounded-lg shadow-sm">
            Hospital & Staff
          </Link>
          <Link href="/settings/departments" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Departments
          </Link>
        </div>
      </div>

      {/* Staff Management Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Hospital Staff & User Governance
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add new staff members and assign operational roles for your hospital workspace
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStaffUsers}
              className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh Staff"
            >
              <RefreshCw className={`w-4 h-4 ${staffLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setStaffModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md hover:bg-primary/90 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Staff Table */}
        {staffLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Loading staff records...</p>
          </div>
        ) : staffUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm font-medium">No staff members found.</p>
            <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Staff Member&quot; to provision a new user.</p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden border border-border rounded-xl">
            {staffUsers.map((u) => (
              <div key={u.id} className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{u.username}</div>
                    <div className="text-muted-foreground text-[11px] flex items-center gap-2">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone || "No phone"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold text-[11px]">
                    {u.roles || "STAFF"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.locked ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {u.locked ? "LOCKED" : "ACTIVE"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Hospital Provisioning */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Multi-Hospital Branch Provisioning
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

      {/* Add Staff Member Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Add New Staff Member</h3>
              </div>
              <button onClick={() => setStaffModalOpen(false)} className="text-muted-foreground hover:text-foreground font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Role / Function</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="RECEPTIONIST">RECEPTIONIST (Front Desk / Registration)</option>
                  <option value="DOCTOR">DOCTOR (Medical Practitioner)</option>
                  <option value="PHARMACIST">PHARMACIST (Pharmacy Ops)</option>
                  <option value="NURSE">NURSE (Clinical Staff)</option>
                  <option value="CASHIER">CASHIER (Billing & Billing Ops)</option>
                  <option value="LAB_TECH">LAB_TECH (Lab Technician)</option>
                  <option value="ADMIN">ADMIN (Hospital Administrator)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Username / Email *</label>
                <input
                  type="text"
                  required
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  placeholder="e.g. receptionist_city@email.com"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="10-digit phone"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {creatingStaff ? "Creating..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
