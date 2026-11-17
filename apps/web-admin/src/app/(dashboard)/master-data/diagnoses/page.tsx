"use client";

import { useState } from "react";
import Link from "next/link";
import { masterDataApi, DiagnosisDto } from "@medicore/api";
import { toast } from "sonner";
import { FileText, Plus } from "lucide-react";

export default function DiagnosesMasterPage() {
  const [icdCode, setIcdCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Respiratory");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icdCode || !description) {
      toast.error("ICD-10 Code and description are required");
      return;
    }

    setLoading(true);
    try {
      const payload: DiagnosisDto = { icdCode, description, category };
      await masterDataApi.addDiagnosis(payload);
      toast.success("ICD-10 Diagnosis added!");
      setIcdCode("");
      setDescription("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to add diagnosis");
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
          <Link href="/master-data/diagnoses" className="px-3.5 py-1.5 bg-card text-foreground font-semibold text-xs rounded-lg shadow-sm">
            Diagnoses
          </Link>
          <Link href="/master-data/charges" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Charges
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Add ICD-10 Master Entry
        </h2>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">ICD-10 Code *</label>
            <input
              type="text"
              required
              value={icdCode}
              onChange={(e) => setIcdCode(e.target.value)}
              placeholder="e.g. J06.9"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Respiratory"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Acute upper respiratory infection, unspecified"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {loading ? "Saving..." : "Add ICD-10 Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
