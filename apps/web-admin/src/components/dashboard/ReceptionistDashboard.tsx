"use client";

import { useEffect, useState } from "react";
import {
  Users, CalendarDays, Activity, Clock, HeartPulse, UserPlus,
  AlertTriangle, CheckCircle2, RefreshCw, FileText,
  ShieldAlert, ArrowRight, Stethoscope, Ticket, Check
} from "lucide-react";
import Link from "next/link";
import { receptionistApi, ReceptionistDashboardDto, DoctorQueueStatusDto } from "@medicore/api";
import { toast } from "sonner";

export default function ReceptionistDashboard() {
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
    } catch {
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
    { label: "Waiting in Queue", value: data?.waitingPatients ?? 0, icon: Clock, color: "from-amber-500 to-orange-600", href: "/reception/queue" },
    { label: "Checked-in Patients", value: data?.checkedInPatients ?? 0, icon: Activity, color: "from-cyan-500 to-blue-600", href: "/reception/queue" },
    { label: "Completed Consultations", value: data?.completedConsultations ?? 0, icon: CheckCircle2, color: "from-purple-500 to-indigo-600", href: "/reception/reports" },
    { label: "Emergency Patients", value: data?.emergencyPatients ?? 0, icon: ShieldAlert, color: "from-rose-500 to-red-600", href: "/reception/queue" },
    { label: "Active Doctors", value: `${data?.doctorAvailabilityCount ?? 0} On Duty`, icon: Stethoscope, color: "from-teal-500 to-emerald-600", href: "/reception/queue" },
    { label: "Pending Billing", value: data?.pendingBillingCount ?? 0, icon: FileText, color: "from-amber-600 to-yellow-600", href: "/billing" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reception &amp; Front-Desk Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live Operations
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time patient check-ins, walk-in token generation, doctor queues, and front-desk coordination.
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
            <span>Register Patient</span>
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
            className="group relative overflow-hidden bg-card border border-border hover:border-primary/50 transition-all rounded-xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Action Station */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/reception/queue"
          className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">Issue Token</div>
            <div className="text-xs text-muted-foreground">Walk-in queue ticket</div>
          </div>
        </Link>

        <Link
          href="/reception/registration"
          className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">Fast Registration</div>
            <div className="text-xs text-muted-foreground">Demographics &amp; UHID</div>
          </div>
        </Link>

        <Link
          href="/reception/vitals"
          className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">Pre-Consult Vitals</div>
            <div className="text-xs text-muted-foreground">BP, Pulse, SpO2, Temp</div>
          </div>
        </Link>

        <Link
          href="/reception/handover"
          className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">Shift Handover</div>
            <div className="text-xs text-muted-foreground">Cash &amp; queue transfer</div>
          </div>
        </Link>
      </div>

      {/* Doctor Availability & Live Queue Overview */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" /> OPD Doctors &amp; Consultation Queues
          </h2>
          <Link href="/reception/queue" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View Full Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.doctorQueues && data.doctorQueues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.doctorQueues.map((doc: DoctorQueueStatusDto) => (
              <div key={doc.doctorId} className="border border-border rounded-xl p-4 bg-muted/20 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{doc.doctorName}</h3>
                    <p className="text-xs text-muted-foreground">{doc.departmentName} &bull; Room {doc.roomNumber || "N/A"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${doc.isAvailable ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                    {doc.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Waiting: <strong className="text-foreground">{doc.waitingCount}</strong></span>
                  <span className="text-muted-foreground">Current Token: <strong className="text-primary">{doc.currentToken || "None"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No active doctor queue recorded for today yet.
          </div>
        )}
      </div>
    </div>
  );
}
