"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ClipboardCheck, Plus, RefreshCw, AlertTriangle, ShieldAlert,
  Clock, CheckCircle2, User, Activity, FileCheck, Check, Sparkles
} from "lucide-react";
import {
  nurseApi, NursingAssessmentDto, patientsApi, PatientDto
} from "@medicore/api";
import { toast } from "sonner";

export default function ClinicalAssessmentsPage() {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [assessments, setAssessments] = useState<NursingAssessmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Assessment Form Tab: "MORSE" | "BRADEN" | "PRE_OP" | "DISCHARGE"
  const [activeScale, setActiveScale] = useState<"MORSE" | "BRADEN" | "PRE_OP" | "DISCHARGE">("MORSE");
  const [submitting, setSubmitting] = useState(false);

  // Morse Fall Scale State
  const [morse, setMorse] = useState({
    historyOfFalls: 0, // 0 or 25
    secondaryDiagnosis: 0, // 0 or 15
    ambulatoryAid: 0, // 0, 15, or 30
    ivTherapy: 0, // 0 or 20
    gait: 0, // 0, 10, or 20
    mentalStatus: 0, // 0 or 15
  });

  // Braden Scale State (1 to 4 each)
  const [braden, setBraden] = useState({
    sensoryPerception: 4,
    moisture: 4,
    activity: 4,
    mobility: 4,
    nutrition: 3,
    frictionShear: 3,
  });

  // Pre-Op Checklist State
  const [preOp, setPreOp] = useState({
    npoVerified: false,
    consentSigned: false,
    surgicalSiteMarked: false,
    jewelryRemoved: false,
    premedicationGiven: false,
    vitalsRecorded: false,
    idBandVerified: false,
  });

  // Discharge Checklist State
  const [dischargeCheck, setDischargeCheck] = useState({
    dischargeSummaryGiven: false,
    medicationsReconciled: false,
    ivCannulaRemoved: false,
    woundDressingClean: false,
    patientEducationComplete: false,
    transportArranged: false,
  });

  const [clinicalNotes, setClinicalNotes] = useState("");

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await patientsApi.search("");
      const pts = res.data?.data || [];
      setPatients(pts);
      if (pts.length > 0 && !selectedPatientId && pts[0].id) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (err) {
      console.error("Failed to load patients", err);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async (patientId: string) => {
    if (!patientId) return;
    try {
      const res = await nurseApi.getPatientAssessments(patientId);
      if (res.data) setAssessments(res.data);
    } catch (err) {
      console.error("Failed to load assessments", err);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadAssessments(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Computed Morse Fall Score
  const morseScore = useMemo(() => {
    return (
      morse.historyOfFalls +
      morse.secondaryDiagnosis +
      morse.ambulatoryAid +
      morse.ivTherapy +
      morse.gait +
      morse.mentalStatus
    );
  }, [morse]);

  const morseRiskLevel = useMemo(() => {
    if (morseScore >= 45) return { label: "HIGH RISK", color: "text-red-600 bg-red-500/10 border-red-500/30" };
    if (morseScore >= 25) return { label: "MODERATE RISK", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" };
    return { label: "LOW RISK", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" };
  }, [morseScore]);

  // Computed Braden Score
  const bradenScore = useMemo(() => {
    return (
      braden.sensoryPerception +
      braden.moisture +
      braden.activity +
      braden.mobility +
      braden.nutrition +
      braden.frictionShear
    );
  }, [braden]);

  const bradenRiskLevel = useMemo(() => {
    if (bradenScore <= 9) return { label: "VERY HIGH RISK", color: "text-red-600 bg-red-500/10 border-red-500/30" };
    if (bradenScore <= 12) return { label: "HIGH RISK", color: "text-red-500 bg-red-500/10 border-red-500/30" };
    if (bradenScore <= 14) return { label: "MODERATE RISK", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" };
    if (bradenScore <= 18) return { label: "MILD RISK", color: "text-blue-600 bg-blue-500/10 border-blue-500/30" };
    return { label: "NO RISK", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" };
  }, [bradenScore]);

  const handleSubmitAssessment = async () => {
    if (!selectedPatientId) {
      toast.error("Please select an inpatient");
      return;
    }

    try {
      setSubmitting(true);
      if (activeScale === "MORSE") {
        await nurseApi.recordAssessment({
          patientId: selectedPatientId,
          assessmentType: "FALL_RISK_MORSE",
          totalScore: morseScore,
          findingsJson: JSON.stringify(morse),
          clinicalSummary: clinicalNotes || `Morse Fall Scale evaluated: ${morseScore} points (${morseRiskLevel.label})`,
        });
        toast.success(`Morse Fall Risk saved (${morseRiskLevel.label})`);
      } else if (activeScale === "BRADEN") {
        await nurseApi.recordAssessment({
          patientId: selectedPatientId,
          assessmentType: "PRESSURE_ULCER_BRADEN",
          totalScore: bradenScore,
          findingsJson: JSON.stringify(braden),
          clinicalSummary: clinicalNotes || `Braden Scale evaluated: ${bradenScore} points (${bradenRiskLevel.label})`,
        });
        toast.success(`Braden Pressure Ulcer Risk saved (${bradenRiskLevel.label})`);
      } else if (activeScale === "PRE_OP") {
        await nurseApi.recordAssessment({
          patientId: selectedPatientId,
          assessmentType: "PRE_OP_CHECKLIST",
          findingsJson: JSON.stringify(preOp),
          clinicalSummary: clinicalNotes || "Pre-operative surgical safety checklist verified by nursing staff.",
        });
        toast.success("Pre-Operative checklist completed");
      } else if (activeScale === "DISCHARGE") {
        await nurseApi.recordAssessment({
          patientId: selectedPatientId,
          assessmentType: "DISCHARGE_CHECKLIST",
          findingsJson: JSON.stringify(dischargeCheck),
          clinicalSummary: clinicalNotes || "Nursing discharge preparation & patient handover verified.",
        });
        toast.success("Discharge checklist saved");
      }

      setClinicalNotes("");
      loadAssessments(selectedPatientId);
    } catch (err: any) {
      console.error("Failed to save assessment", err);
      toast.error(err?.response?.data?.error?.message || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Clinical Risk Scales & Nursing Checklists
              </h1>
              <p className="text-sm text-muted-foreground">
                Morse Fall Risk Scale, Braden Pressure Ulcer Scale, Pre-Operative and Discharge Checklists
              </p>
            </div>
          </div>
        </div>

        {/* Patient Picker */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground mb-1">Select Inpatient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none min-w-[220px]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.uhid}) {p.currentBedNumber ? `• Bed ${p.currentBedNumber}` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadAssessments(selectedPatientId)}
            className="p-2.5 mt-5 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Assessments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left (2 cols), Past Assessments Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Assessment Questionnaire */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Assessment Scale Selection Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-4 overflow-x-auto">
            <button
              onClick={() => setActiveScale("MORSE")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeScale === "MORSE"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Morse Fall Scale
            </button>
            <button
              onClick={() => setActiveScale("BRADEN")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeScale === "BRADEN"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Braden Scale (Ulcer)
            </button>
            <button
              onClick={() => setActiveScale("PRE_OP")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeScale === "PRE_OP"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Pre-Op Safety Checklist
            </button>
            <button
              onClick={() => setActiveScale("DISCHARGE")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeScale === "DISCHARGE"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Discharge Preparation
            </button>
          </div>

          {/* 1. MORSE FALL SCALE FORM */}
          {activeScale === "MORSE" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Morse Fall Scale Evaluation</h3>
                  <p className="text-xs text-muted-foreground">Standardized patient fall risk assessment</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${morseRiskLevel.color}`}>
                  Score: {morseScore} • {morseRiskLevel.label}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">1. History of Falling (past 3 months)</label>
                  <select
                    value={morse.historyOfFalls}
                    onChange={(e) => setMorse({ ...morse, historyOfFalls: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={0}>No (0 pts)</option>
                    <option value={25}>Yes (25 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">2. Secondary Diagnosis (&ge; 2 medical diagnoses)</label>
                  <select
                    value={morse.secondaryDiagnosis}
                    onChange={(e) => setMorse({ ...morse, secondaryDiagnosis: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={0}>No (0 pts)</option>
                    <option value={15}>Yes (15 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">3. Ambulatory Aid</label>
                  <select
                    value={morse.ambulatoryAid}
                    onChange={(e) => setMorse({ ...morse, ambulatoryAid: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={0}>None / Bed Rest / Nurse Assist (0 pts)</option>
                    <option value={15}>Crutches / Cane / Walker (15 pts)</option>
                    <option value={30}>Furniture Holding / Clutches Furniture (30 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">4. IV / Heparin Lock</label>
                  <select
                    value={morse.ivTherapy}
                    onChange={(e) => setMorse({ ...morse, ivTherapy: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={0}>No (0 pts)</option>
                    <option value={20}>Yes (20 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">5. Gait / Transferring</label>
                  <select
                    value={morse.gait}
                    onChange={(e) => setMorse({ ...morse, gait: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={0}>Normal / Bedridden / Immobile (0 pts)</option>
                    <option value={10}>Weak / Stooped / Shuffling (10 pts)</option>
                    <option value={20}>Impaired / Needs assistance (20 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">6. Mental Status</label>
                  <select
                    value={morse.mentalStatus}
                    onChange={(e) => setMorse({ ...morse, mentalStatus: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={0}>Oriented to own ability (0 pts)</option>
                    <option value={15}>Overestimates or forgets limitations (15 pts)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. BRADEN PRESSURE ULCER SCALE */}
          {activeScale === "BRADEN" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Braden Pressure Ulcer Risk Scale</h3>
                  <p className="text-xs text-muted-foreground">Assesses sensory, moisture, mobility, and friction</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${bradenRiskLevel.color}`}>
                  Score: {bradenScore} • {bradenRiskLevel.label}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">1. Sensory Perception</label>
                  <select
                    value={braden.sensoryPerception}
                    onChange={(e) => setBraden({ ...braden, sensoryPerception: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={1}>1. Completely Limited</option>
                    <option value={2}>2. Very Limited</option>
                    <option value={3}>3. Slightly Limited</option>
                    <option value={4}>4. No Impairment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">2. Moisture Exposure</label>
                  <select
                    value={braden.moisture}
                    onChange={(e) => setBraden({ ...braden, moisture: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={1}>1. Constantly Moist</option>
                    <option value={2}>2. Very Moist</option>
                    <option value={3}>3. Occasionally Moist</option>
                    <option value={4}>4. Rarely Moist</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">3. Physical Activity</label>
                  <select
                    value={braden.activity}
                    onChange={(e) => setBraden({ ...braden, activity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={1}>1. Bedfast</option>
                    <option value={2}>2. Chairfast</option>
                    <option value={3}>3. Walks Occasionally</option>
                    <option value={4}>4. Walks Frequently</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">4. Mobility Status</label>
                  <select
                    value={braden.mobility}
                    onChange={(e) => setBraden({ ...braden, mobility: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={1}>1. Completely Immobile</option>
                    <option value={2}>2. Very Limited</option>
                    <option value={3}>3. Slightly Limited</option>
                    <option value={4}>4. No Limitation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">5. Nutrition Pattern</label>
                  <select
                    value={braden.nutrition}
                    onChange={(e) => setBraden({ ...braden, nutrition: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={1}>1. Very Poor</option>
                    <option value={2}>2. Probably Inadequate</option>
                    <option value={3}>3. Adequate</option>
                    <option value={4}>4. Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">6. Friction & Shear</label>
                  <select
                    value={braden.frictionShear}
                    onChange={(e) => setBraden({ ...braden, frictionShear: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  >
                    <option value={1}>1. Problem</option>
                    <option value={2}>2. Potential Problem</option>
                    <option value={3}>3. No Apparent Problem</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. PRE-OP CHECKLIST */}
          {activeScale === "PRE_OP" && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-xl border border-border">
                <h3 className="font-bold text-sm text-foreground">Pre-Operative / Procedure Nursing Checklist</h3>
                <p className="text-xs text-muted-foreground">Mandatory safety verification prior to surgical or invasive procedures</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "npoVerified", label: "NPO (Nothing by Mouth) Status Verified" },
                  { key: "consentSigned", label: "Informed Surgical Consent Signed & Documented" },
                  { key: "surgicalSiteMarked", label: "Surgical Site Marked by Attending Surgeon" },
                  { key: "jewelryRemoved", label: "Jewelry, Dentures & Prosthetics Removed" },
                  { key: "premedicationGiven", label: "Pre-Operative Medications Administered (if ordered)" },
                  { key: "vitalsRecorded", label: "Baseline Vitals Checked & Within Operating Tolerances" },
                  { key: "idBandVerified", label: "Patient Identity Band Verified with Attendant/Chart" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={(preOp as any)[item.key]}
                      onChange={(e) => setPreOp({ ...preOp, [item.key]: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs font-semibold text-foreground">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 4. DISCHARGE CHECKLIST */}
          {activeScale === "DISCHARGE" && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-xl border border-border">
                <h3 className="font-bold text-sm text-foreground">Nursing Discharge Preparation Checklist</h3>
                <p className="text-xs text-muted-foreground">Verification protocol prior to patient leaving the ward</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "dischargeSummaryGiven", label: "Doctor's Discharge Summary Handed to Patient" },
                  { key: "medicationsReconciled", label: "Take-Home Medications Explained & Dispensed" },
                  { key: "ivCannulaRemoved", label: "IV Cannula & Lines Removed with Dressing Applied" },
                  { key: "woundDressingClean", label: "Surgical / Wound Dressing Checked and Clean" },
                  { key: "patientEducationComplete", label: "Post-Discharge Care & Red-Flag Warnings Explained" },
                  { key: "transportArranged", label: "Patient Belongings Returned & Transport Confirmed" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={(dischargeCheck as any)[item.key]}
                      onChange={(e) => setDischargeCheck({ ...dischargeCheck, [item.key]: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs font-semibold text-foreground">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Summary Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Nursing Summary / Intervention Plan</label>
            <input
              type="text"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
              placeholder="e.g. Non-skid footwear provided, call bell within reach, bed in lowest position."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmitAssessment}
              disabled={submitting || !selectedPatientId}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {submitting ? "Saving Assessment..." : "Save Assessment"}
            </button>
          </div>
        </div>

        {/* Right Column: Historical Assessments for Inpatient */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Assessment Timeline</h2>
              <p className="text-xs text-muted-foreground">Historical records for selected patient</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-muted rounded-full">
              {assessments.length}
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
            {assessments && assessments.length > 0 ? (
              assessments.map((a) => (
                <div key={a.id} className="p-3.5 bg-background border border-border rounded-xl space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {a.assessmentType.replace("_", " ")}
                    </span>
                    {a.riskLevel && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        a.riskLevel.includes("HIGH")
                          ? "bg-red-500/15 text-red-600"
                          : a.riskLevel.includes("MODERATE")
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-emerald-500/15 text-emerald-600"
                      }`}>
                        {a.riskLevel}
                      </span>
                    )}
                  </div>

                  {a.totalScore !== undefined && a.totalScore !== null && (
                    <div className="text-xs font-mono font-bold text-foreground">
                      Calculated Score: {a.totalScore} pts
                    </div>
                  )}

                  {a.clinicalSummary && (
                    <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg">
                      {a.clinicalSummary}
                    </p>
                  )}

                  <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                    <span>Nurse: {a.assessedBy}</span>
                    <span>{a.assessedAt ? new Date(a.assessedAt).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <FileCheck className="w-8 h-8 mx-auto text-muted mb-2 opacity-50" />
                <p className="text-xs">No clinical assessments logged for this patient yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
