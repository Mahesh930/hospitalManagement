"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  HeartPulse, Search, RefreshCw, AlertTriangle, ShieldAlert,
  Clock, CheckCircle2, User, Stethoscope, ChevronRight, Activity,
  Sparkles, Bed, Pill, Droplets, BellRing, ClipboardCheck,
  FileSpreadsheet, ArrowUpRight, Eye, AlertCircle, X, ShieldCheck
} from "lucide-react";
import {
  nurseApi, QueueManagementDto, VitalSignsDto, WardDto,
  PatientDto, patientsApi, InpatientSummaryDto
} from "@medicore/api";
import { toast } from "sonner";

export default function NurseStationDashboard() {
  const [activeTab, setActiveTab] = useState<"inpatients" | "triage">("inpatients");

  // Assigned ward & inpatients
  const [assignedWard, setAssignedWard] = useState<WardDto | null>(null);
  const [inpatients, setInpatients] = useState<PatientDto[]>([]);
  const [loadingWard, setLoadingWard] = useState(true);
  const [inpatientSearch, setInpatientSearch] = useState("");

  // Triage state
  const [queue, setQueue] = useState<QueueManagementDto[]>([]);
  const [loadingTriage, setLoadingTriage] = useState(true);
  const [triageSearch, setTriageSearch] = useState("");
  const [debouncedTriageSearch, setDebouncedTriageSearch] = useState("");

  // Triage vitals modal
  const [selectedTriagePatient, setSelectedTriagePatient] = useState<QueueManagementDto | null>(null);
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<VitalSignsDto>({
    patientId: "",
    bloodPressure: "120/80",
    pulseRate: 72,
    temperature: 98.6,
    spo2: 98,
    respiratoryRate: 16,
    bloodSugarMgDl: 110,
    painScore: 0,
    heightCm: 170,
    weightKg: 70,
    chiefComplaint: "",
  });

  // Inpatient 360 Summary Modal
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedSummaryPatient, setSelectedSummaryPatient] = useState<InpatientSummaryDto | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTriageSearch(triageSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [triageSearch]);

  // Load ward and patient data
  const loadWardData = async () => {
    try {
      setLoadingWard(true);
      const [wardRes, ptsRes] = await Promise.all([
        nurseApi.getAssignedWard(),
        patientsApi.search(""),
      ]);
      if (wardRes.data) setAssignedWard(wardRes.data);
      if (ptsRes.data?.data) {
        setInpatients(ptsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load ward inpatient data", err);
    } finally {
      setLoadingWard(false);
    }
  };

  // Load triage queue
  const loadTriageQueue = async () => {
    try {
      setLoadingTriage(true);
      const res = await nurseApi.getTriageQueue();
      if (res.data) setQueue(res.data);
    } catch (err) {
      console.error("Failed to load triage queue", err);
    } finally {
      setLoadingTriage(false);
    }
  };

  const refreshAll = () => {
    loadWardData();
    loadTriageQueue();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Filtered lists
  const filteredInpatients = useMemo(() => {
    if (!inpatientSearch.trim()) return inpatients;
    const q = inpatientSearch.toLowerCase();
    return inpatients.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        (p.lastName && p.lastName.toLowerCase().includes(q)) ||
        p.uhid?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q)
    );
  }, [inpatients, inpatientSearch]);

  const filteredQueue = useMemo(() => {
    if (!debouncedTriageSearch.trim()) return queue;
    const q = debouncedTriageSearch.toLowerCase();
    return queue.filter(
      (item) =>
        item.patientName?.toLowerCase().includes(q) ||
        item.patientUhid?.toLowerCase().includes(q) ||
        item.tokenNumber?.toLowerCase().includes(q) ||
        item.doctorName?.toLowerCase().includes(q)
    );
  }, [queue, debouncedTriageSearch]);

  // Open 360 Inpatient Clinical Summary
  const handleOpenSummary = async (patientId: string) => {
    try {
      setLoadingSummary(true);
      setSummaryModalOpen(true);
      const res = await nurseApi.getInpatientSummary(patientId);
      if (res.data) {
        setSelectedSummaryPatient(res.data);
      }
    } catch (err: unknown) {
      toast.error("Could not fetch clinical summary: " + (err instanceof Error ? err.message : "Error"));
      setSummaryModalOpen(false);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Open Triage Vitals Modal
  const openVitalsModal = (patient: QueueManagementDto) => {
    setSelectedTriagePatient(patient);
    setVitalsForm({
      patientId: patient.patientId,
      patientName: patient.patientName,
      patientUhid: patient.patientUhid,
      bloodPressure: "120/80",
      pulseRate: 72,
      temperature: 98.6,
      spo2: 98,
      respiratoryRate: 16,
      bloodSugarMgDl: 110,
      painScore: 0,
      heightCm: 170,
      weightKg: 70,
      chiefComplaint: "",
    });
    setVitalsModalOpen(true);
  };

  // Submit Triage Vitals
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsForm.patientId) return;

    try {
      setSavingVitals(true);
      const res = await nurseApi.recordTriageVitals(vitalsForm);
      if (res.success) {
        toast.success("Vitals saved! Patient moved to doctor waiting queue.");
        setVitalsModalOpen(false);
        await loadTriageQueue();
      }
    } catch (err: unknown) {
      toast.error("Failed to save vitals: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setSavingVitals(false);
    }
  };

  const bmi =
    vitalsForm.heightCm && vitalsForm.weightKg && vitalsForm.heightCm > 0
      ? Math.round((vitalsForm.weightKg / Math.pow(vitalsForm.heightCm / 100, 2)) * 10) / 10
      : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>Hospital ERP • Nurse Station Command Center</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {assignedWard ? `${assignedWard.name} (${assignedWard.wardType})` : "General Inpatient & Clinical Station"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time patient census, bedside monitoring, triage queue, and unified inpatient clinical management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[11px] font-semibold text-foreground">Active Shift: MORNING</span>
            <span className="text-[10px] text-muted-foreground">Standard Care Protocol Enforced</span>
          </div>
          <button
            onClick={refreshAll}
            disabled={loadingWard || loadingTriage}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-background border border-border rounded-xl hover:bg-muted transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingWard || loadingTriage ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Access Function Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/nurse/beds"
          className="group p-4 bg-card border border-border rounded-2xl hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-teal-600 transition-colors">Wards & Beds</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">Admit, Transfer, Discharge</p>
          </div>
        </Link>

        <Link
          href="/nurse/emar"
          className="group p-4 bg-card border border-border rounded-2xl hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-teal-600 transition-colors">eMAR Meds</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">Administer & Dose Records</p>
          </div>
        </Link>

        <Link
          href="/nurse/fluid-balance"
          className="group p-4 bg-card border border-border rounded-2xl hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-3">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-teal-600 transition-colors">Fluid Balance</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">Intake/Output & Catheter</p>
          </div>
        </Link>

        <Link
          href="/nurse/tasks"
          className="group p-4 bg-card border border-border rounded-2xl hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-teal-600 transition-colors">Tasks & Alert</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">Doctor Orders & Escalation</p>
          </div>
        </Link>

        <Link
          href="/nurse/assessments"
          className="group p-4 bg-card border border-border rounded-2xl hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-teal-600 transition-colors">Assessments</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">Fall Risk, Braden, Pre-Op</p>
          </div>
        </Link>

        <Link
          href="/nurse/handover"
          className="group p-4 bg-card border border-border rounded-2xl hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-teal-600 transition-colors">Shift Handover</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">SBAR & Incident Reports</p>
          </div>
        </Link>
      </div>

      {/* Main Switch Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("inpatients")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "inpatients"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-card text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <Bed className="w-4 h-4" />
          Ward Inpatients Cockpit ({inpatients.length})
        </button>

        <button
          onClick={() => setActiveTab("triage")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "triage"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-card text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <Activity className="w-4 h-4" />
          OPD Clinical Triage Console ({queue.length})
        </button>
      </div>

      {/* TAB 1: Ward Inpatients Cockpit */}
      {activeTab === "inpatients" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inpatients by name, UHID, phone..."
                value={inpatientSearch}
                onChange={(e) => setInpatientSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:border-teal-500"
              />
            </div>
            <span className="text-xs text-muted-foreground self-start sm:self-auto">
              Displaying {filteredInpatients.length} admitted inpatients
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {loadingWard ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                Loading ward inpatients census...
              </div>
            ) : filteredInpatients.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground text-sm">No Inpatients Found</p>
                <p className="text-[11px]">No active patients admitted matching your search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Patient UHID</th>
                      <th className="py-3 px-4">Patient Name & Demographics</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredInpatients.map((pt) => (
                      <tr key={pt.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {pt.uhid}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{pt.name} {pt.lastName || ""}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {pt.gender || "—"} • {pt.bloodGroup ? `Blood: ${pt.bloodGroup}` : "Blood: N/A"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted-foreground">
                          {pt.phone || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            INPATIENT CARE
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => pt.id && handleOpenSummary(pt.id)}
                            className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Clinical 360°
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OPD Clinical Triage Console */}
      {activeTab === "triage" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-card border border-border px-4 py-2.5 rounded-xl">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search triage queue by patient name, UHID, token number, or doctor..."
              value={triageSearch}
              onChange={(e) => setTriageSearch(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            {triageSearch && (
              <button onClick={() => setTriageSearch("")} className="text-xs text-muted-foreground hover:text-foreground">
                Clear
              </button>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Waiting Outpatients ({filteredQueue.length})</span>
              </div>
            </div>

            {loadingTriage ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                Loading live triage queue...
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-foreground text-sm">No Patients in Triage Queue</p>
                <p className="text-[11px]">All checked-in patients have their vitals recorded or no patients are waiting.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Token</th>
                      <th className="py-3 px-4">Patient Name & UHID</th>
                      <th className="py-3 px-4">Assigned Doctor</th>
                      <th className="py-3 px-4">Check-In Time</th>
                      <th className="py-3 px-4">Priority Status</th>
                      <th className="py-3 px-4 text-right">Triage Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredQueue.map((item) => (
                      <tr key={item.visitId} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {item.tokenNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{item.patientName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{item.patientUhid}</p>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">{item.doctorName}</td>
                        <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                          {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              item.priorityRank === 0
                                ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                                : "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                            }`}
                          >
                            {item.priorityRank === 0 ? "EMERGENCY" : "Standard"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openVitalsModal(item)}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all"
                          >
                            Record Vitals & Triage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Inpatient Clinical 360° Drawer / Modal */}
      {summaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-foreground">Inpatient Clinical 360° Overview</h3>
              </div>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingSummary ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                Fetching live inpatient records...
              </div>
            ) : selectedSummaryPatient ? (
              <div className="space-y-6 text-xs">
                {/* Patient Header Card */}
                <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground">{selectedSummaryPatient.name}</h4>
                    <p className="text-muted-foreground mt-0.5">
                      UHID: <span className="font-mono font-bold text-foreground">{selectedSummaryPatient.uhid}</span> •
                      Gender: <span className="text-foreground">{selectedSummaryPatient.gender || "—"}</span> •
                      Blood: <span className="text-foreground">{selectedSummaryPatient.bloodGroup || "—"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold rounded-full border border-teal-500/20 text-xs">
                      {selectedSummaryPatient.currentWardName || "General Ward"} • Bed {selectedSummaryPatient.currentBedNumber || "Active"}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Admitting Doctor: <span className="font-semibold text-foreground">{selectedSummaryPatient.admittingDoctorName || "Assigned On-Duty"}</span>
                    </p>
                  </div>
                </div>

                {/* Allergies Alert */}
                {selectedSummaryPatient.allergies && selectedSummaryPatient.allergies.length > 0 && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold text-rose-700 dark:text-rose-300">Documented Allergies: </span>
                      <span className="text-rose-800 dark:text-rose-200">
                        {selectedSummaryPatient.allergies.join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3-Column Clinical Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Column 1: Latest Vitals */}
                  <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-2">
                      <Activity className="w-4 h-4 text-teal-600" />
                      <span>Latest Vital Signs</span>
                    </div>
                    {selectedSummaryPatient.latestVitals ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Blood Pressure:</span>
                          <span className="font-mono font-bold text-foreground">{selectedSummaryPatient.latestVitals.bloodPressure || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pulse Rate:</span>
                          <span className="font-mono font-bold text-foreground">{selectedSummaryPatient.latestVitals.pulseRate ? `${selectedSummaryPatient.latestVitals.pulseRate} bpm` : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SpO2:</span>
                          <span className="font-mono font-bold text-foreground">{selectedSummaryPatient.latestVitals.spo2 ? `${selectedSummaryPatient.latestVitals.spo2}%` : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Temperature:</span>
                          <span className="font-mono font-bold text-foreground">{selectedSummaryPatient.latestVitals.temperature ? `${selectedSummaryPatient.latestVitals.temperature}°F` : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Blood Sugar:</span>
                          <span className="font-mono font-bold text-foreground">{selectedSummaryPatient.latestVitals.bloodSugarMgDl ? `${selectedSummaryPatient.latestVitals.bloodSugarMgDl} mg/dL` : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pain Score:</span>
                          <span className="font-mono font-bold text-foreground">{selectedSummaryPatient.latestVitals.painScore ?? 0} / 10</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic py-4 text-center">No vital signs logged yet.</p>
                    )}
                  </div>

                  {/* Column 2: 24h Fluid Balance */}
                  <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-2">
                      <Droplets className="w-4 h-4 text-sky-600" />
                      <span>24h Fluid Balance (I/O)</span>
                    </div>
                    {selectedSummaryPatient.fluidBalanceSummary ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Intake:</span>
                          <span className="font-mono font-bold text-sky-600">+{selectedSummaryPatient.fluidBalanceSummary.totalIntakeMl} mL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Output:</span>
                          <span className="font-mono font-bold text-amber-600">-{selectedSummaryPatient.fluidBalanceSummary.totalOutputMl} mL</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1">
                          <span className="font-semibold text-foreground">Net Balance:</span>
                          <span className="font-mono font-bold text-foreground">
                            {selectedSummaryPatient.fluidBalanceSummary.netBalanceMl > 0 ? `+${selectedSummaryPatient.fluidBalanceSummary.netBalanceMl}` : selectedSummaryPatient.fluidBalanceSummary.netBalanceMl} mL
                          </span>
                        </div>
                        {selectedSummaryPatient.fluidBalanceSummary.isFluidOverloadRisk && (
                          <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Fluid Overload Risk (&gt;1500mL Net)
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic py-4 text-center">No fluid balance recorded.</p>
                    )}
                  </div>

                  {/* Column 3: Active Orders & Tasks */}
                  <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-2">
                      <BellRing className="w-4 h-4 text-amber-600" />
                      <span>Medications & Tasks</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pending Meds Due:</span>
                        <span className="font-mono font-bold text-foreground">
                          {selectedSummaryPatient.pendingMedications?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Care Tasks:</span>
                        <span className="font-mono font-bold text-foreground">
                          {selectedSummaryPatient.activeTasks?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Doctor Escalations:</span>
                        <span className="font-mono font-bold text-rose-600">
                          {selectedSummaryPatient.activeEscalations?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Navigation Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border">
                  <Link
                    href="/nurse/emar"
                    className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-colors"
                  >
                    Open eMAR Dose Console
                  </Link>
                  <Link
                    href="/nurse/fluid-balance"
                    className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-colors"
                  >
                    Log Fluid / Bedside Care
                  </Link>
                  <Link
                    href="/nurse/tasks"
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Manage Tasks & Escalations
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 2: Record Vitals Modal */}
      {vitalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Record Patient Vitals & Clinical Triage</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Patient: <span className="font-semibold text-foreground">{selectedTriagePatient?.patientName}</span> • UHID: <span className="font-mono text-foreground">{selectedTriagePatient?.patientUhid}</span>
                </p>
              </div>
              <button
                onClick={() => setVitalsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* BP */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    required
                    placeholder="120/80"
                    value={vitalsForm.bloodPressure || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Pulse */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.pulseRate || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulseRate: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* SpO2 */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.spo2 || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vitalsForm.temperature || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Resp Rate (breaths/min)</label>
                  <input
                    type="number"
                    value={vitalsForm.respiratoryRate || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Blood Sugar */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Blood Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={vitalsForm.bloodSugarMgDl || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodSugarMgDl: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={vitalsForm.heightCm || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heightCm: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={vitalsForm.weightKg || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Pain Score */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Pain Score (0 - 10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={vitalsForm.painScore ?? 0}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, painScore: parseInt(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Real-time Computed BMI */}
              {bmi && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-teal-700 dark:text-teal-300 font-medium">Computed BMI:</span>
                  <span className="font-bold text-teal-800 dark:text-teal-200 font-mono">
                    {bmi} kg/m² ({bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"})
                  </span>
                </div>
              )}

              {/* Chief Complaints */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Chief Complaints / Triage Notes</label>
                <textarea
                  rows={2}
                  placeholder="Record symptoms, duration, and patient remarks..."
                  value={vitalsForm.chiefComplaint || ""}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, chiefComplaint: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setVitalsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVitals}
                  className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {savingVitals ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HeartPulse className="w-3.5 h-3.5" />}
                  Save Vitals & Send to Doctor Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
