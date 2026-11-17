"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { invoicesApi, InvoiceDto } from "@medicore/api";
import { toast } from "sonner";
import { Receipt, ArrowLeft, IndianRupee, ShieldCheck, CheckCircle2, Percent, CreditCard } from "lucide-react";

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const resolvedParams = use(params);
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Discount form
  const [discountAmount, setDiscountAmount] = useState<number | "">("");
  const [discountReason, setDiscountReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("ADMIN");

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await invoicesApi.getById(resolvedParams.invoiceId);
        setInvoice(res.data.data);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: { message?: string } } } };
        toast.error(error?.response?.data?.error?.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [resolvedParams.invoiceId]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountAmount || Number(discountAmount) <= 0) return;
    try {
      const res = await invoicesApi.applyDiscount(
        resolvedParams.invoiceId,
        Number(discountAmount),
        discountReason,
        approvedBy
      );
      setInvoice(res.data.data);
      toast.success("Discount applied successfully!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Discount failed");
    }
  };

  const handleCollectPayment = async () => {
    try {
      const res = await invoicesApi.collectPayment(resolvedParams.invoiceId, paymentMethod);
      setInvoice(res.data.data);
      toast.success("Payment Received & Receipt Sealed!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Payment collection failed");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading invoice...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p className="font-semibold">Invoice record not found.</p>
        <Link href="/billing" className="text-primary text-sm underline mt-2 block">
          Back to Billing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/billing"
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Invoice #{invoice.invoiceNumber || invoice.id?.slice(0, 8)}</h1>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  invoice.paymentStatus === "PAID"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {invoice.paymentStatus || "PENDING"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Patient: {invoice.patientName || "Patient Record"}</p>
          </div>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" /> Itemized Charges
        </h2>

        {/* Items Table */}
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden text-sm">
          <div className="bg-muted/50 p-3 font-semibold text-xs text-muted-foreground grid grid-cols-12">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Unit Price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {(invoice.items || []).map((item, idx) => (
            <div key={idx} className="p-3 grid grid-cols-12 items-center">
              <span className="col-span-6 font-medium text-foreground">{item.description}</span>
              <span className="col-span-2 text-center text-muted-foreground">{item.quantity}</span>
              <span className="col-span-2 text-right text-muted-foreground">₹{item.unitPrice}</span>
              <span className="col-span-2 text-right font-semibold text-foreground">₹{item.totalPrice}</span>
            </div>
          ))}
        </div>

        {/* Calculations Breakdown */}
        <div className="space-y-2 text-sm border-t border-border pt-4 max-w-xs ml-auto">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{invoice.subtotal || 0}</span>
          </div>
          {Number(invoice.discountAmount) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Discount</span>
              <span>-₹{invoice.discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>GST (18%)</span>
            <span>+₹{invoice.gstAmount || 0}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2">
            <span>Grand Total</span>
            <span className="text-primary">₹{invoice.grandTotal || 0}</span>
          </div>
        </div>

        {/* Actions section */}
        {invoice.paymentStatus !== "PAID" ? (
          <div className="border-t border-border pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Apply Discount Form */}
            <form onSubmit={handleApplyDiscount} className="space-y-3 p-4 bg-muted/30 border border-border rounded-xl">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-amber-500" /> Manager Discount Approval
              </h3>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Discount amount (₹)"
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm"
              />
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Discount reason (e.g. Senior Citizen)"
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm"
              />
              <button
                type="submit"
                className="w-full py-2 bg-secondary text-secondary-foreground font-semibold text-xs rounded-xl"
              >
                Apply Discount
              </button>
            </form>

            {/* Collect Payment Form */}
            <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" /> Collect Payment
              </h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash Counter</option>
                <option value="CARD">Credit / Debit Card</option>
              </select>
              <button
                onClick={handleCollectPayment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Collect ₹{invoice.grandTotal || 0}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border pt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-bold text-sm">Payment Completed</p>
                <p className="text-xs">Method: {invoice.paymentMethod || "UPI"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
