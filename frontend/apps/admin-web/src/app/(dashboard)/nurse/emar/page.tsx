"use client";

import { useEffect, useState } from "react";
import {
  Pill, Search, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  ShieldAlert, User, FileText, Plus, HeartPulse, Check, X, AlertCircle
} from "lucide-react";
import {
  nurseApi, MedicationAdministrationDto, MedicationAdministrationRequestDto,
  patientsApi, PatientDto
} from "@medicore/api";
import { toast } from "sonner";

export default function EmarPage() {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);

  const [prescriptionsDue, setPrescriptionsDue] = useState<MedicationAdministrationDto[]>([]);
  const [history, setHistory] = useState<MedicationAdministrationDto[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Administer dose modal
  const [administerModalOpen, setAdministerModalOpen] = useState(false);
  const [selectedItemToAdminister, setSelectedItemToAdminister] = useState<MedicationAdministrationDto | null>(null);
  const [adminForm, setAdminForm] = useState<MedicationAdministrationRequestDto>({
    prescriptionItemId: "",
    patientId: "",
    dosage: "",
    route: "ORAL",
    status: "GIVEN",
    notes: "",
  });
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Load patients list
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await patientsApi.search("");
        if (res.data?.data) {
          setPatients(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedPatientId(res.data.data[0].id || "");
            setSelectedPatient(res.data.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load patients for eMAR", err);
      }
    }
    loadPatients();
  }, []);

  // When patient selection changes, load prescriptions due & administration history
  const loadPatientEmar = async (patientId: string) => {
    if (!patientId) return;
    try {
      setLoadingPrescriptions(true);
      const [dueRes, historyRes] = await Promise.all([
        nurseApi.getPatientPrescriptionsDue(patientId),
        nurseApi.getPatientMedicationHistory(patientId),
      ]);
      if (dueRes.data) setPrescriptionsDue(dueRes.data);
      if (historyRes.data) setHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to load eMAR records", err);
      toast.error("Could not fetch medication records");
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientEmar(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    const p = patients.find((pt) => pt.id === patientId) || null;
    setSelectedPatient(p);
  };

  const openAdministerModal = (item: MedicationAdministrationDto) => {
    setSelectedItemToAdminister(item);
    setAdminForm({
      prescriptionItemId: item.prescriptionItemId,
      patientId: selectedPatientId,
      dosage: item.dosage || "",
      route: "ORAL",
      status: "GIVEN",
      notes: "",
    });
    setAdministerModalOpen(true);
  };

  const handleSaveAdministration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAdmin(true);
      const res = await nurseApi.recordMedicationAdministration(adminForm);
      if (res.success) {
        toast.success(`Dose marked as ${adminForm.status} for ${selectedItemToAdminister?.medicineName}`);
        setAdministerModalOpen(false);
        await loadPatientEmar(selectedPatientId);
      }
    } catch (err: unknown) {
      toast.error("Failed to record administration: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Pill className="w-4 h-4" />
            <span>Electronic Medication Administration Record</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">eMAR Medication Administration</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Administer doctor-prescribed medications, log doses (Given / Held / Refused), and monitor patient allergy safety.
          </p>
        </div>
        <button
          onClick={() => loadPatientEmar(selectedPatientId)}
          disabled={loadingPrescriptions}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-background border border-border rounded-xl hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPrescriptions ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Patient Selector Strip */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-teal-600" />
          <div>
            <label className="text-xs font-semibold text-foreground block">Select Patient:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="text-xs font-semibold bg-background border border-border rounded-lg p-2 outline-none focus:border-teal-500 mt-1 min-w-[240px]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.lastName ? p.lastName : ""} ({p.uhid})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-6 text-xs text-muted-foreground border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-6">
            <div>
              <span className="font-medium text-foreground">Gender/Age:</span>{" "}
              {selectedPatient.gender || "—"} / {selectedPatient.age ? `${selectedPatient.age} yrs` : "—"}
            </div>
            <div>
              <span className="font-medium text-foreground">Blood Group:</span>{" "}
              <span className="font-bold text-rose-600 dark:text-rose-400">{selectedPatient.bloodGroup || "—"}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Phone:</span> {selectedPatient.phone}
            </div>
          </div>
        )}
      </div>

      {/* Prescriptions Due & Administration Record Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions Due Table */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Doctor Prescribed Medications Due</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-bold">
              {prescriptionsDue.length} Items
            </span>
          </div>

          {loadingPrescriptions ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
              Loading prescriptions...
            </div>
          ) : prescriptionsDue.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold text-foreground text-sm">No Active Prescriptions</p>
              <p className="text-[11px]">No pending medication doses found for this patient.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptionsDue.map((item) => (
                <div
                  key={item.prescriptionItemId}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-xs flex items-center gap-2">
                      <Pill className="w-3.5 h-3.5 text-purple-600" />
                      {item.medicineName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Dosage: <span className="font-semibold text-foreground">{item.dosage || "Standard"}</span> • Route:{" "}
                      <span className="font-semibold text-foreground">{item.route || "Oral"}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => openAdministerModal(item)}
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-all"
                  >
                    Administer Dose
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Administration History Log */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>eMAR Administration History</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 font-bold">
              {history.length} Logs
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
              <Clock className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-foreground text-sm">No History Recorded</p>
              <p className="text-[11px]">Medication administration logs will appear here once recorded.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {history.map((log) => {
                const isGiven = log.status === "GIVEN";
                const isHeld = log.status === "HELD";
                const isRefused = log.status === "REFUSED";

                return (
                  <div key={log.id} className="p-3 rounded-xl border border-border bg-card text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{log.medicineName}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          isGiven
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : isHeld
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Dose: {log.dosage} ({log.route})</span>
                      <span className="font-mono">
                        {log.administeredAt ? new Date(log.administeredAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                      Administered by: {log.administeredBy}
                    </p>
                    {log.notes && (
                      <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-1.5 rounded-lg mt-1">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Administer Medication Modal */}
      {administerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Record Medication Administration</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Medicine: <span className="font-bold text-foreground">{selectedItemToAdminister?.medicineName}</span>
                </p>
              </div>
              <button onClick={() => setAdministerModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleSaveAdministration} className="space-y-3.5">
              {/* Status Radio Pills */}
              <div>
                <label className="font-semibold text-foreground block mb-1.5">Administration Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["GIVEN", "HELD", "REFUSED"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAdminForm({ ...adminForm, status: st })}
                      className={`py-2 rounded-xl font-bold transition-all text-center ${
                        adminForm.status === st
                          ? st === "GIVEN"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : st === "HELD"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-rose-600 text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Dosage Given</label>
                  <input
                    type="text"
                    required
                    value={adminForm.dosage || ""}
                    onChange={(e) => setAdminForm({ ...adminForm, dosage: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Route</label>
                  <select
                    value={adminForm.route}
                    onChange={(e) => setAdminForm({ ...adminForm, route: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-purple-500 outline-none"
                  >
                    <option value="ORAL">Oral</option>
                    <option value="IV_BOLUS">IV Bolus</option>
                    <option value="IV_INFUSION">IV Infusion</option>
                    <option value="IM">Intramuscular (IM)</option>
                    <option value="SUBCUTANEOUS">Subcutaneous</option>
                    <option value="TOPICAL">Topical</option>
                    <option value="INHALATION">Inhalation / Nebulization</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Clinical Remarks / Reason if Held or Refused
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dose administered with water. Patient reported mild nausea..."
                  value={adminForm.notes || ""}
                  onChange={(e) => setAdminForm({ ...adminForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdministerModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdmin}
                  className="px-5 py-2 font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-all"
                >
                  {savingAdmin ? "Saving..." : "Log Medication Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
