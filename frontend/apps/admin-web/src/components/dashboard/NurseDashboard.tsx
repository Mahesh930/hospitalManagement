"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartPulse, Users, Bed, Pill, AlertTriangle, ShieldAlert,
  ArrowRight, Activity, Thermometer, Sparkles, RefreshCw,
  Plus, CheckCircle2, Heart, Scale, Stethoscope
} from "lucide-react";
import { nurseApi, NurseDashboardDto, QueueManagementDto, VitalSignsDto } from "@medicore/api";
import { toast } from "sonner";

export default function NurseDashboard() {
  const [data, setData] = useState<NurseDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<QueueManagementDto | null>(null);
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);

  // Vitals form state
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await nurseApi.getDashboardStats();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load nurse station telemetry", err);
      toast.error("Could not load nurse dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRecordVitals = (patient: QueueManagementDto) => {
    setSelectedPatient(patient);
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

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsForm.patientId) return;

    try {
      setSavingVitals(true);
      const res = await nurseApi.recordTriageVitals(vitalsForm);
      if (res.success) {
        toast.success("Vitals and triage parameters recorded successfully!");
        setVitalsModalOpen(false);
        await fetchData();
      }
    } catch (err: unknown) {
      toast.error("Failed to record vitals: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setSavingVitals(false);
    }
  };

  // Real-time BMI calculation
  const calculatedBmi =
    vitalsForm.heightCm && vitalsForm.weightKg && vitalsForm.heightCm > 0
      ? Math.round((vitalsForm.weightKg / Math.pow(vitalsForm.heightCm / 100, 2)) * 10) / 10
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-6 rounded-2xl border border-teal-500/20">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-sm mb-1">
            <HeartPulse className="w-4 h-4 animate-pulse" />
            <span>NURSE STATION & CLINICAL TRIAGE CONSOLE</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Clinical Nursing Station</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time OPD triage queues, abnormal vitals surveillance, and inpatient ward bed telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/nurse/beds"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm shadow-teal-500/30 transition-all"
          >
            <Bed className="w-3.5 h-3.5" />
            Manage Beds & Wards
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Triage</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {loading ? "—" : data?.pendingTriageCount ?? 0}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">Waiting for vitals</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vitals Triaged Today</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {loading ? "—" : data?.todayTriageCount ?? 0}
            </p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1">Prepped for doctor</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Abnormal Alerts</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {loading ? "—" : data?.abnormalVitalsCount ?? 0}
            </p>
            <p className="text-[11px] text-rose-600/80 font-medium mt-1">Safety threshold alerts</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bed Occupancy</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {loading ? "—" : `${data?.occupiedBedsCount ?? 0} / ${data?.totalBedsCount ?? 0}`}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
              {data?.totalBedsCount
                ? `${Math.round(((data.occupiedBedsCount || 0) / (data.totalBedsCount || 1)) * 100)}% occupied`
                : "Active IPD"}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bed className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner (if abnormal vitals exist) */}
      {data?.recentAbnormalAlerts && data.recentAbnormalAlerts.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-bold text-sm mb-3">
            <ShieldAlert className="w-5 h-5" />
            <span>CRITICAL ABNORMAL VITALS & SAFETY SURVEILLANCE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recentAbnormalAlerts.slice(0, 3).map((alert, idx) => (
              <div key={alert.id || idx} className="bg-card/80 border border-rose-500/20 rounded-xl p-3.5 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-foreground">{alert.patientName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    {alert.triagePriority || "CRITICAL"}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] mb-2 font-mono">UHID: {alert.patientUhid || "—"}</p>
                <div className="space-y-1 text-rose-600 dark:text-rose-400 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                  {alert.abnormalNotes || "Abnormal parameters detected"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Triage Queue & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Waiting Triage Queue */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold text-foreground text-sm">Checked-In Patients Awaiting Triage</h2>
            </div>
            <Link href="/nurse" className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-medium">
              View Full Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!data?.activeQueue || data.activeQueue.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
              <p className="font-medium text-foreground">All checked-in patients triaged</p>
              <p className="text-[11px] mt-0.5">No pending vitals in the triage queue at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2.5 font-medium">Token</th>
                    <th className="pb-2.5 font-medium">Patient</th>
                    <th className="pb-2.5 font-medium">Assigned Doctor</th>
                    <th className="pb-2.5 font-medium">Priority</th>
                    <th className="pb-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.activeQueue.map((item) => (
                    <tr key={item.visitId} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {item.tokenNumber}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-foreground">{item.patientName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.patientUhid}</p>
                      </td>
                      <td className="py-3 text-muted-foreground">{item.doctorName}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            item.priorityRank === 0
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.priorityRank === 0 ? "EMERGENCY" : "Standard"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openRecordVitals(item)}
                          className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all"
                        >
                          Record Vitals
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Quick Clinical Actions & Links */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Nurse Station Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/nurse"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-teal-500/10 border border-border hover:border-teal-500/30 transition-all text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                  <div>
                    <p className="font-semibold text-foreground">OPD Triage Console</p>
                    <p className="text-[11px] text-muted-foreground">Capture vitals & prep patients</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/nurse/beds"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-blue-500/10 border border-border hover:border-blue-500/30 transition-all text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <Bed className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-semibold text-foreground">Ward & Bed Management</p>
                    <p className="text-[11px] text-muted-foreground">Inpatient admissions & transfers</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/nurse/emar"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-purple-500/10 border border-border hover:border-purple-500/30 transition-all text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <Pill className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-semibold text-foreground">eMAR Medication Record</p>
                    <p className="text-[11px] text-muted-foreground">Administer doctor prescriptions</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl p-5 text-xs">
            <h4 className="font-semibold text-teal-700 dark:text-teal-300 mb-1">Clinical Safety Note</h4>
            <p className="text-muted-foreground leading-relaxed">
              Recording vital signs automatically runs our clinical threshold rules. Abnormal readings alert the assigned
              doctor immediately and update patient priority in the live queue.
            </p>
          </div>
        </div>
      </div>

      {/* Record Vitals Modal */}
      {vitalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Record Patient Vitals & Triage</h3>
                <p className="text-xs text-muted-foreground">
                  Patient: <span className="font-semibold text-foreground">{selectedPatient?.patientName}</span> ({selectedPatient?.patientUhid})
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
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Pulse */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.pulseRate || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulseRate: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
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
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
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
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Resp. Rate (breaths/min)</label>
                  <input
                    type="number"
                    value={vitalsForm.respiratoryRate || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Blood Glucose */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Blood Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={vitalsForm.bloodSugarMgDl || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodSugarMgDl: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={vitalsForm.heightCm || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heightCm: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={vitalsForm.weightKg || ""}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
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
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* BMI preview */}
              {calculatedBmi && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-teal-700 dark:text-teal-300 font-medium">Computed BMI:</span>
                  <span className="font-bold text-teal-800 dark:text-teal-200">
                    {calculatedBmi} kg/m² ({calculatedBmi < 18.5 ? "Underweight" : calculatedBmi < 25 ? "Normal" : calculatedBmi < 30 ? "Overweight" : "Obese"})
                  </span>
                </div>
              )}

              {/* Chief Complaints */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Chief Complaints / Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mild headache and chest tightness for 2 days..."
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
                  Save Vitals & Send to Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
