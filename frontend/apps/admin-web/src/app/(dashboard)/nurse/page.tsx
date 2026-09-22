"use client";

import { useEffect, useState, useMemo } from "react";
import {
  HeartPulse, Search, RefreshCw, AlertTriangle, ShieldAlert,
  Clock, CheckCircle2, User, Stethoscope, ChevronRight, Activity, Sparkles
} from "lucide-react";
import { nurseApi, QueueManagementDto, VitalSignsDto } from "@medicore/api";
import { toast } from "sonner";

export default function NurseTriagePage() {
  const [queue, setQueue] = useState<QueueManagementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<QueueManagementDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Vitals form
  const [form, setForm] = useState<VitalSignsDto>({
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

  // Debounce search term 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await nurseApi.getTriageQueue();
      if (res.data) {
        setQueue(res.data);
      }
    } catch (err) {
      console.error("Failed to load triage queue", err);
      toast.error("Failed to load triage queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const filteredQueue = useMemo(() => {
    if (!debouncedSearch.trim()) return queue;
    const q = debouncedSearch.toLowerCase();
    return queue.filter(
      (item) =>
        item.patientName?.toLowerCase().includes(q) ||
        item.patientUhid?.toLowerCase().includes(q) ||
        item.tokenNumber?.toLowerCase().includes(q) ||
        item.doctorName?.toLowerCase().includes(q)
    );
  }, [queue, debouncedSearch]);

  const openVitalsModal = (patient: QueueManagementDto) => {
    setSelectedPatient(patient);
    setForm({
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
    setModalOpen(true);
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) return;

    try {
      setSaving(true);
      const res = await nurseApi.recordTriageVitals(form);
      if (res.success) {
        toast.success("Vitals saved! Patient moved to doctor waiting queue.");
        setModalOpen(false);
        await loadQueue();
      }
    } catch (err: unknown) {
      toast.error("Failed to save vitals: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setSaving(false);
    }
  };

  const bmi =
    form.heightCm && form.weightKg && form.heightCm > 0
      ? Math.round((form.weightKg / Math.pow(form.heightCm / 100, 2)) * 10) / 10
      : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>OPD Clinical Triage Console</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pre-Consultation Vitals & Triage Queue</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Capture patient vital signs, detect clinical red flags, and transition patients into doctor consultation readiness.
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-background border border-border rounded-xl hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Queue
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-border px-4 py-2.5 rounded-xl">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by patient name, UHID, token number, or doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="text-xs text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>

      {/* Queue Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Waiting Patients ({filteredQueue.length})</span>
          </div>
        </div>

        {loading ? (
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

      {/* Record Vitals Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Record Patient Vitals & Clinical Triage</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Patient: <span className="font-semibold text-foreground">{selectedPatient?.patientName}</span> • UHID: <span className="font-mono text-foreground">{selectedPatient?.patientUhid}</span>
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
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
                    value={form.bloodPressure || ""}
                    onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Pulse */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    required
                    value={form.pulseRate || ""}
                    onChange={(e) => setForm({ ...form, pulseRate: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* SpO2 */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    value={form.spo2 || ""}
                    onChange={(e) => setForm({ ...form, spo2: parseFloat(e.target.value) })}
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
                    value={form.temperature || ""}
                    onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Resp Rate (breaths/min)</label>
                  <input
                    type="number"
                    value={form.respiratoryRate || ""}
                    onChange={(e) => setForm({ ...form, respiratoryRate: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Blood Sugar */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Blood Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={form.bloodSugarMgDl || ""}
                    onChange={(e) => setForm({ ...form, bloodSugarMgDl: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={form.heightCm || ""}
                    onChange={(e) => setForm({ ...form, heightCm: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none font-mono"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weightKg || ""}
                    onChange={(e) => setForm({ ...form, weightKg: parseFloat(e.target.value) })}
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
                    value={form.painScore ?? 0}
                    onChange={(e) => setForm({ ...form, painScore: parseInt(e.target.value) })}
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
                  value={form.chiefComplaint || ""}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border focus:border-teal-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HeartPulse className="w-3.5 h-3.5" />}
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
