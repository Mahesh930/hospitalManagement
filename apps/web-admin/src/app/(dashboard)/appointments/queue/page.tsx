"use client";

import { useState } from "react";
import Link from "next/link";
import { appointmentsApi, AppointmentDto } from "@medicore/api";
import { toast } from "sonner";
import { Clock, UserCheck, Stethoscope, ArrowLeft, RefreshCw, ChevronRight } from "lucide-react";

export default function DoctorQueuePage() {
  const [doctorId, setDoctorId] = useState("");
  const [queue, setQueue] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    if (!doctorId.trim()) {
      toast.error("Please enter a Doctor ID");
      return;
    }
    setLoading(true);
    try {
      const res = await appointmentsApi.getDoctorQueue(doctorId);
      setQueue(res.data.data || []);
      toast.success("Queue updated!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to load doctor queue");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await appointmentsApi.checkIn(appointmentId);
      toast.success("Patient Checked In! Queue Token Assigned.");
      fetchQueue();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Check-in failed");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/appointments"
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Doctor OPD Queue</h1>
            <p className="text-sm text-muted-foreground">Check in patients and track doctor queue tokens</p>
          </div>
        </div>
      </div>

      {/* Doctor Search */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex gap-3">
        <input
          type="text"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          placeholder="Enter Doctor ID (e.g. doc-dr.-rajesh-kumar)"
          className="flex-1 px-3.5 py-2.5 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Fetch Queue
        </button>
      </div>

      {/* Queue List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between">
          <span>Active Queue Tokens ({queue.length})</span>
          <span className="text-xs text-muted-foreground">Sorted by Token Order</span>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No queue items retrieved.</p>
            <p className="text-xs text-muted-foreground mt-1">Enter a Doctor ID above to fetch active tokens.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {queue.map((item, idx) => (
              <div key={item.id} className="p-4 hover:bg-muted/40 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold text-lg flex items-center justify-center">
                    #{item.queueOrder || idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{item.patientName || "Patient"}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      UHID: {item.patientUhid} · Status: <span className="font-semibold text-primary">{item.status}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "SCHEDULED" && item.id && (
                    <button
                      onClick={() => handleCheckIn(item.id!)}
                      className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <UserCheck className="w-4 h-4" /> Check In
                    </button>
                  )}
                  {item.status === "CHECKED_IN" && (
                    <Link
                      href={`/opd/${item.id}`}
                      className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
                    >
                      <Stethoscope className="w-4 h-4" /> Start Consultation
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
