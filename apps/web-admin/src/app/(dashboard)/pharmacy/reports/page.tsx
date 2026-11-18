"use client";

import { useEffect, useState } from "react";
import {
  pharmacyApi,
  PharmacyReportDto,
  PharmacyStockMovement
} from "@medicore/api";
import {
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  Package,
  IndianRupee,
  Layers,
  Calendar,
  AlertTriangle,
  History,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { toast } from "sonner";

export default function PharmacyReportsPage() {
  const [report, setReport] = useState<PharmacyReportDto | null>(null);
  const [movements, setMovements] = useState<PharmacyStockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repRes, movRes] = await Promise.all([
        pharmacyApi.getReports(),
        pharmacyApi.getMovements()
      ]);
      setReport(repRes.data.data);
      setMovements(movRes.data.data);
    } catch (err: unknown) {
      console.error("Failed to load pharmacy reports", err);
      toast.error("Could not load pharmacy analytical reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pharmacy Analytical Reports & Audit Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Auditable Ledger
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Review medicine dispensing volume, pharmacy billing coordination, top-prescribed drugs, and chronological stock ledger.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition border border-border self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground">Total Prescriptions Dispensed</span>
          <p className="text-2xl font-bold text-foreground">{loading ? "—" : report?.totalDispensedCount}</p>
          <span className="text-[11px] text-muted-foreground">Overall system volume</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground">Total Pharmacy Revenue</span>
          <p className="text-2xl font-bold text-emerald-600">
            {loading ? "—" : `₹${(report?.totalDispensedRevenue ?? 0).toLocaleString()}`}
          </p>
          <span className="text-[11px] text-muted-foreground">Billed & settled medications</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground">Total Units Dispensed</span>
          <p className="text-2xl font-bold text-foreground">{loading ? "—" : report?.totalItemsDispensed}</p>
          <span className="text-[11px] text-muted-foreground">Tablets, capsules, vials</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground">Low Stock & Expiry Buffers</span>
          <p className="text-2xl font-bold text-amber-600">
            {loading ? "—" : (report?.lowStockItemsCount ?? 0) + (report?.expiredItemsCount ?? 0)}
          </p>
          <span className="text-[11px] text-muted-foreground">Requires procurement replenishment</span>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Dispensing Trend */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-foreground">Recent Daily Dispensing Summary</h2>
          </div>

          <div className="divide-y divide-border">
            {!report?.dailyDispenses || report.dailyDispenses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No dispensing transactions in this period.</p>
            ) : (
              report.dailyDispenses.map((d) => (
                <div key={d.date} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{d.date}</span>
                    <span className="text-muted-foreground">({d.count} prescriptions)</span>
                  </div>
                  <span className="font-bold text-emerald-600">₹{d.revenue.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Dispensed Drugs */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Package className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-foreground">Top Dispensed Medicines</h2>
          </div>

          <div className="divide-y divide-border">
            {!report?.topMedicines || report.topMedicines.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No items dispensed yet.</p>
            ) : (
              report.topMedicines.map((m) => (
                <div key={m.medicineName} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-foreground">{m.medicineName}</p>
                    <p className="text-[11px] text-muted-foreground">{m.quantityDispensed} units dispensed</p>
                  </div>
                  <span className="font-bold text-foreground">₹{m.totalValue.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stock Movement Ledger Table */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <History className="w-5 h-5 text-purple-500" />
          <h2 className="text-base font-semibold text-foreground">Chronological Stock Movement Audit Ledger</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Movement Type</th>
                <th className="py-2.5 px-4 font-semibold">Quantity Delta</th>
                <th className="py-2.5 px-4 font-semibold">Balance After</th>
                <th className="py-2.5 px-4 font-semibold">Reference No</th>
                <th className="py-2.5 px-4 font-semibold">Reason / Audit Trail</th>
                <th className="py-2.5 px-4 font-semibold">Pharmacist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading audit ledger...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                            m.movementType === "DISPENSE"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : m.movementType === "PURCHASE_RECEIPT"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : m.movementType === "PATIENT_RETURN"
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {m.movementType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-foreground">{m.balanceAfter}</td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">{m.referenceNumber || "—"}</td>
                      <td className="py-2.5 px-4 text-muted-foreground max-w-sm truncate" title={m.reason}>
                        {m.reason}
                      </td>
                      <td className="py-2.5 px-4 text-foreground font-medium">{m.performedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
