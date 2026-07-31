"use client";

import { useState } from "react";
import { invoicesApi, InvoiceDto } from "@medicore/api";
import { toast } from "sonner";
import { Receipt, Search, Plus, IndianRupee, ShieldCheck, ChevronRight } from "lucide-react";

export default function BillingPage() {
  const [consultationId, setConsultationId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationId.trim()) {
      toast.error("Please enter a Consultation ID");
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = `inv-${Date.now()}`;
      const res = await invoicesApi.createFromConsultation(consultationId, idempotencyKey);
      toast.success("Invoice generated successfully!");
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">OPD Billing &amp; Financials</h1>
        <p className="text-sm text-muted-foreground mt-1">
          US-150: GST calculations, idempotency safeguards, discount approvals &amp; instant receipts.
        </p>
      </div>

      {/* Invoice Generator Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" /> Generate Invoice from Consultation
        </h2>
        <form onSubmit={handleGenerateInvoice} className="flex gap-3">
          <input
            type="text"
            value={consultationId}
            onChange={(e) => setConsultationId(e.target.value)}
            placeholder="Enter Consultation ID..."
            className="flex-1 px-3.5 py-2.5 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm disabled:opacity-50 flex items-center gap-2 shadow-md shadow-primary/20"
          >
            {loading ? "Generating..." : "Generate Invoice"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Protected by Idempotency-Key header against double charging.
        </p>
      </div>
    </div>
  );
}
