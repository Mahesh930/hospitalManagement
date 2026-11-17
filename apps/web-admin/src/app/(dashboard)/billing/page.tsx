"use client";

import { useEffect, useState } from "react";
import { invoicesApi, InvoiceDto, BillingStatsDto } from "@medicore/api";
import { toast } from "sonner";
import {
  Receipt, Search, Plus, IndianRupee, ShieldCheck, ChevronRight,
  Banknote, CreditCard, QrCode, Filter, RefreshCw, Printer, AlertCircle, Percent
} from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const [consultationId, setConsultationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [stats, setStats] = useState<BillingStatsDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // Collect Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Apply Discount Modal
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [submittingDiscount, setSubmittingDiscount] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, invoicesRes] = await Promise.all([
        invoicesApi.getStats(),
        invoicesApi.getAll({
          query: searchQuery || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined
        })
      ]);
      setStats(statsRes.data?.data || null);
      setInvoices(invoicesRes.data?.data || []);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationId.trim()) {
      toast.error("Please enter a Consultation ID");
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = `inv-${Date.now()}`;
      const res = await invoicesApi.createFromConsultation(consultationId.trim(), idempotencyKey);
      toast.success("Invoice generated successfully!");
      setConsultationId("");
      loadData();
      if (res.data.data?.id) {
        window.location.href = `/billing/${res.data.data.id}`;
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Invoice generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (inv: InvoiceDto) => {
    setSelectedInvoice(inv);
    setPaymentMethod("CASH");
    setPayModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice?.id) return;

    try {
      setSubmittingPayment(true);
      await invoicesApi.collectPayment(selectedInvoice.id, paymentMethod);
      toast.success(`Payment of ₹${selectedInvoice.grandTotal?.toLocaleString()} collected via ${paymentMethod}!`);
      setPayModalOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Payment collection failed");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleOpenDiscount = (inv: InvoiceDto) => {
    setSelectedInvoice(inv);
    setDiscountAmount(0);
    setDiscountReason("");
    setApprovedBy("");
    setDiscountModalOpen(true);
  };

  const handleConfirmDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice?.id || discountAmount <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    try {
      setSubmittingDiscount(true);
      await invoicesApi.applyDiscount(
        selectedInvoice.id,
        discountAmount,
        discountReason.trim() || undefined,
        approvedBy.trim() || undefined
      );
      toast.success(`Concession of ₹${discountAmount.toLocaleString()} applied successfully!`);
      setDiscountModalOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to apply discount");
    } finally {
      setSubmittingDiscount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">OPD Billing &amp; Cashier Financials</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Tax &amp; GST Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Standardized invoice issuance, payment collection, discount governance ceiling, and idempotency safeguards.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Today's Collections", value: `₹${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Cash Collected", value: `₹${(stats?.cashCollected ?? 0).toLocaleString()}`, icon: Banknote, color: "text-blue-500 bg-blue-500/10" },
          { label: "Card & UPI", value: `₹${((stats?.cardCollected ?? 0) + (stats?.upiCollected ?? 0)).toLocaleString()}`, icon: QrCode, color: "text-purple-500 bg-purple-500/10" },
          { label: "Pending Bills", value: stats?.pendingInvoicesCount ?? 0, sub: `₹${(stats?.pendingAmount ?? 0).toLocaleString()}`, icon: AlertCircle, color: "text-amber-500 bg-amber-500/10" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">{kpi.label}</div>
              <div className="text-xl font-bold text-foreground mt-1">{kpi.value}</div>
              {kpi.sub && <div className="text-[11px] text-amber-600 font-medium">Pending: {kpi.sub}</div>}
            </div>
            <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center font-bold`}>
              <kpi.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Generator Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" /> Issue Invoice from Consultation
        </h2>
        <form onSubmit={handleGenerateInvoice} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={consultationId}
            onChange={(e) => setConsultationId(e.target.value)}
            placeholder="Enter Consultation UUID (e.g. from OPD queue)..."
            className="flex-1 px-3.5 py-2 bg-muted/40 border border-input rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            {loading ? "Generating..." : "Generate Invoice"}
          </button>
        </form>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Protected by Idempotency-Key against duplicate charge submissions.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "PAID", "REFUNDED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab === "ALL" ? "All Invoices" : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Invoice #, Patient Name, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData()}
            className="w-full pl-9 pr-3 py-1.5 bg-muted/30 border border-input rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Hospital Invoices Register ({invoices.length})
          </h2>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px]">
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Patient</th>
                  <th className="py-3 px-4 font-semibold">UHID</th>
                  <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                  <th className="py-3 px-4 font-semibold text-right">Discount</th>
                  <th className="py-3 px-4 font-semibold text-right">GST (18%)</th>
                  <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Mode</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-primary">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{inv.patientName || "Walk-in"}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{inv.patientUhid || "—"}</td>
                    <td className="py-3 px-4 text-right">₹{(inv.subtotal ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-500">
                      {inv.discountAmount ? `-₹${inv.discountAmount.toLocaleString()}` : "—"}
                    </td>
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
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {inv.paymentStatus === "PENDING" || inv.paymentStatus === "UNPAID" ? (
                        <>
                          <button
                            onClick={() => handleOpenDiscount(inv)}
                            className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold"
                            title="Apply Discount"
                          >
                            <Percent className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                          >
                            Collect
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/billing/${inv.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold"
                        >
                          <Printer className="w-3 h-3" /> View Receipt
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No invoices found in billing registry.
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {payModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" /> Collect Payment
              </h3>
              <button onClick={() => setPayModalOpen(false)} className="text-muted-foreground text-sm">✕</button>
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

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "CASH", label: "Cash", icon: Banknote },
                    { id: "CARD", label: "Credit/Debit Card", icon: CreditCard },
                    { id: "UPI", label: "UPI / QR Code", icon: QrCode },
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
                  onClick={() => setPayModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold"
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

      {/* Apply Discount Modal */}
      {discountModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-500" /> Apply Concession / Discount
              </h3>
              <button onClick={() => setDiscountModalOpen(false)} className="text-muted-foreground text-sm">✕</button>
            </div>

            <div className="bg-muted/30 rounded-xl p-3 space-y-1 text-xs">
              <div><strong className="text-foreground">Invoice:</strong> {selectedInvoice.invoiceNumber}</div>
              <div><strong className="text-foreground">Current Grand Total:</strong> ₹{selectedInvoice.grandTotal?.toLocaleString()}</div>
            </div>

            <form onSubmit={handleConfirmDiscount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice.subtotal || 10000}
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs font-bold text-foreground"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">Discounts &gt; ₹500 require Admin authorization name.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Concession Justification</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Citizen waiver, Staff benefit"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Authorized By</label>
                <input
                  type="text"
                  placeholder="Admin Name / ID"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs text-foreground"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDiscountModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiscount}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {submittingDiscount ? "Applying..." : "Apply Concession"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
