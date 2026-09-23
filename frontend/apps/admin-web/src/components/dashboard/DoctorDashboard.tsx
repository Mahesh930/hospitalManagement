"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Stethoscope, Users, Clock, CheckCircle2, AlertTriangle, ShieldAlert,
  ArrowRight, PhoneCall, FastForward, Activity, Heart, Thermometer,
  Weight, Sparkles, RefreshCw, CalendarDays, User, Building2
} from "lucide-react";
import { doctorsApi, DoctorDashboardDto, DoctorQueueItemDto } from "@medicore/api";
import { toast } from "sonner";

export default function DoctorDashboard() {
  const [dashboard, setDashboard] = useState<DoctorDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await doctorsApi.getDashboard();
      setDashboard(res.data.data);
    } catch (err: unknown) {
      console.error("Failed to load doctor dashboard", err);
      toast.error("Could not fetch doctor clinical workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCallPatient = async (appointmentId?: string) => {
    if (!appointmentId) return;
    try {
      setActionLoading(appointmentId);
      await doctorsApi.callPatient(appointmentId);
      toast.success("Patient called into consultation room");
      await fetchDashboard();
    } catch {
      toast.error("Failed to call patient");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkipPatient = async (appointmentId?: string) => {
    if (!appointmentId) return;
    try {
      setActionLoading(appointmentId);
      await doctorsApi.skipPatient(appointmentId);
      toast.warning("Patient marked as skipped / no-show");
      await fetchDashboard();
    } catch {
      toast.error("Failed to skip patient");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAvailability = async () => {
    if (!dashboard) return;
    try {
      const nextState = !dashboard.isAvailable;
      await doctorsApi.updateAvailability({ isAvailable: nextState });
      setDashboard({ ...dashboard, isAvailable: nextState });
      toast.success(nextState ? "Status set to Available in OPD" : "Status set to Away / On Break");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const currentPatient = dashboard?.activeQueue?.find((item) => item.status === "IN_CONSULTATION");
  const nextWaitingPatient = dashboard?.activeQueue?.find(
    (item) => item.status === "WAITING_DOCTOR" || item.status === "CHECKED_IN" || item.status === "IN_VITALS"
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-2xl shadow-inner border border-emerald-500/20">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {dashboard?.doctorName || "Doctor Workspace"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {dashboard?.specialization || "Clinical OPD"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Room: {dashboard?.roomNumber || "OPD-101"}
              <span>•</span>
              Reg No: {dashboard?.registrationNumber || "MCI-2026"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
              dashboard?.isAvailable
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${dashboard?.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {dashboard?.isAvailable ? "OPD Active" : "On Break"}
          </button>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Critical Clinical Alerts */}
      {dashboard?.criticalAlerts && dashboard.criticalAlerts.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider">Clinical Safety Alerts</span>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              {dashboard.criticalAlerts.slice(0, 3).map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Waiting in Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground mt-2">{dashboard?.waitingPatientsCount ?? 0}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Live queue tokens ready</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">In Consultation</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground mt-2">{dashboard?.inProgressCount ?? 0}</p>
          <p className="text-xs text-primary mt-1">{currentPatient ? currentPatient.patientName : "No active session"}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground mt-2">{dashboard?.completedCount ?? 0}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Prescriptions dispatched</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Appointments</span>
            <CalendarDays className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground mt-2">{dashboard?.todayAppointmentsCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
        </div>
      </div>

      {/* Spotlight: Active or Next Patient Card */}
      {currentPatient ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border-2 border-emerald-500/40 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> In Consultation Now
              </span>
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                Token: {currentPatient.tokenNumber}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">{currentPatient.patientName}</h2>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                UHID: {currentPatient.patientUhid}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Age/Gender: {currentPatient.age ?? "—"} yrs / {currentPatient.gender || "—"}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-rose-500 font-semibold">
                <Heart className="w-3 h-3" /> BP: {currentPatient.bloodPressure || "120/80"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Activity className="w-3 h-3" /> Pulse: {currentPatient.pulseRate ?? 72} bpm
              </span>
              {currentPatient.allergyCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 font-bold border border-rose-500/30">
                  ⚠️ {currentPatient.allergyCount} Allergy Alert
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href={`/opd/${currentPatient.appointmentId || currentPatient.patientId}`}
              className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 text-sm flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Stethoscope className="w-4 h-4" /> Open Clinical Console <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : nextWaitingPatient ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
              Next In Queue • Token {nextWaitingPatient.tokenNumber}
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">{nextWaitingPatient.patientName}</h2>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                UHID: {nextWaitingPatient.patientUhid}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vitals: BP {nextWaitingPatient.bloodPressure || "120/80"} • Pulse {nextWaitingPatient.pulseRate ?? 72} bpm • Temp {nextWaitingPatient.temperature ?? 98.6}°F
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => handleCallPatient(nextWaitingPatient.appointmentId)}
              disabled={actionLoading === nextWaitingPatient.appointmentId}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              <PhoneCall className="w-4 h-4" /> Call Patient
            </button>
            <Link
              href={`/opd/${nextWaitingPatient.appointmentId || nextWaitingPatient.patientId}`}
              className="px-5 py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Stethoscope className="w-4 h-4" /> Start Consultation
            </Link>
          </div>
        </div>
      ) : null}

      {/* Main Grid: Active Queue & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Queue Table (2 Cols) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Live Doctor OPD Queue
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Ordered by token arrival and clinical triage</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
              {dashboard?.activeQueue?.length ?? 0} Patients
            </span>
          </div>

          <div className="divide-y divide-border overflow-x-auto flex-1">
            {!dashboard?.activeQueue || dashboard.activeQueue.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium">All queues are clear</p>
                <p className="text-xs mt-1">No waiting patients currently assigned to your room.</p>
              </div>
            ) : (
              dashboard.activeQueue.map((item) => (
                <div
                  key={item.appointmentId || item.tokenNumber}
                  className={`p-4 transition-colors flex items-center justify-between gap-4 ${
                    item.status === "IN_CONSULTATION" ? "bg-emerald-500/5 dark:bg-emerald-500/10" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-bold flex flex-col items-center justify-center shrink-0 border border-primary/20">
                      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Token</span>
                      <span className="text-sm leading-none">{item.tokenNumber}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{item.patientName}</span>
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                          {item.patientUhid}
                        </span>
                        {item.allergyCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">
                            ALLERGIC
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{item.age ?? "—"}y / {item.gender || "—"}</span>
                        <span>•</span>
                        <span>BP: {item.bloodPressure || "120/80"}</span>
                        <span>•</span>
                        <span>Pulse: {item.pulseRate ?? 72}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "IN_CONSULTATION" ? (
                      <Link
                        href={`/opd/${item.appointmentId || item.patientId}`}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" /> Continue
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCallPatient(item.appointmentId)}
                          disabled={actionLoading === item.appointmentId}
                          className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                          title="Call Patient"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSkipPatient(item.appointmentId)}
                          disabled={actionLoading === item.appointmentId}
                          className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                          title="Skip Patient"
                        >
                          <FastForward className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/opd/${item.appointmentId || item.patientId}`}
                          className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 flex items-center gap-1.5"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Start
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule & Recent Column */}
        <div className="space-y-6">
          {/* Today's Schedule Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" /> Today&apos;s Schedule Slots
              </h3>
            </div>

            {!dashboard?.todaySchedule || dashboard.todaySchedule.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No scheduled slots booked yet</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {dashboard.todaySchedule.map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-foreground">{slot.slotTime}</span>
                      <span className="text-muted-foreground truncate max-w-[120px]">{slot.patientName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      slot.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                      slot.status === "IN_CONSULTATION" ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Completed Consultations */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recent Completed
            </h3>

            {!dashboard?.recentPatients || dashboard.recentPatients.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No consultations completed today yet</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {dashboard.recentPatients.map((recent) => (
                  <div key={recent.consultationId} className="p-3 rounded-xl bg-muted/40 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{recent.patientName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{recent.patientUhid}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      ICD: <span className="font-mono font-semibold">{recent.icdCode || "General"}</span> • {recent.prescriptionItemCount} meds
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
