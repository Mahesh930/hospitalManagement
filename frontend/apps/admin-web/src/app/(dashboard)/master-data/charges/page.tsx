"use client";

import { useState } from "react";
import Link from "next/link";
import { masterDataApi, ChargeDto } from "@medicore/api";
import { toast } from "sonner";
import { Receipt, Plus } from "lucide-react";

export default function ChargesMasterPage() {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("OPD_CONSULTATION");
  const [standardPrice, setStandardPrice] = useState<number | "">(500);
  const [gstPercentage, setGstPercentage] = useState<number | "">(18);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode || !itemName || standardPrice === "") {
      toast.error("Code, Name, and Price are required");
      return;
    }

    setLoading(true);
    try {
      const payload: ChargeDto = {
        itemCode,
        itemName,
        category,
        standardPrice: Number(standardPrice),
        gstPercentage: Number(gstPercentage || 0),
      };
      await masterDataApi.addCharge(payload);
      toast.success("Charge Master Entry Created!");
      setItemCode("");
      setItemName("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to add charge");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Master Data Catalogue</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage medicines, ICD-10 diagnoses, and hospital billing charges</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-xl">
          <Link href="/master-data/medicines" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Medicines
          </Link>
          <Link href="/master-data/diagnoses" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Diagnoses
          </Link>
          <Link href="/master-data/charges" className="px-3.5 py-1.5 bg-card text-foreground font-semibold text-xs rounded-lg shadow-sm">
            Charges
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" /> Add Charge Master Entry
        </h2>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Item Code *</label>
            <input
              type="text"
              required
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="e.g. CONSULT-GEN"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. General OPD Consultation"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            >
              <option value="OPD_CONSULTATION">OPD Consultation</option>
              <option value="DIAGNOSTICS">Diagnostics / Lab</option>
              <option value="PROCEDURE">Procedure / Surgery</option>
              <option value="PHARMACY">Pharmacy</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Standard Price (₹) *</label>
            <input
              type="number"
              required
              value={standardPrice}
              onChange={(e) => setStandardPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="500"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">GST (%)</label>
            <input
              type="number"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="18"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {loading ? "Saving..." : "Add Charge Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
