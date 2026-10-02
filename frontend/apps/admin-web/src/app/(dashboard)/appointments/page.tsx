"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  appointmentsApi, patientsApi, receptionistApi,
  AppointmentDto, PatientDto, DoctorScheduleDto
} from "@medicore/api";
import { toast } from "sonner";
import {
  CalendarDays, Clock, UserCheck, Search, Plus, User,
  Filter, RefreshCw, XCircle, CheckCircle2, AlertTriangle,
  Bell, Edit3, ArrowRightLeft, Stethoscope, ChevronRight
} from "lucide-react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorScheduleDto[]>([]);

  // Filter states
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [filterDoctorId, setFilterDoctorId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [foundPatients, setFoundPatients] = useState<PatientDto[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);
  const [bookingDoctorId, setBookingDoctorId] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Reschedule Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedApptToReschedule, setSelectedApptToReschedule] = useState<AppointmentDto | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedApptToCancel, setSelectedApptToCancel] = useState<AppointmentDto | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Load appointments and doctors
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const [apptRes, docRes] = await Promise.all([
        appointmentsApi.search({
          date: filterDate || undefined,
          doctorId: filterDoctorId && filterDoctorId !== "ALL" ? filterDoctorId : undefined,
          status: filterStatus && filterStatus !== "ALL" ? filterStatus : undefined,
        }),
        receptionistApi.getDoctorSchedules(),
      ]);

      if (apptRes.data?.data) {
        setAppointments(apptRes.data.data);
      }
      if (docRes) {
        setDoctors(docRes);
      }
    } catch (err) {
      console.error("Failed to load appointments", err);
      toast.error("Failed to fetch appointment list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filterDate, filterDoctorId, filterStatus]);

  // Search patients for booking modal
  const handleSearchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientQuery.trim()) return;
    try {
      const res = await patientsApi.search(patientQuery);
      setFoundPatients(res.data?.data || []);
    } catch {
      toast.error("Failed to search patient");
    }
  };

  // Submit Booking
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient?.id || !bookingDoctorId || !bookingTime) {
      toast.error("Please fill in patient, doctor, and date/time");
      return;
    }

    setBookingLoading(true);
    try {
      const doc = doctors.find((d) => d.doctorId === bookingDoctorId);
      const payload: AppointmentDto = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientUhid: selectedPatient.uhid,
        doctorId: bookingDoctorId,
        doctorName: doc?.doctorName || "Dr. Specialist",
        departmentName: doc?.departmentName,
        appointmentTime: new Date(bookingTime).toISOString(),
        reason: bookingReason,
        referralSource,
      };

      await appointmentsApi.book(payload);
      toast.success("Appointment booked successfully!");
      setShowModal(false);
      setSelectedPatient(null);
      setPatientQuery("");
      setBookingReason("");
      loadAppointments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  // Check-In
  const handleCheckIn = async (appointmentId: string) => {
    try {
      const res = await appointmentsApi.checkIn(appointmentId);
      if (res.data?.success) {
        toast.success("Patient checked-in to live doctor queue!");
        loadAppointments();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Check-in failed");
    }
  };

  // Confirm
  const handleConfirm = async (appointmentId: string) => {
    try {
      await appointmentsApi.confirm(appointmentId);
      toast.success("Appointment confirmed");
      loadAppointments();
    } catch (err: unknown) {
      toast.error("Failed to confirm appointment");
    }
  };

  // Send Reminder
  const handleSendReminder = async (appointmentId: string) => {
    try {
      await appointmentsApi.sendReminder(appointmentId);
      toast.success("Reminder notification sent to patient");
      loadAppointments();
    } catch (err: unknown) {
      toast.error("Failed to dispatch reminder");
    }
  };

  // Mark No-Show
  const handleMarkNoShow = async (appointmentId: string) => {
    try {
      await appointmentsApi.markNoShow(appointmentId);
      toast.info("Appointment marked as NO_SHOW");
      loadAppointments();
    } catch (err: unknown) {
      toast.error("Failed to mark no-show");
    }
  };

  // Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptToReschedule?.id || !rescheduleTime) {
      toast.error("Please specify a new appointment time");
      return;
    }

    try {
      setRescheduling(true);
      await appointmentsApi.reschedule(selectedApptToReschedule.id, {
        newTime: new Date(rescheduleTime).toISOString(),
        newDoctorId: rescheduleDoctorId || undefined,
      });
      toast.success("Appointment rescheduled successfully!");
      setRescheduleModalOpen(false);
      loadAppointments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Rescheduling failed");
    } finally {
      setRescheduling(false);
    }
  };

  // Cancel
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptToCancel?.id) return;

    try {
      setCancelling(true);
      await appointmentsApi.cancel(selectedApptToCancel.id, cancelReason);
      toast.success("Appointment cancelled");
      setCancelModalOpen(false);
      setCancelReason("");
      loadAppointments();
    } catch (err: unknown) {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.patientName?.toLowerCase().includes(q) ||
      a.patientUhid?.toLowerCase().includes(q) ||
      a.doctorName?.toLowerCase().includes(q) ||
      a.tokenNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>OPD Scheduling & Front-Desk Appointments Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Appointment Desk & Lifecycle Operations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Book slots, verify arrivals, check-in, reschedule, cancel with policy reasons, send SMS reminders, and manage no-shows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reception/queue"
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" /> Live Doctor Queue
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Book Appointment
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Date Picker */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Appointment Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs p-2 rounded-xl bg-background border border-border outline-none focus:border-primary"
            />
          </div>

          {/* Doctor Filter */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Doctor</label>
            <select
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value)}
              className="text-xs p-2 rounded-xl bg-background border border-border outline-none focus:border-primary"
            >
              <option value="ALL">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.doctorName} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs p-2 rounded-xl bg-background border border-border outline-none focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="BOOKED">BOOKED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CHECKED_IN">CHECKED_IN</option>
              <option value="IN_CONSULTATION">IN_CONSULTATION</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, UHID, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-background border border-border outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <span className="text-xs font-semibold text-foreground">
            Appointments Found ({filteredAppointments.length})
          </span>
          <button
            onClick={loadAppointments}
            disabled={loading}
            className="p-1.5 rounded-lg border border-border hover:bg-muted text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="font-semibold text-foreground text-sm">No Appointments Found</p>
            <p className="text-[11px]">No bookings match your current date, doctor, or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Time & Slot</th>
                  <th className="py-3 px-4">Patient UHID & Name</th>
                  <th className="py-3 px-4">Doctor & Department</th>
                  <th className="py-3 px-4">Reason / Referral</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <p className="font-bold text-foreground">
                        {new Date(appt.appointmentTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(appt.appointmentTime).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{appt.patientName}</p>
                      <p className="text-[10px] font-mono text-primary">{appt.patientUhid}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-foreground">{appt.doctorName}</p>
                      <p className="text-[10px] text-muted-foreground">{appt.departmentName || "General OPD"}</p>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      <p className="truncate max-w-[180px]">{appt.reason || "Routine Consultation"}</p>
                      {appt.referralSource && (
                        <p className="text-[10px] text-amber-600 font-medium">Ref: {appt.referralSource}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                          appt.status === "CHECKED_IN"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : appt.status === "CONFIRMED"
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                            : appt.status === "RESCHEDULED"
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                            : appt.status === "CANCELLED"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                            : appt.status === "NO_SHOW"
                            ? "bg-gray-500/15 text-gray-700 dark:text-gray-300 border border-gray-500/20"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {appt.status}
                      </span>
                      {appt.tokenNumber && (
                        <span className="ml-1 text-[10px] font-mono font-bold text-foreground">
                          [{appt.tokenNumber}]
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status !== "CHECKED_IN" && appt.status !== "COMPLETED" && appt.status !== "CANCELLED" && (
                          <>
                            <button
                              onClick={() => appt.id && handleCheckIn(appt.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                              title="Check-in patient to queue"
                            >
                              Check-In
                            </button>

                            {appt.status !== "CONFIRMED" && (
                              <button
                                onClick={() => appt.id && handleConfirm(appt.id)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                title="Confirm scheduled appointment"
                              >
                                Confirm
                              </button>
                            )}

                            <button
                              onClick={() => appt.id && handleSendReminder(appt.id)}
                              className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Send reminder notification"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedApptToReschedule(appt);
                                setRescheduleTime(appt.appointmentTime ? appt.appointmentTime.substring(0, 16) : "");
                                setRescheduleDoctorId(appt.doctorId || "");
                                setRescheduleModalOpen(true);
                              }}
                              className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Reschedule appointment"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedApptToCancel(appt);
                                setCancelModalOpen(true);
                              }}
                              className="p-1 rounded-lg border border-border hover:bg-rose-500/10 text-rose-600"
                              title="Cancel appointment"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => appt.id && handleMarkNoShow(appt.id)}
                              className="px-2 py-1 border border-border rounded-lg text-[10px] text-muted-foreground hover:text-foreground"
                              title="Mark No-Show"
                            >
                              No-Show
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Schedule Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Schedule OPD Appointment</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Step 1: Select Patient */}
            {!selectedPatient ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground block">Find Patient (UHID, Name, Phone)</label>
                <form onSubmit={handleSearchPatient} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Search UHID or mobile..."
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl">
                    Search
                  </button>
                </form>

                <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border/60">
                  {foundPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className="p-2.5 rounded-xl hover:bg-muted cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-xs text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.uhid} • {p.phone}</p>
                      </div>
                      <span className="text-xs text-primary font-semibold">Select</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">{selectedPatient.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedPatient.uhid} • {selectedPatient.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Select Doctor</label>
                  <select
                    required
                    value={bookingDoctorId}
                    onChange={(e) => setBookingDoctorId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName} — {d.specialization} ({d.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Appointment Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Chief Reason for Visit</label>
                  <input
                    type="text"
                    placeholder="e.g. Follow-up consultation, chest discomfort"
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Referral Source (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sharma Clinic, Community Center, Self"
                    value={referralSource}
                    onChange={(e) => setReferralSource(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    {bookingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Reschedule Appointment Modal */}
      {rescheduleModalOpen && selectedApptToReschedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Reschedule Appointment</h3>
              <button onClick={() => setRescheduleModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <p className="font-semibold text-xs text-foreground">{selectedApptToReschedule.patientName}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{selectedApptToReschedule.patientUhid}</p>
                <p className="text-[11px] text-primary mt-1 font-medium">Doctor: {selectedApptToReschedule.doctorName}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">New Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Change Doctor (Optional)</label>
                <select
                  value={rescheduleDoctorId}
                  onChange={(e) => setRescheduleDoctorId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                >
                  <option value="">Keep current doctor</option>
                  {doctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.doctorName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {rescheduling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Rescheduled Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Cancel Appointment Modal */}
      {cancelModalOpen && selectedApptToCancel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Cancel Appointment
              </h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Are you sure you want to cancel the appointment for <strong className="text-foreground">{selectedApptToCancel.patientName}</strong>?
              </p>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Cancellation Reason (Mandatory)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Patient requested cancellation, doctor unavailable, duplicate booking..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-background border border-border outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {cancelling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
