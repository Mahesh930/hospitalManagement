"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { patientsApi, appointmentsApi, PatientDto, AppointmentDto } from "@medicore/api";
import { toast } from "sonner";
import { User, Phone, ShieldAlert, CalendarDays, ArrowLeft, Clock, Activity, FileText } from "lucide-react";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [patient, setPatient] = useState<PatientDto | null>(null);
  const [history, setHistory] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, aRes] = await Promise.all([
          patientsApi.getById(resolvedParams.id),
          appointmentsApi.getPatientHistory(resolvedParams.id).catch(() => ({ data: { data: [] } })),
        ]);
        setPatient(pRes.data.data);
        setHistory(aRes.data.data || []);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: { message?: string } } } };
        toast.error(error?.response?.data?.error?.message || "Failed to load patient profile");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Loading patient record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p className="font-semibold">Patient record not found.</p>
        <Link href="/patients" className="text-primary text-sm underline mt-2 block">
          Back to Patient Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/patients"
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
              <span className="px-2.5 py-1 bg-primary/10 text-primary font-mono text-xs font-semibold rounded-full">
                {patient.uhid}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {patient.gender}, {patient.age ? `${patient.age} yrs` : "N/A"} · Registered Patient
            </p>
          </div>
        </div>

        <Link
          href={`/appointments?patientId=${patient.id}`}
          className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
        >
          <CalendarDays className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      {/* Red Allergy Banner (US-141 Safety Feature) */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div className="allergy-banner bg-allergy text-white p-4 rounded-xl flex items-start gap-3 shadow-lg shadow-allergy/20">
          <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">CRITICAL ALLERGY ALERT</h3>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {patient.allergies.map((a, i) => (
                <span key={i} className="px-2.5 py-1 bg-white/20 text-white rounded-lg text-xs font-semibold">
                  {a.allergen} ({a.severity}) {a.reaction ? `- ${a.reaction}` : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Demographics Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Patient Information
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">UHID</span>
              <span className="font-mono font-semibold text-foreground">{patient.uhid}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Phone Number</span>
              <span className="text-foreground">{patient.phone}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Blood Group</span>
              <span className="font-semibold text-foreground">{patient.bloodGroup || "Not specified"}</span>
            </div>
            {patient.email && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider block">Email Address</span>
                <span className="text-foreground">{patient.email}</span>
              </div>
            )}
            {patient.abhaId && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider block">ABHA ID</span>
                <span className="font-mono text-foreground">{patient.abhaId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Visit History & Timeline */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Clinical Timeline &amp; Visit History
          </h2>

          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm">No past appointments recorded for this patient.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((apt) => (
                <div key={apt.id} className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{apt.doctorName || "Doctor Visit"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(apt.appointmentTime).toLocaleString()} · Status: <span className="font-semibold text-primary">{apt.status}</span>
                    </p>
                    {apt.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {apt.reason}</p>}
                  </div>
                  <Link
                    href={`/opd/${apt.id}`}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" /> OPD Record
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
