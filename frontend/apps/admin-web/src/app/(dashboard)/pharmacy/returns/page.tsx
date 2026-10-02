"use client";

import { useEffect, useState } from "react";
import {
  pharmacyApi,
  PharmacyReturnDto,
  MedicineBatchDto,
  patientsApi,
  PatientDto
} from "@medicore/api";
import {
  Undo2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function PharmacyReturnsPage() {
  const [returns, setReturns] = useState<PharmacyReturnDto[]>([]);
  const [batches, setBatches] = useState<MedicineBatchDto[]>([]);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<PharmacyReturnDto>({
    patientId: "",
    medicineId: "",
    batchId: "",
    returnQuantity: 1,
    refundAmount: 50,
    disposition: "RETURN_TO_STOCK",
    reason: "Unused course, intact sealed package",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [retRes, batchRes, patRes] = await Promise.all([
        pharmacyApi.getReturns(),
        pharmacyApi.getBatches(),
        patientsApi.getAll()
      ]);
      setReturns(retRes.data.data);
      setBatches(batchRes.data.data);
      setPatients(patRes.data?.data || []);

      if (batchRes.data.data.length > 0 && !form.batchId) {
        setForm((prev) => ({
          ...prev,
          batchId: batchRes.data.data[0].id,
          medicineId: batchRes.data.data[0].medicineId,
        }));
      }
    } catch (err: unknown) {
      console.error("Failed to load returns", err);
      toast.error("Could not load pharmacy returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId || form.returnQuantity <= 0) {
      toast.error("Please select a batch and quantity greater than 0");
      return;
    }
    try {
      await pharmacyApi.processReturn(form);
      toast.success("Medicine return recorded and stock adjusted");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to process return");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Patient Medicine Returns & Wastage</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Audit Tracked
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Record patient medicine returns, handle sealed restocks vs damaged/opened quarantine write-offs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
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
            Process Return
          </button>
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">Return ID</th>
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Medicine & Batch</th>
                <th className="py-3 px-4 font-semibold">Quantity</th>
                <th className="py-3 px-4 font-semibold">Refund Amount</th>
                <th className="py-3 px-4 font-semibold">Disposition</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading return records...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No medicine return transactions on record.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">{r.returnNumber}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{r.patientName || "OTC / Anonymous"}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{r.medicineName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">Batch: {r.batchNumber}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{r.returnQuantity} units</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">₹{r.refundAmount?.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${
                          r.disposition === "RETURN_TO_STOCK"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        }`}
                      >
                        {r.disposition.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{r.reason}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                        {r.status}
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
              <h3 className="text-base font-bold text-foreground">Record Patient Medicine Return</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessReturn} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Patient (Optional)</label>
                <select
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                >
                  <option value="">-- Over The Counter / Walk-in --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Medicine Batch Returned *</label>
                <select
                  value={form.batchId}
                  onChange={(e) => {
                    const chosen = batches.find((b) => b.id === e.target.value);
                    setForm({
                      ...form,
                      batchId: e.target.value,
                      medicineId: chosen?.medicineId || "",
                    });
                  }}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.medicineName} • Batch: {b.batchNumber} (Exp: {b.expiryDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Returned Units *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.returnQuantity}
                    onChange={(e) => setForm({ ...form, returnQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Approved Refund (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.refundAmount}
                    onChange={(e) => setForm({ ...form, refundAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl font-bold text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Physical Inspection & Disposition *</label>
                <select
                  value={form.disposition}
                  onChange={(e) => setForm({ ...form, disposition: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground font-semibold"
                >
                  <option value="RETURN_TO_STOCK">Sealed / Intact Package - Restock to Inventory</option>
                  <option value="QUARANTINE_WASTE">Opened / Damaged - Move to Quarantine & Waste</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Reason for Return *</label>
                <input
                  type="text"
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Doctor revised prescription, allergy reaction, treatment discontinued"
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
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
