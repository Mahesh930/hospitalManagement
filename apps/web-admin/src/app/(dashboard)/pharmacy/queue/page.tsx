"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  pharmacyApi,
  PrescriptionQueueItemDto,
  MedicineBatchDto,
  DispenseRequestDto,
  DispenseResponseDto
} from "@medicore/api";
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  AlertCircle,
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  HelpCircle,
  User,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function PharmacyQueuePage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";
  const initialRx = searchParams.get("rx");

  const [queue, setQueue] = useState<PrescriptionQueueItemDto[]>([]);
  const [batches, setBatches] = useState<MedicineBatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Active selections
  const [selectedRx, setSelectedRx] = useState<PrescriptionQueueItemDto | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState<"VERIFY" | "REJECT" | "CLARIFY">("VERIFY");
  const [verifyNotes, setVerifyNotes] = useState("");

  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispenseItems, setDispenseItems] = useState<
    Array<{
      prescriptionItemId: string;
      medicineName: string;
      medicineId: string;
      batchId: string;
      batchNumber: string;
      prescribedQty: number;
      dispenseQty: number;
      unitPrice: number;
      instructions: string;
    }>
  >([]);
  const [handoverTo, setHandoverTo] = useState("Patient Self");
  const [dispenseInstructions, setDispenseInstructions] = useState("Take after meals with warm water.");
  const [dispenseReceipt, setDispenseReceipt] = useState<DispenseResponseDto | null>(null);
  const [dispensing, setDispensing] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const [queueRes, batchRes] = await Promise.all([
        pharmacyApi.getPrescriptions({ status: statusFilter === "ALL" ? undefined : statusFilter, query: searchQuery }),
        pharmacyApi.getBatches()
      ]);
      setQueue(queueRes.data.data);
      setBatches(batchRes.data.data);

      if (initialRx) {
        const found = queueRes.data.data.find((q) => q.prescriptionId === initialRx);
        if (found) {
          openDispenseModal(found, batchRes.data.data);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load prescription queue", err);
      toast.error("Failed to load pharmacy queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const filteredQueue = useMemo(() => {
    if (!searchQuery) return queue;
    const q = searchQuery.toLowerCase();
    return queue.filter(
      (item) =>
        item.patientName.toLowerCase().includes(q) ||
        item.uhid.toLowerCase().includes(q) ||
        item.doctorName.toLowerCase().includes(q)
    );
  }, [queue, searchQuery]);

  const handleVerify = async () => {
    if (!selectedRx) return;
    try {
      await pharmacyApi.verifyPrescription({
        prescriptionId: selectedRx.prescriptionId,
        action: verifyAction,
        notes: verifyNotes,
      });
      toast.success(
        verifyAction === "VERIFY"
          ? "Prescription clinically verified for dispensing"
          : verifyAction === "REJECT"
          ? "Prescription rejected"
          : "Prescription clarification request submitted to doctor"
      );
      setVerifyModalOpen(false);
      setVerifyNotes("");
      fetchQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to process prescription verification");
    }
  };

  const openDispenseModal = (rx: PrescriptionQueueItemDto, batchList = batches) => {
    setSelectedRx(rx);
    const preparedItems = rx.items.map((it) => {
      // Find matching batch with stock using FEFO
      const matchingBatches = batchList.filter(
        (b) =>
          b.medicineName.toLowerCase() === it.medicineName.toLowerCase() &&
          b.quantityOnHand > 0 &&
          b.status === "ACTIVE"
      );
      const selectedBatch = matchingBatches[0];

      return {
        prescriptionItemId: it.itemId,
        medicineName: it.medicineName,
        medicineId: selectedBatch?.medicineId || "",
        batchId: selectedBatch?.id || "",
        batchNumber: selectedBatch?.batchNumber || "NO_STOCK",
        prescribedQty: it.prescribedQuantity,
        dispenseQty: Math.min(it.prescribedQuantity - it.dispensedQuantity, selectedBatch?.quantityOnHand || it.prescribedQuantity),
        unitPrice: selectedBatch?.sellingPrice || 10,
        instructions: it.instructions || "After meals",
      };
    });

    setDispenseItems(preparedItems);
    setDispenseModalOpen(true);
  };

  const handleExecuteDispense = async () => {
    if (!selectedRx) return;

    const invalidItem = dispenseItems.find((it) => !it.batchId || it.dispenseQty <= 0);
    if (invalidItem) {
      toast.error(`Please select a valid batch and quantity for ${invalidItem.medicineName}`);
      return;
    }

    try {
      setDispensing(true);
      const payload: DispenseRequestDto = {
        prescriptionId: selectedRx.prescriptionId,
        patientId: selectedRx.patientId,
        handoverTo,
        instructions: dispenseInstructions,
        paymentStatus: "PAID",
        createBillingInvoice: true,
        items: dispenseItems.map((it) => ({
          prescriptionItemId: it.prescriptionItemId,
          medicineId: it.medicineId,
          batchId: it.batchId,
          quantityDispensed: it.dispenseQty,
          unitPrice: it.unitPrice,
          dosageInstructions: it.instructions,
        })),
      };

      const res = await pharmacyApi.dispense(payload);
      toast.success("Medicines successfully dispensed & stock deducted!");
      setDispenseReceipt(res.data.data);
      setDispenseModalOpen(false);
      fetchQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Dispensing transaction failed");
    } finally {
      setDispensing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Prescription Dispensing Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Live OPD / Inpatient Orders
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Clinically verify doctor prescriptions, review recorded patient allergies, and allocate FEFO batches.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition border border-border self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "SUBMITTED", "VERIFIED", "PARTIALLY_DISPENSED", "DISPENSED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient, UHID or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Prescription Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-card border border-border rounded-2xl">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading prescriptions queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-20 text-center bg-card border border-border rounded-2xl p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-semibold text-foreground">No Prescriptions Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              There are no prescriptions matching the selected status or query at this moment.
            </p>
          </div>
        ) : (
          filteredQueue.map((rx) => {
            const hasAllergies = rx.allergies && rx.allergies !== "No recorded allergies";
            return (
              <div
                key={rx.prescriptionId}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 transition hover:border-border/80"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{rx.patientName}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-muted-foreground border border-border">
                          {rx.uhid}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rx.patientAge}y • {rx.patientGender}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>Issued by: Dr. {rx.doctorName} ({rx.doctorSpecialization})</span>
                        <span>•</span>
                        <span>{new Date(rx.issuedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        rx.status === "VERIFIED"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : rx.status === "DISPENSED"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : rx.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {rx.status.replace("_", " ")}
                    </span>

                    {/* Actions */}
                    {rx.status !== "DISPENSED" && rx.status !== "REJECTED" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRx(rx);
                            setVerifyAction("VERIFY");
                            setVerifyModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition border border-border flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          Verify
                        </button>
                        <button
                          onClick={() => openDispenseModal(rx)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          <Pill className="w-3.5 h-3.5" />
                          Dispense
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Allergy & Doctor Clinical Advice Alert */}
                {hasAllergies && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      <strong>Clinical Allergy Warning:</strong> Patient has recorded allergy to:{" "}
                      <strong>{rx.allergies}</strong>. Verify all prescribed items before dispensing.
                    </span>
                  </div>
                )}

                {rx.clarificationRequested && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Clarification Requested:</strong> {rx.clarificationNotes}
                    </span>
                  </div>
                )}

                {rx.advice && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
                    <strong>Doctor's Advice:</strong> {rx.advice}
                  </p>
                )}

                {/* Prescribed Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-2 font-medium">Medicine</th>
                        <th className="pb-2 font-medium">Dosage & Frequency</th>
                        <th className="pb-2 font-medium">Route / Days</th>
                        <th className="pb-2 font-medium">Prescribed / Dispensed</th>
                        <th className="pb-2 font-medium">Inventory Stock</th>
                        <th className="pb-2 font-medium">Suggested Batch</th>
                        <th className="pb-2 font-medium">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rx.items.map((it) => (
                        <tr key={it.itemId} className="hover:bg-muted/20">
                          <td className="py-2.5 font-semibold text-foreground">{it.medicineName}</td>
                          <td className="py-2.5 text-muted-foreground">
                            {it.dosage} • {it.frequency}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {it.route} • {it.durationDays} days
                          </td>
                          <td className="py-2.5">
                            <span className="font-bold text-foreground">{it.dispensedQuantity}</span> /{" "}
                            <span>{it.prescribedQuantity} units</span>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                                it.availableStock > 20
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : it.availableStock > 0
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              }`}
                            >
                              {it.availableStock} in stock
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-muted-foreground">{it.batchNumber || "—"}</td>
                          <td className="py-2.5 text-muted-foreground">{it.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Verification Modal */}
      {verifyModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Verify Prescription</h3>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Patient: <strong>{selectedRx.patientName}</strong> ({selectedRx.uhid})
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Action</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyAction("VERIFY")}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    verifyAction === "VERIFY"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyAction("CLARIFY")}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    verifyAction === "CLARIFY"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  Clarify
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyAction("REJECT")}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    verifyAction === "REJECT"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Pharmacist Clinical Notes</label>
              <textarea
                rows={3}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder={
                  verifyAction === "VERIFY"
                    ? "Prescription clinically verified for dosage, interactions, and route."
                    : verifyAction === "REJECT"
                    ? "Reason for rejection (e.g. contraindication, duplicate item)..."
                    : "Specify question or dosage clarification for Dr. " + selectedRx.doctorName
                }
                className="w-full p-2.5 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispensing Modal */}
      {dispenseModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl p-6 shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Dispense Medicines against Prescription</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allocate inventory batches (FEFO) and verify dispensed quantities.
                </p>
              </div>
              <button
                onClick={() => setDispenseModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Patient Header */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">PATIENT</span>
                <span className="font-bold text-foreground">{selectedRx.patientName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">UHID</span>
                <span className="font-mono text-foreground">{selectedRx.uhid}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">DOCTOR</span>
                <span className="text-foreground">Dr. {selectedRx.doctorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">ALLERGIES</span>
                <span className="text-rose-500 font-semibold">{selectedRx.allergies || "None"}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Prescribed Medicines & Batch Allocation</label>
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {dispenseItems.map((item, idx) => {
                  // Available batches for this medicine
                  const availableForMed = batches.filter(
                    (b) => b.medicineName.toLowerCase() === item.medicineName.toLowerCase() && b.quantityOnHand > 0
                  );

                  return (
                    <div key={item.prescriptionItemId} className="p-3.5 space-y-2 bg-card">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-foreground">{item.medicineName}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            (Prescribed: {item.prescribedQty} units)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Dispense Qty:</span>
                            <input
                              type="number"
                              min={1}
                              max={item.prescribedQty}
                              value={item.dispenseQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const updated = [...dispenseItems];
                                updated[idx].dispenseQty = val;
                                setDispenseItems(updated);
                              }}
                              className="w-16 p-1.5 text-xs text-center font-bold bg-muted/60 border border-border rounded-lg text-foreground"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Subtotal: <strong className="text-foreground">₹{(item.dispenseQty * item.unitPrice).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Batch Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] text-muted-foreground block mb-1">Select Batch (FEFO Recommended)</label>
                          <select
                            value={item.batchId}
                            onChange={(e) => {
                              const batchId = e.target.value;
                              const chosen = batches.find((b) => b.id === batchId);
                              const updated = [...dispenseItems];
                              updated[idx].batchId = batchId;
                              updated[idx].batchNumber = chosen?.batchNumber || "";
                              updated[idx].unitPrice = chosen?.sellingPrice || 10;
                              setDispenseItems(updated);
                            }}
                            className="w-full p-2 text-xs bg-muted/60 border border-border rounded-lg text-foreground focus:outline-none"
                          >
                            {availableForMed.length === 0 ? (
                              <option value="">No batches in stock</option>
                            ) : (
                              availableForMed.map((b) => (
                                <option key={b.id} value={b.id}>
                                  Batch: {b.batchNumber} (Exp: {b.expiryDate} • Stock: {b.quantityOnHand} • ₹{b.sellingPrice}/u)
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground block mb-1">Dosage Instructions on Label</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => {
                              const updated = [...dispenseItems];
                              updated[idx].instructions = e.target.value;
                              setDispenseItems(updated);
                            }}
                            className="w-full p-2 text-xs bg-muted/60 border border-border rounded-lg text-foreground"
                            placeholder="Take after meals"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Handover & Overall instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Handover To</label>
                <select
                  value={handoverTo}
                  onChange={(e) => setHandoverTo(e.target.value)}
                  className="w-full p-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground"
                >
                  <option value="Patient Self">Patient Self</option>
                  <option value="Family Attendant">Family Attendant</option>
                  <option value="Inpatient Ward Nurse">Inpatient Ward Nurse</option>
                  <option value="Emergency Staff">Emergency Staff</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">General Usage Notes</label>
                <input
                  type="text"
                  value={dispenseInstructions}
                  onChange={(e) => setDispenseInstructions(e.target.value)}
                  className="w-full p-2 text-xs bg-muted/50 border border-border rounded-xl text-foreground"
                  placeholder="Keep in cool place away from sunlight."
                />
              </div>
            </div>

            {/* Total Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="text-sm font-semibold text-foreground">
                Total Bill Amount:{" "}
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-base">
                  ₹{dispenseItems.reduce((acc, it) => acc + it.dispenseQty * it.unitPrice, 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDispenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={dispensing}
                  onClick={handleExecuteDispense}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-2"
                >
                  {dispensing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Pill className="w-3.5 h-3.5" />}
                  Confirm & Deduct Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Dispense Receipt Modal */}
      {dispenseReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-foreground">Dispensing Receipt Generated</h3>
              </div>
              <button
                onClick={() => setDispenseReceipt(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div id="pharmacy-receipt-print" className="p-4 bg-muted/30 border border-border rounded-xl space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-border">
                <h4 className="font-bold text-sm tracking-tight text-foreground">MediCore Hospital Central Dispensary</h4>
                <p className="text-[10px] text-muted-foreground">Official Drug Dispensing Receipt</p>
                <p className="font-mono text-[11px] font-bold text-primary mt-1">{dispenseReceipt.dispenseNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Patient:</span> <strong>{dispenseReceipt.patientName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">UHID:</span> <strong>{dispenseReceipt.uhid}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Dispensed By:</span> {dispenseReceipt.pharmacistUsername}
                </div>
                <div>
                  <span className="text-muted-foreground">Handover To:</span> {dispenseReceipt.handoverTo}
                </div>
              </div>

              <div className="divide-y divide-border border-y border-border py-2 space-y-1">
                {dispenseReceipt.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center py-1">
                    <div>
                      <p className="font-semibold text-foreground">{it.medicineName}</p>
                      <p className="text-[10px] text-muted-foreground">Batch: {it.batchNumber} • {it.dosageInstructions}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{it.quantityDispensed} × ₹{it.unitPrice}</p>
                      <p className="font-bold text-primary">₹{it.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1 font-bold text-sm">
                <span>Grand Total:</span>
                <span className="text-emerald-600">₹{dispenseReceipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-xl border border-border flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Dispensing Label
              </button>
              <button
                type="button"
                onClick={() => setDispenseReceipt(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
