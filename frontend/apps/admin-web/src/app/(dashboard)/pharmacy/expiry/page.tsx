"use client";

import { useEffect, useState } from "react";
import {
  pharmacyApi,
  MedicineBatchDto,
  MedicineRecallDto,
  masterDataApi,
  MedicineDto
} from "@medicore/api";
import {
  AlertTriangle,
  ShieldAlert,
  Plus,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Warehouse,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function PharmacyExpiryRecallsPage() {
  const [nearExpiryBatches, setNearExpiryBatches] = useState<MedicineBatchDto[]>([]);
  const [recalls, setRecalls] = useState<MedicineRecallDto[]>([]);
  const [medicines, setMedicines] = useState<MedicineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [recallModalOpen, setRecallModalOpen] = useState(false);

  const [recallForm, setRecallForm] = useState<MedicineRecallDto>({
    medicineId: "",
    batchNumber: "",
    recallReason: "Manufacturer Class II notice: Potential dissolution test deviation",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchRes, recallRes, medRes] = await Promise.all([
        pharmacyApi.getBatches({ nearExpiryOnly: true }),
        pharmacyApi.getRecalls(),
        masterDataApi.getMedicines()
      ]);
      setNearExpiryBatches(batchRes.data.data);
      setRecalls(recallRes.data.data);
      setMedicines(medRes.data.data);

      if (medRes.data.data.length > 0 && !recallForm.medicineId && medRes.data.data[0].id) {
        setRecallForm((prev) => ({ ...prev, medicineId: medRes.data.data[0].id! }));
      }
    } catch (err: unknown) {
      console.error("Failed to load expiry / recall data", err);
      toast.error("Could not load expiry alerts and recalls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitiateRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recallForm.medicineId || !recallForm.batchNumber || !recallForm.recallReason) {
      toast.error("Please fill all required recall parameters");
      return;
    }
    try {
      await pharmacyApi.initiateRecall(recallForm);
      toast.success(`Batch ${recallForm.batchNumber} has been recalled and quarantined`);
      setRecallModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to initiate recall");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Expiry Watch & Medicine Recalls</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
              Safety & Compliance
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Proactively quarantine batches approaching expiration and execute regulatory batch recall locks.
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
            onClick={() => setRecallModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Initiate Batch Recall
          </button>
        </div>
      </div>

      {/* Near-Expiry Section */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold text-foreground">
            Near-Expiry Batches (Expiring within 60 Days)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Medicine</th>
                <th className="py-2.5 px-4 font-semibold">Batch No</th>
                <th className="py-2.5 px-4 font-semibold">Expiry Date</th>
                <th className="py-2.5 px-4 font-semibold">Days Remaining</th>
                <th className="py-2.5 px-4 font-semibold">Storage Location</th>
                <th className="py-2.5 px-4 font-semibold">Available Units</th>
                <th className="py-2.5 px-4 font-semibold">Quarantine Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Checking expiry status...
                  </td>
                </tr>
              ) : nearExpiryBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    No medicine batches are approaching expiration in the next 60 days.
                  </td>
                </tr>
              ) : (
                nearExpiryBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-4 font-bold text-foreground">{b.medicineName}</td>
                    <td className="py-2.5 px-4 font-mono">{b.batchNumber}</td>
                    <td className="py-2.5 px-4 font-semibold">{b.expiryDate}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20">
                        {b.daysUntilExpiry} days left
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">{b.storageLocation}</td>
                    <td className="py-2.5 px-4 font-bold">{b.quantityOnHand} units</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recalls Section */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <h2 className="text-base font-semibold text-foreground">Active Regulatory Recalls & Quarantines</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Recall Ref</th>
                <th className="py-2.5 px-4 font-semibold">Medicine</th>
                <th className="py-2.5 px-4 font-semibold">Batch No</th>
                <th className="py-2.5 px-4 font-semibold">Reason for Recall</th>
                <th className="py-2.5 px-4 font-semibold">Quarantined Stock</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading recall logs...
                  </td>
                </tr>
              ) : recalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    Zero active drug recalls. All pharmacy stocks adhere to CDSCO / FDA standards.
                  </td>
                </tr>
              ) : (
                recalls.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-4 font-mono font-bold text-foreground">{r.recallNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-foreground">{r.medicineName}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-rose-600">{r.batchNumber}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{r.recallReason}</td>
                    <td className="py-2.5 px-4 font-bold">{r.quarantinedQuantity} units locked</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
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

      {/* Recall Modal */}
      {recallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-foreground">Initiate Medicine Batch Recall</h3>
              </div>
              <button onClick={() => setRecallModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Executing a batch recall will immediately lock all remaining units in inventory into quarantine and prevent any further dispensing.
            </p>

            <form onSubmit={handleInitiateRecall} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Medicine *</label>
                <select
                  value={recallForm.medicineId}
                  onChange={(e) => setRecallForm({ ...recallForm, medicineId: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  required
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.genericName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Batch Number to Recall *</label>
                <input
                  type="text"
                  required
                  value={recallForm.batchNumber}
                  onChange={(e) => setRecallForm({ ...recallForm, batchNumber: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl font-mono text-foreground font-bold"
                  placeholder="e.g. EXP-AMX-2025"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Recall Reason / Regulatory Notice *</label>
                <textarea
                  rows={3}
                  required
                  value={recallForm.recallReason}
                  onChange={(e) => setRecallForm({ ...recallForm, recallReason: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRecallModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
                >
                  Quarantine & Lock Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
