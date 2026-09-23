"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Droplets, Plus, RefreshCw, AlertTriangle, ArrowDownRight, ArrowUpRight,
  User, Bed, Clock, CheckCircle2, ShieldAlert, Sparkles, Filter, Activity
} from "lucide-react";
import {
  nurseApi, FluidBalanceDto, FluidBalanceSummaryDto, NursingCareRecordDto,
  patientsApi, PatientDto
} from "@medicore/api";
import { toast } from "sonner";

export default function FluidBalancePage() {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [summary, setSummary] = useState<FluidBalanceSummaryDto | null>(null);
  const [careHistory, setCareHistory] = useState<NursingCareRecordDto[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Modals
  const [fluidModalOpen, setFluidModalOpen] = useState(false);
  const [fluidForm, setFluidForm] = useState({
    recordType: "INTAKE" as "INTAKE" | "OUTPUT",
    subCategory: "ORAL",
    amountMl: 250,
    notes: "",
  });
  const [savingFluid, setSavingFluid] = useState(false);

  const [careModalOpen, setCareModalOpen] = useState(false);
  const [careForm, setCareForm] = useState({
    careType: "WOUND_DRESSING",
    siteOrDevice: "Abdominal surgical wound",
    statusOrCondition: "Clean & Intact",
    details: "Dry sterile dressing applied, no exudate or erythema.",
  });
  const [savingCare, setSavingCare] = useState(false);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const res = await patientsApi.search("");
      const pts = res.data?.data || [];
      setPatients(pts);
      if (pts.length > 0 && !selectedPatientId && pts[0].id) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (err) {
      console.error("Failed to load patients", err);
      toast.error("Failed to load ward inpatients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadPatientData = async (patientId: string) => {
    if (!patientId) return;
    try {
      setLoadingSummary(true);
      const [sumRes, careRes] = await Promise.all([
        nurseApi.getFluidBalanceSummary(patientId),
        nurseApi.getPatientBedsideCareHistory(patientId),
      ]);
      if (sumRes.data) setSummary(sumRes.data);
      if (careRes.data) setCareHistory(careRes.data);
    } catch (err) {
      console.error("Failed to load fluid/care data", err);
      toast.error("Failed to load patient fluid & care history");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const handleSaveFluid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    try {
      setSavingFluid(true);
      await nurseApi.recordFluidBalance({
        patientId: selectedPatientId,
        recordType: fluidForm.recordType,
        subCategory: fluidForm.subCategory,
        amountMl: Number(fluidForm.amountMl),
        notes: fluidForm.notes,
      });
      toast.success(`${fluidForm.recordType} recorded successfully`);
      setFluidModalOpen(false);
      setFluidForm({ recordType: "INTAKE", subCategory: "ORAL", amountMl: 250, notes: "" });
      loadPatientData(selectedPatientId);
    } catch (err: any) {
      console.error("Failed to save fluid entry", err);
      toast.error(err?.response?.data?.error?.message || "Failed to log fluid balance");
    } finally {
      setSavingFluid(false);
    }
  };

  const handleSaveCare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    try {
      setSavingCare(true);
      await nurseApi.recordBedsideCare({
        patientId: selectedPatientId,
        careType: careForm.careType,
        siteOrDevice: careForm.siteOrDevice,
        statusOrCondition: careForm.statusOrCondition,
        details: careForm.details,
      });
      toast.success("Bedside care procedure logged");
      setCareModalOpen(false);
      loadPatientData(selectedPatientId);
    } catch (err: any) {
      console.error("Failed to save care procedure", err);
      toast.error(err?.response?.data?.error?.message || "Failed to log bedside care");
    } finally {
      setSavingCare(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Intake / Output & 24h Fluid Balance
              </h1>
              <p className="text-sm text-muted-foreground">
                Fluid monitoring, cumulative balance calculation, and specialized bedside nursing care.
              </p>
            </div>
          </div>
        </div>

        {/* Patient Selection Dropdown */}
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
            onClick={() => loadPatientData(selectedPatientId)}
            className="p-2.5 mt-5 border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh Patient Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSummary ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Fluid Overload Warning Banner */}
      {summary?.isFluidOverloadRisk && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 animate-pulse">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Clinical Alert: Fluid Overload Risk Detected!</span> 24-hour cumulative positive balance exceeds +2000 ml ({summary.netBalanceMl} ml). Notify attending physician and monitor pulmonary status and edema.
          </div>
        </div>
      )}

      {/* 24-Hour Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Intake */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">24h Total Intake</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {summary?.totalIntakeMl ?? 0} <span className="text-sm font-normal text-muted-foreground">ml</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Oral, IV fluids, tube feeds, blood products</p>
        </div>

        {/* Total Output */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">24h Total Output</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {summary?.totalOutputMl ?? 0} <span className="text-sm font-normal text-muted-foreground">ml</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Urine, surgical drains, vomit, NG aspirate</p>
        </div>

        {/* Net Fluid Balance */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Fluid Balance</span>
            <div className={`p-2 rounded-lg ${
              (summary?.netBalanceMl ?? 0) >= 0 ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
            }`}>
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            (summary?.netBalanceMl ?? 0) > 2000 ? "text-red-500" : "text-foreground"
          }`}>
            {(summary?.netBalanceMl ?? 0) > 0 ? `+${summary?.netBalanceMl}` : summary?.netBalanceMl ?? 0}{" "}
            <span className="text-sm font-normal text-muted-foreground">ml</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Intake minus Output (24-hour cycle)</p>
        </div>

        {/* Quick Action Buttons Card */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center gap-2">
          <button
            onClick={() => setFluidModalOpen(true)}
            disabled={!selectedPatientId}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Log Intake / Output
          </button>
          <button
            onClick={() => setCareModalOpen(true)}
            disabled={!selectedPatientId}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border font-semibold rounded-xl text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Activity className="w-4 h-4" /> Log Bedside Care
          </button>
        </div>
      </div>

      {/* Main Content: Split View for Intake/Output Table & Bedside Care Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Intake/Output Records Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Recent Intake / Output Records</h2>
              <p className="text-xs text-muted-foreground">Detailed chronological fluid measurements</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-muted rounded-full">
              {summary?.recentRecords.length ?? 0} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground font-medium text-xs uppercase">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4">Nurse</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary?.recentRecords && summary.recentRecords.length > 0 ? (
                  summary.recentRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {r.recordedAt ? new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          r.recordType === "INTAKE"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}>
                          {r.recordType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{r.subCategory}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {r.amountMl} ml
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{r.recordedBy}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-xs">{r.notes || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Droplets className="w-8 h-8 mx-auto text-muted mb-2 opacity-50" />
                      <p className="font-medium">No fluid records logged yet today.</p>
                      <p className="text-xs">Click "Log Intake / Output" to add the first measurement.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Bedside Nursing Care History */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Bedside Care History</h2>
              <p className="text-xs text-muted-foreground">Wound, drain, catheter & repositioning</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-muted rounded-full">
              {careHistory.length}
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
            {careHistory && careHistory.length > 0 ? (
              careHistory.map((c) => (
                <div key={c.id} className="p-3.5 bg-background border border-border rounded-xl space-y-1.5 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                      {c.careType.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {c.performedAt ? new Date(c.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  {c.siteOrDevice && (
                    <div className="text-xs font-semibold text-foreground">
                      Site/Device: <span className="font-normal text-muted-foreground">{c.siteOrDevice}</span>
                    </div>
                  )}
                  {c.statusOrCondition && (
                    <div className="text-xs font-semibold text-foreground">
                      Condition: <span className="font-normal text-emerald-600 dark:text-emerald-400">{c.statusOrCondition}</span>
                    </div>
                  )}
                  {c.details && (
                    <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded-lg">
                      {c.details}
                    </p>
                  )}
                  <div className="text-[11px] text-muted-foreground text-right pt-1">
                    Nurse: {c.performedBy}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto text-muted mb-2 opacity-50" />
                <p className="text-xs">No bedside procedures documented yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Log Fluid Intake / Output */}
      {fluidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" /> Log Intake or Output
              </h3>
              <button
                onClick={() => setFluidModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFluid} className="space-y-4">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                <button
                  type="button"
                  onClick={() => setFluidForm({ ...fluidForm, recordType: "INTAKE", subCategory: "ORAL" })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    fluidForm.recordType === "INTAKE"
                      ? "bg-emerald-500 text-white shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  INTAKE (Administered)
                </button>
                <button
                  type="button"
                  onClick={() => setFluidForm({ ...fluidForm, recordType: "OUTPUT", subCategory: "URINE" })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    fluidForm.recordType === "OUTPUT"
                      ? "bg-amber-500 text-white shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  OUTPUT (Drained/Lost)
                </button>
              </div>

              {/* Subcategory */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subcategory</label>
                <select
                  value={fluidForm.subCategory}
                  onChange={(e) => setFluidForm({ ...fluidForm, subCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                >
                  {fluidForm.recordType === "INTAKE" ? (
                    <>
                      <option value="ORAL">Oral Fluid (Water, Juice, Soup)</option>
                      <option value="IV_FLUID">IV Infusion / Saline</option>
                      <option value="TUBE_FEED">Enteral / NG Tube Feed</option>
                      <option value="BLOOD_PRODUCT">Blood Transfusion / Plasma</option>
                      <option value="OTHER_INTAKE">Other Intake</option>
                    </>
                  ) : (
                    <>
                      <option value="URINE">Urine Voided / Foley Catheter</option>
                      <option value="SURGICAL_DRAIN">Surgical Drain Output</option>
                      <option value="VOMIT">Emesis / Vomit</option>
                      <option value="NG_ASPIRATE">NG Tube Aspirate</option>
                      <option value="BOWEL">Stool / Diarrhea</option>
                      <option value="OTHER_OUTPUT">Other Output</option>
                    </>
                  )}
                </select>
              </div>

              {/* Amount in ml */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Volume (ml)</label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  required
                  value={fluidForm.amountMl}
                  onChange={(e) => setFluidForm({ ...fluidForm, amountMl: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold font-mono"
                  placeholder="e.g. 250"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Clinical Notes</label>
                <input
                  type="text"
                  value={fluidForm.notes}
                  onChange={(e) => setFluidForm({ ...fluidForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. Normal clear color, tolerated well"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFluidModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFluid}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingFluid ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Bedside Care Procedure */}
      {careModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" /> Log Bedside Nursing Care
              </h3>
              <button
                onClick={() => setCareModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCare} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Care Procedure Type</label>
                <select
                  value={careForm.careType}
                  onChange={(e) => setCareForm({ ...careForm, careType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="WOUND_DRESSING">Wound Care & Sterile Dressing</option>
                  <option value="REPOSITIONING">Q2H Repositioning (Ulcer Prevention)</option>
                  <option value="CATHETER_CARE">Urinary Catheter Care & Hygiene</option>
                  <option value="IV_LINE_MONITORING">IV Cannula & Line Site Check</option>
                  <option value="DRAIN_CARE">Surgical Drain Monitoring & Emptying</option>
                  <option value="HYGIENE_CARE">Bed Bath, Oral & Perineal Hygiene</option>
                  <option value="OXYGEN_THERAPY">Oxygen Therapy Administration</option>
                  <option value="NEBULIZATION">Nebulization Procedure</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Site or Device Location</label>
                <input
                  type="text"
                  value={careForm.siteOrDevice}
                  onChange={(e) => setCareForm({ ...careForm, siteOrDevice: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. Left Forearm Cannula 20G, Abdominal surgical site"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Condition / Observation</label>
                <input
                  type="text"
                  value={careForm.statusOrCondition}
                  onChange={(e) => setCareForm({ ...careForm, statusOrCondition: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. Clean & Intact, patent, mild erythema"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Procedure Details</label>
                <textarea
                  rows={3}
                  value={careForm.details}
                  onChange={(e) => setCareForm({ ...careForm, details: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="Enter sterile technique details, dressing used, or patient comfort feedback..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCareModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCare}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingCare ? "Logging..." : "Log Procedure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
