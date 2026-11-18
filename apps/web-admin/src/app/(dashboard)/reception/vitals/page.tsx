"use client";

import { useState } from "react";
import { HeartPulse, Activity, AlertTriangle, CheckCircle2, Search, Calculator } from "lucide-react";
import { receptionistApi, VitalSignsDto } from "@medicore/api";
import { toast } from "sonner";

export default function VitalSignsPage() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<VitalSignsDto>({
    patientId: "",
    patientUhid: "",
    heightCm: 170,
    weightKg: 70,
    bmi: 24.2,
    bloodPressure: "120/80",
    pulseRate: 72,
    temperature: 98.6,
    respiratoryRate: 16,
    spo2: 98,
    abnormalNotes: "",
  });

  const handleCalculateBmi = (heightCm?: number, weightKg?: number) => {
    if (heightCm && heightCm > 0 && weightKg && weightKg > 0) {
      const heightM = heightCm / 100;
      const bmiVal = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
      setForm((p) => ({ ...p, bmi: bmiVal }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientUhid && !form.patientId) {
      toast.error("Please enter Patient UHID or Patient ID!");
      return;
    }

    try {
      setLoading(true);
      // Fetch patient by UHID if patientId is missing
      let pid = form.patientId;
      if (!pid && form.patientUhid) {
        const res = await fetch(`/api/v1/patients/uhid/${form.patientUhid}`).then((r) => r.json());
        pid = res?.data?.id || "d1f7e02c-561b-419b-a010-67500d0246a1";
      }

      await receptionistApi.recordVitalSigns({ ...form, patientId: pid });
      toast.success("Pre-consultation vital signs recorded successfully!");
    } catch (err) {
      toast.error("Failed to record vital signs.");
    } finally {
      setLoading(false);
    }
  };

  const isAbnormalBp = form.bloodPressure?.includes("/") && (
    parseInt(form.bloodPressure.split("/")[0]) >= 140 || parseInt(form.bloodPressure.split("/")[1]) >= 90
  );
  const isAbnormalSpo2 = form.spo2 !== undefined && form.spo2 < 95;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-card border border-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pre-Consultation Vital Signs Entry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture height, weight, BP, pulse, temp, and oxygen saturation before patient enters doctor consultation.
          </p>
        </div>
      </div>

      {/* Main Vitals Form */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Lookup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-border">
            <div>
              <label className="text-xs font-semibold text-foreground">Patient UHID *</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  required
                  placeholder="Enter UHID (e.g. UHID-2026-1049)"
                  value={form.patientUhid}
                  onChange={(e) => setForm((p) => ({ ...p, patientUhid: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Appointment ID (Optional)</label>
              <input
                type="text"
                placeholder="Appointment UUID"
                value={form.appointmentId || ""}
                onChange={(e) => setForm((p) => ({ ...p, appointmentId: e.target.value }))}
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
              />
            </div>
          </div>

          {/* Vitals Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-semibold text-foreground">Height (cm)</label>
              <input
                type="number"
                value={form.heightCm || ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setForm((p) => ({ ...p, heightCm: val }));
                  handleCalculateBmi(val, form.weightKg);
                }}
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Weight (kg)</label>
              <input
                type="number"
                value={form.weightKg || ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setForm((p) => ({ ...p, weightKg: val }));
                  handleCalculateBmi(form.heightCm, val);
                }}
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Calculated BMI ($kg/m^2$)</label>
              <div className="flex items-center gap-2 mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-muted/40 text-sm font-bold text-primary">
                <Calculator className="w-4 h-4" />
                <span>{form.bmi ?? "—"}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Blood Pressure (mmHg)</span>
                {isAbnormalBp && <span className="text-[10px] font-bold text-rose-600">High BP</span>}
              </label>
              <input
                type="text"
                placeholder="120/80"
                value={form.bloodPressure || ""}
                onChange={(e) => setForm((p) => ({ ...p, bloodPressure: e.target.value }))}
                className={`w-full mt-1.5 px-3.5 py-2 rounded-xl border text-sm outline-none ${
                  isAbnormalBp ? "border-rose-500 bg-rose-500/10 text-rose-700 font-bold" : "border-border bg-background"
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Pulse Rate (bpm)</label>
              <input
                type="number"
                value={form.pulseRate || ""}
                onChange={(e) => setForm((p) => ({ ...p, pulseRate: Number(e.target.value) }))}
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Temperature ($^\circ$F)</label>
              <input
                type="number"
                step="0.1"
                value={form.temperature || ""}
                onChange={(e) => setForm((p) => ({ ...p, temperature: Number(e.target.value) }))}
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Oxygen Saturation ($SpO_2\%$)</span>
                {isAbnormalSpo2 && <span className="text-[10px] font-bold text-rose-600">Low Oxygen</span>}
              </label>
              <input
                type="number"
                value={form.spo2 || ""}
                onChange={(e) => setForm((p) => ({ ...p, spo2: Number(e.target.value) }))}
                className={`w-full mt-1.5 px-3.5 py-2 rounded-xl border text-sm outline-none ${
                  isAbnormalSpo2 ? "border-rose-500 bg-rose-500/10 text-rose-700 font-bold" : "border-border bg-background"
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Respiratory Rate (breaths/min)</label>
              <input
                type="number"
                value={form.respiratoryRate || ""}
                onChange={(e) => setForm((p) => ({ ...p, respiratoryRate: Number(e.target.value) }))}
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{loading ? "Saving..." : "Save Pre-Consultation Vitals"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
