"use client";

import { useEffect, useState } from "react";
import {
  Bed as BedIcon, Plus, RefreshCw, Users, CheckCircle2, AlertCircle,
  Building2, ArrowRightLeft, LogOut, Search, Sparkles, Filter
} from "lucide-react";
import { nurseApi, WardDto, BedDto, BedAdmissionDto, patientsApi, PatientDto, receptionistApi, DoctorQueueStatusDto } from "@medicore/api";
import { toast } from "sonner";

export default function WardsAndBedsPage() {
  const [wards, setWards] = useState<WardDto[]>([]);
  const [beds, setBeds] = useState<BedDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWardId, setSelectedWardId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<BedDto | null>(null);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorQueueStatusDto[]>([]);
  const [admissionForm, setAdmissionForm] = useState({
    patientId: "",
    admittingDoctorId: "",
    reasonForAdmission: "",
  });
  const [admitting, setAdmitting] = useState(false);

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [activeAdmissionToTransfer, setActiveAdmissionToTransfer] = useState<{ admissionId: string; currentBed: BedDto } | null>(null);
  const [targetBedId, setTargetBedId] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Discharge modal
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [activeAdmissionToDischarge, setActiveAdmissionToDischarge] = useState<{ admissionId: string; bed: BedDto } | null>(null);
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [discharging, setDischarging] = useState(false);

  // New Bed & Ward modals
  const [newWardModalOpen, setNewWardModalOpen] = useState(false);
  const [wardForm, setWardForm] = useState({ name: "", wardType: "GENERAL", totalBeds: 10, floorNumber: "1st Floor", description: "" });
  const [creatingWard, setCreatingWard] = useState(false);

  const [newBedModalOpen, setNewBedModalOpen] = useState(false);
  const [bedForm, setBedForm] = useState({ wardId: "", bedNumber: "", dailyRate: 500 });
  const [creatingBed, setCreatingBed] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wardsRes, bedsRes] = await Promise.all([
        nurseApi.getWards(),
        nurseApi.getBeds(),
      ]);
      if (wardsRes.data) setWards(wardsRes.data);
      if (bedsRes.data) setBeds(bedsRes.data);
    } catch (err) {
      console.error("Failed to load wards and beds", err);
      toast.error("Could not load ward bed data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdmitModal = async (bed: BedDto) => {
    setSelectedBedForAdmission(bed);
    setAdmitModalOpen(true);
    try {
      const [ptsRes, recStatsRes] = await Promise.all([
        patientsApi.search(""),
        receptionistApi.getDashboardStats(),
      ]);
      if (ptsRes.data?.data) setPatients(ptsRes.data.data);
      if (recStatsRes?.doctorQueues) setDoctors(recStatsRes.doctorQueues);
    } catch (err) {
      console.error("Failed to load patients/doctors for admission", err);
    }
  };

  const handleAdmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForAdmission || !admissionForm.patientId) {
      toast.error("Please select a patient");
      return;
    }

    try {
      setAdmitting(true);
      const res = await nurseApi.admitPatient({
        bedId: selectedBedForAdmission.id!,
        patientId: admissionForm.patientId,
        admittingDoctorId: admissionForm.admittingDoctorId || undefined,
        reasonForAdmission: admissionForm.reasonForAdmission,
      });

      if (res.success) {
        toast.success("Patient successfully admitted to " + selectedBedForAdmission.bedNumber);
        setAdmitModalOpen(false);
        setAdmissionForm({ patientId: "", admittingDoctorId: "", reasonForAdmission: "" });
        await loadData();
      }
    } catch (err: unknown) {
      toast.error("Admission failed: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setAdmitting(false);
    }
  };

  const openTransferModal = (bed: BedDto) => {
    if (!bed.currentAdmissionId) return;
    setActiveAdmissionToTransfer({ admissionId: bed.currentAdmissionId, currentBed: bed });
    setTargetBedId("");
    setTransferModalOpen(true);
  };

  const handleTransferBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmissionToTransfer || !targetBedId) return;

    try {
      setTransferring(true);
      const res = await nurseApi.transferBed(activeAdmissionToTransfer.admissionId, targetBedId);
      if (res.success) {
        toast.success("Patient transferred to new bed successfully!");
        setTransferModalOpen(false);
        await loadData();
      }
    } catch (err: unknown) {
      toast.error("Transfer failed: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setTransferring(false);
    }
  };

  const openDischargeModal = (bed: BedDto) => {
    if (!bed.currentAdmissionId) return;
    setActiveAdmissionToDischarge({ admissionId: bed.currentAdmissionId, bed });
    setDischargeNotes("");
    setDischargeModalOpen(true);
  };

  const handleDischargePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmissionToDischarge) return;

    try {
      setDischarging(true);
      const res = await nurseApi.dischargePatient(activeAdmissionToDischarge.admissionId, dischargeNotes);
      if (res.success) {
        toast.success("Patient discharged! Bed marked for cleaning & sanitization.");
        setDischargeModalOpen(false);
        await loadData();
      }
    } catch (err: unknown) {
      toast.error("Discharge failed: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setDischarging(false);
    }
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingWard(true);
      const res = await nurseApi.createWard(wardForm);
      if (res.success) {
        toast.success("Ward created successfully!");
        setNewWardModalOpen(false);
        setWardForm({ name: "", wardType: "GENERAL", totalBeds: 10, floorNumber: "1st Floor", description: "" });
        await loadData();
      }
    } catch (err: unknown) {
      toast.error("Failed to create ward: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setCreatingWard(false);
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingBed(true);
      const res = await nurseApi.createBed({
        wardId: bedForm.wardId,
        bedNumber: bedForm.bedNumber,
        dailyRate: bedForm.dailyRate,
        status: "AVAILABLE",
      });
      if (res.success) {
        toast.success("Bed created successfully!");
        setNewBedModalOpen(false);
        setBedForm({ wardId: "", bedNumber: "", dailyRate: 500 });
        await loadData();
      }
    } catch (err: unknown) {
      toast.error("Failed to create bed: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setCreatingBed(false);
    }
  };

  const filteredBeds = beds.filter((b) => {
    const wardMatch = selectedWardId === "ALL" || b.wardId === selectedWardId;
    const statusMatch = statusFilter === "ALL" || b.status?.toUpperCase() === statusFilter.toUpperCase();
    return wardMatch && statusMatch;
  });

  const availableTargetBeds = beds.filter((b) => b.status === "AVAILABLE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
            <BedIcon className="w-4 h-4" />
            <span>Inpatient Ward & Bed Layout</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Inpatient Bed Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time ward occupancy grid, bed admissions, inter-ward patient transfers, and discharge workflows.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNewWardModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Ward
          </button>
          <button
            onClick={() => setNewBedModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Bed
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Ward Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wards.map((ward) => (
          <div
            key={ward.id}
            onClick={() => setSelectedWardId(selectedWardId === ward.id ? "ALL" : ward.id!)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedWardId === ward.id
                ? "bg-teal-500/10 border-teal-500/40 shadow-md ring-1 ring-teal-500/30"
                : "bg-card border-border hover:border-teal-500/20"
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-muted text-muted-foreground uppercase">
                  {ward.wardType}
                </span>
                <h3 className="font-bold text-foreground text-sm mt-2">{ward.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{ward.floorNumber || "Main Floor"}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Beds:</span>
              <span className="font-bold text-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">{ward.availableBeds ?? 0} Avail</span> /{" "}
                <span className="text-rose-600 dark:text-rose-400">{ward.occupiedBeds ?? 0} Occupied</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Filter Beds:</span>
          <div className="flex items-center gap-1.5 ml-2">
            {["ALL", "AVAILABLE", "OCCUPIED", "CLEANING"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${statusFilter === st
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {st === "ALL" ? "All Beds" : st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredBeds.length}</span> beds
        </div>
      </div>

      {/* Bed Grid Visualization */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <BedIcon className="w-4 h-4 text-teal-600" />
            <span>Live Ward Bed Grid</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Cleaning / Maint.</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading beds...
          </div>
        ) : filteredBeds.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-1">
            <BedIcon className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground text-sm">No Beds Found</p>
            <p className="text-[11px]">Click "Add Bed" to provision beds for this ward.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => {
              const isOccupied = bed.status === "OCCUPIED";
              const isAvailable = bed.status === "AVAILABLE";
              const isCleaning = bed.status === "CLEANING" || bed.status === "MAINTENANCE";

              return (
                <div
                  key={bed.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${isOccupied
                      ? "bg-rose-500/5 border-rose-500/30"
                      : isAvailable
                        ? "bg-emerald-500/5 border-emerald-500/30 hover:shadow-md"
                        : "bg-amber-500/5 border-amber-500/30"
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-foreground">{bed.bedNumber}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isOccupied
                            ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            : isAvailable
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          }`}
                      >
                        {bed.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{bed.wardName}</p>

                    {/* Occupant Info */}
                    {isOccupied && (
                      <div className="mt-3 p-2.5 rounded-lg bg-card/80 border border-rose-500/20 text-xs space-y-1">
                        <p className="font-bold text-foreground">{bed.currentPatientName || "Occupied"}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">UHID: {bed.currentPatientUhid || "—"}</p>
                        {bed.admittedDoctorName && (
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">{bed.admittedDoctorName}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                    {isAvailable && (
                      <button
                        onClick={() => openAdmitModal(bed)}
                        className="w-full py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                      >
                        Admit Patient
                      </button>
                    )}

                    {isOccupied && (
                      <>
                        <button
                          onClick={() => openTransferModal(bed)}
                          title="Transfer Patient"
                          className="px-2.5 py-1 text-xs font-semibold bg-background border border-border hover:bg-muted rounded-lg text-foreground transition-all flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Transfer
                        </button>
                        <button
                          onClick={() => openDischargeModal(bed)}
                          title="Discharge Patient"
                          className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          Discharge
                        </button>
                      </>
                    )}

                    {isCleaning && (
                      <button
                        onClick={async () => {
                          try {
                            await nurseApi.createBed({ ...bed, status: "AVAILABLE" });
                            toast.success("Bed cleaned and marked AVAILABLE!");
                            await loadData();
                          } catch {
                            toast.error("Failed to update bed status");
                          }
                        }}
                        className="w-full py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all"
                      >
                        Mark as Cleaned
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {admitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Inpatient Bed Admission</h3>
                <p className="text-xs text-muted-foreground">
                  Allocating Bed: <span className="font-mono font-bold text-foreground">{selectedBedForAdmission?.bedNumber}</span> ({selectedBedForAdmission?.wardName})
                </p>
              </div>
              <button onClick={() => setAdmitModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleAdmitPatient} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Select Patient *</label>
                <select
                  required
                  value={admissionForm.patientId}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, patientId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.lastName ? p.lastName : ""} ({p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Admitting Doctor</label>
                <select
                  value={admissionForm.admittingDoctorId}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, admittingDoctorId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                >
                  <option value="">-- Choose Doctor (Optional) --</option>
                  {doctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      Dr. {d.doctorName} ({d.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Admission Diagnosis / Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Acute severe gastroenteritis with dehydration requiring IV fluids..."
                  value={admissionForm.reasonForAdmission}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, reasonForAdmission: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdmitModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admitting}
                  className="px-5 py-2 font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all"
                >
                  {admitting ? "Admitting..." : "Confirm Inpatient Admission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Bed Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Transfer Patient Bed</h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <p className="text-muted-foreground">
              Moving <span className="font-semibold text-foreground">{activeAdmissionToTransfer?.currentBed.currentPatientName}</span> from{" "}
              <span className="font-mono font-bold text-foreground">{activeAdmissionToTransfer?.currentBed.bedNumber}</span>.
            </p>

            <form onSubmit={handleTransferBed} className="space-y-3.5">
              <div>
                <label className="font-semibold text-foreground block mb-1">Select Target Available Bed *</label>
                <select
                  required
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                >
                  <option value="">-- Choose Available Bed --</option>
                  {availableTargetBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} - {b.wardName} (₹{b.dailyRate}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="px-5 py-2 font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                >
                  {transferring ? "Transferring..." : "Complete Bed Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Patient Modal */}
      {dischargeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Discharge Inpatient</h3>
              <button onClick={() => setDischargeModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <p className="text-muted-foreground">
              Discharging patient <span className="font-semibold text-foreground">{activeAdmissionToDischarge?.bed.currentPatientName}</span> from Bed{" "}
              <span className="font-mono font-bold text-foreground">{activeAdmissionToDischarge?.bed.bedNumber}</span>.
            </p>

            <form onSubmit={handleDischargePatient} className="space-y-3.5">
              <div>
                <label className="font-semibold text-foreground block mb-1">Discharge Summary / Nursing Notes</label>
                <textarea
                  rows={3}
                  placeholder="Vitals stable, IV cannula removed, discharge medications and follow-up explained..."
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDischargeModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={discharging}
                  className="px-5 py-2 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                >
                  {discharging ? "Discharging..." : "Confirm Patient Discharge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ward Modal */}
      {newWardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Create New Ward</h3>
              <button onClick={() => setNewWardModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCreateWard} className="space-y-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Ward Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU Wing B, General Ward 3"
                  value={wardForm.name}
                  onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Ward Type</label>
                  <select
                    value={wardForm.wardType}
                    onChange={(e) => setWardForm({ ...wardForm, wardType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  >
                    <option value="GENERAL">General Ward</option>
                    <option value="ICU">Intensive Care (ICU)</option>
                    <option value="SEMI_PRIVATE">Semi-Private</option>
                    <option value="EMERGENCY">Emergency Care</option>
                    <option value="POST_OP">Post-Operative</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Capacity (Beds)</label>
                  <input
                    type="number"
                    required
                    value={wardForm.totalBeds}
                    onChange={(e) => setWardForm({ ...wardForm, totalBeds: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Floor Number</label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Floor, Wing A"
                  value={wardForm.floorNumber}
                  onChange={(e) => setWardForm({ ...wardForm, floorNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setNewWardModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWard}
                  className="px-5 py-2 font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                >
                  {creatingWard ? "Saving..." : "Create Ward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bed Modal */}
      {newBedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Add Bed to Ward</h3>
              <button onClick={() => setNewBedModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCreateBed} className="space-y-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Select Ward *</label>
                <select
                  required
                  value={bedForm.wardId}
                  onChange={(e) => setBedForm({ ...bedForm, wardId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                >
                  <option value="">-- Choose Ward --</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.wardType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Bed Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BED-105, ICU-03"
                    value={bedForm.bedNumber}
                    onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Daily Tariff (₹)</label>
                  <input
                    type="number"
                    required
                    value={bedForm.dailyRate}
                    onChange={(e) => setBedForm({ ...bedForm, dailyRate: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setNewBedModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBed}
                  className="px-5 py-2 font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                >
                  {creatingBed ? "Saving..." : "Add Bed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
