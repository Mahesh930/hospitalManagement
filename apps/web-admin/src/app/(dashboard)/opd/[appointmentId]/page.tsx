"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  consultationsApi,
  ConsultationDto,
  PrescriptionItemDto,
  ClinicalSafetyCheckDto,
  doctorsApi,
  PatientClinicalSummaryDto,
  DoctorInvestigationOrderDto,
  MedicalCertificateDto,
  AdmissionRecommendationDto
} from "@medicore/api";
import { toast } from "sonner";
import {
  Stethoscope,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Activity,
  Heart,
  Thermometer,
  Weight,
  FileText,
  Pill,
  Clock,
  Calendar,
  User,
  AlertCircle,
  History,
  FlaskConical,
  Award,
  Bed,
  Edit3,
  Check,
  Send,
  ExternalLink,
  ChevronDown
} from "lucide-react";

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

const COMMON_ROUTES = ["Oral", "IV (Intravenous)", "IM (Intramuscular)", "Subcutaneous", "Topical", "Inhalation", "Ophthalmic", "Sublingual"];

export default function OpdConsultationConsolePage({
  params
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [safetyChecking, setSafetyChecking] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [consultationStatus, setConsultationStatus] = useState<string>("IN_PROGRESS");
  const [amended, setAmended] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "ASSESSMENT" | "PRESCRIPTION" | "INVESTIGATIONS" | "CERTIFICATE" | "ADMISSION" | "SUMMARY"
  >("ASSESSMENT");

  // Patient Info & 360 Summary
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("Loading patient...");
  const [patientUhid, setPatientUhid] = useState("");
  const [patientAge, setPatientAge] = useState<number | undefined>();
  const [patientGender, setPatientGender] = useState("");
  const [patientBloodGroup, setPatientBloodGroup] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState<PatientClinicalSummaryDto | null>(null);
  const [allergies, setAllergies] = useState<Array<{ allergen: string; severity?: string; reaction?: string }>>([]);

  // Vitals
  const [bloodPressure, setBloodPressure] = useState("120/80");
  const [pulseRate, setPulseRate] = useState<number | "">(72);
  const [temperature, setTemperature] = useState<number | "">(98.6);
  const [weight, setWeight] = useState<number | "">(70);
  const [spo2, setSpo2] = useState<number | "">(98);
  const [respiratoryRate, setRespiratoryRate] = useState<number | "">(16);

  // Clinical Examination & Histories
  const [chiefComplaint, setChiefComplaint] = useState("Fever and body ache for 2 days");
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState("");
  const [pastMedicalHistory, setPastMedicalHistory] = useState("");
  const [surgicalHistory, setSurgicalHistory] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [socialHistory, setSocialHistory] = useState("");
  const [physicalExamination, setPhysicalExamination] = useState("Chest clear, throat mildly congested, no organomegaly");

  // Diagnoses
  const [icdCode, setIcdCode] = useState("J06.9");
  const [diagnosisNotes, setDiagnosisNotes] = useState("Acute upper respiratory tract infection");
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState("");
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState("");

  // Plan & Instructions
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [patientInstructions, setPatientInstructions] = useState("Rest, drink warm fluids, avoid cold beverages.");
  const [dietInstructions, setDietInstructions] = useState("");
  const [activityInstructions, setActivityInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [referralDepartment, setReferralDepartment] = useState("");
  const [referralDoctor, setReferralDoctor] = useState("");
  const [referralNotes, setReferralNotes] = useState("");

  // Prescriptions
  const [items, setItems] = useState<PrescriptionItemDto[]>([
    {
      medicineName: "Paracetamol 650mg",
      dosage: "1 tab",
      route: "Oral",
      frequency: "1-1-1",
      durationDays: 5,
      quantity: 15,
      instructions: "After food"
    }
  ]);

  // New Rx Line Item Inputs
  const [newMedName, setNewMedName] = useState("");
  const [newDosage, setNewDosage] = useState("1 tab");
  const [newRoute, setNewRoute] = useState("Oral");
  const [newFreq, setNewFreq] = useState("1-0-1");
  const [newDuration, setNewDuration] = useState(5);
  const [newQuantity, setNewQuantity] = useState(10);
  const [newInst, setNewInst] = useState("After food");

  // Pre-flight Safety Result
  const [safetyCheckResult, setSafetyCheckResult] = useState<ClinicalSafetyCheckDto | null>(null);

  // Investigation Ordering Form
  const [invTestName, setInvTestName] = useState("");
  const [invCategory, setInvCategory] = useState("LAB");
  const [invClinicalNotes, setInvClinicalNotes] = useState("");
  const [invInstructions, setInvInstructions] = useState("");
  const [orderingInv, setOrderingInv] = useState(false);

  // Medical Certificate Form
  const [certType, setCertType] = useState("MEDICAL_LEAVE");
  const [certStartDate, setCertStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [certEndDate, setCertEndDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]
  );
  const [certDiagnosis, setCertDiagnosis] = useState("Acute viral illness");
  const [certRemarks, setCertRemarks] = useState("Advised complete bed rest");
  const [certRecommendations, setCertRecommendations] = useState("Patient is advised rest from duties");
  const [issuingCert, setIssuingCert] = useState(false);

  // Inpatient Admission Form
  const [admReason, setAdmReason] = useState("");
  const [admWardType, setAdmWardType] = useState("General Medical Ward");
  const [admPriority, setAdmPriority] = useState("ROUTINE");
  const [admNotes, setAdmNotes] = useState("");
  const [recommendingAdm, setRecommendingAdm] = useState(false);

  // Audited Amendment Modal
  const [amendModalOpen, setAmendModalOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [amending, setAmending] = useState(false);

  // 1. Load Consultation and Patient Data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const consultRes = await consultationsApi.getByAppointment(resolvedParams.appointmentId).catch(() => null);

        if (consultRes?.data?.data) {
          const c = consultRes.data.data;
          setConsultationId(c.id || null);
          setConsultationStatus(c.status || "IN_PROGRESS");
          setAmended(c.amended || false);

          if (c.patientId) setPatientId(c.patientId);
          if (c.patientName) setPatientName(c.patientName);
          if (c.patientUhid) setPatientUhid(c.patientUhid);

          // Clinical assessment values
          if (c.bloodPressure) setBloodPressure(c.bloodPressure);
          if (c.pulseRate) setPulseRate(c.pulseRate);
          if (c.temperature) setTemperature(c.temperature);
          if (c.weight) setWeight(c.weight);
          if (c.spo2) setSpo2(c.spo2);
          if (c.respiratoryRate) setRespiratoryRate(c.respiratoryRate);

          if (c.chiefComplaint) setChiefComplaint(c.chiefComplaint);
          if (c.historyOfPresentIllness) setHistoryOfPresentIllness(c.historyOfPresentIllness);
          if (c.pastMedicalHistory) setPastMedicalHistory(c.pastMedicalHistory);
          if (c.surgicalHistory) setSurgicalHistory(c.surgicalHistory);
          if (c.familyHistory) setFamilyHistory(c.familyHistory);
          if (c.socialHistory) setSocialHistory(c.socialHistory);
          if (c.physicalExamination) setPhysicalExamination(c.physicalExamination);

          if (c.icdCode) setIcdCode(c.icdCode);
          if (c.diagnosisNotes) setDiagnosisNotes(c.diagnosisNotes);
          if (c.secondaryDiagnoses) setSecondaryDiagnoses(c.secondaryDiagnoses);
          if (c.differentialDiagnosis) setDifferentialDiagnosis(c.differentialDiagnosis);

          if (c.treatmentPlan) setTreatmentPlan(c.treatmentPlan);
          if (c.patientInstructions) setPatientInstructions(c.patientInstructions);
          if (c.dietInstructions) setDietInstructions(c.dietInstructions);
          if (c.activityInstructions) setActivityInstructions(c.activityInstructions);
          if (c.followUpDate) setFollowUpDate(c.followUpDate);
          if (c.followUpInstructions) setFollowUpInstructions(c.followUpInstructions);

          if (c.prescription?.items && c.prescription.items.length > 0) {
            setItems(c.prescription.items);
          }

          if (c.patientId) {
            loadPatientSummary(c.patientId);
          }
        }
      } catch (err) {
        console.error("Failed to load appointment details", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.appointmentId]);

  const loadPatientSummary = async (pid: string) => {
    try {
      const summaryRes = await doctorsApi.getPatientSummary(pid).catch(() => null);
      if (summaryRes?.data?.data) {
        const s = summaryRes.data.data;
        setClinicalSummary(s);
        setPatientId(s.patientId);
        setPatientName(s.name);
        setPatientUhid(s.uhid);
        setPatientAge(s.age);
        setPatientGender(s.gender || "");
        setPatientBloodGroup(s.bloodGroup || "");
        setAllergies(s.allergies || []);
      }
    } catch {
      // ignore
    }
  };

  // Pre-flight Clinical Safety Check
  const runSafetyCheck = async (candidateItems: PrescriptionItemDto[]) => {
    if (!patientId || candidateItems.length === 0) return;
    try {
      setSafetyChecking(true);
      const medNames = candidateItems.map((i) => i.medicineName);
      const res = await consultationsApi.checkSafety({ patientId, medications: medNames });
      setSafetyCheckResult(res.data.data);
      if (res.data.data?.isBlocked) {
        toast.error("🚨 DRUG ALLERGY HARD BLOCK DETECTED: Review Prescription Tab immediately!", { duration: 7000 });
      }
    } catch {
      // ignore
    } finally {
      setSafetyChecking(false);
    }
  };

  // Add Medicine with Allergy Hard-Block Check
  const addMedicine = () => {
    if (!newMedName.trim()) {
      toast.error("Please enter medication name");
      return;
    }

    // Direct client-side hard-blocker check
    const cleanMed = newMedName.trim().toLowerCase();
    for (const a of allergies) {
      const allergen = a.allergen.trim().toLowerCase();
      if (cleanMed.includes(allergen) || allergen.includes(cleanMed)) {
        toast.error(
          `🚨 DRUG ALLERGY HARD BLOCKER: Patient has a documented allergy to '${a.allergen}' (${a.severity || "SEVERE"}). Prescription blocked by clinical safety engine.`,
          { duration: 8000 }
        );
        return;
      }
    }

    const updated = [
      ...items,
      {
        medicineName: newMedName,
        dosage: newDosage,
        route: newRoute,
        frequency: newFreq,
        durationDays: newDuration,
        quantity: newQuantity,
        instructions: newInst
      }
    ];

    setItems(updated);
    setNewMedName("");
    toast.success("Medication added to prescription");
    runSafetyCheck(updated);
  };

  const removeMedicine = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    runSafetyCheck(updated);
  };

  // Build Payload
  const buildPayload = (): ConsultationDto => {
    return {
      appointmentId: resolvedParams.appointmentId,
      patientId: patientId || undefined,
      bloodPressure,
      pulseRate: pulseRate ? Number(pulseRate) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      weight: weight ? Number(weight) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,

      chiefComplaint,
      historyOfPresentIllness,
      pastMedicalHistory,
      surgicalHistory,
      familyHistory,
      socialHistory,
      physicalExamination,

      icdCode,
      diagnosisNotes,
      secondaryDiagnoses,
      differentialDiagnosis,

      treatmentPlan,
      patientInstructions,
      dietInstructions,
      activityInstructions,
      followUpDate: followUpDate || undefined,
      followUpInstructions,
      referralDepartment,
      referralDoctor,
      referralNotes,

      prescription: {
        advice: patientInstructions,
        items
      }
    };
  };

  // Save Progress (Draft)
  const handleSaveDraft = async () => {
    if (consultationStatus === "COMPLETED") {
      toast.error("Consultation is FINALIZED. Use 'Amend Consultation' to update records.");
      return;
    }

    try {
      setSaving(true);
      const res = await consultationsApi.save(resolvedParams.appointmentId, buildPayload());
      setConsultationId(res.data.data?.id || null);
      toast.success("Consultation notes saved successfully");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to save consultation");
    } finally {
      setSaving(false);
    }
  };

  // Finalize & Complete Consultation
  const handleFinalize = async () => {
    if (safetyCheckResult?.isBlocked) {
      toast.error("Cannot finalize consultation: Critical Drug-Allergy Hard Blocker active!");
      return;
    }

    try {
      setSaving(true);
      const saveRes = await consultationsApi.save(resolvedParams.appointmentId, buildPayload());
      const cId = saveRes.data.data?.id || consultationId;
      if (cId) {
        await consultationsApi.complete(cId);
        setConsultationStatus("COMPLETED");
        toast.success("Consultation finalized! Locked for normal edits. Routed to Pharmacy & Billing.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to finalize consultation");
    } finally {
      setSaving(false);
    }
  };

  // Handle Audited Amendment
  const handleAmend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim()) {
      toast.error("Please provide mandatory clinical justification for amendment");
      return;
    }

    try {
      setAmending(true);
      const payload = {
        ...buildPayload(),
        amendmentReason
      };
      await consultationsApi.amend(resolvedParams.appointmentId, payload);
      setAmended(true);
      setAmendModalOpen(false);
      setAmendmentReason("");
      toast.success("Audited clinical amendment saved with physician signature");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to amend consultation");
    } finally {
      setAmending(false);
    }
  };

  // Handle Lab / Radiology Order
  const handleOrderInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTestName.trim()) {
      toast.error("Please enter diagnostic test name");
      return;
    }

    try {
      setOrderingInv(true);
      const payload: DoctorInvestigationOrderDto = {
        patientId,
        testName: invTestName,
        category: invCategory,
        clinicalNotes: invClinicalNotes,
        instructions: invInstructions
      };

      await doctorsApi.orderInvestigation(payload);
      toast.success(`Investigation ordered: ${invTestName} (${invCategory})`);
      setInvTestName("");
      setInvClinicalNotes("");
      setInvInstructions("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to place investigation order");
    } finally {
      setOrderingInv(false);
    }
  };

  // Handle Medical Certificate
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIssuingCert(true);
      const payload: MedicalCertificateDto = {
        certificateType: certType,
        patientId,
        startDate: certStartDate,
        endDate: certEndDate,
        diagnosis: certDiagnosis,
        clinicalRemarks: certRemarks,
        recommendations: certRecommendations
      };

      const res = await doctorsApi.issueCertificate(payload);
      toast.success(`Medical Certificate issued: #${res.data.data?.certificateNumber}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to issue certificate");
    } finally {
      setIssuingCert(false);
    }
  };

  // Handle Inpatient Admission Recommendation
  const handleRecommendAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admReason.trim()) {
      toast.error("Please provide clinical reason for admission");
      return;
    }

    try {
      setRecommendingAdm(true);
      const payload: AdmissionRecommendationDto = {
        patientId,
        reasonForAdmission: admReason,
        suggestedWardType: admWardType,
        priority: admPriority,
        clinicalNotes: admNotes
      };

      await doctorsApi.recommendAdmission(payload);
      toast.success("Inpatient Admission recommendation logged to Admission Desk");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to log admission recommendation");
    } finally {
      setRecommendingAdm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Opening Clinical Workstation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Action Bar & Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/opd"
            className="p-2.5 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" /> OPD Clinical Encounter
              </h1>
              {consultationStatus === "COMPLETED" ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> FINALIZED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  IN PROGRESS
                </span>
              )}
              {amended && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  AMENDED
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Appointment Ref: <span className="font-mono">{resolvedParams.appointmentId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {consultationStatus !== "COMPLETED" ? (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 bg-muted/70 hover:bg-muted text-foreground font-semibold rounded-xl text-xs transition-colors border border-border"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={saving || safetyCheckResult?.isBlocked}
                className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Finalize Consultation
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAmendModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs shadow-md hover:bg-purple-700 transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" /> Amend Finalized Record
            </button>
          )}
        </div>
      </div>

      {/* Patient Banner */}
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
          <span className="text-sm font-semibold text-foreground">
            {patientAge ? `${patientAge} yrs` : "—"} / {patientGender || "—"}
          </span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">Blood Group</span>
          <span className="text-sm font-bold text-rose-500">{patientBloodGroup || "—"}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">Allergy Profile</span>
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

      {/* Critical Allergy Alert */}
      {allergies.length > 0 && (
        <div className="bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Documented Patient Allergies (Hard Blocker Active)</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {allergies.map((a, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <span>⚠️ {a.allergen}</span>
                <span className="opacity-80 text-[10px]">({a.severity || "MODERATE"})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Workstation Navigation Tabs */}
      <div className="flex border-b border-border gap-2 text-xs font-bold overflow-x-auto">
        {[
          { id: "ASSESSMENT", label: "Clinical Assessment & Vitals", icon: Stethoscope },
          { id: "PRESCRIPTION", label: `Structured Rx (${items.length})`, icon: Pill },
          { id: "INVESTIGATIONS", label: "Lab & Radiology Orders", icon: FlaskConical },
          { id: "CERTIFICATE", label: "Medical Certificate", icon: Award },
          { id: "ADMISSION", label: "Admission Recommendation", icon: Bed },
          { id: "SUMMARY", label: "Patient 360° Summary", icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CLINICAL ASSESSMENT */}
      {activeTab === "ASSESSMENT" && (
        <div className="space-y-6">
          {/* Vitals */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Physiological Vitals (Current Encounter)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">BP (mmHg)</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="72"
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="98.6"
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="70"
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="98"
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="16"
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Chief Complaint & HPI */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Presenting Illness &amp; Physical Examination
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">History of Present Illness (HPI)</label>
                <input
                  type="text"
                  value={historyOfPresentIllness}
                  onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="Onset, duration, intensity, relieving factors..."
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Physical Examination Findings</label>
              <textarea
                rows={2}
                value={physicalExamination}
                onChange={(e) => setPhysicalExamination(e.target.value)}
                disabled={consultationStatus === "COMPLETED"}
                placeholder="Cardiovascular, respiratory, abdominal, and neurological findings..."
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
              />
            </div>

            {/* Medical / Surgical / Family Histories */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Past Medical History</label>
                <input
                  type="text"
                  value={pastMedicalHistory}
                  onChange={(e) => setPastMedicalHistory(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. HTN, T2DM"
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Past Surgical History</label>
                <input
                  type="text"
                  value={surgicalHistory}
                  onChange={(e) => setSurgicalHistory(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. Appendectomy 2018"
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Family History</label>
                <input
                  type="text"
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. CAD in father"
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Social History</label>
                <input
                  type="text"
                  value={socialHistory}
                  onChange={(e) => setSocialHistory(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. Non-smoker"
                  className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* ICD-10 Diagnosis */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" /> ICD-10 Standardized Diagnosis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Primary ICD-10 Code *</label>
                <input
                  type="text"
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. I10"
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Diagnosis Description *</label>
                <input
                  type="text"
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. Essential (primary) hypertension"
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Quick ICD Shortcuts */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Standard ICD-10 Catalogue Shortcuts:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ICD_CODES.map((diag) => (
                  <button
                    key={diag.code}
                    type="button"
                    disabled={consultationStatus === "COMPLETED"}
                    onClick={() => {
                      setIcdCode(diag.code);
                      setDiagnosisNotes(diag.label);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary text-[11px] font-mono border border-border transition-colors disabled:opacity-50"
                  >
                    <span className="font-bold">{diag.code}</span> — {diag.label.slice(0, 24)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Secondary Diagnoses / Comorbidities</label>
                <input
                  type="text"
                  value={secondaryDiagnoses}
                  onChange={(e) => setSecondaryDiagnoses(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. E11.9 - Type 2 Diabetes"
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Differential Diagnosis</label>
                <input
                  type="text"
                  value={differentialDiagnosis}
                  onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="Alternative clinical differentials considered..."
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Follow-up & Referral */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Follow-Up &amp; Specialist Referral
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-mono font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Follow-Up Instructions</label>
                <input
                  type="text"
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="Review with fasting lipid profile in 2 weeks..."
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Referral Department</label>
                <input
                  type="text"
                  value={referralDepartment}
                  onChange={(e) => setReferralDepartment(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. Cardiology"
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Referral Doctor</label>
                <input
                  type="text"
                  value={referralDoctor}
                  onChange={(e) => setReferralDoctor(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Referral Notes</label>
                <input
                  type="text"
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  disabled={consultationStatus === "COMPLETED"}
                  placeholder="Clinical question for specialist review..."
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURED DIGITAL PRESCRIPTION (Rx) */}
      {activeTab === "PRESCRIPTION" && (
        <div className="space-y-6">
          {/* Pre-flight Safety Engine Status Banner */}
          {safetyCheckResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                safetyCheckResult.isBlocked
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-800 dark:text-rose-200"
                  : (safetyCheckResult.warnings || []).length > 0
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200"
                  : "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                {safetyCheckResult.isBlocked ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                ) : (safetyCheckResult.warnings || []).length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <span>Clinical Pre-Flight Safety Verification</span>
              </div>

              {(safetyCheckResult.allergyConflicts || []).length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-rose-700 dark:text-rose-300 block">Critical Allergen Conflicts:</span>
                  <ul className="list-disc list-inside">
                    {(safetyCheckResult.allergyConflicts || []).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(safetyCheckResult.drugInteractions || []).length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block">Drug-Drug Interactions:</span>
                  <ul className="list-disc list-inside">
                    {(safetyCheckResult.drugInteractions || []).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(safetyCheckResult.warnings || []).length === 0 && !safetyCheckResult.isBlocked && (
                <p>All prescribed medications cleared against patient allergies and drug interaction database.</p>
              )}
            </div>
          )}

          {/* Rx Items List */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" /> Active Prescription Orders ({items.length})
              </h2>
              <span className="text-xs text-muted-foreground font-mono">Dispatches to Pharmacy Queue</span>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{item.medicineName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground">
                        {item.route || "Oral"}
                      </span>
                      {item.quantity && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-muted text-foreground">
                          Qty: {item.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      Dose: <strong className="text-foreground">{item.dosage}</strong> • Frequency:{" "}
                      <strong className="text-foreground">{item.frequency}</strong> • Duration:{" "}
                      <strong className="text-foreground">{item.durationDays} Days</strong> • Instructions:{" "}
                      {item.instructions || "As directed"}
                    </p>
                  </div>

                  {consultationStatus !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Medication Subform */}
            {consultationStatus !== "COMPLETED" && (
              <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3 mt-4">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Add Medication</span>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                    className="sm:col-span-2 px-3 py-2 bg-card border border-input rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    placeholder="Dose (1 tab)"
                    className="px-3 py-2 bg-card border border-input rounded-xl text-xs"
                  />
                  <select
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="px-3 py-2 bg-card border border-input rounded-xl text-xs font-medium"
                  >
                    {COMMON_ROUTES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value)}
                    placeholder="Freq (1-0-1)"
                    className="px-3 py-2 bg-card border border-input rounded-xl text-xs font-mono"
                  />
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    placeholder="Days (5)"
                    className="px-3 py-2 bg-card border border-input rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <input
                      type="number"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      placeholder="Total Qty (10)"
                      className="w-full px-3 py-2 bg-card border border-input rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newInst}
                      onChange={(e) => setNewInst(e.target.value)}
                      placeholder="Instructions (e.g. After food)"
                      className="w-full px-3 py-2 bg-card border border-input rounded-xl text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add to Prescription
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTIC INVESTIGATION ORDERS */}
      {activeTab === "INVESTIGATIONS" && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" /> Order Laboratory &amp; Radiology Investigations
          </h2>
          <p className="text-xs text-muted-foreground">
            Directly requisitions investigations into Laboratory / Diagnostic Booking queues.
          </p>

          <form onSubmit={handleOrderInvestigation} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Test Name *</label>
                <input
                  type="text"
                  value={invTestName}
                  onChange={(e) => setInvTestName(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray PA View..."
                  className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                <select
                  value={invCategory}
                  onChange={(e) => setInvCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-bold"
                >
                  <option value="LAB">Pathology / Laboratory</option>
                  <option value="RADIOLOGY">Radiology / Imaging</option>
                  <option value="CARDIOLOGY">Cardiology (ECG / Echo)</option>
                  <option value="ULTRASOUND">Ultrasound (USG)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Clinical Notes for Lab</label>
                <input
                  type="text"
                  value={invClinicalNotes}
                  onChange={(e) => setInvClinicalNotes(e.target.value)}
                  placeholder="e.g. Check for leukocytosis or anemia"
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Patient Instructions</label>
                <input
                  type="text"
                  value={invInstructions}
                  onChange={(e) => setInvInstructions(e.target.value)}
                  placeholder="e.g. Overnight 10-hour fasting required"
                  className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={orderingInv}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {orderingInv ? "Requisitioning..." : "Submit Investigation Order"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: MEDICAL CERTIFICATE */}
      {activeTab === "CERTIFICATE" && (
        <form onSubmit={handleIssueCertificate} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Issue Authorized Medical Certificate
          </h2>
          <p className="text-xs text-muted-foreground">
            Generates verifiable, uniquely numbered medical certificate bearing physician credentials.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Certificate Type</label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-bold"
              >
                <option value="MEDICAL_LEAVE">Medical Leave Certificate</option>
                <option value="FITNESS">Medical Fitness Certificate</option>
                <option value="SICKNESS">Sickness Certificate</option>
                <option value="ATTENDANT">Attendant Recommendation</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date</label>
              <input
                type="date"
                value={certStartDate}
                onChange={(e) => setCertStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-mono font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End Date</label>
              <input
                type="date"
                value={certEndDate}
                onChange={(e) => setCertEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Certified Diagnosis *</label>
            <input
              type="text"
              value={certDiagnosis}
              onChange={(e) => setCertDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Clinical Remarks</label>
              <input
                type="text"
                value={certRemarks}
                onChange={(e) => setCertRemarks(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Physician Recommendations</label>
              <input
                type="text"
                value={certRecommendations}
                onChange={(e) => setCertRecommendations(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={issuingCert}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
          >
            <Award className="w-4 h-4" />
            {issuingCert ? "Issuing Certificate..." : "Issue Authorized Certificate"}
          </button>
        </form>
      )}

      {/* TAB 5: ADMISSION RECOMMENDATION */}
      {activeTab === "ADMISSION" && (
        <form onSubmit={handleRecommendAdmission} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <Bed className="w-4 h-4 text-primary" /> Inpatient Admission Recommendation
          </h2>
          <p className="text-xs text-muted-foreground">
            Transfers clinical recommendation to Admission Desk for bed allocation and ward transfer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Reason for Admission *</label>
              <input
                type="text"
                value={admReason}
                onChange={(e) => setAdmReason(e.target.value)}
                placeholder="e.g. Unstable angina requiring telemetry and continuous monitoring"
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Suggested Ward Category</label>
              <select
                value={admWardType}
                onChange={(e) => setAdmWardType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-bold"
              >
                <option value="General Medical Ward">General Medical Ward</option>
                <option value="Cardiology Step-Down">Cardiology Step-Down</option>
                <option value="ICU / Intensive Care">ICU / Intensive Care</option>
                <option value="Semi-Private">Semi-Private Room</option>
                <option value="Private Deluxe">Private Deluxe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
              <select
                value={admPriority}
                onChange={(e) => setAdmPriority(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs font-bold"
              >
                <option value="ROUTINE">Routine Admission</option>
                <option value="URGENT">Urgent (Within 2 Hours)</option>
                <option value="STAT">Emergency / STAT</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Admission Clinical Notes</label>
              <input
                type="text"
                value={admNotes}
                onChange={(e) => setAdmNotes(e.target.value)}
                placeholder="Directives for receiving ward physician..."
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={recommendingAdm}
            className="px-6 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-rose-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Bed className="w-4 h-4" />
            {recommendingAdm ? "Recommending..." : "Dispatch Admission Recommendation"}
          </button>
        </form>
      )}

      {/* TAB 6: PATIENT 360° SUMMARY */}
      {activeTab === "SUMMARY" && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Longitudinal Clinical Summary (360° View)
            </h2>
            <span className="text-xs font-mono text-muted-foreground">{patientUhid}</span>
          </div>

          {clinicalSummary ? (
            <div className="space-y-6 text-xs">
              {/* Prior Consultations */}
              <div>
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">Past Consultations</h3>
                {clinicalSummary.pastConsultations.length === 0 ? (
                  <p className="text-muted-foreground italic">No previous consultations recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {clinicalSummary.pastConsultations.map((pc, i) => (
                      <div key={i} className="p-3 rounded-xl border border-border bg-muted/20 flex justify-between">
                        <div>
                          <span className="font-bold text-foreground">{pc.doctorName}</span>
                          <p className="text-muted-foreground">
                            {pc.icdCode && <strong className="font-mono text-primary">{pc.icdCode} - </strong>}
                            {pc.diagnosisNotes || "General Checkup"}
                          </p>
                        </div>
                        <span className="text-muted-foreground font-mono">
                          {new Date(pc.consultationDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Prescriptions */}
              <div>
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">Active Prescriptions</h3>
                {clinicalSummary.activePrescriptions.length === 0 ? (
                  <p className="text-muted-foreground italic">No past prescriptions found.</p>
                ) : (
                  <div className="space-y-2">
                    {clinicalSummary.activePrescriptions.map((ap, i) => (
                      <div key={i} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>Prescribed by {ap.doctorName}</span>
                          <span className="font-mono text-muted-foreground">
                            {new Date(ap.prescribedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ap.medications.map((m, mi) => (
                            <span key={mi} className="px-2 py-0.5 rounded bg-muted font-medium text-[11px]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground italic text-xs">Clinical summary loading or unavailable.</p>
          )}
        </div>
      )}

      {/* Audited Amendment Modal */}
      {amendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" /> Amend Finalized Consultation
              </h3>
              <button onClick={() => setAmendModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Clinical amendment protocol: Every change to a finalized consultation requires a documented clinical justification,
              which is permanently recorded in the hospital audit trail.
            </p>

            <form onSubmit={handleAmend} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Clinical Justification for Amendment *
                </label>
                <textarea
                  rows={3}
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  placeholder="e.g. Corrected clinical assessment following specialist echo review..."
                  className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAmendModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={amending}
                  className="px-5 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {amending ? "Amending..." : "Save Audited Amendment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
