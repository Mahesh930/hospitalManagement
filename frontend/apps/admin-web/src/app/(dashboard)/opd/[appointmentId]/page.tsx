"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  consultationsApi, ConsultationDto, PrescriptionItemDto,
  patientsApi, PatientTimelineDto, appointmentsApi
} from "@medicore/api";
import { toast } from "sonner";
import {
  Stethoscope, ShieldAlert, Plus, Trash2, CheckCircle2, ArrowLeft,
  Activity, Heart, Thermometer, Weight, FileText, Pill, Clock,
  Calendar, User, AlertCircle, History, ChevronRight, X
} from "lucide-react";
import Link from "next/link";

const COMMON_ICD_CODES = [
  { code: "J06.9", label: "Acute upper respiratory infection, unspecified" },
  { code: "R50.9", label: "Fever, unspecified" },
  { code: "I10", label: "Essential (primary) hypertension" },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications" },
  { code: "K21.9", label: "Gastro-esophageal reflux disease without esophagitis" },
  { code: "R05", label: "Cough" },
  { code: "R51", label: "Headache" },
  { code: "J45.909", label: "Unspecified asthma, uncomplicated" },
  { code: "A09", label: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "M54.5", label: "Low back pain" },
];

export default function OpdConsultationConsolePage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timeline, setTimeline] = useState<PatientTimelineDto | null>(null);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);

  // Patient / Consultation Identity
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("Loading patient...");
  const [patientUhid, setPatientUhid] = useState("");
  const [patientAge, setPatientAge] = useState<number | undefined>();
  const [patientGender, setPatientGender] = useState("");
  const [patientBloodGroup, setPatientBloodGroup] = useState("");
  const [allergies, setAllergies] = useState<{ allergen: string; severity: string; reaction: string }[]>([]);

  // Vitals
  const [bloodPressure, setBloodPressure] = useState("120/80");
  const [pulseRate, setPulseRate] = useState<number | "">(72);
  const [temperature, setTemperature] = useState<number | "">(98.6);
  const [weight, setWeight] = useState<number | "">(70);

  // Clinical Examination & Notes
  const [chiefComplaint, setChiefComplaint] = useState("Fever and body ache for 2 days");
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState("");
  const [clinicalExamination, setClinicalExamination] = useState("Chest clear, throat mildly congested, no organomegaly");

  // Diagnosis
  const [icdCode, setIcdCode] = useState("J06.9");
  const [diagnosisNotes, setDiagnosisNotes] = useState("Acute upper respiratory tract infection");
  const [isPrimaryDiagnosis, setIsPrimaryDiagnosis] = useState(true);

  // Prescription Items
  const [items, setItems] = useState<PrescriptionItemDto[]>([
    { medicineName: "Paracetamol 500mg", dosage: "1 tab", frequency: "1-1-1", durationDays: 5, instructions: "After food" },
  ]);

  const [newMedName, setNewMedName] = useState("");
  const [newDosage, setNewDosage] = useState("1 tab");
  const [newFreq, setNewFreq] = useState("1-0-1");
  const [newDuration, setNewDuration] = useState(5);
  const [newInst, setNewInst] = useState("After food");

  // Follow-up & Advice
  const [advice, setAdvice] = useState("Rest, drink warm fluids, avoid cold beverages.");
  const [followUpDays, setFollowUpDays] = useState<number | "">(5);

  // Load existing consultation / appointment data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Try getting existing consultation
        const consultRes = await consultationsApi.getByAppointment(resolvedParams.appointmentId).catch(() => null);
        if (consultRes?.data?.data) {
          const c = consultRes.data.data;
          if (c.patientId) setPatientId(c.patientId);
          if (c.patientName) setPatientName(c.patientName);
          if (c.patientUhid) setPatientUhid(c.patientUhid);
          if (c.bloodPressure) setBloodPressure(c.bloodPressure);
          if (c.pulseRate) setPulseRate(c.pulseRate);
          if (c.temperature) setTemperature(c.temperature);
          if (c.weight) setWeight(c.weight);
          if (c.icdCode) setIcdCode(c.icdCode);
          if (c.diagnosisNotes) setDiagnosisNotes(c.diagnosisNotes);
          if (c.prescription?.advice) setAdvice(c.prescription.advice);
          if (c.prescription?.items && c.prescription.items.length > 0) setItems(c.prescription.items);

          if (c.patientId) {
            loadPatientTimeline(c.patientId);
          }
        } else {
          // If no consultation record yet, lookup appointment to find patient
          const apptRes = await appointmentsApi.getPatientHistory(resolvedParams.appointmentId).catch(() => null);
          // Load patient directly if param is patientId or UUID
          loadPatientTimeline(resolvedParams.appointmentId);
        }
      } catch (err) {
        console.error("Failed to load appointment details", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.appointmentId]);

  const loadPatientTimeline = async (pid: string) => {
    try {
      setTimelineLoading(true);
      const res = await patientsApi.getTimeline(pid).catch(async () => {
        // Fallback: try by UHID or ID lookup
        const p = await patientsApi.getById(pid);
        return await patientsApi.getTimeline(p.data.data.id || pid);
      });

      if (res?.data?.data) {
        const tl = res.data.data;
        setTimeline(tl);
        setPatientId(tl.patientId);
        setPatientName(tl.name);
        setPatientUhid(tl.uhid);
        setPatientAge(tl.age);
        setPatientGender(tl.gender || "");
        setPatientBloodGroup(tl.bloodGroup || "");
        if (tl.allergies) {
          setAllergies(tl.allergies.map(a => ({ allergen: a.allergen, severity: a.severity, reaction: a.reaction })));
        }

        // Pull latest triage vitals if available
        if (tl.recentVitals && tl.recentVitals.length > 0) {
          const latest = tl.recentVitals[0];
          if (latest.bloodPressure) setBloodPressure(latest.bloodPressure);
          if (latest.pulseRate) setPulseRate(latest.pulseRate);
          if (latest.temperature) setTemperature(latest.temperature);
          if (latest.weightKg) setWeight(latest.weightKg);
        }
      }
    } catch {
      // ignore
    } finally {
      setTimelineLoading(false);
    }
  };

  // Allergy safety blocker check
  const checkAllergyConflict = (medName: string) => {
    if (!allergies || allergies.length === 0 || !medName) return null;
    const cleanMed = medName.trim().toLowerCase();
    for (const allergy of allergies) {
      const cleanAllergen = allergy.allergen.trim().toLowerCase();
      if (cleanMed.includes(cleanAllergen) || cleanAllergen.includes(cleanMed)) {
        return allergy;
      }
    }
    return null;
  };

  const addMedicine = () => {
    if (!newMedName.trim()) {
      toast.error("Please enter medication name");
      return;
    }

    const conflict = checkAllergyConflict(newMedName);
    if (conflict) {
      toast.error(
        `🚨 DRUG ALLERGY HARD BLOCK: Patient has a documented allergy to '${conflict.allergen}' (${conflict.severity}). Medication cannot be added.`,
        { duration: 8000 }
      );
      return;
    }

    setItems([
      ...items,
      {
        medicineName: newMedName,
        dosage: newDosage,
        frequency: newFreq,
        durationDays: newDuration,
        instructions: newInst,
      },
    ]);
    setNewMedName("");
    toast.success("Medication added to prescription");
  };

  const removeMedicine = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side hard block verification before dispatching
    for (const item of items) {
      const conflict = checkAllergyConflict(item.medicineName);
      if (conflict) {
        toast.error(
          `🚨 CRITICAL SAFETY BLOCKER: Prescribed medicine '${item.medicineName}' conflicts with patient allergy '${conflict.allergen}'. Remove the drug to proceed.`,
          { duration: 8000 }
        );
        return;
      }
    }

    setLoading(true);

    try {
      const fullAdvice = followUpDays
        ? `${advice} [Follow-up recommended in ${followUpDays} days]`
        : advice;

      const payload: ConsultationDto = {
        appointmentId: resolvedParams.appointmentId,
        patientId: patientId || undefined,
        bloodPressure,
        pulseRate: pulseRate ? Number(pulseRate) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        weight: weight ? Number(weight) : undefined,
        icdCode,
        diagnosisNotes: `${isPrimaryDiagnosis ? "[Primary] " : "[Secondary] "}${diagnosisNotes} | Notes: ${clinicalExamination}`,
        prescription: {
          advice: fullAdvice,
          items,
        },
      };

      const res = await consultationsApi.save(resolvedParams.appointmentId, payload);
      await consultationsApi.complete(res.data.data?.id || "");

      toast.success("Consultation Completed! Patient routed to Pharmacy & Billing queues.");
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error?.response?.data?.error?.message || "Failed to finalize consultation";
      toast.error(`SAFETY BLOCKER / ERROR: ${msg}`, { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header & Patient Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-primary" /> OPD Clinical Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                ACTIVE ENCOUNTER
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Appointment Ref: <span className="font-mono">{resolvedParams.appointmentId}</span>
            </p>
          </div>
        </div>

        {/* Longitudinal Timeline Trigger */}
        <button
          type="button"
          onClick={() => setShowTimelineDrawer(true)}
          className="px-4 py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:bg-secondary/80 transition-all shadow-sm"
        >
          <History className="w-4 h-4 text-primary" />
          View Patient Medical History Timeline ({timeline?.encounters?.length ?? 0})
        </button>
      </div>

      {/* Patient Clinical Summary Banner */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-4 items-center">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">Patient Name</span>
          <span className="text-sm font-bold text-foreground">{patientName}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">UHID</span>
          <span className="text-sm font-mono font-bold text-primary">{patientUhid || "—"}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">Age / Gender</span>
          <span className="text-sm font-semibold text-foreground">{patientAge ? `${patientAge} yrs` : "—"} / {patientGender || "—"}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">Blood Group</span>
          <span className="text-sm font-bold text-rose-500">{patientBloodGroup || "—"}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">Allergy Status</span>
          {allergies.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30 flex items-center gap-1 w-fit">
              <AlertCircle className="w-3 h-3" /> {allergies.length} Documented
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 w-fit">
              No Known Allergies
            </span>
          )}
        </div>
      </div>

      {/* Persistent Red/Amber Allergy Alert Banner (Mandatory PRD requirement) */}
      {allergies.length > 0 && (
        <div className="bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl p-5 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse shrink-0" />
            <span>CRITICAL PATIENT ALLERGY WARNING (HARD BLOCK ACTIVE)</span>
          </div>
          <p className="text-xs text-rose-700/90 dark:text-rose-300/90">
            The patient has documented adverse reactions to the following allergens. Prescribing any of these medications will trigger an automatic hard blocker.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {allergies.map((a, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <span>⚠️ {a.allergen}</span>
                <span className="opacity-80 text-[10px]">({a.severity} • {a.reaction})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Clinical Consultation Form */}
      <form onSubmit={handleSaveAndComplete} className="space-y-6">
        {/* Section 1: Pre-populated Vitals */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Patient Vitals (Triage Synchronized)
            </h2>
            <span className="text-xs text-muted-foreground">Auto-imported from check-in triage</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> BP (mmHg)
              </label>
              <input
                type="text"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                placeholder="120/80"
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-input rounded-xl text-sm font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Pulse (bpm)
              </label>
              <input
                type="number"
                value={pulseRate}
                onChange={(e) => setPulseRate(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="72"
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-input rounded-xl text-sm font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temp (°F)
              </label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="98.6"
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-input rounded-xl text-sm font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                <Weight className="w-3.5 h-3.5 text-blue-500" /> Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="70"
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-input rounded-xl text-sm font-bold font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Examination & Chief Complaint */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Clinical Examination &amp; Notes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Chief Complaint</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Fever, body pain, dry cough..."
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">History of Present Illness (HPI)</label>
              <input
                type="text"
                value={historyOfPresentIllness}
                onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                placeholder="Symptoms onset, duration, previous medication..."
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Doctor Examination Findings / Observations</label>
            <textarea
              rows={2}
              value={clinicalExamination}
              onChange={(e) => setClinicalExamination(e.target.value)}
              placeholder="Clinical exam notes, vitals review, respiratory/cardiovascular assessment..."
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Section 3: ICD-10 Diagnosis Catalogue */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" /> ICD-10 Diagnosis Catalogue
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsPrimaryDiagnosis(true)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  isPrimaryDiagnosis ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Primary
              </button>
              <button
                type="button"
                onClick={() => setIsPrimaryDiagnosis(false)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  !isPrimaryDiagnosis ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Secondary
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">ICD-10 Code</label>
              <input
                type="text"
                value={icdCode}
                onChange={(e) => setIcdCode(e.target.value)}
                placeholder="e.g. J06.9"
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Clinical Diagnosis Description</label>
              <input
                type="text"
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                placeholder="Confirmed diagnostic impression..."
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
              />
            </div>
          </div>

          {/* Quick ICD-10 Shortcuts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Quick Diagnostic Shortcuts:</span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ICD_CODES.map((diag) => (
                <button
                  key={diag.code}
                  type="button"
                  onClick={() => {
                    setIcdCode(diag.code);
                    setDiagnosisNotes(diag.label);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary text-[11px] font-mono border border-border transition-colors"
                >
                  <span className="font-bold">{diag.code}</span> — {diag.label.slice(0, 24)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Structured Digital Prescription with Drug Allergy Blocker */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" /> Structured Digital Prescription (Rx)
            </h2>
            <span className="text-xs text-muted-foreground">Directly dispatched to Pharmacy Queue</span>
          </div>

          {/* Rx Items List */}
          <div className="space-y-2">
            {items.map((med, idx) => {
              const conflict = checkAllergyConflict(med.medicineName);
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    conflict
                      ? "bg-rose-500/20 border-rose-500 text-rose-900 dark:text-rose-100"
                      : "bg-muted/40 border-border"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{med.medicineName}</span>
                      {conflict && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          ALLERGY CONFLICT: {conflict.allergen}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {med.dosage} • {med.frequency} • {med.durationDays} Days ({med.instructions})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedicine(idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add New Rx Subform */}
          <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Add Medication</span>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                className="sm:col-span-2 px-3.5 py-2 bg-card border border-input rounded-xl text-sm"
              />
              <input
                type="text"
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                placeholder="Dose (1 tab)"
                className="px-3.5 py-2 bg-card border border-input rounded-xl text-sm"
              />
              <input
                type="text"
                value={newFreq}
                onChange={(e) => setNewFreq(e.target.value)}
                placeholder="Freq (1-0-1 / TDS)"
                className="px-3.5 py-2 bg-card border border-input rounded-xl text-sm"
              />
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                placeholder="Days"
                className="px-3.5 py-2 bg-card border border-input rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={addMedicine}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" /> Add Rx
              </button>
            </div>
          </div>

          {/* Advice & Follow-up Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Doctor Advice / Dietary Instructions</label>
              <textarea
                rows={2}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Follow-Up (Days)
              </label>
              <input
                type="number"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="5"
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Schedules next OPD recall slot</p>
            </div>
          </div>
        </div>

        {/* Section 5: Consultation Completion & Next Queue Handoff */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-md">
          <div>
            <h3 className="font-bold text-foreground text-sm">Finalize Encounter &amp; Route Workflow</h3>
            <p className="text-xs text-muted-foreground">
              Marks appointment COMPLETED, generates prescription, and forwards invoice to billing queue.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-5 h-5" />
            {loading ? "Completing Consultation..." : "Complete Consultation & Advance Queue"}
          </button>
        </div>
      </form>

      {/* Longitudinal Patient Medical History Timeline Drawer */}
      {showTimelineDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Longitudinal Medical History</h2>
                  <p className="text-xs text-muted-foreground">
                    {patientName} ({patientUhid}) • Chronological Encounters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTimelineDrawer(false)}
                className="p-2 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
              {/* Existing Conditions & Surgeries */}
              {(timeline?.existingDiseases || timeline?.previousSurgeries) && (
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2 text-xs">
                  {timeline.existingDiseases && (
                    <p>
                      <strong className="text-foreground">Chronic Conditions:</strong>{" "}
                      <span className="text-muted-foreground">{timeline.existingDiseases}</span>
                    </p>
                  )}
                  {timeline.previousSurgeries && (
                    <p>
                      <strong className="text-foreground">Surgical History:</strong>{" "}
                      <span className="text-muted-foreground">{timeline.previousSurgeries}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Chronological Encounters */}
              {!timeline?.encounters || timeline.encounters.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No previous OPD encounters recorded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.encounters.map((enc, idx) => (
                    <div key={idx} className="bg-muted/20 border border-border rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-primary" /> {enc.doctorName}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {new Date(enc.encounterDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <p>
                          <strong className="text-foreground">Diagnosis:</strong>{" "}
                          <span className="font-mono text-primary font-bold">{enc.icdCode}</span> — {enc.diagnosisNotes}
                        </p>
                        {enc.advice && (
                          <p>
                            <strong className="text-foreground">Advice:</strong>{" "}
                            <span className="text-muted-foreground">{enc.advice}</span>
                          </p>
                        )}
                      </div>

                      {/* Rx Items in past encounter */}
                      {enc.prescriptionItems && enc.prescriptionItems.length > 0 && (
                        <div className="pt-2 border-t border-border/60">
                          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Prescribed:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {enc.prescriptionItems.map((pi, piIdx) => (
                              <span key={piIdx} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground border border-border">
                                {pi.medicineName} ({pi.dosage} • {pi.frequency})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
