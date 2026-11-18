"use client";

import { useEffect, useState } from "react";
import {
  Receipt, IndianRupee, CreditCard, Banknote, QrCode,
  AlertCircle, CheckCircle2, Search, RefreshCw, Plus,
  Printer, ArrowUpRight, ShieldCheck, Filter, Undo2
} from "lucide-react";
import Link from "next/link";
import { invoicesApi, InvoiceDto, BillingStatsDto } from "@medicore/api";
import { toast } from "sonner";

export default function CashierDashboard() {
  const [stats, setStats] = useState<BillingStatsDto | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, invoicesRes] = await Promise.all([
        invoicesApi.getStats(),
        invoicesApi.getAll({ query: searchQuery || undefined, status: statusFilter !== "ALL" ? statusFilter : undefined })
      ]);
      setStats(statsRes.data?.data || null);
      setInvoices(invoicesRes.data?.data || []);
    } catch {
      toast.error("Failed to load cashier billing records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenPayment = (inv: InvoiceDto) => {
    setSelectedInvoice(inv);
    setPaymentMethod("CASH");
    setPaymentModalOpen(true);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice?.id) return;
    try {
      setSubmittingPayment(true);
      await invoicesApi.collectPayment(selectedInvoice.id, paymentMethod);
      toast.success(`Payment of ₹${selectedInvoice.grandTotal?.toLocaleString()} collected successfully via ${paymentMethod}!`);
      setPaymentModalOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to process payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const statCards = [
    { label: "Today's Revenue", value: `₹${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: "from-emerald-500 to-emerald-600" },
    { label: "Cash Collected", value: `₹${(stats?.cashCollected ?? 0).toLocaleString()}`, icon: Banknote, color: "from-blue-500 to-indigo-600" },
    { label: "Card & UPI", value: `₹${((stats?.cardCollected ?? 0) + (stats?.upiCollected ?? 0)).toLocaleString()}`, icon: QrCode, color: "from-purple-500 to-purple-600" },
    { label: "Pending Bills", value: stats?.pendingInvoicesCount ?? 0, sub: `₹${(stats?.pendingAmount ?? 0).toLocaleString()}`, icon: AlertCircle, color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cashier &amp; Billing Counter</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Cash Desk Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cash register management, payment settlement (Cash/Card/UPI), concession audits, and receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/billing"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
              {item.sub && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Outstanding: {item.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "PAID", "REFUNDED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab === "ALL" ? "All Invoices" : tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Invoice #, Name, UHID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-muted/30 border border-input rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Invoices List Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Active Cash Desk Invoices ({invoices.length})
          </h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Idempotent &amp; GST Compliant
          </span>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Patient</th>
                  <th className="py-3 px-4 font-semibold">UHID</th>
                  <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                  <th className="py-3 px-4 font-semibold text-right">GST (18%)</th>
                  <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Payment Mode</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-primary">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{inv.patientName || "Walk-in"}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">{inv.patientUhid || "—"}</td>
                    <td className="py-3 px-4 text-right">₹{(inv.subtotal ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">₹{(inv.gstAmount ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">₹{(inv.grandTotal ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : inv.paymentStatus === "REFUNDED"
                          ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}>
                        {inv.paymentStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-muted-foreground uppercase text-[11px]">
                      {inv.paymentMethod || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.paymentStatus === "PENDING" || inv.paymentStatus === "UNPAID" ? (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Collect
                        </button>
                      ) : (
                        <Link
                          href={`/billing/${inv.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold transition"
                        >
                          <Printer className="w-3 h-3" /> Receipt
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No invoices found matching current filter.
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" /> Collect Payment
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice:</span>
                <span className="font-mono font-bold text-primary">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold text-foreground">{selectedInvoice.patientName}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-bold text-foreground">Total Payable:</span>
                <span className="font-bold text-emerald-600 text-base">₹{(selectedInvoice.grandTotal ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Select Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "CASH", label: "Cash", icon: Banknote },
                    { id: "CARD", label: "Credit/Debit Card", icon: CreditCard },
                    { id: "UPI", label: "UPI / QR", icon: QrCode },
                    { id: "INSURANCE", label: "Insurance / TPA", icon: ShieldCheck },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
                        paymentMethod === mode.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      <mode.icon className="w-4 h-4" />
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {submittingPayment ? "Processing..." : `Confirm ₹${selectedInvoice.grandTotal?.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

