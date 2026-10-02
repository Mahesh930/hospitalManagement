"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck, Stethoscope, FlaskConical, Receipt, MessageSquare,
  PackageSearch, GitMerge, Search, Plus, CheckCircle2, Clock,
  AlertTriangle, Eye, RefreshCw, X, Shield, Phone, User, Calendar
} from "lucide-react";
import {
  receptionistApi, DoctorScheduleDto, DiagnosticBookingDto,
  PatientFeedbackDto, LostAndFoundItemDto, PatientMergeRequestDto,
  patientsApi, PatientDto
} from "@medicore/api";
import { toast } from "sonner";

export default function FrontDeskCoordinationPage() {
  const [activeTab, setActiveTab] = useState<"doctors" | "diagnostics" | "billing" | "feedback" | "lostfound" | "merge">("doctors");

  // Doctor schedules state
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorScheduleDto[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<DiagnosticBookingDto[]>([]);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [diagForm, setDiagForm] = useState<DiagnosticBookingDto>({
    patientId: "",
    testName: "",
    category: "LAB",
    departmentName: "Pathology",
    instructions: "",
  });

  // Billing inquiry state
  const [billingPatientQuery, setBillingPatientQuery] = useState("");
  const [patientInvoices, setPatientInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [searchedPatient, setSearchedPatient] = useState<PatientDto | null>(null);

  // Feedback state
  const [feedbacks, setFeedbacks] = useState<PatientFeedbackDto[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<PatientFeedbackDto>({
    category: "COMPLAINT",
    severity: "MEDIUM",
    subject: "",
    description: "",
    patientName: "",
    contactPhone: "",
    assignedDepartment: "General Administration",
  });
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Lost & Found state
  const [lostItems, setLostItems] = useState<LostAndFoundItemDto[]>([]);
  const [loadingLost, setLoadingLost] = useState(false);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [lostForm, setLostForm] = useState<LostAndFoundItemDto>({
    itemName: "",
    category: "VALUABLES",
    description: "",
    foundLocation: "",
    storageLocation: "Front-Desk Safe Drawer",
  });
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [claimForm, setClaimForm] = useState({ claimedBy: "", claimantContact: "", claimantIdProof: "", remarks: "" });

  // Merge requests state
  const [mergeRequests, setMergeRequests] = useState<PatientMergeRequestDto[]>([]);
  const [loadingMerges, setLoadingMerges] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeForm, setMergeForm] = useState<PatientMergeRequestDto>({
    sourcePatientId: "",
    targetPatientId: "",
    reason: "",
  });

  // Load functions
  const loadDoctorSchedules = async () => {
    try {
      setLoadingDoctors(true);
      const res = await receptionistApi.getDoctorSchedules();
      setDoctorSchedules(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Failed to load doctor schedules");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadDiagnostics = async () => {
    try {
      setLoadingDiagnostics(true);
      const res = await receptionistApi.getDiagnostics();
      setDiagnostics(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Failed to load diagnostic bookings");
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      const res = await receptionistApi.getFeedbacks();
      setFeedbacks(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Failed to load patient feedback & complaints");
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const loadLostAndFound = async () => {
    try {
      setLoadingLost(true);
      const res = await receptionistApi.getLostAndFoundItems();
      setLostItems(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Failed to load lost and found items");
    } finally {
      setLoadingLost(false);
    }
  };

  const loadMergeRequests = async () => {
    try {
      setLoadingMerges(true);
      const res = await receptionistApi.getMergeRequests();
      setMergeRequests(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Failed to load merge requests");
    } finally {
      setLoadingMerges(false);
    }
  };

  useEffect(() => {
    if (activeTab === "doctors") loadDoctorSchedules();
    if (activeTab === "diagnostics") loadDiagnostics();
    if (activeTab === "feedback") loadFeedbacks();
    if (activeTab === "lostfound") loadLostAndFound();
    if (activeTab === "merge") loadMergeRequests();
  }, [activeTab]);

  // Billing lookup handler
  const handleSearchBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingPatientQuery.trim()) return;

    try {
      setLoadingInvoices(true);
      const pRes = await patientsApi.search(billingPatientQuery);
      const pList = (pRes as any).data?.data || (pRes as any).data || pRes;
      if (Array.isArray(pList) && pList.length > 0) {
        const patient = pList[0];
        setSearchedPatient(patient);
        const invRes = await receptionistApi.getPatientInvoices(patient.id!);
        setPatientInvoices(Array.isArray(invRes) ? invRes : []);
      } else {
        toast.error("Patient not found with that UHID or phone");
        setSearchedPatient(null);
        setPatientInvoices([]);
      }
    } catch {
      toast.error("Failed to query patient billing history");
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handlers for Diagnostics
  const handleSaveDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagForm.patientId || !diagForm.testName) {
      toast.error("Patient ID/UHID and Test Name are required");
      return;
    }
    try {
      await receptionistApi.scheduleDiagnostic(diagForm);
      toast.success("Diagnostic test scheduled successfully");
      setDiagModalOpen(false);
      setDiagForm({ patientId: "", testName: "", category: "LAB", departmentName: "Pathology", instructions: "" });
      loadDiagnostics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to schedule diagnostic");
    }
  };

  // Handlers for Feedback
  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.subject || !feedbackForm.description) {
      toast.error("Subject and description are required");
      return;
    }
    try {
      await receptionistApi.registerFeedback(feedbackForm);
      toast.success("Feedback recorded successfully");
      setFeedbackModalOpen(false);
      setFeedbackForm({
        category: "COMPLAINT",
        severity: "MEDIUM",
        subject: "",
        description: "",
        patientName: "",
        contactPhone: "",
        assignedDepartment: "General Administration",
      });
      loadFeedbacks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record feedback");
    }
  };

  const handleResolveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedbackId || !resolutionNotes.trim()) {
      toast.error("Resolution notes are required");
      return;
    }
    try {
      await receptionistApi.resolveFeedback(selectedFeedbackId, resolutionNotes);
      toast.success("Feedback marked as resolved");
      setResolveModalOpen(false);
      setSelectedFeedbackId(null);
      setResolutionNotes("");
      loadFeedbacks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resolve feedback");
    }
  };

  // Handlers for Lost & Found
  const handleSaveLostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostForm.itemName || !lostForm.foundLocation) {
      toast.error("Item Name and Found Location are required");
      return;
    }
    try {
      await receptionistApi.recordLostAndFound(lostForm);
      toast.success("Lost & found item logged");
      setLostModalOpen(false);
      setLostForm({ itemName: "", category: "VALUABLES", description: "", foundLocation: "", storageLocation: "Front-Desk Safe Drawer" });
      loadLostAndFound();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to log item");
    }
  };

  const handleClaimLostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !claimForm.claimedBy.trim()) {
      toast.error("Claimant name is required");
      return;
    }
    try {
      await receptionistApi.claimLostAndFound(selectedItemId, claimForm);
      toast.success("Item claimed successfully");
      setClaimModalOpen(false);
      setSelectedItemId(null);
      setClaimForm({ claimedBy: "", claimantContact: "", claimantIdProof: "", remarks: "" });
      loadLostAndFound();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to claim item");
    }
  };

  // Handlers for Merge
  const handleSaveMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeForm.sourcePatientId || !mergeForm.targetPatientId || !mergeForm.reason) {
      toast.error("Source patient, target patient, and reason are required");
      return;
    }
    try {
      await receptionistApi.createMergeRequest(mergeForm);
      toast.success("Patient merge request submitted for admin review");
      setMergeModalOpen(false);
      setMergeForm({ sourcePatientId: "", targetPatientId: "", reason: "" });
      loadMergeRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit merge request");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Front-Desk Coordination Desk</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Operations Hub
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Doctor availability, diagnostic appointments, billing clearances, complaints, lost & found, and patient duplicate merges.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card rounded-xl p-1 gap-1 overflow-x-auto shadow-sm">
        {[
          { id: "doctors", label: "Doctor Schedules", icon: Stethoscope },
          { id: "diagnostics", label: "Diagnostic Bookings", icon: FlaskConical },
          { id: "billing", label: "Billing Inquiries", icon: Receipt },
          { id: "feedback", label: "Feedback & Grievances", icon: MessageSquare },
          { id: "lostfound", label: "Lost & Found", icon: PackageSearch },
          { id: "merge", label: "Duplicate Merges", icon: GitMerge },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: DOCTOR SCHEDULES */}
      {activeTab === "doctors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Doctor Availability & Consultation Rosters</h3>
            <button
              onClick={loadDoctorSchedules}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Rosters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingDoctors ? (
              <p className="text-sm text-muted-foreground col-span-full">Loading doctor schedules...</p>
            ) : doctorSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">No active doctor schedules found.</p>
            ) : (
              doctorSchedules.map((doc) => (
                <div key={doc.doctorId} className="bg-card border border-border p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-foreground">{doc.doctorName}</h4>
                      <p className="text-xs text-primary font-medium mt-0.5">{doc.specialization} • {doc.departmentName}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      doc.available && !doc.onLeave
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}>
                      {doc.onLeave ? "On Leave" : doc.available ? "Available" : "Away"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                    <p><span className="font-semibold text-foreground">Room:</span> {doc.roomNumber}</p>
                    <p><span className="font-semibold text-foreground">Hours:</span> {doc.workingHours}</p>
                    <p><span className="font-semibold text-foreground">Consultation Fee:</span> ₹{doc.consultationFee}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-center">
                    <div className="bg-muted/40 p-2 rounded-xl">
                      <span className="text-[11px] text-muted-foreground block">Active Queue</span>
                      <span className="text-base font-bold text-foreground">{doc.activeQueueCount}</span>
                    </div>
                    <div className="bg-muted/40 p-2 rounded-xl">
                      <span className="text-[11px] text-muted-foreground block">Today's Appts</span>
                      <span className="text-base font-bold text-primary">{doc.todayAppointmentsCount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNOSTIC BOOKINGS */}
      {activeTab === "diagnostics" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Diagnostic Lab & Radiology Investigation Appointments</h3>
            <button
              onClick={() => setDiagModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Diagnostic Test</span>
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Test Name & Category</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Doctor / Instructions</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date Booked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingDiagnostics ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">Loading diagnostics...</td>
                    </tr>
                  ) : diagnostics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium text-foreground">No diagnostic bookings recorded</p>
                      </td>
                    </tr>
                  ) : (
                    diagnostics.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{d.patientName || "Patient"}</p>
                          <p className="text-xs text-muted-foreground">UHID: {d.patientUhid || d.patientId}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-foreground">{d.testName}</p>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600">
                            {d.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-foreground font-medium">{d.departmentName || "Pathology"}</td>
                        <td className="py-3.5 px-4 text-xs max-w-xs">
                          {d.referringDoctorName && <p className="font-medium text-foreground">Dr: {d.referringDoctorName}</p>}
                          <p className="text-muted-foreground line-clamp-1">{d.instructions || "Standard prep"}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {d.status || "CONFIRMED"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {d.bookingDateTime ? new Date(d.bookingDateTime).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING INQUIRIES */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground">Patient Billing & Invoice Clearance Verification</h3>
            <p className="text-xs text-muted-foreground">
              Search patient UHID or phone to view their outstanding invoices, billing clearance status, and guide them to the cashier.
            </p>

            <form onSubmit={handleSearchBilling} className="flex gap-3 max-w-md">
              <input
                type="text"
                required
                placeholder="Enter Patient UHID, Name, or Phone..."
                value={billingPatientQuery}
                onChange={(e) => setBillingPatientQuery(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={loadingInvoices}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {searchedPatient && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-foreground">{searchedPatient.name} {searchedPatient.lastName || ""}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  UHID: {searchedPatient.uhid} • Phone: {searchedPatient.phone} • Age/Gender: {searchedPatient.age || "-"} / {searchedPatient.gender}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Patient Verified
              </span>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Paid Amount</th>
                    <th className="py-3.5 px-4">Due Balance</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingInvoices ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">Searching invoices...</td>
                    </tr>
                  ) : !searchedPatient ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        Search for a patient above to inspect billing invoices.
                      </td>
                    </tr>
                  ) : patientInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No invoices found for this patient.
                      </td>
                    </tr>
                  ) : (
                    patientInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">{inv.invoiceNumber || inv.id?.slice(0, 8)}</td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">₹{inv.totalAmount?.toLocaleString() ?? "0"}</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-semibold">₹{inv.paidAmount?.toLocaleString() ?? "0"}</td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">
                          ₹{((inv.totalAmount || 0) - (inv.paidAmount || 0)).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {inv.status || "UNPAID"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PATIENT FEEDBACK & COMPLAINTS */}
      {activeTab === "feedback" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Front-Desk Grievance & Patient Feedback Registry</h3>
            <button
              onClick={() => setFeedbackModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Record Grievance / Feedback</span>
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Category & Severity</th>
                    <th className="py-3.5 px-4">Subject & Details</th>
                    <th className="py-3.5 px-4">Patient / Contact</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingFeedbacks ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">Loading grievances...</td>
                    </tr>
                  ) : feedbacks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium text-foreground">No grievances or feedback recorded</p>
                      </td>
                    </tr>
                  ) : (
                    feedbacks.map((f) => (
                      <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            f.category === "COMPLAINT"
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}>
                            {f.category}
                          </span>
                          <span className={`block text-[11px] font-semibold mt-1 ${
                            f.severity === "CRITICAL" || f.severity === "HIGH" ? "text-rose-600 font-bold" : "text-muted-foreground"
                          }`}>
                            Severity: {f.severity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <p className="font-semibold text-foreground">{f.subject}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{f.description}</p>
                          {f.resolutionNotes && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">Resolution: {f.resolutionNotes}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <p className="font-semibold text-foreground">{f.patientName || "Anonymous Patient"}</p>
                          <p className="text-muted-foreground">{f.contactPhone || "-"}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-foreground">{f.assignedDepartment || "General"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            f.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {f.status || "OPEN"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {f.status !== "RESOLVED" ? (
                            <button
                              onClick={() => {
                                setSelectedFeedbackId(f.id!);
                                setResolveModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LOST & FOUND */}
      {activeTab === "lostfound" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Hospital Lost & Found Custody Log</h3>
            <button
              onClick={() => setLostModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Log Found Item</span>
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Item Details</th>
                    <th className="py-3.5 px-4">Found Location</th>
                    <th className="py-3.5 px-4">Storage Custody</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Claimant Info</th>
                    <th className="py-3.5 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingLost ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">Loading items...</td>
                    </tr>
                  ) : lostItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <PackageSearch className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium text-foreground">No lost and found items recorded</p>
                      </td>
                    </tr>
                  ) : (
                    lostItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground">{item.itemName}</p>
                          <p className="text-xs text-muted-foreground">{item.description || "No description"}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                            {item.category || "GENERAL"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-foreground">{item.foundLocation}</td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">{item.storageLocation || "Front Desk Safe"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === "CLAIMED"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {item.status || "UNCLAIMED"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {item.claimedBy ? (
                            <div>
                              <p className="font-semibold text-foreground">{item.claimedBy}</p>
                              <p className="text-muted-foreground">{item.claimantContact} • {item.claimantIdProof}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.status !== "CLAIMED" ? (
                            <button
                              onClick={() => {
                                setSelectedItemId(item.id!);
                                setClaimModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                            >
                              Claim Item
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">Claim Verified</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DUPLICATE MERGE REQUESTS */}
      {activeTab === "merge" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Patient Duplicate Merge Requests</h3>
            <button
              onClick={() => setMergeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Merge Request</span>
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Source Patient (Duplicate)</th>
                    <th className="py-3.5 px-4">Target Patient (Primary UHID)</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Requested By</th>
                    <th className="py-3.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingMerges ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">Loading merge requests...</td>
                    </tr>
                  ) : mergeRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <GitMerge className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium text-foreground">No merge requests pending</p>
                      </td>
                    </tr>
                  ) : (
                    mergeRequests.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{m.sourcePatientName || "Source Patient"}</p>
                          <p className="text-xs text-muted-foreground">UHID: {m.sourcePatientUhid || m.sourcePatientId}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{m.targetPatientName || "Target Patient"}</p>
                          <p className="text-xs text-muted-foreground">UHID: {m.targetPatientUhid || m.targetPatientId}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-foreground max-w-xs">{m.reason}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            m.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : m.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {m.status || "PENDING"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">{m.requestedBy || "Receptionist"}</td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE DIAGNOSTIC */}
      {diagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Schedule Diagnostic Investigation</h3>
              <button onClick={() => setDiagModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDiagnostic} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Patient UHID or ID *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter patient UHID or UUID"
                  value={diagForm.patientId}
                  onChange={(e) => setDiagForm({ ...diagForm, patientId: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Blood Count (CBC)"
                    value={diagForm.testName}
                    onChange={(e) => setDiagForm({ ...diagForm, testName: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Category *</label>
                  <select
                    value={diagForm.category}
                    onChange={(e) => setDiagForm({ ...diagForm, category: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="LAB">Laboratory (Pathology)</option>
                    <option value="RADIOLOGY">Radiology (X-Ray, CT, MRI)</option>
                    <option value="CARDIOLOGY">Cardiology (ECG, 2D Echo)</option>
                    <option value="OTHER">Other Diagnostics</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Biochemistry / Radiology"
                  value={diagForm.departmentName || ""}
                  onChange={(e) => setDiagForm({ ...diagForm, departmentName: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Preparation / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting 10 hours required before test..."
                  value={diagForm.instructions || ""}
                  onChange={(e) => setDiagForm({ ...diagForm, instructions: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setDiagModalOpen(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD FEEDBACK */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Register Grievance or Feedback</h3>
              <button onClick={() => setFeedbackModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFeedback} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Category *</label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="COMPLAINT">Complaint</option>
                    <option value="SERVICE_REQUEST">Service Request</option>
                    <option value="SUGGESTION">Suggestion</option>
                    <option value="COMPLIMENT">Compliment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Severity *</label>
                  <select
                    value={feedbackForm.severity}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, severity: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Long wait time at pharmacy"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Patient Name & Phone (Optional)</label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <input
                    type="text"
                    placeholder="Patient Name"
                    value={feedbackForm.patientName || ""}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, patientName: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={feedbackForm.contactPhone || ""}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, contactPhone: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the incident or suggestion..."
                  value={feedbackForm.description}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setFeedbackModalOpen(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                  Save Grievance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE FEEDBACK */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Resolve Feedback / Grievance</h3>
              <button onClick={() => setResolveModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResolveFeedback} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Resolution Notes *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter corrective action taken or resolution explanation given to the patient..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setResolveModalOpen(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG LOST & FOUND ITEM */}
      {lostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Log Found Item in Custody</h3>
              <button onClick={() => setLostModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLostItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Black Leather Wallet / iPhone 13"
                  value={lostForm.itemName}
                  onChange={(e) => setLostForm({ ...lostForm, itemName: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Category *</label>
                  <select
                    value={lostForm.category}
                    onChange={(e) => setLostForm({ ...lostForm, category: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="VALUABLES">Valuables (Cash/Jewelry)</option>
                    <option value="DOCUMENTS">Documents / ID Cards</option>
                    <option value="ELECTRONICS">Electronics / Phones</option>
                    <option value="CLOTHING">Clothing / Bag</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Found Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OPD Waiting Area B"
                    value={lostForm.foundLocation}
                    onChange={(e) => setLostForm({ ...lostForm, foundLocation: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Custody Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Front-Desk Safe Lockbox #2"
                  value={lostForm.storageLocation || ""}
                  onChange={(e) => setLostForm({ ...lostForm, storageLocation: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Item Description</label>
                <textarea
                  rows={2}
                  placeholder="Contains Aadhaar card, SBI debit card..."
                  value={lostForm.description || ""}
                  onChange={(e) => setLostForm({ ...lostForm, description: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setLostModalOpen(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLAIM LOST ITEM */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Verify & Release Found Item</h3>
              <button onClick={() => setClaimModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleClaimLostItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Claimant Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter recipient name"
                  value={claimForm.claimedBy}
                  onChange={(e) => setClaimForm({ ...claimForm, claimedBy: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Claimant mobile"
                    value={claimForm.claimantContact}
                    onChange={(e) => setClaimForm({ ...claimForm, claimantContact: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">ID Proof Verified</label>
                  <input
                    type="text"
                    placeholder="e.g. Aadhaar 4521"
                    value={claimForm.claimantIdProof}
                    onChange={(e) => setClaimForm({ ...claimForm, claimantIdProof: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Verification Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Verification notes, signatures collected..."
                  value={claimForm.remarks}
                  onChange={(e) => setClaimForm({ ...claimForm, remarks: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setClaimModalOpen(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                  Release & Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT MERGE REQUEST */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Submit Duplicate Patient Merge Request</h3>
              <button onClick={() => setMergeModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMerge} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Source Patient UHID/ID (To be merged & archived) *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter source duplicate UHID or UUID"
                  value={mergeForm.sourcePatientId}
                  onChange={(e) => setMergeForm({ ...mergeForm, sourcePatientId: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Target Patient UHID/ID (Primary master record) *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter master target UHID or UUID"
                  value={mergeForm.targetPatientId}
                  onChange={(e) => setMergeForm({ ...mergeForm, targetPatientId: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Reason for Merge *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Patient was registered twice under slight spelling variation with identical phone number..."
                  value={mergeForm.reason}
                  onChange={(e) => setMergeForm({ ...mergeForm, reason: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setMergeModalOpen(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
