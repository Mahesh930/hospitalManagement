"use client";

import { useState, useEffect } from "react";
import {
  doctorsApi,
  InpatientProgressNoteDto,
  DoctorNurseInstructionDto,
  DischargeRecommendationDto
} from "@medicore/api";
import {
  Bed,
  User,
  Activity,
  ClipboardList,
  Plus,
  Send,
  AlertCircle,
  FileCheck,
  Stethoscope,
  Heart,
  Thermometer,
  RefreshCw,
  LogOut,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function DoctorIpdWardRoundsPage() {
  const [loading, setLoading] = useState(true);
  const [inpatients, setInpatients] = useState<any[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<any | null>(null);
  const [progressNotes, setProgressNotes] = useState<InpatientProgressNoteDto[]>([]);
  const [activeTab, setActiveTab] = useState<"SOAP" | "NURSE_ORDER" | "DISCHARGE">("SOAP");

  // SOAP Note Form State
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [bp, setBp] = useState("120/80");
  const [pulse, setPulse] = useState<number | "">(76);
  const [temp, setTemp] = useState<number | "">(98.6);
  const [spo2, setSpo2] = useState<number | "">(99);
  const [respRate, setRespRate] = useState<number | "">(18);
  const [isCritical, setIsCritical] = useState(false);
  const [clinicalInstructions, setClinicalInstructions] = useState("");
  const [savingSoap, setSavingSoap] = useState(false);

  // Nurse Order State
  const [nurseTaskTitle, setNurseTaskTitle] = useState("");
  const [nurseTaskDesc, setNurseTaskDesc] = useState("");
  const [nursePriority, setNursePriority] = useState("ROUTINE");
  const [savingNurseOrder, setSavingNurseOrder] = useState(false);

  // Discharge Recommendation State
  const [dischargeRec, setDischargeRec] = useState("Clinically stable and fit for discharge.");
  const [dischargeInst, setDischargeInst] = useState("Continue prescribed medications. Report immediately if chest pain or breathlessness recurs.");
  const [dischargeCondition, setDischargeCondition] = useState("STABLE");
  const [dietInst, setDietInst] = useState("Low salt, diabetic diet.");
  const [activityInst, setActivityInst] = useState("Normal activity, avoid heavy weightlifting for 2 weeks.");
  const [savingDischarge, setSavingDischarge] = useState(false);

  const fetchInpatients = async () => {
    try {
      setLoading(true);
      const res = await doctorsApi.getActiveInpatients();
      const list = res.data?.data || [];
      setInpatients(list);
      if (list.length > 0 && !selectedAdmission) {
        setSelectedAdmission(list[0]);
        loadNotes(list[0].id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to load assigned inpatients");
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (bedAdmissionId: string) => {
    try {
      const res = await doctorsApi.getProgressNotes(bedAdmissionId);
      setProgressNotes(res.data?.data || []);
    } catch {
      setProgressNotes([]);
    }
  };

  useEffect(() => {
    fetchInpatients();
  }, []);

  const handleSelectAdmission = (adm: any) => {
    setSelectedAdmission(adm);
    loadNotes(adm.id);
  };

  const handleSaveSoapNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    if (!assessment.trim() || !plan.trim()) {
      toast.error("Please enter Clinical Assessment and Plan");
      return;
    }

    try {
      setSavingSoap(true);
      const payload: InpatientProgressNoteDto = {
        bedAdmissionId: selectedAdmission.id,
        patientId: selectedAdmission.patient?.id,
        noteType: "SOAP_NOTE",
        subjective,
        objective,
        assessment,
        plan,
        bloodPressure: bp,
        pulseRate: pulse === "" ? undefined : Number(pulse),
        temperature: temp === "" ? undefined : Number(temp),
        spo2: spo2 === "" ? undefined : Number(spo2),
        respiratoryRate: respRate === "" ? undefined : Number(respRate),
        isCritical,
        clinicalInstructions
      };

      await doctorsApi.createProgressNote(payload);
      toast.success("SOAP Progress Note saved to Inpatient Medical Record");
      // Reset form fields
      setSubjective("");
      setObjective("");
      setAssessment("");
      setPlan("");
      setClinicalInstructions("");
      loadNotes(selectedAdmission.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to save SOAP note");
    } finally {
      setSavingSoap(false);
    }
  };

  const handleCreateNurseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    if (!nurseTaskTitle.trim()) {
      toast.error("Please enter instruction title");
      return;
    }

    try {
      setSavingNurseOrder(true);
      const payload: DoctorNurseInstructionDto = {
        patientId: selectedAdmission.patient?.id,
        bedAdmissionId: selectedAdmission.id,
        wardId: selectedAdmission.bed?.ward?.id,
        taskTitle: nurseTaskTitle,
        description: nurseTaskDesc,
        priority: nursePriority
      };

      await doctorsApi.assignNurseInstruction(payload);
      toast.success("Clinical order dispatched to Ward Nursing Station");
      setNurseTaskTitle("");
      setNurseTaskDesc("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to send nurse order");
    } finally {
      setSavingNurseOrder(false);
    }
  };

  const handleDischargeRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      setSavingDischarge(true);
      const payload: DischargeRecommendationDto = {
        bedAdmissionId: selectedAdmission.id,
        dischargeRecommendation: dischargeRec,
        dischargeInstructions: dischargeInst,
        conditionAtDischarge: dischargeCondition,
        dietInstructions: dietInst,
        activityInstructions: activityInst
      };

      await doctorsApi.recommendDischarge(payload);
      toast.success("Discharge recommendation and instructions logged");
      fetchInpatients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to log discharge recommendation");
    } finally {
      setSavingDischarge(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Inpatient Ward Rounds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inpatient Ward Rounds &amp; SOAP Console</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conduct daily physician rounds, document SOAP progress notes, issue nursing tasks, and authorize discharge plans.
            </p>
          </div>
        </div>
        <button
          onClick={fetchInpatients}
          className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors self-start sm:self-auto shadow-sm"
          title="Refresh inpatients"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Inpatients List */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Assigned Inpatients ({inpatients.length})
            </h2>
            <span className="text-[11px] text-muted-foreground">Active Admissions</span>
          </div>

          {inpatients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <Bed className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No active inpatients currently assigned to your care.
            </div>
          ) : (
            <div className="space-y-2.5">
              {inpatients.map((adm) => {
                const isSelected = selectedAdmission?.id === adm.id;
                const p = adm.patient || {};
                const b = adm.bed || {};
                const w = b.ward || {};

                return (
                  <div
                    key={adm.id}
                    onClick={() => handleSelectAdmission(adm)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "bg-muted/20 border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-foreground text-sm block">
                          {p.name || "Inpatient"}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {p.uhid || "—"} • {p.age ? `${p.age}y` : ""} {p.gender || ""}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground">
                        Bed {b.bedNumber || "N/A"}
                      </span>
                    </div>

                    <div className="mt-2 text-xs flex items-center justify-between text-muted-foreground border-t border-border/50 pt-2">
                      <span>Ward: <strong className="text-foreground">{w.name || "General"}</strong></span>
                      <span className="text-[10px]">Adm: {adm.admissionDate ? new Date(adm.admissionDate).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Selected Inpatient Workstation */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAdmission ? (
            <>
              {/* Selected Patient Banner */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Patient Name</span>
                  <span className="text-sm font-bold text-foreground block">
                    {selectedAdmission.patient?.name || "Inpatient"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">UHID / Age</span>
                  <span className="text-sm font-mono font-bold text-primary block">
                    {selectedAdmission.patient?.uhid} ({selectedAdmission.patient?.age || "—"}y)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Ward &amp; Bed</span>
                  <span className="text-sm font-bold text-foreground block">
                    {selectedAdmission.bed?.ward?.name} - Bed {selectedAdmission.bed?.bedNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Status</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    ADMITTED
                  </span>
                </div>
              </div>

              {/* Sub-Tabs: SOAP Notes, Nurse Order, Discharge Recommendation */}
              <div className="flex border-b border-border gap-2 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("SOAP")}
                  className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === "SOAP"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Activity className="w-4 h-4" /> Daily SOAP Progress Note
                </button>
                <button
                  onClick={() => setActiveTab("NURSE_ORDER")}
                  className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === "NURSE_ORDER"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Send className="w-4 h-4" /> Doctor-to-Nurse Instructions
                </button>
                <button
                  onClick={() => setActiveTab("DISCHARGE")}
                  className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === "DISCHARGE"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogOut className="w-4 h-4" /> Discharge Recommendation
                </button>
              </div>

              {/* TAB 1: SOAP PROGRESS NOTE */}
              {activeTab === "SOAP" && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveSoapNote} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary" /> Record Physician Ward Round (SOAP)
                    </h3>

                    {/* Vitals Snapshot */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">BP (mmHg)</label>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => setBp(e.target.value)}
                          placeholder="120/80"
                          className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Pulse (bpm)</label>
                        <input
                          type="number"
                          value={pulse}
                          onChange={(e) => setPulse(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="72"
                          className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Temp (°F)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={temp}
                          onChange={(e) => setTemp(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="98.6"
                          className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">SpO2 (%)</label>
                        <input
                          type="number"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="99"
                          className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Resp Rate (/min)</label>
                        <input
                          type="number"
                          value={respRate}
                          onChange={(e) => setRespRate(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="18"
                          className="w-full px-3 py-1.5 bg-muted/30 border border-input rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* S & O */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          [S] Subjective (Patient symptoms, pain level, overnight complaints)
                        </label>
                        <textarea
                          rows={2}
                          value={subjective}
                          onChange={(e) => setSubjective(e.target.value)}
                          placeholder="Patient reports pain subsided, slept well..."
                          className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          [O] Objective (Physical exam, surgical site, chest, abdomen findings)
                        </label>
                        <textarea
                          rows={2}
                          value={objective}
                          onChange={(e) => setObjective(e.target.value)}
                          placeholder="Lungs clear bilaterally, surgical dressing clean and dry..."
                          className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    {/* A & P */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          [A] Assessment (Clinical progress, stability, complications) *
                        </label>
                        <textarea
                          rows={2}
                          value={assessment}
                          onChange={(e) => setAssessment(e.target.value)}
                          placeholder="Post-operative day 2: hemodynamic stability achieved..."
                          className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          [P] Plan (Medication adjustments, IV weaning, mobilization plan) *
                        </label>
                        <textarea
                          rows={2}
                          value={plan}
                          onChange={(e) => setPlan(e.target.value)}
                          placeholder="Transition IV analgesia to oral paracetamol; start light ambulation..."
                          className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Doctor Instructions to Ward Staff
                      </label>
                      <input
                        type="text"
                        value={clinicalInstructions}
                        onChange={(e) => setClinicalInstructions(e.target.value)}
                        placeholder="e.g. Check vitals q4h; discontinue Foley catheter tomorrow morning..."
                        className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-600">
                        <input
                          type="checkbox"
                          checked={isCritical}
                          onChange={(e) => setIsCritical(e.target.checked)}
                          className="w-4 h-4 rounded border-rose-400 text-rose-600"
                        />
                        <span>Flag as Critical / High-Risk Patient</span>
                      </label>

                      <button
                        type="submit"
                        disabled={savingSoap}
                        className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                      >
                        <FileCheck className="w-4 h-4" />
                        {savingSoap ? "Saving SOAP Note..." : "Save Ward Round SOAP Note"}
                      </button>
                    </div>
                  </form>

                  {/* Previous SOAP Notes for this Admission */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Ward Round Progress Notes History ({progressNotes.length})
                    </h3>

                    {progressNotes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No progress notes documented yet for this admission.</p>
                    ) : (
                      <div className="space-y-3">
                        {progressNotes.map((note) => (
                          <div key={note.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5 text-primary" /> {note.doctorName || "Attending Physician"}
                              </span>
                              <span className="text-muted-foreground font-mono text-[11px]">
                                {note.roundDateTime ? new Date(note.roundDateTime).toLocaleString() : ""}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 text-[11px] font-mono bg-card p-2 rounded-lg border border-border/50">
                              <span>BP: <strong>{note.bloodPressure || "—"}</strong></span>
                              <span>Pulse: <strong>{note.pulseRate || "—"}</strong></span>
                              <span>SpO2: <strong>{note.spo2 ? `${note.spo2}%` : "—"}</strong></span>
                              <span>Temp: <strong>{note.temperature ? `${note.temperature}°F` : "—"}</strong></span>
                            </div>

                            <div className="space-y-1 pt-1">
                              {note.subjective && <p><strong className="text-foreground">[S]:</strong> {note.subjective}</p>}
                              {note.objective && <p><strong className="text-foreground">[O]:</strong> {note.objective}</p>}
                              {note.assessment && <p><strong className="text-foreground">[A]:</strong> <span className="font-semibold text-primary">{note.assessment}</span></p>}
                              {note.plan && <p><strong className="text-foreground">[P]:</strong> {note.plan}</p>}
                              {note.clinicalInstructions && (
                                <p className="text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                  <strong>Nurse Orders:</strong> {note.clinicalInstructions}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DOCTOR-TO-NURSE INSTRUCTIONS */}
              {activeTab === "NURSE_ORDER" && (
                <form onSubmit={handleCreateNurseOrder} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" /> Assign Clinical Order to Ward Nursing Station
                  </h3>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Order Title / Directive *</label>
                    <input
                      type="text"
                      value={nurseTaskTitle}
                      onChange={(e) => setNurseTaskTitle(e.target.value)}
                      placeholder="e.g. Infuse 500ml Ringer Lactate over 4 hours, monitor hourly vitals"
                      className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Priority Level</label>
                      <select
                        value={nursePriority}
                        onChange={(e) => setNursePriority(e.target.value)}
                        className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs font-bold"
                      >
                        <option value="ROUTINE">Routine</option>
                        <option value="URGENT">Urgent (Immediate attention)</option>
                        <option value="STAT">STAT (Emergency execution)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Detailed Instructions / Precautions</label>
                      <input
                        type="text"
                        value={nurseTaskDesc}
                        onChange={(e) => setNurseTaskDesc(e.target.value)}
                        placeholder="e.g. Discontinue if systolic BP drops below 90 mmHg"
                        className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingNurseOrder}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {savingNurseOrder ? "Dispatching..." : "Dispatch Order to Nurse Station"}
                  </button>
                </form>
              )}

              {/* TAB 3: DISCHARGE RECOMMENDATION */}
              {activeTab === "DISCHARGE" && (
                <form onSubmit={handleDischargeRecommendation} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-primary" /> Inpatient Discharge Recommendation &amp; Summary
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Discharge Recommendation *</label>
                      <input
                        type="text"
                        value={dischargeRec}
                        onChange={(e) => setDischargeRec(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Patient Condition at Discharge</label>
                      <select
                        value={dischargeCondition}
                        onChange={(e) => setDischargeCondition(e.target.value)}
                        className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs font-bold"
                      >
                        <option value="STABLE">Stable / Recovered</option>
                        <option value="IMPROVED">Improved</option>
                        <option value="AGAINST_MEDICAL_ADVICE">Discharge Against Medical Advice (DAMA)</option>
                        <option value="TRANSFERRED">Transferred to Higher Center</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Discharge Instructions to Patient &amp; Family</label>
                    <textarea
                      rows={2}
                      value={dischargeInst}
                      onChange={(e) => setDischargeInst(e.target.value)}
                      className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Dietary Instructions</label>
                      <input
                        type="text"
                        value={dietInst}
                        onChange={(e) => setDietInst(e.target.value)}
                        className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Activity &amp; Rehabilitation Instructions</label>
                      <input
                        type="text"
                        value={activityInst}
                        onChange={(e) => setActivityInst(e.target.value)}
                        className="w-full px-3 py-2 bg-muted/30 border border-input rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingDischarge}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" />
                    {savingDischarge ? "Recording Discharge..." : "Record Discharge Recommendation"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
              <Bed className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
              <h3 className="text-base font-bold text-foreground">Select an Inpatient</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Choose an assigned inpatient from the left panel to record ward round SOAP notes, assign nursing tasks, or log discharge recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
