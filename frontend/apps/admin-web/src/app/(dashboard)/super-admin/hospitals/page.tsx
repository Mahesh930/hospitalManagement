"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { superAdminApi, SuperAdminHospitalDto, SuperAdminUserDto } from "@medicore/api";
import { Building2, Plus, Search, ShieldAlert, CheckCircle, Ban, Users, Stethoscope, BedDouble, RefreshCw, Settings, UserPlus, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SuperAdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<SuperAdminHospitalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [configModal, setConfigModal] = useState<{ open: boolean; hospital: SuperAdminHospitalDto | null }>({
    open: false, hospital: null
  });
  const [activeTab, setActiveTab] = useState<"details" | "provision" | "users">("details");
  const [hospitalUsers, setHospitalUsers] = useState<SuperAdminUserDto[]>([]);
  const [loadingHospitalUsers, setLoadingHospitalUsers] = useState(false);

  // Form states for details update
  const [editForm, setEditForm] = useState<Partial<SuperAdminHospitalDto>>({});
  const [savingDetails, setSavingDetails] = useState(false);

  // Form states for provisioning user
  const [userForm, setUserForm] = useState({
    username: "", password: "", phone: "", role: "ADMIN"
  });
  const [savingUser, setSavingUser] = useState(false);

  const fetchHospitalUsers = async (hospitalId: string) => {
    setLoadingHospitalUsers(true);
    try {
      const res = await superAdminApi.getHospitalUsers(hospitalId);
      setHospitalUsers(res.data?.data?.content || []);
    } catch {
      toast.error("Failed to load users for hospital");
    } finally {
      setLoadingHospitalUsers(false);
    }
  };

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getAllHospitals();
      setHospitals(res.data?.data || []);
    } catch {
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
    } catch {
      toast.error("Status update failed");
    }
  };

  const handleOpenConfig = (hospital: SuperAdminHospitalDto) => {
    setConfigModal({ open: true, hospital });
    setEditForm({
      name: hospital.name,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      email: hospital.email,
      phone: hospital.phone,
      maxUsers: hospital.maxUsers,
      maxDoctors: hospital.maxDoctors,
      maxBeds: hospital.maxBeds,
      category: hospital.category,
    });
    setUserForm({ username: "", password: "", phone: "", role: "ADMIN" });
    setActiveTab("details");
    if (hospital.id) {
      fetchHospitalUsers(hospital.id);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configModal.hospital?.id) return;
    setSavingDetails(true);
    try {
      await superAdminApi.updateHospital(configModal.hospital.id, editForm as SuperAdminHospitalDto);
      toast.success("Hospital configuration updated successfully");
      setConfigModal({ open: false, hospital: null });
      fetchHospitals();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to update hospital configuration");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configModal.hospital?.id) return;
    if (!userForm.username || !userForm.password) {
      toast.error("Username and password are required");
      return;
    }
    setSavingUser(true);
    try {
      await superAdminApi.createHospitalUser(configModal.hospital.id, userForm);
      toast.success(`User '${userForm.username}' provisioned for ${configModal.hospital.name}`);
      setUserForm({ username: "", password: "", phone: "", role: "ADMIN" });
      fetchHospitalUsers(configModal.hospital.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to provision hospital user");
    } finally {
      setSavingUser(false);
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
                <div className="flex items-center justify-between pt-3 border-t border-border mt-2 gap-2">
                  <button
                    onClick={() => handleOpenConfig(h)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Config</span>
                  </button>

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

        {/* Config / Manage Modal */}
        {configModal.open && configModal.hospital && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-foreground">{configModal.hospital.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Registration: {configModal.hospital.registrationNumber}</p>
                </div>
                <button
                  onClick={() => setConfigModal({ open: false, hospital: null })}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1 rounded-lg hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border bg-card px-5">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`py-3 px-4 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "details"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Details & Quotas
                </button>
                <button
                  onClick={() => setActiveTab("provision")}
                  className={`py-3 px-4 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "provision"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Provision Admin / Staff
                </button>
                <button
                  onClick={() => {
                    setActiveTab("users");
                    if (configModal.hospital?.id) fetchHospitalUsers(configModal.hospital.id);
                  }}
                  className={`py-3 px-4 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "users"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Users ({hospitalUsers.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {activeTab === "details" ? (
                  <form onSubmit={handleSaveDetails} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Hospital Name</label>
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                        <input
                          type="text"
                          value={editForm.category || ""}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          placeholder="PRIVATE / GOVERNMENT / TRUST"
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email || ""}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone</label>
                        <input
                          type="text"
                          value={editForm.phone || ""}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">City</label>
                        <input
                          type="text"
                          value={editForm.city || ""}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">State</label>
                        <input
                          type="text"
                          value={editForm.state || ""}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Tenant Capacity Quotas</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Max Users</label>
                          <input
                            type="number"
                            value={editForm.maxUsers || 25}
                            onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm font-bold text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Max Doctors</label>
                          <input
                            type="number"
                            value={editForm.maxDoctors || 10}
                            onChange={(e) => setEditForm({ ...editForm, maxDoctors: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm font-bold text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Max Beds</label>
                          <input
                            type="number"
                            value={editForm.maxBeds || 50}
                            onChange={(e) => setEditForm({ ...editForm, maxBeds: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm font-bold text-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setConfigModal({ open: false, hospital: null })}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingDetails}
                        className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                      >
                        {savingDetails ? "Saving..." : "Save Configuration"}
                      </button>
                    </div>
                  </form>
                ) : activeTab === "provision" ? (
                  <form onSubmit={handleProvisionUser} className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Provision new Admin or Staff user credentials assigned directly to <strong>{configModal.hospital.name}</strong>.
                    </p>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Role Assignment</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                      >
                        <option value="ADMIN">ADMIN (Hospital Administrator)</option>
                        <option value="DOCTOR">DOCTOR (Medical Practitioner)</option>
                        <option value="RECEPTIONIST">RECEPTIONIST (Front Desk)</option>
                        <option value="PHARMACIST">PHARMACIST (Pharmacy Ops)</option>
                        <option value="NURSE">NURSE (Clinical Staff)</option>
                        <option value="CASHIER">CASHIER (Billing & Cash)</option>
                        <option value="LAB_TECH">LAB_TECH (Lab Technician)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Username / Email</label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        placeholder="e.g. admin_apollo@email.com"
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Initial Password</label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone Number (Optional)</label>
                      <input
                        type="text"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setConfigModal({ open: false, hospital: null })}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingUser}
                        className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        {savingUser ? "Provisioning..." : "Provision User"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Registered staff &amp; users assigned to <strong>{configModal.hospital.name}</strong>:
                      </p>
                      <button
                        onClick={() => configModal.hospital?.id && fetchHospitalUsers(configModal.hospital.id)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Refresh Users"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingHospitalUsers ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {loadingHospitalUsers ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs font-medium">Loading hospital users...</p>
                      </div>
                    ) : hospitalUsers.length === 0 ? (
                      <div className="p-8 text-center border border-border rounded-xl bg-muted/20">
                        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">No Users Provisioned</p>
                        <p className="text-xs text-muted-foreground mt-1">Switch to &apos;Provision Admin / Staff&apos; tab to add users for this hospital.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                        {hospitalUsers.map((u) => (
                          <div key={u.id} className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 text-xs">
                            <div>
                              <div className="font-semibold text-foreground text-sm">{u.username}</div>
                              <div className="text-muted-foreground text-[11px]">{u.phone || "No phone registered"}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-mono font-bold text-[11px]">
                                {u.roles || "USER"}
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
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
