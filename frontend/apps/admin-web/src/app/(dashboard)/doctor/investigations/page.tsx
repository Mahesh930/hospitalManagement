"use client";

import { useState, useEffect } from "react";
import {
  doctorsApi,
  DoctorInvestigationResultDto
} from "@medicore/api";
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  FileText,
  User,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function DoctorInvestigationsPage() {
  const [loading, setLoading] = useState(true);
  const [investigations, setInvestigations] = useState<DoctorInvestigationResultDto[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "ABNORMAL" | "PENDING" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<DoctorInvestigationResultDto | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const res = await doctorsApi.getInvestigations();
      setInvestigations(res.data?.data || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to load investigations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleOpenReview = (inv: DoctorInvestigationResultDto) => {
    setSelectedInv(inv);
    setReviewNotes(inv.resultNotes || "Reviewed and clinically acknowledged.");
    setReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;

    try {
      setSavingReview(true);
      await doctorsApi.reviewInvestigation(selectedInv.id, reviewNotes);
      toast.success("Investigation reviewed and signed off by physician");
      setReviewModalOpen(false);
      setSelectedInv(null);
      fetchInvestigations();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to submit review");
    } finally {
      setSavingReview(false);
    }
  };

  const filteredList = investigations.filter((inv) => {
    const matchesSearch =
      inv.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientUhid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.testName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "ABNORMAL") return inv.isAbnormal === true;
    if (filterType === "PENDING") return inv.status === "BOOKED" || inv.status === "SAMPLE_COLLECTED";
    if (filterType === "COMPLETED") return inv.status === "RESULT_ENTERED" || inv.status === "COMPLETED";
    return true;
  });

  const abnormalCount = investigations.filter((i) => i.isAbnormal).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Lab &amp; Radiology Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Diagnostic Investigations &amp; Results</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review pathology and radiology orders, monitor critical abnormal results, and provide clinical sign-off.
            </p>
          </div>
        </div>

        <button
          onClick={fetchInvestigations}
          className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors self-start sm:self-auto shadow-sm"
          title="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Critical Abnormal Results Alert Banner */}
      {abnormalCount > 0 && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-sm block">
                {abnormalCount} Abnormal Investigation {abnormalCount > 1 ? "Results" : "Result"} Flagged
              </span>
              <p className="text-xs opacity-90">
                Action required: Clinical findings outside normal biological reference ranges. Please review and sign off.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterType("ABNORMAL")}
            className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-rose-700 shrink-0"
          >
            Filter Abnormal
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-input text-xs w-full sm:w-auto">
          {[
            { id: "ALL", label: `All Orders (${investigations.length})` },
            { id: "ABNORMAL", label: `Abnormal (${abnormalCount})` },
            { id: "PENDING", label: "In-Progress / Pending" },
            { id: "COMPLETED", label: "Completed" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient, UHID, test..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-muted/40 border border-input rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Investigations Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No diagnostic investigations found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Test Details</th>
                  <th className="py-3 px-4">Patient Information</th>
                  <th className="py-3 px-4">Order Date / Dept</th>
                  <th className="py-3 px-4">Status &amp; Severity</th>
                  <th className="py-3 px-4">Findings &amp; Result Notes</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-foreground text-sm block">{inv.testName}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {inv.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-foreground block">{inv.patientName || "—"}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{inv.patientUhid || "—"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-muted-foreground space-y-0.5">
                        <span className="block font-mono text-[11px]">
                          {inv.bookingDateTime ? new Date(inv.bookingDateTime).toLocaleDateString() : "—"}
                        </span>
                        <span className="text-[10px] text-foreground font-medium">{inv.departmentName || "Laboratory"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === "COMPLETED" || inv.status === "RESULT_ENTERED"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {inv.status}
                        </span>
                        {inv.isAbnormal && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
                            <AlertTriangle className="w-3 h-3" /> ABNORMAL VALUE
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      {inv.resultNotes ? (
                        <p className="text-foreground text-[11px] line-clamp-2">{inv.resultNotes}</p>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">Result pending entry</span>
                      )}
                      {inv.resultAttachmentUrl && (
                        <a
                          href={inv.resultAttachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1 font-semibold"
                        >
                          View Report Attachment <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(inv)}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors shadow-sm"
                      >
                        Clinical Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Sign-Off Modal */}
      {reviewModalOpen && selectedInv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Physician Result Review &amp; Sign-Off
              </h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="bg-muted/30 p-3.5 rounded-xl border border-border text-xs space-y-1">
              <p><strong className="text-foreground">Test:</strong> {selectedInv.testName} ({selectedInv.category})</p>
              <p><strong className="text-foreground">Patient:</strong> {selectedInv.patientName} ({selectedInv.patientUhid})</p>
              {selectedInv.isAbnormal && (
                <p className="text-rose-600 font-bold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Flagged as Abnormal / Critical
                </p>
              )}
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Doctor Clinical Interpretation &amp; Sign-off Notes *
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record clinical response, follow-up advice, dose titration..."
                  className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReview}
                  className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingReview ? "Submitting..." : "Sign-Off & Acknowledge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
