"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { consultationsApi, ConsultationDto, PrescriptionItemDto } from "@medicore/api";
import { toast } from "sonner";
import {
  Stethoscope, ShieldAlert, Plus, Trash2, CheckCircle2, ArrowLeft,
  Activity, Heart, Thermometer, Weight, FileText, Pill
} from "lucide-react";
import Link from "next/link";

export default function OpdConsultationConsolePage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Vitals
  const [bloodPressure, setBloodPressure] = useState("120/80");
  const [pulseRate, setPulseRate] = useState<number | "">(72);
  const [temperature, setTemperature] = useState<number | "">(98.6);
  const [weight, setWeight] = useState<number | "">(70);

  // Clinical Notes & Diagnosis
  const [icdCode, setIcdCode] = useState("J06.9");
  const [diagnosisNotes, setDiagnosisNotes] = useState("Acute upper respiratory infection");
  const [advice, setAdvice] = useState("Rest, drink plenty of fluids.");

  // Prescription Items
  const [items, setItems] = useState<PrescriptionItemDto[]>([
    { medicineName: "Paracetamol 500mg", dosage: "1 tab", frequency: "TDS", durationDays: 5, instructions: "After meals" },
  ]);

  const [newMedName, setNewMedName] = useState("");
  const [newDosage, setNewDosage] = useState("1 tab");
  const [newFreq, setNewFreq] = useState("BD");
  const [newDuration, setNewDuration] = useState(5);
  const [newInst, setNewInst] = useState("After food");

  const addMedicine = () => {
    if (!newMedName.trim()) {
      toast.error("Enter medicine name");
      return;
    }
    setItems([...items, { medicineName: newMedName, dosage: newDosage, frequency: newFreq, durationDays: newDuration, instructions: newInst }]);
    setNewMedName("");
  };

  const removeMedicine = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: ConsultationDto = {
        appointmentId: resolvedParams.appointmentId,
        bloodPressure,
        pulseRate: pulseRate ? Number(pulseRate) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        weight: weight ? Number(weight) : undefined,
        icdCode,
        diagnosisNotes,
        prescription: {
          advice,
          items,
        },
      };

      const res = await consultationsApi.save(resolvedParams.appointmentId, payload);
      await consultationsApi.complete(res.data.data?.id || "");

      toast.success("Consultation Completed & Sent to Billing Queue!");
      router.push("/billing");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error?.response?.data?.error?.message || "Failed to save consultation";
      toast.error(`DRUG ALLERGY BLOCKER: ${msg}`, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/appointments/queue"
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-primary" /> OPD Consultation Console
            </h1>
            <p className="text-sm text-muted-foreground">Appointment Ref: {resolvedParams.appointmentId}</p>
          </div>
        </div>
      </div>

      {/* Hard Blocker Alert Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
        <span>
          <strong>US-141 Safety Enforcement:</strong> Prescribing any drug present in the patient&apos;s allergy registry will trigger an instant hard blocker exception (422 Unprocessable Entity).
        </span>
      </div>

      <form onSubmit={handleSaveAndComplete} className="space-y-6">
        {/* Vitals Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Patient Vitals
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> BP (mmHg)
              </label>
              <input
                type="text"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
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
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
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
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
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
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Clinical Diagnosis Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Diagnosis &amp; Clinical Notes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">ICD-10 Code</label>
              <input
                type="text"
                value={icdCode}
                onChange={(e) => setIcdCode(e.target.value)}
                placeholder="e.g. J06.9"
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-mono font-semibold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Diagnosis Notes</label>
              <input
                type="text"
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                placeholder="Clinical impressions..."
                className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Prescription & Drug Items Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" /> Digital Prescription
          </h2>

          {/* Rx items list */}
          {items.map((med, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl">
              <div>
                <span className="font-bold text-foreground text-sm">{med.medicineName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {med.dosage} · {med.frequency} · {med.durationDays} Days ({med.instructions})
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeMedicine(idx)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add Rx Item subform */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
            <input
              type="text"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              placeholder="Medicine Name (e.g. Penicillin 500mg)"
              className="sm:col-span-2 px-3 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
            <input
              type="text"
              value={newDosage}
              onChange={(e) => setNewDosage(e.target.value)}
              placeholder="Dosage (1 tab)"
              className="px-3 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
            <input
              type="text"
              value={newFreq}
              onChange={(e) => setNewFreq(e.target.value)}
              placeholder="Freq (TDS)"
              className="px-3 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={addMedicine}
              className="px-4 py-2 bg-secondary text-secondary-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Rx
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Doctor Advice / Dietary Instructions</label>
            <textarea
              rows={2}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            {loading ? "Processing Consultation..." : "Complete Consultation & Send to Billing"}
          </button>
        </div>
      </form>
    </div>
  );
}
