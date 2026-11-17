"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { superAdminApi, SuperAdminUserDto, SuperAdminHospitalDto } from "@medicore/api";
import {
  Users, Search, ShieldOff, ShieldCheck, Key, Trash2, RotateCcw,
  Building2, Lock, Unlock, RefreshCw, AlertTriangle, Filter
} from "lucide-react";
import { toast } from "sonner";

export default function UserOperationsPage() {
  const [users, setUsers] = useState<SuperAdminUserDto[]>([]);
  const [hospitals, setHospitals] = useState<SuperAdminHospitalDto[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetModal, setResetModal] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: "", username: ""
  });
  const [newPassword, setNewPassword] = useState("");

  const fetchHospitals = async () => {
    try {
      const res = await superAdminApi.getAllHospitals();
      setHospitals(res.data?.data || []);
    } catch {
      // Ignore background hospital fetch error
    }
  };

  const fetchUsers = async (q = search, hospId = selectedHospital) => {
    setLoading(true);
    try {
      const res = await superAdminApi.searchUsers(q, hospId, 0, 50);
      setUsers(res.data?.data?.content || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search, selectedHospital), 300);
    return () => clearTimeout(timer);
  }, [search, selectedHospital]);

  const handleLock = async (id: string, isLocked: boolean) => {
    try {
      if (isLocked) {
        await superAdminApi.unlockUser(id);
        toast.success("User account unlocked");
      } else {
        await superAdminApi.lockUser(id);
        toast.success("User account locked");
      }
      fetchUsers(search);
    } catch {
      toast.error("Failed to update user lock status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await superAdminApi.deleteUser(id);
      toast.success("User soft-deleted");
      fetchUsers(search);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await superAdminApi.resetPassword(resetModal.userId, newPassword);
      toast.success(`Password reset for ${resetModal.username}`);
      setResetModal({ open: false, userId: "", username: "" });
      setNewPassword("");
    } catch {
      toast.error("Failed to reset password");
    }
  };

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cross-Tenant User Operations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search, lock, unlock, reset passwords, and manage users across all hospital tenants
            </p>
          </div>
          <button
            onClick={() => fetchUsers(search)}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors self-start"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search & Hospital Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by username or phone... (debounced 300ms)"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative sm:w-72">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="">All Hospitals (System-Wide)</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.registrationNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[250px]">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No Users Found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try searching with a different username or phone number.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role(s)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hospital</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.phone || "No phone"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold font-mono">
                          {u.roles || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{u.hospitalName || "Platform"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.locked
                            ? "bg-destructive/15 text-destructive border border-destructive/30"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {u.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {u.locked ? "LOCKED" : "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Lock / Unlock */}
                          <button
                            onClick={() => handleLock(u.id, u.locked)}
                            title={u.locked ? "Unlock User" : "Lock User"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.locked
                                ? "text-emerald-600 hover:bg-emerald-500/10"
                                : "text-amber-600 hover:bg-amber-500/10"
                            }`}
                          >
                            {u.locked ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => setResetModal({ open: true, userId: u.id, username: u.username })}
                            title="Reset Password"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Soft Delete */}
                          <button
                            onClick={() => handleDelete(u.id)}
                            title="Soft Delete User"
                            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetModal.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Reset Password</h3>
                  <p className="text-xs text-muted-foreground">Resetting for: <strong>{resetModal.username}</strong></p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => { setResetModal({ open: false, userId: "", username: "" }); setNewPassword(""); }}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
