"use client";

import { useEffect, useState } from "react";
import { FileText, Calendar, Download, RefreshCw, Users, CheckCircle2, UserX, Clock, IndianRupee } from "lucide-react";
import { receptionistApi, DailyReceptionistReportDto } from "@medicore/api";
import { toast } from "sonner";

export default function DailyReceptionistReportPage() {
  const [report, setReport] = useState<DailyReceptionistReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const fetchReport = async (dateStr?: string) => {
    try {
      setLoading(true);
      const res = await receptionistApi.getDailyReport(dateStr);
      if (res) {
        setReport(res);
      }
    } catch (err) {
      toast.error("Failed to load daily receptionist operational report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const handleExportCsv = () => {
    if (!report?.recentVisits) return;
    const headers = ["Token Number", "Patient Name", "UHID", "Doctor", "Priority", "Status", "CheckIn Time"];
    const rows = report.recentVisits.map((v) => [
      v.tokenNumber, v.patientName, v.patientUhid, v.doctorName, v.priorityRank, v.status, v.checkInTime
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Receptionist_Daily_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Front-Office Operational Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze daily patient registrations, walk-ins, doctor queues, no-shows, and front-office billing estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-border bg-background text-sm font-semibold outline-none"
          />

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase">New Registrations</p>
          <p className="text-2xl font-bold text-foreground mt-2">{loading ? "..." : report?.newRegistrations ?? 0}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Walk-in Patients</p>
          <p className="text-2xl font-bold text-foreground mt-2">{loading ? "..." : report?.walkinCount ?? 0}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Completed Consultations</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{loading ? "..." : report?.completedCount ?? 0}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Estimated OPD Revenue</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">₹{(report?.estimatedRevenue ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="text-base font-bold text-foreground">Detailed Daily Patient Visits Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground font-semibold text-xs uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3">Token #</th>
                <th className="px-5 py-3">Patient Name</th>
                <th className="px-5 py-3">UHID</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Loading operational log...</td>
                </tr>
              ) : report?.recentVisits && report.recentVisits.length > 0 ? (
                report.recentVisits.map((v) => (
                  <tr key={v.visitId} className="hover:bg-muted/20">
                    <td className="px-5 py-3.5 font-bold text-primary">{v.tokenNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-foreground">{v.patientName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{v.patientUhid}</td>
                    <td className="px-5 py-3.5 text-foreground">{v.doctorName}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No visits recorded for selected date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
