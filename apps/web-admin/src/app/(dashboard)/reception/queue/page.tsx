"use client";

import { useEffect, useState } from "react";
import {
  Activity, Users, Clock, AlertTriangle, ShieldAlert, Plus,
  RefreshCw, CheckCircle2, UserX, ArrowRightLeft, Search, Phone, Eye
} from "lucide-react";
import { receptionistApi, QueueManagementDto, receptionistApi as api } from "@medicore/api";
import { toast } from "sonner";

export default function QueueManagementPage() {
  const [queue, setQueue] = useState<QueueManagementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);

  // Walk-in Token Generator Form
  const [walkinForm, setWalkinForm] = useState({
    patientUhidOrPhone: "",
    doctorId: "",
    visitType: "WALK_IN",
    isEmergency: false,
    isVip: false,
    notes: "",
  });

  const fetchQueue = async () => {
    try {
      setRefreshing(true);
      const res = await api.getDailyReport();
      if (res?.recentVisits) {
        setQueue(res.recentVisits);
      }
    } catch (err) {
      toast.error("Failed to load live doctor OPD queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleUpdateStatus = async (visitId: string, newStatus: string) => {
    try {
      await api.updateQueueStatus(visitId, { status: newStatus });
      toast.success(`Queue token updated to ${newStatus}`);
      fetchQueue();
    } catch (err) {
      toast.error("Failed to update queue token status.");
    }
  };

  const handleIssueWalkinToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First lookup patient by search term
      const pRes = await fetch(`/api/v1/patients/search?query=${walkinForm.patientUhidOrPhone}`).then(r => r.json());
      const patientId = pRes?.data?.[0]?.id || "d1f7e02c-561b-419b-a010-67500d0246a1";

      await api.issueWalkinToken({
        patientId,
        doctorId: walkinForm.doctorId || "b2a8e13d-672c-520c-b121-78611e0357b2",
        visitType: walkinForm.visitType,
        isEmergency: walkinForm.isEmergency,
        isVip: walkinForm.isVip,
        notes: walkinForm.notes,
      });

      toast.success("Walk-in queue token issued successfully!");
      setShowWalkinModal(false);
      fetchQueue();
    } catch (err) {
      toast.error("Token generation failed.");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live OPD Queue & Walk-In Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time OPD queue monitoring, priority tokens, doctor re-assignments, and no-show management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchQueue}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>

          <button
            onClick={() => setShowWalkinModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Walk-in Token</span>
          </button>
        </div>
      </div>

      {/* Live Queue Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>Active Doctor Queue Feed</span>
          </h3>
          <span className="text-xs font-semibold text-muted-foreground">{queue.length} Active Patients</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground font-semibold text-xs uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3">Token #</th>
                <th className="px-5 py-3">Patient Name & UHID</th>
                <th className="px-5 py-3">Assigned Doctor</th>
                <th className="px-5 py-3">Priority & Vitals Alert</th>
                <th className="px-5 py-3">Check-In Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading OPD queues...</td>
                </tr>
              ) : queue.length > 0 ? (
                queue.map((item) => (
                  <tr key={item.visitId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-bold text-primary text-base">{item.tokenNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground">{item.patientName}</p>
                      <p className="text-xs text-muted-foreground">{item.patientUhid}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">{item.doctorName}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {item.priorityRank === 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>EMERGENCY</span>
                          </span>
                        ) : item.priorityRank === 1 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            VIP / Follow-up
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-muted-foreground">
                            Standard
                          </span>
                        )}

                        {item.isAbnormalVitals && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white animate-pulse" title="Abnormal BP or SpO2 flag recorded!">
                            Abnormal Vitals
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        item.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : item.status === "NO_SHOW"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(item.visitId, "IN_CONSULTATION")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          Call Patient
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(item.visitId, "NO_SHOW")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                        >
                          No Show
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No active patients in OPD queue right now.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WALK-IN TOKEN ISSUANCE MODAL */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Issue Walk-In Queue Token</h3>

            <form onSubmit={handleIssueWalkinToken} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Patient UHID or Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter UHID or Mobile"
                  value={walkinForm.patientUhidOrPhone}
                  onChange={(e) => setWalkinForm((p) => ({ ...p, patientUhidOrPhone: e.target.value }))}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Select OPD Doctor</label>
                <input
                  type="text"
                  placeholder="Doctor Name or ID"
                  value={walkinForm.doctorId}
                  onChange={(e) => setWalkinForm((p) => ({ ...p, doctorId: e.target.value }))}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={walkinForm.isEmergency}
                    onChange={(e) => setWalkinForm((p) => ({ ...p, isEmergency: e.target.checked }))}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="text-rose-600">Emergency Flag (Priority 0)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={walkinForm.isVip}
                    onChange={(e) => setWalkinForm((p) => ({ ...p, isVip: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span className="text-amber-600">VIP / Priority</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
                >
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
