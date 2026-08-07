"use client";

import { useEffect, useState } from "react";
import {
  Users, CalendarDays, Activity, Clock, HeartPulse, UserPlus,
  AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw, FileText,
  Building2, ShieldAlert, ArrowRight, Printer, QrCode, Stethoscope, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { receptionistApi, ReceptionistDashboardDto, DoctorQueueStatusDto } from "@medicore/api";
import { toast } from "sonner";

export default function ReceptionDashboardPage() {
  const [data, setData] = useState<ReceptionistDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await receptionistApi.getDashboardStats();
      if (res) {
        setData(res);
      }
    } catch (err) {
      toast.error("Failed to load front-office dashboard metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = [
    { label: "Today's Appointments", value: data?.todayAppointments ?? 0, icon: CalendarDays, color: "from-blue-500 to-indigo-600", href: "/appointments" },
    { label: "Walk-in Patients", value: data?.walkinPatients ?? 0, icon: Users, color: "from-emerald-500 to-teal-600", href: "/reception/queue" },
    { label: "Waiting Patients", value: data?.waitingPatients ?? 0, icon: Clock, color: "from-amber-500 to-orange-600", href: "/reception/queue" },
    { label: "Checked-in Patients", value: data?.checkedInPatients ?? 0, icon: Activity, color: "from-cyan-500 to-blue-600", href: "/reception/queue" },
    { label: "Completed Consultations", value: data?.completedConsultations ?? 0, icon: CheckCircle2, color: "from-purple-500 to-indigo-600", href: "/reception/reports" },
    { label: "Emergency Patients", value: data?.emergencyPatients ?? 0, icon: ShieldAlert, color: "from-rose-500 to-red-600", href: "/reception/queue?filter=emergency" },
    { label: "Doctor Availability", value: `${data?.doctorAvailabilityCount ?? 0} Active`, icon: Stethoscope, color: "from-teal-500 to-emerald-600", href: "/reception/queue" },
    { label: "Pending Billing", value: data?.pendingBillingCount ?? 0, icon: FileText, color: "from-amber-600 to-yellow-600", href: "/billing" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Front-Office Receptionist Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live Operations
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time patient check-ins, walk-in token generation, doctor queues, and pre-consultation vitals recording.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>

          <Link
            href="/reception/registration"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </Link>
        </div>
      </div>

      {/* Announcements Banner if present */}
      {data?.announcements && data.announcements.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-semibold">Hospital Announcements: </span>
            {data.announcements.join(" | ")}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group bg-card border border-border p-5 rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{loading ? "..." : item.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Front-Office Quick Actions Bar */}
      <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-semibold text-foreground">Reception Desk Quick Workflows</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/reception/registration"
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-muted/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Patient Registration</p>
              <p className="text-xs text-muted-foreground">Full demographics & ABHA</p>
            </div>
          </Link>

          <Link
            href="/reception/queue?modal=walkin"
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-emerald/40 hover:bg-muted/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Issue Walk-in Token</p>
              <p className="text-xs text-muted-foreground">Assign live doctor queue</p>
            </div>
          </Link>

          <Link
            href="/reception/vitals"
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-rose-500/40 hover:bg-muted/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:bg-rose-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Capture Vital Signs</p>
              <p className="text-xs text-muted-foreground">BP, SpO2, Temp & BMI</p>
            </div>
          </Link>

          <Link
            href="/reception/reports"
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-purple-500/40 hover:bg-muted/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Daily Operations Report</p>
              <p className="text-xs text-muted-foreground">Registrations & Check-ins</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Doctor Availability & Live OPD Queues */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Doctor Availability & Live OPD Queues</h3>
          <Link href="/reception/queue" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>Manage All Doctor Queues</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground col-span-full">Loading live doctor OPD queues...</p>
          ) : data?.doctorQueues && data.doctorQueues.length > 0 ? (
            data.doctorQueues.map((doc: DoctorQueueStatusDto) => (
              <div key={doc.doctorId} className="bg-card border border-border p-5 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-foreground">{doc.doctorName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.departmentName} • {doc.roomNumber}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    doc.isAvailable
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  }`}>
                    {doc.isAvailable ? "Available" : "On Leave / Away"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div className="bg-muted/40 p-2.5 rounded-xl text-center">
                    <span className="text-xs text-muted-foreground block">Waiting Queue</span>
                    <span className="text-lg font-bold text-foreground">{doc.waitingCount} Patients</span>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-xl text-center">
                    <span className="text-xs text-muted-foreground block">Current Token</span>
                    <span className="text-lg font-bold text-primary">{doc.currentToken}</span>
                  </div>
                </div>

                <Link
                  href={`/reception/queue?doctorId=${doc.doctorId}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <span>Open Doctor Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground col-span-full">No active doctors registered in OPD.</p>
          )}
        </div>
      </div>
    </div>
  );
}
