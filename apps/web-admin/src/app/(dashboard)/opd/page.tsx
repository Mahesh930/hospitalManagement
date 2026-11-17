"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  doctorsApi,
  DoctorDashboardDto,
  DoctorQueueItemDto,
  DoctorScheduleSlotDto
} from "@medicore/api";
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldAlert,
  Activity,
  Calendar,
  Building,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";

export default function DoctorOpdDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DoctorDashboardDto | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchDashboard = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const res = await doctorsApi.getDashboard();
      if (res.data?.data) {
        setDashboard(res.data.data);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to load doctor dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCallPatient = async (appointmentId?: string) => {
    if (!appointmentId) return;
    try {
      await doctorsApi.callPatient(appointmentId);
      toast.success("Patient called into consultation room");
      router.push(`/opd/${appointmentId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to call patient");
    }
  };

  const filteredQueue = (dashboard?.activeQueue || []).filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.patientUhid.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.tokenNumber.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || item.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Doctor OPD Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Doctor Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {dashboard?.doctorName || "Dr. Consultation Console"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {dashboard?.isAvailable ? "ON DUTY" : "OFFLINE"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
              <span>{dashboard?.specialization || "Clinical Consultant"}</span>
              {dashboard?.registrationNumber && (
                <span>• Reg: <span className="font-mono">{dashboard.registrationNumber}</span></span>
              )}
              {dashboard?.roomNumber && (
                <span>• Room: <span className="font-semibold text-foreground">{dashboard.roomNumber}</span></span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-sm"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/doctor/ipd"
            className="px-4 py-2.5 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors shadow-sm"
          >
            Inpatient Rounds
          </Link>
          <Link
            href="/doctor/investigations"
            className="px-4 py-2.5 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors shadow-sm"
          >
            Lab & Radiology Orders
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner (if any) */}
      {dashboard?.criticalAlerts && dashboard.criticalAlerts.length > 0 && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">Clinical & Triage Alerts</span>
            <ul className="list-disc list-inside space-y-0.5">
              {dashboard.criticalAlerts.map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Real-time OPD Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today Total</span>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{dashboard?.todayAppointmentsCount || 0}</p>
          <span className="text-[11px] text-muted-foreground">Scheduled OPD visits</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waiting Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{dashboard?.waitingPatientsCount || 0}</p>
          <span className="text-[11px] text-muted-foreground">Ready for consultation</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Progress</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{dashboard?.inProgressCount || 0}</p>
          <span className="text-[11px] text-muted-foreground">Currently being examined</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{dashboard?.completedCount || 0}</p>
          <span className="text-[11px] text-muted-foreground">Encounters closed</span>
        </div>
      </div>

      {/* OPD Live Patient Queue Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Live Doctor Queue &amp; Patient Waiting List
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select or call a patient to begin clinical evaluation, ICD-10 diagnosis, and prescription.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search UHID, token, name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 pr-3.5 py-1.5 bg-muted/40 border border-input rounded-xl text-xs w-48 focus:w-60 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-input text-xs">
              {["ALL", "WAITING", "IN_CONSULTATION", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st === "IN_CONSULTATION" ? "IN PROGRESS" : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No patients found in the active OPD queue.</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting patients will automatically appear when checked in at reception.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Token / Order</th>
                  <th className="py-3 px-4">Patient Information</th>
                  <th className="py-3 px-4">Triage Vitals</th>
                  <th className="py-3 px-4">Chief Complaint &amp; Allergies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQueue.map((item) => (
                  <tr key={item.patientId + (item.appointmentId || "")} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center font-mono">
                          {item.tokenNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground">#{item.queueOrder}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-foreground text-sm block">{item.patientName}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {item.patientUhid} • {item.age ? `${item.age}y` : ""} {item.gender || ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {item.bloodPressure || item.pulseRate || item.temperature ? (
                        <div className="space-y-0.5">
                          {item.bloodPressure && <span>BP: <strong className="text-foreground">{item.bloodPressure}</strong> </span>}
                          {item.pulseRate && <span>PR: <strong className="text-foreground">{item.pulseRate}</strong> </span>}
                          {item.temperature && <span>T: <strong className="text-foreground">{item.temperature}°F</strong></span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Vitals not recorded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div>
                        <p className="text-foreground font-medium truncate">{item.chiefComplaint || "General Consultation"}</p>
                        {item.allergyCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            {item.allergyNames.join(", ")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">No Known Allergies</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === "IN_CONSULTATION"
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                            : item.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.appointmentId ? (
                        <div className="flex items-center justify-end gap-2">
                          {item.status !== "IN_CONSULTATION" && item.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleCallPatient(item.appointmentId)}
                              className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5 text-primary" /> Call
                            </button>
                          )}
                          <Link
                            href={`/opd/${item.appointmentId}`}
                            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <span>Open Console</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">Walk-in Visit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
