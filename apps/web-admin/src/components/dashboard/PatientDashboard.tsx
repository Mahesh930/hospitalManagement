"use client";

import { useEffect, useState } from "react";
import {
  User, CalendarDays, Pill, FlaskConical, Receipt, HeartPulse,
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, FileText,
  Phone, Activity, ChevronRight, Plus, RefreshCw, Printer
} from "lucide-react";
import Link from "next/link";
import { patientsApi, appointmentsApi, invoicesApi, PatientDto, PatientTimelineDto, AppointmentDto, InvoiceDto } from "@medicore/api";
import { toast } from "sonner";

export default function PatientDashboard() {
  const [patient, setPatient] = useState<PatientDto | null>(null);
  const [timeline, setTimeline] = useState<PatientTimelineDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"APPOINTMENTS" | "PRESCRIPTIONS" | "REPORTS" | "BILLS" | "VITALS">("APPOINTMENTS");

  const loadData = async () => {
    try {
      setRefreshing(true);
      const profileRes = await patientsApi.getMyProfile();
      const p = profileRes.data?.data;
      setPatient(p || null);

      if (p?.id) {
        const [timelineRes, apptsRes, invRes] = await Promise.all([
          patientsApi.getTimeline(p.id).catch(() => ({ data: { data: null } })),
          appointmentsApi.getPatientHistory(p.id).catch(() => ({ data: { data: [] } })),
          invoicesApi.getByPatientId(p.id).catch(() => ({ data: { data: [] } }))
        ]);
        setTimeline(timelineRes.data?.data || null);
        setAppointments(apptsRes.data?.data || []);
        setInvoices(invRes.data?.data || []);
      }
    } catch {
      toast.error("Failed to load your patient profile. Please contact front-desk.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading your medical records portal...</p>
        </div>
      </div>
    );
  }

  const upcomingAppts = appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CHECKED_IN");
  const pastAppts = appointments.filter((a) => a.status !== "SCHEDULED" && a.status !== "CHECKED_IN");

  // Extract all prescribed medicines from clinical timeline encounters
  const allPrescriptions = timeline?.encounters?.flatMap((enc) =>
    (enc.prescriptionItems || []).map((item) => ({
      ...item,
      encounterDate: enc.encounterDate,
      doctorName: enc.doctorName,
    }))
  ) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Patient Profile Card */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-md shrink-0">
            {patient?.name?.charAt(0) || "P"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{patient?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                {patient?.uhid}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
              <span>{patient?.gender || "Unspecified"} &bull; {patient?.age ? `${patient.age} yrs` : "Age N/A"}</span>
              <span>Blood Group: <strong className="text-rose-500 font-bold">{patient?.bloodGroup || "N/A"}</strong></span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient?.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <Link
            href="/appointments"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      {/* Allergies Critical Banner */}
      {patient?.allergies && patient.allergies.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Known Medical Allergies Alert
            </div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {patient.allergies.map((all, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/30">
                  {all.allergen} &bull; <span className="opacity-80">{all.severity}: {all.reaction}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Health KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Upcoming Visits", value: upcomingAppts.length, icon: CalendarDays, color: "text-blue-500 bg-blue-500/10", tab: "APPOINTMENTS" },
          { label: "Active Medicines", value: allPrescriptions.length, icon: Pill, color: "text-emerald-500 bg-emerald-500/10", tab: "PRESCRIPTIONS" },
          { label: "Lab Reports", value: timeline?.encounters?.length || 0, icon: FlaskConical, color: "text-purple-500 bg-purple-500/10", tab: "REPORTS" },
          { label: "Invoices / Bills", value: invoices.length, icon: Receipt, color: "text-amber-500 bg-amber-500/10", tab: "BILLS" },
        ].map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setActiveTab(kpi.tab as typeof activeTab)}
            className={`p-4 rounded-xl border text-left transition shadow-xs flex items-center justify-between ${
              activeTab === kpi.tab ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/30"
            }`}
          >
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">{kpi.label}</div>
              <div className="text-xl font-bold text-foreground mt-1">{kpi.value}</div>
            </div>
            <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center font-bold`}>
              <kpi.icon className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: "APPOINTMENTS", label: "My Appointments", icon: CalendarDays },
          { id: "PRESCRIPTIONS", label: "Prescriptions & Meds", icon: Pill },
          { id: "REPORTS", label: "Consultation Records", icon: FileText },
          { id: "BILLS", label: "Billing & Invoices", icon: Receipt },
          { id: "VITALS", label: "Vitals History", icon: HeartPulse },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Appointments */}
      {activeTab === "APPOINTMENTS" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Upcoming Appointments ({upcomingAppts.length})
            </h2>
            {upcomingAppts.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppts.map((appt) => (
                  <div key={appt.id} className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {appt.doctorName ? `Dr. ${appt.doctorName}` : "General Physician"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {appt.appointmentTime} &bull; Reason: {appt.reason || "General Consultation"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {appt.status}
                      </span>
                      {appt.tokenNumber && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                          Token #{appt.tokenNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No upcoming appointments scheduled. Need care? Click &quot;Book Appointment&quot; above.
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {pastAppts.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Past Consultations ({pastAppts.length})
              </h2>
              <div className="divide-y divide-border">
                {pastAppts.map((appt) => (
                  <div key={appt.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground">{appt.doctorName || "Doctor"}</span>
                      <span className="text-muted-foreground ml-2">({appt.appointmentTime})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Prescriptions */}
      {activeTab === "PRESCRIPTIONS" && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" /> Active &amp; Historical Prescriptions
          </h2>
          {allPrescriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allPrescriptions.map((rx, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{rx.medicineName}</h3>
                      <p className="text-xs text-muted-foreground">{rx.dosage} &bull; {rx.frequency} &bull; {rx.durationDays} days</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Prescribed
                    </span>
                  </div>
                  {rx.instructions && (
                    <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border">
                      <strong className="text-foreground">Instructions: </strong>{rx.instructions}
                    </p>
                  )}
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border flex justify-between">
                    <span>By: {rx.doctorName}</span>
                    <span>Date: {rx.encounterDate}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No prescriptions found on your clinical file.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Consultation Records */}
      {activeTab === "REPORTS" && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Longitudinal Clinical Encounters
          </h2>
          {timeline?.encounters && timeline.encounters.length > 0 ? (
            <div className="space-y-4">
              {timeline.encounters.map((enc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{enc.doctorName} &bull; {enc.departmentName || "OPD"}</span>
                    <span className="text-xs text-muted-foreground">{enc.encounterDate}</span>
                  </div>
                  {enc.diagnosisNotes && (
                    <p className="text-xs text-foreground bg-background/50 p-2.5 rounded-lg border border-border">
                      <strong className="text-primary">Clinical Diagnosis: </strong>{enc.diagnosisNotes}
                      {enc.icdCode && <span className="ml-2 font-mono text-muted-foreground">({enc.icdCode})</span>}
                    </p>
                  )}
                  {enc.advice && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Physician Advice: </strong>{enc.advice}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No past consultation summaries recorded yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Invoices & Bills */}
      {activeTab === "BILLS" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Hospital Bills &amp; Invoices ({invoices.length})
            </h2>
          </div>
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px]">
                    <th className="py-3 px-4 font-semibold">Invoice #</th>
                    <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                    <th className="py-3 px-4 font-semibold text-right">GST</th>
                    <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono font-semibold text-primary">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-right">₹{(inv.subtotal ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">₹{(inv.gstAmount ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">₹{(inv.grandTotal ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                          {inv.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/billing/${inv.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold transition"
                        >
                          <Printer className="w-3 h-3" /> View Bill
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No bills or invoices issued yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Vitals History */}
      {activeTab === "VITALS" && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-500" /> Recorded Vital Signs History
          </h2>
          {timeline?.recentVitals && timeline.recentVitals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeline.recentVitals.map((v) => (
                <div key={v.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{v.recordedAt || "Recorded recently"}</span>
                    {v.isAbnormal && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">
                        Abnormal
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block">BP</span>
                      <strong className="text-foreground">{v.bloodPressure || "—"} mmHg</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Pulse</span>
                      <strong className="text-foreground">{v.pulseRate ? `${v.pulseRate} bpm` : "—"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">SpO2</span>
                      <strong className="text-foreground">{v.spo2 ? `${v.spo2}%` : "—"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Temp</span>
                      <strong className="text-foreground">{v.temperature ? `${v.temperature}°F` : "—"}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No recorded vitals found on file.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
