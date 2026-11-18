"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Pill,
  ClipboardCheck,
  AlertTriangle,
  Package,
  ShoppingCart,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Building2,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  Plus
} from "lucide-react";
import {
  pharmacyApi,
  PharmacyDashboardDto,
  PrescriptionQueueItemDto,
  MedicineBatchDto
} from "@medicore/api";
import { toast } from "sonner";

export default function PharmacyDashboard() {
  const [data, setData] = useState<PharmacyDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await pharmacyApi.getDashboard();
      setData(res.data.data);
    } catch (err: unknown) {
      console.error("Failed to load pharmacy dashboard", err);
      toast.error("Could not fetch pharmacy dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const statCards = [
    {
      label: "Pending Prescriptions",
      value: loading ? "—" : (data?.pendingPrescriptionsCount ?? 0).toString(),
      subtext: "Waiting clinical verification",
      icon: Clock,
      color: "from-amber-500 to-amber-600",
      href: "/pharmacy/queue?status=SUBMITTED",
    },
    {
      label: "Verified for Dispensing",
      value: loading ? "—" : (data?.verifiedPrescriptionsCount ?? 0).toString(),
      subtext: "Ready for batch allocation",
      icon: ClipboardCheck,
      color: "from-blue-500 to-blue-600",
      href: "/pharmacy/queue?status=VERIFIED",
    },
    {
      label: "Dispensed Today",
      value: loading ? "—" : (data?.dispensedTodayCount ?? 0).toString(),
      subtext: `Total: ₹${(data?.todayDispensedValue ?? 0).toLocaleString()}`,
      icon: CheckCircle2,
      color: "from-emerald-500 to-emerald-600",
      href: "/pharmacy/reports",
    },
    {
      label: "Low Stock Medicines",
      value: loading ? "—" : (data?.lowStockBatchesCount ?? 0).toString(),
      subtext: "Below 25 safety buffer",
      icon: Package,
      color: "from-rose-500 to-rose-600",
      href: "/pharmacy/inventory?filter=lowStock",
    },
    {
      label: "Near Expiry Batches",
      value: loading ? "—" : (data?.nearExpiryBatchesCount ?? 0).toString(),
      subtext: "Expiring within 60 days",
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
      href: "/pharmacy/expiry",
    },
    {
      label: "Active Recalls",
      value: loading ? "—" : (data?.activeRecallsCount ?? 0).toString(),
      subtext: "Quarantined batches",
      icon: ShieldAlert,
      color: "from-purple-500 to-purple-600",
      href: "/pharmacy/expiry",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-inner border border-indigo-500/20">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Pharmacy Station & Dispensing Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                FEFO Operations Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> MediCore Central Dispensary
              <span>•</span>
              Shift: Morning (08:00 - 16:00)
              <span>•</span>
              Stock Buffer: Real-Time Verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition border border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/pharmacy/queue"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Open Dispensing Queue
          </Link>
          <Link
            href="/pharmacy/inventory"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition border border-primary/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Stock Receipt (GRN)
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="group bg-card border border-border rounded-xl p-4 hover:shadow-md transition duration-150 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground line-clamp-1">{c.label}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${c.color} text-white shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-foreground">{c.value}</span>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{c.subtext}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Prescriptions Queue Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-semibold text-foreground">Active Prescriptions Queue</h2>
              </div>
              <Link
                href="/pharmacy/queue"
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                View Full Queue ({data?.activeQueue?.length ?? 0})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.activeQueue || data.activeQueue.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                All prescriptions are currently verified and dispensed.
              </div>
            ) : (
              <div className="divide-y divide-border mt-2">
                {data.activeQueue.slice(0, 5).map((q) => (
                  <div
                    key={q.prescriptionId}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 px-2 rounded-xl transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{q.patientName}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-muted-foreground border border-border">
                          {q.uhid}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            q.status === "VERIFIED"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : q.status === "DISPENSED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Dr. {q.doctorName}</span>
                        <span>•</span>
                        <span>{q.items?.length || 0} prescribed medicines</span>
                        {q.allergies && q.allergies !== "No recorded allergies" && (
                          <>
                            <span>•</span>
                            <span className="text-rose-500 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Allergy Alert: {q.allergies}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pharmacy/queue?rx=${q.prescriptionId}`}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
                      >
                        Process / Dispense
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts & Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/pharmacy/purchases"
              className="p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 transition flex flex-col items-center text-center gap-2"
            >
              <ShoppingCart className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-semibold text-foreground">Purchase Orders</span>
              <span className="text-[10px] text-muted-foreground">Replenish drugs</span>
            </Link>
            <Link
              href="/pharmacy/returns"
              className="p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 transition flex flex-col items-center text-center gap-2"
            >
              <RefreshCw className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-semibold text-foreground">Patient Returns</span>
              <span className="text-[10px] text-muted-foreground">Restock or quarantine</span>
            </Link>
            <Link
              href="/pharmacy/handover"
              className="p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 transition flex flex-col items-center text-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-semibold text-foreground">Shift Handover</span>
              <span className="text-[10px] text-muted-foreground">End-of-shift report</span>
            </Link>
            <Link
              href="/pharmacy/reports"
              className="p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 transition flex flex-col items-center text-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-xs font-semibold text-foreground">Daily Analytics</span>
              <span className="text-[10px] text-muted-foreground">Revenue & stock ledger</span>
            </Link>
          </div>
        </div>

        {/* Alerts & Critical Stock Status (1 col) */}
        <div className="space-y-4">
          {/* Low Stock Watchlist */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-semibold text-foreground">Low Stock Threshold</h3>
              </div>
              <Link
                href="/pharmacy/inventory?filter=lowStock"
                className="text-xs text-primary hover:underline font-medium"
              >
                All
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Loading stock...</p>
            ) : !data?.lowStockAlerts || data.lowStockAlerts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">All medicine stocks are healthy.</p>
            ) : (
              <div className="space-y-2.5">
                {data.lowStockAlerts.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{b.medicineName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Batch: {b.batchNumber} • {b.storageLocation || "Rack A1"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20">
                        {b.quantityOnHand} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Near Expiry Batches */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Near Expiry Alerts</h3>
              </div>
              <Link href="/pharmacy/expiry" className="text-xs text-primary hover:underline font-medium">
                All
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Loading expiries...</p>
            ) : !data?.nearExpiryAlerts || data.nearExpiryAlerts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No batches near expiry.</p>
            ) : (
              <div className="space-y-2.5">
                {data.nearExpiryAlerts.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{b.medicineName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Batch: {b.batchNumber} • Exp: {b.expiryDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20">
                        {b.daysUntilExpiry}d left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
