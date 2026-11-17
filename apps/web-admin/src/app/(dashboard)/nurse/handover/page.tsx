"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet, ShieldAlert, Plus, RefreshCw, AlertTriangle,
  Clock, CheckCircle2, User, Building2, Calendar, FileText
} from "lucide-react";
import {
  nurseApi, ShiftHandoverReportDto, NursingIncidentDto, WardDto,
  patientsApi, PatientDto
} from "@medicore/api";
import { toast } from "sonner";

export default function ShiftHandoverAndIncidentsPage() {
  const [assignedWard, setAssignedWard] = useState<WardDto | null>(null);
  const [handovers, setHandovers] = useState<ShiftHandoverReportDto[]>([]);
  const [incidents, setIncidents] = useState<NursingIncidentDto[]>([]);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: "HANDOVERS" | "INCIDENTS"
  const [activeTab, setActiveTab] = useState<"HANDOVERS" | "INCIDENTS">("HANDOVERS");

  // Handover Modal
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    shiftType: "MORNING" as "MORNING" | "EVENING" | "NIGHT",
    incomingNurse: "",
    totalInpatients: 1,
    criticalPatientsCount: 0,
    handoverSummary: "",
    pendingTasksSummary: "",
  });
  const [savingHandover, setSavingHandover] = useState(false);

  // Incident Modal
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    patientId: "",
    incidentType: "PATIENT_FALL",
    severity: "NEAR_MISS" as "NEAR_MISS" | "MINOR" | "MODERATE" | "SEVERE",
    description: "",
    immediateActionTaken: "",
  });
  const [savingIncident, setSavingIncident] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wardRes, ptsRes, hoRes, incRes] = await Promise.all([
        nurseApi.getAssignedWard(),
        patientsApi.search(""),
        nurseApi.getWardHandovers(),
        nurseApi.getWardIncidents(),
      ]);

      if (wardRes.data) setAssignedWard(wardRes.data);
      if (ptsRes.data?.data) {
        setPatients(ptsRes.data.data);
        setHandoverForm((prev) => ({ ...prev, totalInpatients: ptsRes.data?.data?.length || 1 }));
      }
      if (hoRes.data) setHandovers(hoRes.data);
      if (incRes.data) setIncidents(incRes.data);
    } catch (err) {
      console.error("Failed to load shift handover & incidents data", err);
      toast.error("Failed to load handover and incident records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverForm.handoverSummary.trim()) {
      toast.error("Please provide a clinical handover summary");
      return;
    }

    try {
      setSavingHandover(true);
      await nurseApi.createShiftHandover({
        wardId: assignedWard?.id,
        shiftType: handoverForm.shiftType,
        incomingNurse: handoverForm.incomingNurse,
        totalInpatients: Number(handoverForm.totalInpatients),
        criticalPatientsCount: Number(handoverForm.criticalPatientsCount),
        handoverSummary: handoverForm.handoverSummary,
        pendingTasksSummary: handoverForm.pendingTasksSummary,
      });
      toast.success("Shift handover report logged successfully");
      setHandoverModalOpen(false);
      setHandoverForm({
        shiftType: "MORNING",
        incomingNurse: "",
        totalInpatients: patients.length,
        criticalPatientsCount: 0,
        handoverSummary: "",
        pendingTasksSummary: "",
      });
      loadData();
    } catch (err: any) {
      console.error("Failed to save handover", err);
      toast.error(err?.response?.data?.error?.message || "Failed to submit handover");
    } finally {
      setSavingHandover(false);
    }
  };

  const handleSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.description.trim()) {
      toast.error("Please describe the incident details");
      return;
    }

    try {
      setSavingIncident(true);
      await nurseApi.reportIncident({
        patientId: incidentForm.patientId || undefined,
        wardId: assignedWard?.id,
        incidentType: incidentForm.incidentType,
        severity: incidentForm.severity,
        description: incidentForm.description,
        immediateActionTaken: incidentForm.immediateActionTaken,
      });
      toast.success("Hospital incident report filed for quality review");
      setIncidentModalOpen(false);
      setIncidentForm({
        patientId: "",
        incidentType: "PATIENT_FALL",
        severity: "NEAR_MISS",
        description: "",
        immediateActionTaken: "",
      });
      loadData();
    } catch (err: any) {
      console.error("Failed to file incident report", err);
      toast.error(err?.response?.data?.error?.message || "Failed to file incident report");
    } finally {
      setSavingIncident(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Shift Handover & Incident Safety Reporting
              </h1>
              <p className="text-sm text-muted-foreground">
                {assignedWard ? (
                  <>Assigned Ward: <span className="font-semibold text-foreground">{assignedWard.name}</span></>
                ) : (
                  "Nursing shift transfers, patient census handover, and hospital safety incident reporting"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "HANDOVERS" ? (
            <button
              onClick={() => setHandoverModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> End of Shift Handover
            </button>
          ) : (
            <button
              onClick={() => setIncidentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow transition-colors"
            >
              <ShieldAlert className="w-4 h-4" /> Report Safety Incident
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2.5 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("HANDOVERS")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition-all ${
            activeTab === "HANDOVERS"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <FileText className="w-4 h-4" /> Shift Handovers ({handovers.length})
        </button>
        <button
          onClick={() => setActiveTab("INCIDENTS")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition-all ${
            activeTab === "INCIDENTS"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Safety Incidents ({incidents.length})
        </button>
      </div>

      {/* View 1: Shift Handovers Table */}
      {activeTab === "HANDOVERS" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {handovers.length > 0 ? (
              handovers.map((h) => (
                <div key={h.id} className="p-5 space-y-3 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {h.shiftType} SHIFT
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {h.shiftDate ? new Date(h.shiftDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        Census: {h.totalInpatients ?? 0} Inpatients
                      </span>
                      {(h.criticalPatientsCount ?? 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-600 font-bold">
                          {h.criticalPatientsCount} Critical Patients
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Outgoing: <span className="font-semibold text-foreground">{h.outgoingNurse}</span>
                      {h.incomingNurse ? <> &rarr; Incoming: <span className="font-semibold text-foreground">{h.incomingNurse}</span></> : ""}
                    </div>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ward Clinical Summary:</div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{h.handoverSummary}</p>
                  </div>

                  {h.pendingTasksSummary && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                      <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Action Items Handed Over:</div>
                      <p className="text-xs text-foreground/90 font-medium">{h.pendingTasksSummary}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-muted mb-2 opacity-50" />
                <p className="font-semibold text-sm">No shift handovers documented yet.</p>
                <p className="text-xs">Click "End of Shift Handover" to record the shift report for the incoming nurse.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Hospital Safety Incidents Table */}
      {activeTab === "INCIDENTS" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {incidents.length > 0 ? (
              incidents.map((inc) => (
                <div key={inc.id} className="p-5 space-y-3 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        inc.severity === "SEVERE"
                          ? "bg-red-500 text-white"
                          : inc.severity === "MODERATE"
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {inc.severity}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {inc.incidentType.replace("_", " ")}
                      </span>
                      {inc.patientName && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          Patient: {inc.patientName} ({inc.patientUhid})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-semibold">
                        {inc.investigationStatus}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {inc.reportedAt ? new Date(inc.reportedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/90">{inc.description}</p>

                  {inc.immediateActionTaken && (
                    <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl">
                      <span className="font-semibold text-foreground">Immediate Action Taken: </span>
                      {inc.immediateActionTaken}
                    </div>
                  )}

                  <div className="text-[11px] text-muted-foreground text-right">
                    Reported by: {inc.reportedBy}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <ShieldAlert className="w-10 h-10 mx-auto text-muted mb-2 opacity-50" />
                <p className="font-semibold text-sm">No safety incidents reported.</p>
                <p className="text-xs">Any near-misses, falls, or equipment issues can be filed here for patient safety auditing.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Shift Handover */}
      {handoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> End of Shift Handover
              </h3>
              <button
                onClick={() => setHandoverModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHandover} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Shift Type</label>
                  <select
                    value={handoverForm.shiftType}
                    onChange={(e) => setHandoverForm({ ...handoverForm, shiftType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold"
                  >
                    <option value="MORNING">Morning Shift (07:00 - 15:00)</option>
                    <option value="EVENING">Evening Shift (15:00 - 23:00)</option>
                    <option value="NIGHT">Night Shift (23:00 - 07:00)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Incoming Nurse</label>
                  <input
                    type="text"
                    required
                    value={handoverForm.incomingNurse}
                    onChange={(e) => setHandoverForm({ ...handoverForm, incomingNurse: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                    placeholder="e.g. nurse.night@medicore.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Inpatient Census</label>
                  <input
                    type="number"
                    min="0"
                    value={handoverForm.totalInpatients}
                    onChange={(e) => setHandoverForm({ ...handoverForm, totalInpatients: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Critical Patients Count</label>
                  <input
                    type="number"
                    min="0"
                    value={handoverForm.criticalPatientsCount}
                    onChange={(e) => setHandoverForm({ ...handoverForm, criticalPatientsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Clinical Summary & Ward Events</label>
                <textarea
                  rows={4}
                  required
                  value={handoverForm.handoverSummary}
                  onChange={(e) => setHandoverForm({ ...handoverForm, handoverSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="Summarize ward admissions, discharges, patient deterioration events, and major treatments..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pending Tasks & Action Items</label>
                <input
                  type="text"
                  value={handoverForm.pendingTasksSummary}
                  onChange={(e) => setHandoverForm({ ...handoverForm, pendingTasksSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. 22:00 IV antibiotic due, post-op drainage bag emptying at 00:00"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingHandover}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingHandover ? "Submitting..." : "Submit Handover"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Incident */}
      {incidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" /> File Hospital Safety Incident
              </h3>
              <button
                onClick={() => setIncidentModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Associated Inpatient (optional)</label>
                <select
                  value={incidentForm.patientId}
                  onChange={(e) => setIncidentForm({ ...incidentForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="">No specific patient (Ward/Equipment incident)</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid}) {p.currentBedNumber ? `• Bed ${p.currentBedNumber}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Incident Type</label>
                  <select
                    value={incidentForm.incidentType}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  >
                    <option value="PATIENT_FALL">Patient Fall / Slipping</option>
                    <option value="MEDICATION_ERROR">Medication Near-Miss / Error</option>
                    <option value="EQUIPMENT_FAILURE">Medical Device / Equipment Malfunction</option>
                    <option value="ADVERSE_DRUG_REACTION">Severe Drug / Transfusion Reaction</option>
                    <option value="INJURY">Skin Tear / Infiltration / Pressure Injury</option>
                    <option value="OTHER">Other Safety Event</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Severity</label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-red-600"
                  >
                    <option value="NEAR_MISS">Near Miss (Intercepted)</option>
                    <option value="MINOR">Minor (No Harm)</option>
                    <option value="MODERATE">Moderate (Temporary Harm)</option>
                    <option value="SEVERE">Severe (Critical Harm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="Detail precisely what occurred, equipment involved, and patient's status..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Immediate Actions Taken</label>
                <input
                  type="text"
                  value={incidentForm.immediateActionTaken}
                  onChange={(e) => setIncidentForm({ ...incidentForm, immediateActionTaken: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. Attending physician alerted, ice pack applied, vitals checked stable"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIncidentModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingIncident}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow disabled:opacity-50"
                >
                  {savingIncident ? "Filing Report..." : "Submit Incident Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
