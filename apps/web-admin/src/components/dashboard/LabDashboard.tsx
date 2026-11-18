"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical, AlertTriangle, CheckCircle2, Clock, Search,
  RefreshCw, FileText, User, ExternalLink, ShieldAlert,
  TestTube2, Check, ArrowRight, Filter
} from "lucide-react";
import Link from "next/link";
import { labApi, LabWorklistItemDto, LabStatsDto } from "@medicore/api";
import { toast } from "sonner";

export default function LabDashboard() {
  const [stats, setStats] = useState<LabStatsDto | null>(null);
  const [worklist, setWorklist] = useState<LabWorklistItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Sample Collection Modal
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LabWorklistItemDto | null>(null);
  const [barcode, setBarcode] = useState("");
  const [specimenType, setSpecimenType] = useState("Whole Blood (EDTA)");
  const [sampleNotes, setSampleNotes] = useState("");
  const [savingSample, setSavingSample] = useState(false);

  // Result Entry Modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultNotes, setResultNotes] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [savingResult, setSavingResult] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, worklistRes] = await Promise.all([
        labApi.getStats(),
        labApi.getWorklist({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          category: categoryFilter !== "ALL" ? categoryFilter : undefined,
          query: searchQuery || undefined,
        })
      ]);
      setStats(statsRes.data?.data || null);
      setWorklist(worklistRes.data?.data || []);
    } catch {
      toast.error("Failed to load laboratory workstation data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenSampleModal = (item: LabWorklistItemDto) => {
    setSelectedItem(item);
    setBarcode(`BAR-${item.patientUhid?.slice(-4) || "0000"}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSpecimenType(item.category === "RADIOLOGY" ? "Imaging Request" : "Whole Blood (EDTA)");
    setSampleNotes("");
    setSampleModalOpen(true);
  };

  const handleSubmitSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.id || !barcode.trim()) return;

    try {
      setSavingSample(true);
      await labApi.collectSample(selectedItem.id, {
        barcode: barcode.trim(),
        specimenType,
        technicianNotes: sampleNotes.trim() || undefined,
      });
      toast.success(`Specimen barcode ${barcode} logged for ${selectedItem.patientName}`);
      setSampleModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to log sample collection");
    } finally {
      setSavingSample(false);
    }
  };

  const handleOpenResultModal = (item: LabWorklistItemDto) => {
    setSelectedItem(item);
    setResultNotes(item.resultNotes || "");
    setReferenceRange("Ref: Normal biological reference interval");
    setIsAbnormal(item.isAbnormal || false);
    setTechnicianNotes("");
    setResultModalOpen(true);
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.id || !resultNotes.trim()) return;

    try {
      setSavingResult(true);
      await labApi.recordResult(selectedItem.id, {
        resultNotes: resultNotes.trim(),
        referenceRange: referenceRange.trim() || undefined,
        isAbnormal,
        technicianNotes: technicianNotes.trim() || undefined,
      });
      toast.success(`Lab result recorded and signed off for ${selectedItem.patientName}`);
      setResultModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to save lab results");
    } finally {
      setSavingResult(false);
    }
  };

  const statCards = [
    { label: "Today's Orders", value: stats?.totalTestsScheduledToday ?? 0, icon: FlaskConical, color: "from-blue-500 to-indigo-600" },
    { label: "Pending Samples", value: stats?.pendingSampleCollection ?? 0, icon: Clock, color: "from-amber-500 to-orange-600" },
    { label: "Samples Collected", value: stats?.samplesCollected ?? 0, icon: TestTube2, color: "from-cyan-500 to-teal-600" },
    { label: "Completed Today", value: stats?.completedToday ?? 0, icon: CheckCircle2, color: "from-emerald-500 to-emerald-600" },
    { label: "Abnormal Alerts", value: stats?.abnormalResultsCount ?? 0, icon: ShieldAlert, color: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Laboratory &amp; Diagnostics Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
              Lab Station Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Specimen collection, barcode accessioning, analytical test result entry, and critical value flagging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/laboratory"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20"
          >
            <span>Full Laboratory Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">{item.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-xs`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "SCHEDULED", "SAMPLE_COLLECTED", "COMPLETED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
          <span className="text-muted-foreground text-xs">|</span>
          {["ALL", "LAB", "RADIOLOGY", "PATHOLOGY"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                categoryFilter === cat
                  ? "bg-muted font-bold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Test, Patient, UHID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/30 border border-input rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Lab Worklist Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-cyan-600" /> Laboratory Investigation Worklist ({worklist.length})
          </h2>
          <span className="text-xs text-muted-foreground">Standardized Test Directory</span>
        </div>

        {worklist.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px]">
                  <th className="py-3 px-4 font-semibold">Test / Investigation</th>
                  <th className="py-3 px-4 font-semibold">Patient</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Referring Doctor</th>
                  <th className="py-3 px-4 font-semibold">Order Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Abnormal</th>
                  <th className="py-3 px-4 font-semibold text-right">Workstation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {worklist.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <div>{item.testName}</div>
                      {item.instructions && (
                        <div className="text-[11px] text-muted-foreground font-normal truncate max-w-xs">{item.instructions}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{item.patientName}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{item.patientUhid}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item.referringDoctorName || "Doctor"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.bookingDateTime ? new Date(item.bookingDateTime).toLocaleString() : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : item.status === "SAMPLE_COLLECTED"
                          ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isAbnormal ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">
                          CRITICAL
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {item.status === "SCHEDULED" || item.status === "BOOKED" ? (
                        <button
                          onClick={() => handleOpenSampleModal(item)}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          Collect Sample
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenResultModal(item)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          {item.status === "COMPLETED" ? "Edit Result" : "Enter Result"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No lab investigation requests matching current filter.
          </div>
        )}
      </div>

      {/* Collect Specimen Modal */}
      {sampleModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <TestTube2 className="w-5 h-5 text-cyan-600" /> Collect Specimen / Accessioning
              </h3>
              <button onClick={() => setSampleModalOpen(false)} className="text-muted-foreground text-sm">✕</button>
            </div>

            <div className="bg-muted/30 rounded-xl p-3 space-y-1 text-xs">
              <div><strong className="text-foreground">Test:</strong> {selectedItem.testName}</div>
              <div><strong className="text-foreground">Patient:</strong> {selectedItem.patientName} ({selectedItem.patientUhid})</div>
            </div>

            <form onSubmit={handleSubmitSample} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Specimen Barcode / Tube #</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs font-mono font-bold text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Specimen Type</label>
                <select
                  value={specimenType}
                  onChange={(e) => setSpecimenType(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground"
                >
                  <option value="Whole Blood (EDTA)">Whole Blood (EDTA)</option>
                  <option value="Serum (Clot Activator)">Serum (Clot Activator)</option>
                  <option value="Plasma (Heparin)">Plasma (Heparin)</option>
                  <option value="Urine (Midstream)">Urine (Midstream)</option>
                  <option value="Nasopharyngeal Swab">Nasopharyngeal Swab</option>
                  <option value="Stool Specimen">Stool Specimen</option>
                  <option value="Imaging Session">Imaging Session</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Technician Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hemolysis absent, tube filled to mark"
                  value={sampleNotes}
                  onChange={(e) => setSampleNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSampleModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSample}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {savingSample ? "Accessioning..." : "Confirm Sample"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Results Modal */}
      {resultModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600" /> Enter Laboratory Analytical Findings
              </h3>
              <button onClick={() => setResultModalOpen(false)} className="text-muted-foreground text-sm">✕</button>
            </div>

            <div className="bg-muted/30 rounded-xl p-3 space-y-1 text-xs">
              <div><strong className="text-foreground">Test:</strong> {selectedItem.testName}</div>
              <div><strong className="text-foreground">Patient:</strong> {selectedItem.patientName} ({selectedItem.patientUhid})</div>
            </div>

            <form onSubmit={handleSubmitResult} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Quantitative / Qualitative Findings</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Total Cholesterol: 245 mg/dL (High), HDL: 38 mg/dL, Triglycerides: 180 mg/dL"
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Biological Reference Range</label>
                <input
                  type="text"
                  placeholder="e.g. Desirable: <200 mg/dL, Borderline: 200-239 mg/dL"
                  value={referenceRange}
                  onChange={(e) => setReferenceRange(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20">
                <input
                  type="checkbox"
                  id="abnormalCheck"
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="abnormalCheck" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Flag as Abnormal / Critical (Triggers Physician Alert &amp; Sign-off)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Technician / Verification Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Verified by automated dry chemistry analyzer"
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResultModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResult}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {savingResult ? "Verifying..." : "Verify & Sign Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

