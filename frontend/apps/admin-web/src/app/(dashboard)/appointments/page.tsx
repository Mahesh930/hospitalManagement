"use client";

import { useState } from "react";
import Link from "next/link";
import { appointmentsApi, patientsApi, AppointmentDto, PatientDto } from "@medicore/api";
import { toast } from "sonner";
import { CalendarDays, Clock, UserCheck, Search, Plus, User } from "lucide-react";

export default function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [foundPatients, setFoundPatients] = useState<PatientDto[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientQuery.trim()) return;
    try {
      const res = await patientsApi.search(patientQuery);
      setFoundPatients(res.data.data || []);
    } catch {
      toast.error("Failed to search patient");
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient?.id || !doctorId || !appointmentTime) {
      toast.error("Please fill in patient, doctor, and date/time");
      return;
    }

    setLoading(true);
    try {
      const payload: AppointmentDto = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientUhid: selectedPatient.uhid,
        doctorId,
        doctorName: doctorName || "Dr. Specialist",
        appointmentTime: new Date(appointmentTime).toISOString(),
        reason,
      };

      await appointmentsApi.book(payload);
      toast.success("Appointment booked successfully!");
      setShowModal(false);
      setSelectedPatient(null);
      setPatientQuery("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointment Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">
            US-130: Schedule OPD appointments and manage live patient check-ins.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/appointments/queue"
            className="px-4 py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all text-sm flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> Live Doctor Queue
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Schedule Appointment
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-card border border-border rounded-xl p-8 text-center max-w-2xl mx-auto space-y-4">
        <CalendarDays className="w-16 h-16 text-primary mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">OPD Appointment Desk</h2>
        <p className="text-sm text-muted-foreground">
          Use the button above to schedule a new patient appointment or open the Live Doctor Queue to perform check-ins.
        </p>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Book OPD Slot
            </h2>

            {/* Step 1: Select Patient */}
            {!selectedPatient ? (
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Find Patient by Name or UHID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Search patient..."
                    className="flex-1 px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm"
                  />
                  <button
                    onClick={handleSearchPatient}
                    className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl"
                  >
                    Search
                  </button>
                </div>

                {foundPatients.length > 0 && (
                  <div className="max-h-40 overflow-y-auto divide-y divide-border border border-border rounded-xl">
                    {foundPatients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className="w-full text-left p-3 hover:bg-muted/40 transition-colors flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">UHID: {p.uhid} · {p.phone}</p>
                        </div>
                        <span className="text-xs text-primary font-semibold">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Selected Patient:</p>
                  <p className="font-semibold text-sm text-foreground">{selectedPatient.name} ({selectedPatient.uhid})</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Change
                </button>
              </div>
            )}

            {/* Step 2: Slot & Doctor Form */}
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                  Doctor ID / Name
                </label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => {
                    setDoctorName(e.target.value);
                    setDoctorId("doc-" + e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                  placeholder="e.g. Dr. Rajesh Kumar (Cardiology)"
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                  Appointment Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                  Chief Complaint / Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Chest pain, routine checkup"
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedPatient}
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
