"use client";

import { useEffect, useState } from "react";
import {
  pharmacyApi,
  PharmacyShiftHandoverDto
} from "@medicore/api";
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function PharmacyHandoverPage() {
  const [handovers, setHandovers] = useState<PharmacyShiftHandoverDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<PharmacyShiftHandoverDto>({
    shiftName: "Morning",
    handoverDate: new Date().toISOString().split("T")[0],
    incomingPharmacist: "David Wilson (Evening Lead)",
    criticalAlerts: "Awaiting supplier delivery for Paracetamol 650mg. 2 urgent pediatric prescriptions pending verification.",
    notes: "Narcotics locker count verified and keys handed over. Daily cash collection reconciled.",
  });

  const loadHandovers = async () => {
    try {
      setLoading(true);
      const res = await pharmacyApi.getShiftHandovers();
      setHandovers(res.data.data);
    } catch (err: unknown) {
      console.error("Failed to load shift handovers", err);
      toast.error("Could not load pharmacy shift handovers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandovers();
  }, []);

  const handleRecordHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pharmacyApi.recordShiftHandover(form);
      toast.success("Pharmacy shift handover recorded successfully");
      setModalOpen(false);
      loadHandovers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record handover");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pharmacy Shift Handover</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Operational Continuity
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Maintain structured handovers between morning, evening, and night shifts covering pending scripts, critical alerts, and stock notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadHandovers}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition border border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Shift Handover
          </button>
        </div>
      </div>

      {/* Handover List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">Date & Shift</th>
                <th className="py-3 px-4 font-semibold">Outgoing Pharmacist</th>
                <th className="py-3 px-4 font-semibold">Incoming Pharmacist</th>
                <th className="py-3 px-4 font-semibold">Pending Rx</th>
                <th className="py-3 px-4 font-semibold">Low Stock Alerts</th>
                <th className="py-3 px-4 font-semibold">Critical Alerts</th>
                <th className="py-3 px-4 font-semibold">Operational Notes</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading shift handovers...
                  </td>
                </tr>
              ) : handovers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No shift handover reports recorded yet.
                  </td>
                </tr>
              ) : (
                handovers.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/30 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{h.shiftName} Shift</p>
                      <p className="text-[11px] text-muted-foreground">{h.handoverDate}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{h.outgoingPharmacist}</td>
                    <td className="py-3 px-4 text-muted-foreground">{h.incomingPharmacist}</td>
                    <td className="py-3 px-4 font-bold">{h.pendingPrescriptionsCount} pending</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20">
                        {h.lowStockItemsCount} items
                      </span>
                    </td>
                    <td className="py-3 px-4 text-rose-500 font-medium max-w-xs truncate" title={h.criticalAlerts}>
                      {h.criticalAlerts || "None"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate" title={h.notes}>
                      {h.notes}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Record Shift Handover Report</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordHandover} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Shift Name *</label>
                  <select
                    value={form.shiftName}
                    onChange={(e) => setForm({ ...form, shiftName: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  >
                    <option value="Morning">Morning Shift (08:00 - 16:00)</option>
                    <option value="Evening">Evening Shift (16:00 - 00:00)</option>
                    <option value="Night">Night Shift (00:00 - 08:00)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Handover Date *</label>
                  <input
                    type="date"
                    required
                    value={form.handoverDate}
                    onChange={(e) => setForm({ ...form, handoverDate: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Incoming Pharmacist Name *</label>
                <input
                  type="text"
                  required
                  value={form.incomingPharmacist}
                  onChange={(e) => setForm({ ...form, incomingPharmacist: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Critical Alerts & Escalations</label>
                <textarea
                  rows={2}
                  value={form.criticalAlerts}
                  onChange={(e) => setForm({ ...form, criticalAlerts: e.target.value })}
                  placeholder="e.g. Critical stock alerts, delayed supplier deliveries, doctor inquiries..."
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">General Operations & Cash Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Cash drawer balanced, cold-chain temperature logged..."
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Save Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
