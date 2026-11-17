"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet, Plus, Calendar, Clock, DollarSign, Users,
  ShieldAlert, CheckCircle2, Search, ArrowRight, UserCheck, RefreshCw, X
} from "lucide-react";
import { receptionistApi, ReceptionShiftHandoverDto } from "@medicore/api";
import { toast } from "sonner";

export default function ReceptionShiftHandoverPage() {
  const [handovers, setHandovers] = useState<ReceptionShiftHandoverDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ReceptionShiftHandoverDto>({
    shiftType: "MORNING",
    incomingStaff: "",
    cashCollected: 0,
    totalTokensIssued: 0,
    totalWalkinsHandled: 0,
    totalEmergenciesHandled: 0,
    pendingAppointmentsSummary: "",
    handoverNotes: "",
  });

  const loadHandovers = async () => {
    try {
      setLoading(true);
      const data = await receptionistApi.getShiftHandovers(selectedDate || undefined);
      setHandovers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error("Failed to load front-desk shift handovers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandovers();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.incomingStaff?.trim()) {
      toast.error("Incoming staff member is required");
      return;
    }
    if (!formData.handoverNotes?.trim()) {
      toast.error("Handover notes are required for front-desk continuity");
      return;
    }

    try {
      setSaving(true);
      await receptionistApi.createShiftHandover(formData);
      toast.success("Shift handover registered successfully");
      setModalOpen(false);
      setFormData({
        shiftType: "EVENING",
        incomingStaff: "",
        cashCollected: 0,
        totalTokensIssued: 0,
        totalWalkinsHandled: 0,
        totalEmergenciesHandled: 0,
        pendingAppointmentsSummary: "",
        handoverNotes: "",
      });
      loadHandovers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record shift handover");
    } finally {
      setSaving(false);
    }
  };

  const filteredHandovers = handovers.filter((h) => {
    const q = searchFilter.toLowerCase();
    return (
      (h.incomingStaff || "").toLowerCase().includes(q) ||
      (h.outgoingStaff || "").toLowerCase().includes(q) ||
      (h.shiftType || "").toLowerCase().includes(q) ||
      (h.handoverNotes || "").toLowerCase().includes(q)
    );
  });

  const totalCash = handovers.reduce((sum, h) => sum + (h.cashCollected || 0), 0);
  const totalWalkins = handovers.reduce((sum, h) => sum + (h.totalWalkinsHandled || 0), 0);
  const totalEmergencies = handovers.reduce((sum, h) => sum + (h.totalEmergenciesHandled || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Front-Desk Shift Handover</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Shift Operations
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Seamless operational handover between receptionists, cash reconciliation tally, token counts, and pending task coordination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadHandovers}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Shift Handover</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Handovers Recorded</p>
            <p className="text-2xl font-bold text-foreground mt-1">{handovers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Cash Collected Total</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCash.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Walk-ins Handled</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalWalkins}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Emergencies Processed</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{totalEmergencies}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by staff, shift, notes..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Filter Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="text-xs text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table of Handovers */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4">Shift & Date</th>
                <th className="py-3.5 px-4">Outgoing Staff</th>
                <th className="py-3.5 px-4">Incoming Staff</th>
                <th className="py-3.5 px-4">Cash Tally</th>
                <th className="py-3.5 px-4">Tokens / Walk-ins</th>
                <th className="py-3.5 px-4">Handover Notes</th>
                <th className="py-3.5 px-4">Pending Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading shift handovers...
                  </td>
                </tr>
              ) : filteredHandovers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-foreground">No shift handovers logged yet</p>
                    <p className="text-xs mt-1">Click "New Shift Handover" to record the front-desk transition.</p>
                  </td>
                </tr>
              ) : (
                filteredHandovers.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                          item.shiftType === "MORNING"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : item.shiftType === "EVENING"
                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                        }`}>
                          {item.shiftType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.shiftDate || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-")}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-foreground">{item.outgoingStaff || "Front-Desk Staff"}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.incomingStaff}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-emerald-600">
                      ₹{item.cashCollected?.toLocaleString() ?? "0"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-xs">
                        <p><span className="text-muted-foreground">Tokens:</span> <span className="font-semibold text-foreground">{item.totalTokensIssued ?? 0}</span></p>
                        <p><span className="text-muted-foreground">Walk-ins:</span> <span className="font-semibold text-foreground">{item.totalWalkinsHandled ?? 0}</span></p>
                        {item.totalEmergenciesHandled ? (
                          <p><span className="text-rose-600 font-semibold">Emergencies:</span> <span className="font-bold text-rose-600">{item.totalEmergenciesHandled}</span></p>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-foreground line-clamp-2" title={item.handoverNotes}>
                        {item.handoverNotes}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-muted-foreground line-clamp-2" title={item.pendingAppointmentsSummary}>
                        {item.pendingAppointmentsSummary || "No pending appointments"}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Shift Handover */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Log Front-Desk Shift Handover</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record end-of-shift cash collection, walk-in tallies, and operational instructions.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Shift Type *</label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="MORNING">Morning Shift (07:00 - 15:00)</option>
                    <option value="EVENING">Evening Shift (15:00 - 23:00)</option>
                    <option value="NIGHT">Night Shift (23:00 - 07:00)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Incoming Staff Member *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma (Receptionist ID)"
                    value={formData.incomingStaff || ""}
                    onChange={(e) => setFormData({ ...formData, incomingStaff: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Cash Collected (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cashCollected ?? 0}
                    onChange={(e) => setFormData({ ...formData, cashCollected: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Total Tokens Issued</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalTokensIssued ?? 0}
                    onChange={(e) => setFormData({ ...formData, totalTokensIssued: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Walk-in Patients Handled</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalWalkinsHandled ?? 0}
                    onChange={(e) => setFormData({ ...formData, totalWalkinsHandled: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Emergencies Handled</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalEmergenciesHandled ?? 0}
                    onChange={(e) => setFormData({ ...formData, totalEmergenciesHandled: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Pending Appointments & VIP Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 2 VIP appointments pending confirmation for Dr. Rao at 4:30 PM..."
                  value={formData.pendingAppointmentsSummary || ""}
                  onChange={(e) => setFormData({ ...formData, pendingAppointmentsSummary: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Front-Desk Handover Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Instructions for next shift, cash drawer handed over, printer paper replaced, pending patient documents..."
                  value={formData.handoverNotes}
                  onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  {saving ? "Recording Handover..." : "Save Shift Handover"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
