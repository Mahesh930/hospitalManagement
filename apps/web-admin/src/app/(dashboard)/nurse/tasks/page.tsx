"use client";

import { useEffect, useState } from "react";
import {
  BellRing, CheckSquare, Plus, RefreshCw, AlertTriangle, ShieldAlert,
  Clock, CheckCircle2, User, Stethoscope, ChevronRight, Activity, Filter, Check
} from "lucide-react";
import {
  nurseApi, NursingTaskDto, ClinicalEscalationDto, WardDto,
  patientsApi, PatientDto
} from "@medicore/api";
import { toast } from "sonner";

export default function NursingTasksAndAlertsPage() {
  const [assignedWard, setAssignedWard] = useState<WardDto | null>(null);
  const [tasks, setTasks] = useState<NursingTaskDto[]>([]);
  const [escalations, setEscalations] = useState<ClinicalEscalationDto[]>([]);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [taskFilter, setTaskFilter] = useState<string>("ALL");

  // Create Task Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    patientId: "",
    taskTitle: "",
    description: "",
    taskType: "VITALS_CHECK",
    priority: "ROUTINE" as "ROUTINE" | "URGENT" | "STAT",
  });
  const [savingTask, setSavingTask] = useState(false);

  // Complete Task Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<NursingTaskDto | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completingTask, setCompletingTask] = useState(false);

  // Create Escalation Modal
  const [escModalOpen, setEscModalOpen] = useState(false);
  const [escForm, setEscForm] = useState({
    patientId: "",
    severity: "URGENT" as "ROUTINE" | "URGENT" | "CRITICAL",
    triggerReason: "ABNORMAL_VITALS",
    clinicalNotes: "",
  });
  const [savingEsc, setSavingEsc] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wardRes, ptsRes, tasksRes, escRes] = await Promise.all([
        nurseApi.getAssignedWard(),
        patientsApi.search(""),
        nurseApi.getWardTasks(),
        nurseApi.getWardEscalations(),
      ]);

      if (wardRes.data) setAssignedWard(wardRes.data);
      if (ptsRes.data?.data) setPatients(ptsRes.data.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (escRes.data) setEscalations(escRes.data);
    } catch (err) {
      console.error("Failed to load tasks and alerts", err);
      toast.error("Failed to load nursing tasks and escalation alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.patientId || !taskForm.taskTitle.trim()) {
      toast.error("Please select a patient and provide a task title");
      return;
    }
    try {
      setSavingTask(true);
      await nurseApi.createNursingTask({
        patientId: taskForm.patientId,
        wardId: assignedWard?.id,
        taskTitle: taskForm.taskTitle,
        description: taskForm.description,
        taskType: taskForm.taskType,
        priority: taskForm.priority,
      });
      toast.success("Nursing task scheduled successfully");
      setTaskModalOpen(false);
      setTaskForm({ patientId: "", taskTitle: "", description: "", taskType: "VITALS_CHECK", priority: "ROUTINE" });
      loadData();
    } catch (err: any) {
      console.error("Failed to create task", err);
      toast.error(err?.response?.data?.error?.message || "Failed to schedule task");
    } finally {
      setSavingTask(false);
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToComplete?.id) return;
    try {
      setCompletingTask(true);
      await nurseApi.completeNursingTask(taskToComplete.id, completionNotes);
      toast.success("Task marked as completed");
      setCompleteModalOpen(false);
      setTaskToComplete(null);
      setCompletionNotes("");
      loadData();
    } catch (err: any) {
      console.error("Failed to complete task", err);
      toast.error(err?.response?.data?.error?.message || "Failed to complete task");
    } finally {
      setCompletingTask(false);
    }
  };

  const handleCreateEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escForm.patientId || !escForm.clinicalNotes.trim()) {
      toast.error("Please select an inpatient and document clinical notes");
      return;
    }
    try {
      setSavingEsc(true);
      await nurseApi.createClinicalEscalation({
        patientId: escForm.patientId,
        wardId: assignedWard?.id,
        severity: escForm.severity,
        triggerReason: escForm.triggerReason,
        clinicalNotes: escForm.clinicalNotes,
      });
      toast.success("Clinical escalation alert transmitted to attending doctor");
      setEscModalOpen(false);
      setEscForm({ patientId: "", severity: "URGENT", triggerReason: "ABNORMAL_VITALS", clinicalNotes: "" });
      loadData();
    } catch (err: any) {
      console.error("Failed to raise escalation", err);
      toast.error(err?.response?.data?.error?.message || "Failed to broadcast escalation");
    } finally {
      setSavingEsc(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "PENDING") return t.status === "PENDING";
    if (taskFilter === "COMPLETED") return t.status === "COMPLETED";
    if (taskFilter === "URGENT") return t.priority === "URGENT" || t.priority === "STAT";
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Ward Tasks & Doctor Escalations
              </h1>
              <p className="text-sm text-muted-foreground">
                {assignedWard ? (
                  <>Care Operations Scope: <span className="font-semibold text-foreground">{assignedWard.name}</span></>
                ) : (
                  "Inpatient tasks and clinical escalation station"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Nursing Task
          </button>
          <button
            onClick={() => setEscModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow transition-colors"
          >
            <ShieldAlert className="w-4 h-4" /> Alert Doctor (STAT)
          </button>
          <button
            onClick={loadData}
            className="p-2.5 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Critical Escalations Live Alert Drawer */}
      {escalations.length > 0 && (
        <div className="bg-card border border-red-500/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
              Active Doctor Escalation Alerts ({escalations.filter(e => !e.isAcknowledged).length} Unacknowledged)
            </div>
            <span className="text-xs text-muted-foreground font-medium">Broadcasted to Attending Medical Officers</span>
          </div>

          <div className="divide-y divide-border">
            {escalations.map((esc) => (
              <div key={esc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      esc.severity === "CRITICAL"
                        ? "bg-red-500 text-white"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}>
                      {esc.severity}
                    </span>
                    <span className="text-xs font-bold text-foreground">{esc.patientName}</span>
                    <span className="text-xs text-muted-foreground font-mono">({esc.patientUhid})</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium text-muted-foreground">
                      {esc.triggerReason.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 font-medium">
                    {esc.clinicalNotes}
                  </p>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>Escalated by: {esc.escalatedBy}</span>
                    <span>•</span>
                    <span>{esc.escalatedAt ? new Date(esc.escalatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {esc.isAcknowledged ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Acknowledged by Dr. {esc.acknowledgedByDoctor || "Attending"}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-semibold animate-pulse">
                      <Clock className="w-4 h-4" /> Pending Doctor Response
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nursing Tasks Board */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" /> Shift Nursing Tasks & Routine Orders
            </h2>
            <p className="text-xs text-muted-foreground">Hourly vitals capture, medication reminders, wound dressings, and doctor orders</p>
          </div>

          <div className="flex items-center gap-2">
            {["ALL", "PENDING", "URGENT", "COMPLETED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setTaskFilter(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  taskFilter === tab
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((t) => (
              <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {t.status === "COMPLETED" ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTaskToComplete(t);
                          setCompleteModalOpen(true);
                        }}
                        className="w-6 h-6 rounded-full border-2 border-primary/40 hover:border-primary flex items-center justify-center text-transparent hover:text-primary transition-all"
                        title="Mark Completed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        t.priority === "STAT"
                          ? "bg-red-500 text-white"
                          : t.priority === "URGENT"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}>
                        {t.priority}
                      </span>
                      <h3 className={`text-sm font-bold ${t.status === "COMPLETED" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {t.taskTitle}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {t.patientName} ({t.patientUhid})
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    )}

                    {t.completionNotes && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Completed: {t.completionNotes} (by {t.completedBy})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {t.dueAt ? new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Immediate"}</span>
                  </div>

                  {t.status !== "COMPLETED" && (
                    <button
                      onClick={() => {
                        setTaskToComplete(t);
                        setCompleteModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg text-xs transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <CheckSquare className="w-10 h-10 mx-auto text-muted mb-2 opacity-50" />
              <p className="font-semibold text-sm">No tasks found for current filter.</p>
              <p className="text-xs">Click "Add Nursing Task" to assign instructions or routine checks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Task */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" /> Schedule Nursing Task
              </h3>
              <button
                onClick={() => setTaskModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Inpatient</label>
                <select
                  required
                  value={taskForm.patientId}
                  onChange={(e) => setTaskForm({ ...taskForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="">Select Inpatient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid}) {p.currentBedNumber ? `• Bed ${p.currentBedNumber}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.taskTitle}
                  onChange={(e) => setTaskForm({ ...taskForm, taskTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. Check SpO2 post-nebulization"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Task Type</label>
                  <select
                    value={taskForm.taskType}
                    onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  >
                    <option value="VITALS_CHECK">Vitals & Monitoring</option>
                    <option value="MEDICATION">Medication Administration</option>
                    <option value="DRESSING">Wound Dressing</option>
                    <option value="LAB_COLLECTION">Blood / Specimen Collection</option>
                    <option value="DOCTOR_ORDER">Doctor Order Execution</option>
                    <option value="GENERAL_CARE">General Hygiene / Bedside</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold"
                  >
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="URGENT">URGENT</option>
                    <option value="STAT">STAT (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Instructions / Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="Specific nursing instructions or clinical notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingTask ? "Scheduling..." : "Schedule Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Task */}
      {completeModalOpen && taskToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Complete Task
              </h3>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteTask} className="space-y-4">
              <div className="p-3 bg-muted rounded-xl space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Task:</div>
                <div className="text-sm font-bold text-foreground">{taskToComplete.taskTitle}</div>
                <div className="text-xs text-muted-foreground">Patient: {taskToComplete.patientName}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Completion Notes / Findings</label>
                <textarea
                  rows={3}
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. Vitals checked, SpO2 99% stable on room air. Dressing clean and intact."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingTask}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow disabled:opacity-50"
                >
                  {completingTask ? "Completing..." : "Mark Completed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Raise Escalation Alert */}
      {escModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" /> Raise Doctor Clinical Alert
              </h3>
              <button
                onClick={() => setEscModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEscalation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Inpatient</label>
                <select
                  required
                  value={escForm.patientId}
                  onChange={(e) => setEscForm({ ...escForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="">Select Inpatient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid}) {p.currentBedNumber ? `• Bed ${p.currentBedNumber}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Severity</label>
                  <select
                    value={escForm.severity}
                    onChange={(e) => setEscForm({ ...escForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold text-red-600"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="CRITICAL">CRITICAL (STAT)</option>
                    <option value="ROUTINE">ROUTINE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Trigger Reason</label>
                  <select
                    value={escForm.triggerReason}
                    onChange={(e) => setEscForm({ ...escForm, triggerReason: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  >
                    <option value="ABNORMAL_VITALS">Abnormal Vitals Deterioration</option>
                    <option value="PATIENT_DETERIORATION">Altered Mental / Clinical State</option>
                    <option value="ADVERSE_REACTION">Adverse Drug / Transfusion Reaction</option>
                    <option value="EMERGENCY_CODE">Code / Rapid Response</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Clinical Findings & Notes</label>
                <textarea
                  rows={3}
                  required
                  value={escForm.clinicalNotes}
                  onChange={(e) => setEscForm({ ...escForm, clinicalNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="Document specific vitals drop, signs, patient symptoms, and immediate nurse actions taken..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEscModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEsc}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow disabled:opacity-50"
                >
                  {savingEsc ? "Transmitting..." : "Broadcast Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
